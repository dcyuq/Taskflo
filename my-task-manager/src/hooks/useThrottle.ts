import { useRef } from 'react'

export const waitMessage = (seconds: number) => `Too many attempts. Try again in ${seconds} seconds.`

export function useThrottle(limit: number, windowMs = 60_000) {
    const hits = useRef<number[]>([])
    return () => {
        const now = Date.now()
        hits.current = hits.current.filter(t => now - t < windowMs)
        if (hits.current.length >= limit) return Math.ceil((hits.current[0] + windowMs - now) / 1000)
        hits.current.push(now)
        return 0
    }
}
