export const ease = [0.22, 1, 0.36, 1] as const
export const duration = 0.8
export const stagger = 0.12

export const rise = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration, ease } },
}

export const staggered = { show: { transition: { staggerChildren: stagger } } }

export const reveal = (reduce: boolean | null) => ({
    initial: reduce ? false : 'hidden',
    whileInView: 'show',
    viewport: { once: true, amount: 0.25 },
    variants: staggered,
}) as const

export function applyMotionTokens(root: HTMLElement) {
    root.style.setProperty('--ease-soft', `cubic-bezier(${ease.join(', ')})`)
    root.style.setProperty('--rise-duration', `${duration * 1000}ms`)
    root.style.setProperty('--stagger', `${stagger * 1000}ms`)
}
