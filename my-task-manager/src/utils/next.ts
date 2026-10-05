export const safeNext = (next: string | null) => next && /^\/(?![/\\])/.test(next) ? next : '/dashboard'
