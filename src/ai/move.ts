import {
  ARMY,
  isLake,
  isOnBoard,
  legalMoves,
  pieceAt,
  resolveCombat,
  sameSquare,
  type CombatResult,
  type Move,
  type PieceView,
  type PlayerView,
  type Rank,
  type Rng,
  type Square,
} from '../game/index.ts'

// What each piece is worth to the computer when it weighs fights and threats.
const VALUE: Readonly<Record<Rank, number>> = {
  marshal: 100,
  general: 80,
  spy: 55,
  miner: 45,
  bomb: 25,
  scout: 15,
  flag: 300,
}

/** A Scout attacking an unknown piece is worth this much extra, for what it finds out. */
const SCOUTING_BONUS = 20
/** Per row moved toward the enemy, so pieces don't just wander. */
const ADVANCE_BONUS = 2
/** How much a target's pull weakens with each square of distance. */
const PULL_DISCOUNT = 0.9
/** Enemies this many squares (or fewer) from the Flag count as threatening it. */
const FLAG_GUARD_RADIUS = 3
/** For attacking an enemy that's threatening the Flag. */
const FLAG_GUARD_BONUS = 40
/** Per square a piece moves closer to a threatened Flag. */
const RETURN_TO_FLAG_BONUS = 8

/** How likely each rank is for a piece. */
type Odds = Partial<Record<Rank, number>>

type BoardView = PlayerView['board']

/** What the computer works out once per turn, before it scores the moves. */
interface Context {
  view: PlayerView
  odds: (piece: PieceView) => Odds
  enemies: readonly { square: Square; piece: PieceView }[]
  flag: Square | null
  flagThreats: readonly Square[]
}

const DIRECTIONS: readonly Square[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
]

/**
 * The computer's move, by rules of thumb: it scores every legal move and plays the best one,
 * breaking ties at random. It works only from what it can see, in `view`.
 */
export function chooseMove(view: PlayerView, rng: Rng): Move {
  const enemies = view.board.flatMap((cells, row) =>
    cells.flatMap((piece, col) => (piece && piece.owner !== view.player ? [{ square: { row, col }, piece }] : [])),
  )
  const flag = findOwn(view, 'flag')
  const context: Context = {
    view,
    odds: rankOdds(view),
    enemies,
    flag,
    flagThreats: flag
      ? enemies.map(({ square }) => square).filter((square) => distance(square, flag) <= FLAG_GUARD_RADIUS)
      : [],
  }

  const scored = legalMoves(view).map((move) => ({ move, score: scoreMove(context, move) }))
  const best = Math.max(...scored.map(({ score }) => score))
  const top = scored.filter(({ score }) => score >= best - 1e-6)
  return top[Math.floor(rng() * top.length)].move
}

function scoreMove(context: Context, move: Move): number {
  const { view, odds, flag, flagThreats } = context
  const piece = pieceAt(view.board, move.from)
  if (!piece?.rank) return -Infinity
  const rank = piece.rank
  const target = pieceAt(view.board, move.to)

  // Moving away from a threat is worth whatever the threat put at risk.
  let score = danger(context, rank, move.from)

  if (target) {
    // Attack: weigh each rank the target could be by how likely it is.
    for (const [targetRank, chance] of entries(odds(target))) {
      const result = resolveCombat(rank, targetRank)
      const winner = result === 'attacker-wins' ? piece : result === 'defender-wins' ? { ...target, rank: targetRank } : null
      const after = withChanges(view.board, [
        [move.from, null],
        [move.to, winner],
      ])
      let gain = fightGain(rank, targetRank, result) - VALUE.flag * flagExposure(context, after)
      if (result === 'attacker-wins') gain -= danger(context, rank, move.to)
      score += chance * gain
    }
    if (!target.rank && rank === 'scout') score += SCOUTING_BONUS
    if (flagThreats.some((square) => sameSquare(square, move.to))) score += FLAG_GUARD_BONUS
  } else {
    const after = withChanges(view.board, [
      [move.from, null],
      [move.to, piece],
    ])
    score -= danger(context, rank, move.to)
    score -= VALUE.flag * flagExposure(context, after)
    score += pull(context, rank, move.to) - pull(context, rank, move.from)
    // The Spy stays back to guard against the Marshal; everything else pushes forward.
    if (rank !== 'spy') score += ADVANCE_BONUS * rowsForward(view, move)
    if (flag && flagThreats.length > 0) {
      score += RETURN_TO_FLAG_BONUS * (distance(move.from, flag) - distance(move.to, flag))
    }
  }
  return score
}

/** What a fight is worth to the attacker: what it takes, less what it loses. */
function fightGain(rank: Rank, targetRank: Rank, result: CombatResult): number {
  if (result === 'attacker-wins') return VALUE[targetRank]
  if (result === 'defender-wins') return -VALUE[rank]
  return VALUE[targetRank] - VALUE[rank]
}

