// Shows which build is running, so you can tell at a glance what test and production have.
export default function AppVersion() {
  return (
    <footer className="fixed right-2 bottom-2 font-mono text-xs text-slate-500">
      {__APP_VERSION__}
    </footer>
  )
}
