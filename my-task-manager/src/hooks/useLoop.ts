import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'motion/react'

export function useLoop(steps: number, ms: number) {
    const ref = useRef<HTMLDivElement>(null)
    const reduce = useReducedMotion()
    const inView = useInView(ref)
    const [hovered, setHovered] = useState(false)
    const [tick, setTick] = useState(0)

    useEffect(() => {
        if (reduce || !inView || hovered) return
        const id = setInterval(() => setTick(t => (t + 1) % steps), ms)
        return () => clearInterval(id)
    }, [reduce, inView, hovered, steps, ms])

    return {
        ref,
        tick,
        reduce,
        hover: { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) },
    }
}
