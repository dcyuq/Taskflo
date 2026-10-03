import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import HeroDemo from '../components/HeroDemo'
import Footer from '../components/Footer'
import './LandingPage.css'
import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { reveal, rise, staggered } from '../utils/motion'

const spotQuery = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'

function LandingPage() {
    const reduce = useReducedMotion()
    const landing = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!window.matchMedia(spotQuery).matches) return
        let frame = 0
        const onMove = (e: PointerEvent) => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() => {
                landing.current?.style.setProperty('--mx', `${e.clientX}px`)
                landing.current?.style.setProperty('--my', `${e.clientY}px`)
            })
        }
        window.addEventListener('pointermove', onMove, { passive: true })
        return () => {
            cancelAnimationFrame(frame)
            window.removeEventListener('pointermove', onMove)
        }
    }, [])

    return (
        <div className="landing dot-grid" ref={landing}>
            <a className="skip-link" href="#main">Skip to content</a>
            <Navbar />
            <main id="main" tabIndex={-1}>
                <section className="Hero">
                    <div className="Hero-card">
                        <motion.div className="Hero-copy" initial={reduce ? false : 'hidden'} animate="show" variants={staggered}>
                            <motion.h1 variants={rise}>Assign. Track. Done.</motion.h1>
                            <motion.p variants={rise}>A task manager for small teams that does less on purpose. Give work an owner and a deadline, see where it stands, and get on with it.</motion.p>
                            <motion.div variants={rise}>
                                <Link className="Hero-button" to="/register">Get started</Link>
                            </motion.div>
                        </motion.div>
                        <HeroDemo />
                    </div>
                </section>
                <Features />
                <HowItWorks />
                <section className="features faq-section" id="faq">
                    <motion.div className="faq-intro" {...reveal(reduce)}>
                        <motion.h2 variants={rise}>FAQ</motion.h2>
                        <motion.p variants={rise}>Short answers about workspaces, invites and who can see what.</motion.p>
                    </motion.div>
                    <motion.div className="faq" {...reveal(reduce)}>
                        <motion.details variants={rise} open>
                            <summary>Who is Taskflo for?</summary>
                            <p>Leads of small teams, roughly 3 to 20 people, who want one simple place to bring their team together.</p>
                        </motion.details>
                        <motion.details variants={rise}>
                            <summary>How do teammates join?</summary>
                            <p>Add their email when you set up your workspace. When they sign in to Taskflo with that address, the invite is waiting for them to accept.</p>
                        </motion.details>
                        <motion.details variants={rise}>
                            <summary>Do invites expire?</summary>
                            <p>Yes. An invite lasts 7 days and can only be used once.</p>
                        </motion.details>
                        <motion.details variants={rise}>
                            <summary>Who can see my workspace?</summary>
                            <p>Only its members. Someone you've invited can see the workspace name until they accept or decline.</p>
                        </motion.details>
                        <motion.details variants={rise}>
                            <summary>Can I have more than one workspace?</summary>
                            <p>Yes. Create one per team and switch between them from the sidebar.</p>
                        </motion.details>
                    </motion.div>
                </section>
            </main>
            <Footer />
        </div>
    )
}

export default LandingPage
