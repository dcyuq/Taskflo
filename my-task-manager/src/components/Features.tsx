import './Features.css'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'

function useTick(ref: RefObject<Element | null>, length: number, ms: number) {
    const reduce = useReducedMotion()
    const inView = useInView(ref)
    const [i, setI] = useState(0)
    useEffect(() => {
        if (reduce || !inView) return
        const id = setInterval(() => setI(n => (n + 1) % length), ms)
        return () => clearInterval(id)
    }, [reduce, inView, length, ms])
    return i
}

const tasks = [
    { title: 'Write launch notes', who: 'AR', due: 'Oct 14', priority: 'High' },
    { title: 'Review onboarding copy', who: 'BO', due: 'Oct 16', priority: 'Medium' },
    { title: 'Fix invite email layout', who: 'PS', due: 'Oct 17', priority: 'Low' },
]

function TaskVisual() {
    const ref = useRef<HTMLDivElement>(null)
    const i = useTick(ref, tasks.length, 2600)
    const reduce = useReducedMotion()
    const t = tasks[i]
    return (
        <div className="bento-visual task-stack" ref={ref} aria-hidden="true">
            <span className="task-ghost"></span>
            <span className="task-ghost"></span>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                    key={i}
                    className="task-row"
                    initial={reduce ? false : { opacity: 0, y: 14, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -14, filter: 'blur(2px)' }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                    <span className="task-avatar">{t.who}</span>
                    <span className="task-title">{t.title}</span>
                    <span className="task-due">{t.due}</span>
                    <span className={`task-priority is-${t.priority.toLowerCase()}`}>{t.priority}</span>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

function Card({ ink, wide, children }: { ink?: boolean, wide?: boolean, children: ReactNode }) {
    const reduce = useReducedMotion()
    return (
        <motion.article
            className={`bento-card${ink ? ' is-ink' : ''}${wide ? ' is-wide' : ''}`}
            whileHover={reduce ? undefined : { y: -3 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        >
            {children}
        </motion.article>
    )
}

function Features() {
    return(
        <section className="features" id="features">
            <h2>Everything your team needs</h2>
            <div className="bento">
                <Card ink wide>
                    <div className="bento-text">
                        <h3>Task assignment</h3>
                        <p>Give each task an owner, a deadline and a priority.</p>
                    </div>
                    <TaskVisual />
                </Card>

                <Card>
                    <div className="bento-text">
                        <h3>Progress tracking</h3>
                        <p>See the status of every task across your team.</p>
                    </div>
                    <div className="bento-visual" aria-hidden="true"></div>
                </Card>

                <Card>
                    <div className="bento-text">
                        <h3>AI assistant <span className="feature-soon">Coming soon</span></h3>
                        <p>Suggested priorities and assignments based on each person's workload.</p>
                    </div>
                    <div className="bento-visual" aria-hidden="true"></div>
                </Card>
            </div>
        </section>
    )
}

export default Features
