import './HeroDemo.css'
import './AuthDemos.css'
import { AnimatePresence, motion } from 'motion/react'
import { useLoop } from '../hooks/useLoop'
import { ease } from '../utils/motion'

const feed = [
    { who: 'AR', text: <><b>Ana</b> finished <b>Write launch notes</b></>, time: '2m' },
    { who: 'BO', text: <><b>Ben</b> moved <b>Fix invite email</b> to Doing</>, time: '14m' },
    { who: null, text: <><b>2 tasks</b> due today</>, time: 'Today' },
]

function SignInDemo() {
    const { ref, tick, reduce, hover } = useLoop(6, 1800)
    const count = reduce ? feed.length : Math.min(tick, feed.length)
    const week = 0.42 + count * 0.12

    return (
        <div className="demo auth-demo" ref={ref} aria-hidden="true" {...hover}>
            <div className="demo-head">
                <span>This week</span>
                <span className="ring">
                    <svg viewBox="0 0 48 48" width="48" height="48">
                        <circle cx="24" cy="24" r="20" className="ring-track" />
                        <motion.circle
                            cx="24"
                            cy="24"
                            r="20"
                            className="ring-fill"
                            initial={false}
                            animate={{ pathLength: week }}
                            transition={{ duration: reduce ? 0 : 1.4, ease }}
                        />
                    </svg>
                    <span className="ring-label">{Math.round(week * 100)}%</span>
                </span>
            </div>
            <p className="auth-demo-sub">Your team's week so far</p>
            <div className="feed">
                <AnimatePresence initial={false}>
                    {feed.slice(0, count).map(item => (
                        <motion.div
                            key={item.time}
                            className="demo-row"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, transition: { duration: 0.5, ease } }}
                            transition={{ duration: 0.8, ease }}
                        >
                            {item.who
                                ? <span className="demo-avatar">{item.who}</span>
                                : (
                                    <span className="demo-avatar is-icon">
                                        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                            <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
                                            <path d="M2.5 7h11M5.5 2v3M10.5 2v3" />
                                        </svg>
                                    </span>
                                )}
                            <span className="feed-text">{item.text}</span>
                            <span className="feed-time">{item.time}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default SignInDemo
