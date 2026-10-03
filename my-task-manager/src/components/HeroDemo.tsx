import './HeroDemo.css'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

const ease = [0.16, 1, 0.3, 1] as const
const pop = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 0.28, ease },
}

function HeroDemo() {
    const ref = useRef<HTMLDivElement>(null)
    const reduce = useReducedMotion()
    const inView = useInView(ref)
    const [tick, setTick] = useState(0)

    useEffect(() => {
        if (reduce || !inView) return
        const id = setInterval(() => setTick(t => (t + 1) % 6), 1300)
        return () => clearInterval(id)
    }, [reduce, inView])

    const stage = reduce ? 3 : Math.min(tick, 3)
    const done = stage === 3

    return (
        <div className="demo" ref={ref} aria-hidden="true">
            <div className="demo-head">
                <span>Design team</span>
                <span className="demo-count">{done ? 2 : 1} of 3 done</span>
            </div>
            <div className={`demo-row is-live${done ? ' is-done' : ''}`}>
                <span className="demo-check">
                    {done && (
                        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <motion.path d="M3.5 8.5l3 3 6-7" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, ease }} />
                        </svg>
                    )}
                </span>
                <span className="demo-title">Write launch notes</span>
                <AnimatePresence initial={false}>
                    {stage >= 2 && <motion.span key="due" className="demo-due" {...pop} initial={reduce ? false : pop.initial}>Oct 14</motion.span>}
                </AnimatePresence>
                <AnimatePresence initial={false} mode="popLayout">
                    {stage >= 1
                        ? <motion.span key="ana" className="demo-avatar" {...pop} initial={reduce ? false : pop.initial}>AR</motion.span>
                        : <motion.span key="empty" className="demo-avatar is-empty" {...pop} />}
                </AnimatePresence>
            </div>
            <div className="demo-row is-done">
                <span className="demo-check">
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3.5 8.5l3 3 6-7" />
                    </svg>
                </span>
                <span className="demo-title">Set up workspace</span>
                <span className="demo-due">Oct 3</span>
                <span className="demo-avatar">BO</span>
            </div>
            <div className="demo-row">
                <span className="demo-check"></span>
                <span className="demo-title">Fix invite email layout</span>
                <span className="demo-due">Oct 17</span>
                <span className="demo-avatar">PS</span>
            </div>
            <div className="demo-bar">
                <motion.span
                    className="demo-fill"
                    initial={false}
                    animate={{ scaleX: done ? 2 / 3 : 1 / 3 }}
                    transition={{ duration: reduce ? 0 : 0.5, ease }}
                />
            </div>
        </div>
    )
}

export default HeroDemo
