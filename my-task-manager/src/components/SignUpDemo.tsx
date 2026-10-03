import './HeroDemo.css'
import './AuthDemos.css'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useLoop } from '../hooks/useLoop'
import { ease } from '../utils/motion'

const invitee = 'priya@northlight.co'
const appear = {
    initial: { opacity: 0, scale: 0.85 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.85 },
    transition: { duration: 0.7, ease },
}

function SignUpDemo() {
    const { ref, tick, reduce, hover } = useLoop(7, 1500)
    const stage = reduce ? 4 : tick
    const sent = stage >= 2
    const done = stage >= 4
    const [typed, setTyped] = useState(0)

    useEffect(() => {
        if (stage !== 1) return
        let n = 0
        const id = setInterval(() => {
            n += 1
            setTyped(n)
            if (n >= invitee.length) clearInterval(id)
        }, 55)
        return () => {
            clearInterval(id)
            setTyped(0)
        }
    }, [stage])

    return (
        <div className="demo auth-demo" ref={ref} aria-hidden="true" {...hover}>
            <div className="demo-head">
                <span>Design team</span>
                <span className="demo-count">{sent ? 3 : 2} members</span>
            </div>

            <div className="invite">
                <span className="invite-field">
                    {stage === 0 && <span className="invite-placeholder">Invite by email</span>}
                    {stage >= 1 && invitee.slice(0, stage === 1 ? typed : invitee.length)}
                    {stage <= 1 && <span className="invite-caret" />}
                </span>
                <span className={`invite-button${sent ? ' is-sent' : ''}`}>{sent ? 'Sent' : 'Invite'}</span>
            </div>

            <div className="team">
                <span className="demo-avatar">AR</span>
                <span className="demo-avatar">BO</span>
                <AnimatePresence initial={false}>
                    {sent && <motion.span key="ps" className="demo-avatar" {...appear} initial={reduce ? false : appear.initial}>PS</motion.span>}
                </AnimatePresence>
            </div>

            <div className={`demo-row${stage >= 3 ? ' is-live' : ''}${done ? ' is-done' : ''}`}>
                <span className="demo-check">
                    {done && (
                        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <motion.path d="M3.5 8.5l3 3 6-7" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease }} />
                        </svg>
                    )}
                </span>
                <span className="demo-title">Fix invite email layout</span>
                <AnimatePresence initial={false} mode="popLayout">
                    {stage >= 3
                        ? <motion.span key="ps" className="demo-avatar" {...appear} initial={reduce ? false : appear.initial}>PS</motion.span>
                        : <motion.span key="empty" className="demo-avatar is-empty" {...appear} />}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default SignUpDemo
