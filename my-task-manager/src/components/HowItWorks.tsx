import './HowItWorks.css'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

const steps = [
    { title: 'Create a workspace', text: 'Name it after your team. One workspace holds one team and its work.' },
    { title: 'Invite your team', text: 'Add teammates by email. They see the invite when they sign in with that address.' },
    { title: 'Assign tasks', text: "Give each task an owner and a due date, so everyone knows what's theirs." },
]

const item = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const } },
}

function WorkspaceMock() {
    return (
        <>
            <motion.span variants={item} className="mock-label">Workspace name</motion.span>
            <motion.span variants={item} className="mock-input">Design team<span className="mock-caret"></span></motion.span>
            <motion.span variants={item} className="mock-button">Create workspace</motion.span>
        </>
    )
}

function InviteMock() {
    return (
        <>
            <motion.span variants={item} className="mock-label">Invite by email</motion.span>
            <motion.span variants={item} className="mock-input mock-chips">
                {['ana@northlight.co', 'ben@northlight.co', 'priya@northlight.co'].map(email => (
                    <motion.span variants={item} className="mock-chip" key={email}>{email}</motion.span>
                ))}
            </motion.span>
            <motion.span variants={item} className="mock-hint">3 invites, valid for 7 days</motion.span>
        </>
    )
}

function AssignMock() {
    return (
        <>
            <motion.span variants={item} className="mock-task">
                <span className="mock-task-title">Write launch notes</span>
                <span className="mock-due">Oct 14</span>
            </motion.span>
            <motion.span variants={item} className="mock-label">Assign to</motion.span>
            <span className="mock-people">
                {[['AR', 'Ana Ruiz'], ['BO', 'Ben Okafor'], ['PS', 'Priya Shah']].map(([initials, name]) => (
                    <motion.span variants={item} className={`mock-person${initials === 'BO' ? ' is-picked' : ''}`} key={name}>
                        <span className="mock-avatar">{initials}</span>
                        {name}
                        {initials === 'BO' && (
                            <svg className="mock-check" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M3.5 8.5l3 3 6-7" />
                            </svg>
                        )}
                    </motion.span>
                ))}
            </span>
        </>
    )
}

const mocks = [WorkspaceMock, InviteMock, AssignMock]

function HowItWorks() {
    const [active, setActive] = useState(0)
    const reduce = useReducedMotion()
    const tabs = useRef<(HTMLButtonElement | null)[]>([])
    const Mock = mocks[active]

    const onKey = (e: KeyboardEvent) => {
        const last = steps.length - 1
        const next = {
            ArrowDown: active === last ? 0 : active + 1,
            ArrowRight: active === last ? 0 : active + 1,
            ArrowUp: active === 0 ? last : active - 1,
            ArrowLeft: active === 0 ? last : active - 1,
            Home: 0,
            End: last,
        }[e.key]
        if (next === undefined) return
        e.preventDefault()
        setActive(next)
        tabs.current[next]?.focus()
    }

    return (
        <section className="features" id="how-it-works">
            <h2>How it works</h2>
            <div className="hiw">
                <div className="hiw-tabs" role="tablist" aria-orientation="vertical" aria-label="Steps" onKeyDown={onKey}>
                    {steps.map((s, i) => (
                        <button
                            key={s.title}
                            ref={el => { tabs.current[i] = el }}
                            type="button"
                            role="tab"
                            id={`hiw-tab-${i}`}
                            aria-selected={active === i}
                            aria-controls="hiw-panel"
                            tabIndex={active === i ? 0 : -1}
                            className="hiw-tab"
                            onClick={() => setActive(i)}
                        >
                            <span className="hiw-num">{i + 1}</span>
                            <span className="hiw-copy">
                                <span className="hiw-title">{s.title}</span>
                                <span className="hiw-text">{s.text}</span>
                            </span>
                        </button>
                    ))}
                </div>
                <div className="hiw-panel" id="hiw-panel" role="tabpanel" aria-labelledby={`hiw-tab-${active}`}>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={active}
                            className="hiw-mock"
                            initial={reduce ? false : 'hidden'}
                            animate="show"
                            exit={reduce ? undefined : { opacity: 0, y: -6, transition: { duration: 0.14 } }}
                            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                        >
                            <Mock />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    )
}

export default HowItWorks