/**
 * How much of a piece's value is at risk on `square`: the chance that an enemy next to it
 * attacks and wins (a tie counts as half), times what the piece is worth. This is also what
 * keeps the Marshal away from a possible Spy.
 */
function danger({ view, odds }: Context, rank: Rank, square: Square): number {
  let safe = 1
  for (const direction of DIRECTIONS) {
    const next = { row: square.row + direction.row, col: square.col + direction.col }
    const enemy = isOnBoard(next) ? pieceAt(view.board, next) : null
    if (!enemy || enemy.owner === view.player) continue
    let beats = 0
    for (const [enemyRank, chance] of entries(odds(enemy))) {
      if (enemyRank === 'bomb' || enemyRank === 'flag') continue
      const result = resolveCombat(enemyRank, rank)
      if (result === 'attacker-wins') beats += chance
      else if (result === 'both-lose') beats += chance / 2
    }
    safe *= 1 - Math.min(1, beats)
  }
  return VALUE[rank] * (1 - safe)
}

/**
 * The chance that an enemy could take the Flag on its next move, on `board`: a piece next to
 * it that can move, or a Scout with a clear line to it.
 */
function flagExposure({ view, odds, flag }: Context, board: BoardView): number {
  if (!flag) return 0
  let safe = 1
  for (const direction of DIRECTIONS) {
    for (let steps = 1; ; steps++) {
      const square = { row: flag.row + direction.row * steps, col: flag.col + direction.col * steps }
      if (!isOnBoard(square) || isLake(square)) break
      const piece = pieceAt(board, square)
      if (!piece) continue
      if (piece.owner !== view.player) {
        const chances = odds(piece)
        safe *= steps === 1 ? (chances.bomb ?? 0) + (chances.flag ?? 0) : 1 - (chances.scout ?? 0)
      }
      break
    }
  }
  return 1 - safe
}

/**
 * How strongly a piece on `square` is drawn toward the enemy: the most it expects to gain by
 * attacking any one enemy piece, less for each square that piece is away.
 */
function pull({ odds, enemies }: Context, rank: Rank, square: Square): number {
  let best = 0
  for (const enemy of enemies) {
    let gain = 0
    for (const [enemyRank, chance] of entries(odds(enemy.piece))) {
      gain += chance * fightGain(rank, enemyRank, resolveCombat(rank, enemyRank))
    }
    best = Math.max(best, gain * PULL_DISCOUNT ** distance(square, enemy.square))
  }
  return best
}

/**
 * For each enemy piece, how likely each rank is, from what the computer can see: the ranks
 * it has seen, the pieces that have been captured, and which pieces have moved (a piece that
 * has moved can't be a Bomb or the Flag, so those are spread over the ones that haven't).
 */
function rankOdds(view: PlayerView): (piece: PieceView) => Odds {
  const remaining: Record<Rank, number> = { ...ARMY }
  for (const piece of view.captured) if (piece.owner !== view.player) remaining[piece.rank]--
  const unknown: PieceView[] = []
  for (const piece of view.board.flat()) {
    if (!piece || piece.owner === view.player) continue
    if (piece.rank) remaining[piece.rank]--
    else unknown.push(piece)
  }

  const immovable = remaining.bomb + remaining.flag
  const unmoved = unknown.filter((piece) => !piece.hasMoved).length
  const movable = unknown.length - immovable

  return (piece) => {
    if (piece.rank) return { [piece.rank]: 1 }
    const movableShare = piece.hasMoved || unmoved === 0 ? 1 : 1 - immovable / unmoved
    const odds: Odds = {}
    for (const rank of Object.keys(remaining) as Rank[]) {
      if (remaining[rank] <= 0) continue
      if (rank === 'bomb' || rank === 'flag') {
        if (!piece.hasMoved && unmoved > 0) odds[rank] = remaining[rank] / unmoved
      } else if (movable > 0) {
        odds[rank] = (movableShare * remaining[rank]) / movable
      }
    }
    return odds
  }
}

function entries(odds: Odds): [Rank, number][] {
  return Object.entries(odds) as [Rank, number][]
}

/** A copy of `board` with some squares changed, to look at a position after a move. */
function withChanges(board: BoardView, changes: readonly [Square, PieceView | null][]): BoardView {
  const next = board.map((cells) => [...cells])
  for (const [square, piece] of changes) next[square.row][square.col] = piece
  return next
}

function findOwn(view: PlayerView, rank: Rank): Square | null {
  for (const [row, cells] of view.board.entries()) {
    for (const [col, piece] of cells.entries()) {
      if (piece?.owner === view.player && piece.rank === rank) return { row, col }
    }
  }
  return null
}

function distance(a: Square, b: Square): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col)
}

/** How many rows a move goes toward the enemy's side. Blue starts at the top, Red at the bottom. */
function rowsForward(view: PlayerView, move: Move): number {
  const rows = move.to.row - move.from.row
  return view.player === 'blue' ? rows : -rows
}
