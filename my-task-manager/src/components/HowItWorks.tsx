import './HowItWorks.css'
import { AnimatePresence, animate, motion, useInView, useMotionValue, useReducedMotion } from 'motion/react'
import type { AnimationPlaybackControls } from 'motion/react'
import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { FocusEvent, HTMLAttributes, KeyboardEvent } from 'react'

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

const narrowQuery = '(max-width: 720px)'
const subscribeNarrow = (cb: () => void) => {
    const mq = window.matchMedia(narrowQuery)
    mq.addEventListener('change', cb)
    return () => mq.removeEventListener('change', cb)
}
const getNarrow = () => window.matchMedia(narrowQuery).matches

function HowItWorks() {
    const [active, setActive] = useState(0)
    const reduce = useReducedMotion()
    const tabs = useRef<(HTMLButtonElement | null)[]>([])
    const Mock = mocks[active]
    const [hovered, setHovered] = useState(false)
    const [focused, setFocused] = useState(false)
    const section = useRef<HTMLElement>(null)
    const inView = useInView(section)
    const narrow = useSyncExternalStore(subscribeNarrow, getNarrow)
    const auto = !reduce && !narrow
    const paused = hovered || focused || !inView
    const progress = useMotionValue(0)
    const controls = useRef<AnimationPlaybackControls | null>(null)

    useEffect(() => {
        progress.set(0)
        if (!auto) return
        const c = animate(progress, 1, {
            duration: 5,
            ease: 'linear',
            onComplete: () => setActive(a => (a + 1) % steps.length),
        })
        controls.current = c
        return () => c.stop()
    }, [active, auto, progress])

    useEffect(() => {
        if (paused) controls.current?.pause()
        else controls.current?.play()
    }, [paused, active, auto])

    const onBlur = (e: FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
    }

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

    const stepButton = (i: number, aria: HTMLAttributes<HTMLButtonElement>) => (
        <button
            key={steps[i].title}
            ref={el => { tabs.current[i] = el }}
            type="button"
            id={`hiw-tab-${i}`}
            className={`hiw-tab${active === i ? ' is-active' : ''}`}
            onClick={() => setActive(i)}
            {...aria}
        >
            {active === i && auto && (
                <motion.span className="hiw-line" style={{ scaleX: progress }} aria-hidden="true" />
            )}
            <span className="hiw-num">{i + 1}</span>
            <span className="hiw-copy">
                <span className="hiw-title">{steps[i].title}</span>
                <span className="hiw-text">{steps[i].text}</span>
            </span>
        </button>
    )

    const panel = (aria: HTMLAttributes<HTMLDivElement>) => (
        <div className="hiw-panel" id="hiw-panel" {...aria}>
            <span className="hiw-preview">Preview</span>
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
    )

    return (
        <section
            className="features"
            id="how-it-works"
            ref={section}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={onBlur}
        >
            <h2>How it works</h2>
            <motion.div
                className="hiw"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
                {narrow ? (
                    <div className="hiw-tabs" onKeyDown={onKey}>
                        {steps.map((s, i) => (
                            <Fragment key={s.title}>
                                {stepButton(i, { 'aria-expanded': active === i, 'aria-controls': active === i ? 'hiw-panel' : undefined })}
                                {active === i && panel({ role: 'region', 'aria-labelledby': `hiw-tab-${i}` })}
                            </Fragment>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="hiw-tabs" role="tablist" aria-orientation="vertical" aria-label="Steps" onKeyDown={onKey}>
                            {steps.map((_, i) => stepButton(i, { role: 'tab', 'aria-selected': active === i, 'aria-controls': 'hiw-panel', tabIndex: active === i ? 0 : -1 }))}
                        </div>
                        {panel({ role: 'tabpanel', 'aria-labelledby': `hiw-tab-${active}` })}
                    </>
                )}
            </motion.div>
        </section>
    )
}

export default HowItWorks
