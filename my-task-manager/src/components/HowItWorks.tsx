import './HowItWorks.css'
import { AnimatePresence, animate, motion, useInView, useMotionValue, useReducedMotion } from 'motion/react'
import type { AnimationPlaybackControls, HTMLMotionProps } from 'motion/react'
import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { FocusEvent, KeyboardEvent } from 'react'
import { reveal, rise, staggered } from '../utils/motion'
import SignUpDemo from './SignUpDemo'

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
    return <SignUpDemo step={800} />
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

    const stepButton = (i: number, aria: HTMLMotionProps<'button'>) => (
        <motion.button
            key={steps[i].title}
            ref={el => { tabs.current[i] = el }}
            type="button"
            id={`hiw-tab-${i}`}
            className={`hiw-tab${active === i ? ' is-active' : ''}`}
            onClick={() => setActive(i)}
            variants={rise}
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
        </motion.button>
    )

    const panel = (aria: HTMLMotionProps<'div'>) => (
        <motion.div className="hiw-panel" id="hiw-panel" variants={rise} {...aria}>
            <span className="hiw-preview">Preview</span>
            <AnimatePresence initial={false}>
                <motion.div
                    key={active}
                    className="hiw-mock"
                    initial={reduce ? false : 'hidden'}
                    animate="show"
                    exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.2 } }}
                    variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                >
                    <Mock />
                </motion.div>
            </AnimatePresence>
        </motion.div>
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
            <motion.div className="section-head" {...reveal(reduce)}>
                <motion.h2 variants={rise}>How it works</motion.h2>
                <motion.p variants={rise}>Three steps from sign-up to a team that knows what to work on.</motion.p>
            </motion.div>
            <motion.div className="hiw" {...reveal(reduce)}>
                {narrow ? (
                    <motion.div className="hiw-tabs" onKeyDown={onKey} variants={staggered}>
                        {steps.map((s, i) => (
                            <Fragment key={s.title}>
                                {stepButton(i, { 'aria-expanded': active === i, 'aria-controls': active === i ? 'hiw-panel' : undefined })}
                                {active === i && panel({ role: 'region', 'aria-labelledby': `hiw-tab-${i}` })}
                            </Fragment>
                        ))}
                    </motion.div>
                ) : (
                    <>
                        <motion.div className="hiw-tabs" role="tablist" aria-orientation="vertical" aria-label="Steps" onKeyDown={onKey} variants={staggered}>
                            {steps.map((_, i) => stepButton(i, { role: 'tab', 'aria-selected': active === i, 'aria-controls': 'hiw-panel', tabIndex: active === i ? 0 : -1 }))}
                        </motion.div>
                        {panel({ role: 'tabpanel', 'aria-labelledby': `hiw-tab-${active}` })}
                    </>
                )}
            </motion.div>
        </section>
    )
}

export default HowItWorks
