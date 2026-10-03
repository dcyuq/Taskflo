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

const columns = [
    { name: 'To do', cards: ['Plan sprint'] },
    { name: 'Doing', cards: ['Pricing page'] },
    { name: 'Done', cards: ['Invite team', 'Set up workspace'] },
]

function BoardVisual() {
    const ref = useRef<HTMLDivElement>(null)
    const stage = useTick(ref, columns.length, 1800)
    const done = 2 + (stage === 2 ? 1 : 0)
    const total = 5
    return (
        <div className="bento-visual board" ref={ref} aria-hidden="true">
            <div className="board-cols">
                {columns.map((col, c) => (
                    <div className="board-col" key={col.name}>
                        <span className="board-name">{col.name}</span>
                        {c === stage && (
                            <motion.span
                                layoutId="moving-card"
                                className="board-card is-moving"
                                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                            >
                                Launch notes
                            </motion.span>
                        )}
                        {col.cards.map(card => <span className="board-card" key={card}>{card}</span>)}
                    </div>
                ))}
            </div>
            <div className="board-progress">
                <div className="board-bar">
                    <motion.span
                        className="board-fill"
                        initial={false}
                        animate={{ scaleX: done / total }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    />
                </div>
                <span className="board-count">{done} of {total} done</span>
            </div>
        </div>
    )
}

const suggestion = 'Move 2 tasks from Ana to Ben'

function SuggestVisual() {
    const ref = useRef<HTMLDivElement>(null)
    const reduce = useReducedMotion()
    const inView = useInView(ref)
    const [n, setN] = useState(0)
    const shown = reduce ? suggestion.length : n

    useEffect(() => {
        if (reduce || !inView) return
        const id = setTimeout(() => setN(c => (c >= suggestion.length ? 0 : c + 1)), n >= suggestion.length ? 2400 : n === 0 ? 600 : 45)
        return () => clearTimeout(id)
    }, [reduce, inView, n])

    return (
        <div className="bento-visual suggest" ref={ref} aria-hidden="true">
            <div className="load-row">
                <span className="load-name">Ana</span>
                <span className="load-bar is-heavy"><span></span></span>
                <span className="load-count">7 tasks</span>
            </div>
            <div className="load-row">
                <span className="load-name">Ben</span>
                <span className="load-bar is-light"><span></span></span>
                <span className="load-count">2 tasks</span>
            </div>
            <motion.div
                className="suggest-chip"
                animate={reduce ? undefined : { boxShadow: ['0 0 0 0px rgba(13, 13, 13, 0.14)', '0 0 0 6px rgba(13, 13, 13, 0)'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            >
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M8 1.5l1.6 4.1 4.1 1.6-4.1 1.6L8 12.9 6.4 8.8 2.3 7.2l4.1-1.6z" />
                </svg>
                <span className="suggest-text">
                    {suggestion.slice(0, shown)}
                    <motion.span
                        className="suggest-caret"
                        animate={reduce ? undefined : { opacity: [1, 1, 0, 0] }}
                        transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
                    />
                </span>
            </motion.div>
        </div>
    )
}

function Card({ ink, wide, delay = 0, children }: { ink?: boolean, wide?: boolean, delay?: number, children: ReactNode }) {
    const reduce = useReducedMotion()
    return (
        <motion.article
            className={`bento-card${ink ? ' is-ink' : ''}${wide ? ' is-wide' : ''}`}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </motion.article>
    )
}

function Features() {
    return(
        <section className="features" id="features">
            <h2>Three things, done well</h2>
            <div className="bento">
                <Card ink wide>
                    <div className="bento-text">
                        <h3>Task assignment</h3>
                        <p>Give each task an owner, a deadline and a priority.</p>
                    </div>
                    <TaskVisual />
                </Card>

                <Card delay={0.08}>
                    <div className="bento-text">
                        <h3>Progress tracking</h3>
                        <p>See the status of every task across your team.</p>
                    </div>
                    <BoardVisual />
                </Card>

                <Card delay={0.16}>
                    <div className="bento-text">
                        <div className="bento-head">
                            <h3>AI assistant</h3>
                            <span className="feature-soon">Coming soon</span>
                        </div>
                        <p>Suggested priorities and assignments based on each person's workload.</p>
                    </div>
                    <SuggestVisual />
                </Card>
            </div>
        </section>
    )
}

export default Features
