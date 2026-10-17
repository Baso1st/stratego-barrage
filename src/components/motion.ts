/** Whether the device asks for less motion, in which case nothing slides or fades. */
export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
