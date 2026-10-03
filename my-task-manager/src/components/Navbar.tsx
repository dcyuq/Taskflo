import './Navbar.css'
import './TopNav.css'
import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import wordmark from '../assets/taskflo-wordmark.svg?raw'

const sections = [
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How it works' },
    { id: 'faq', label: 'FAQ' },
]

function Navbar() {
    const [active, setActive] = useState('')
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        const update = () => {
            const line = window.innerHeight * 0.4
            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
            let current = ''
            for (const s of sections) {
                const el = document.getElementById(s.id)
                if (el && el.getBoundingClientRect().top <= line) current = s.id
            }
            setActive(atBottom ? sections[sections.length - 1].id : current)
        }
        const frame = requestAnimationFrame(update)
        window.addEventListener('scroll', update, { passive: true })
        window.addEventListener('resize', update)
        return () => {
            cancelAnimationFrame(frame)
            window.removeEventListener('scroll', update)
            window.removeEventListener('resize', update)
        }
    }, [])

    useEffect(() => {
        if (!menuOpen) return
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [menuOpen])

    const toTop = (e: MouseEvent) => {
        if (window.location.pathname !== '/') return
        e.preventDefault()
        setMenuOpen(false)
        history.replaceState(null, '', '/')
        window.scrollTo({ top: 0 })
    }

    return(
        <nav className="navbar">
            <Link to="/" className="topnav-brand" aria-label="Taskflo, back to top" onClick={toTop}>
                <span className="brand-wordmark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: wordmark }} />
            </Link>
            <button
                type="button"
                className="navbar-menu"
                aria-expanded={menuOpen}
                aria-controls="navbar-links"
                onClick={() => setMenuOpen(o => !o)}
            >
                {menuOpen ? "Close" : "Menu"}
            </button>
            <ul id="navbar-links" className={`navbar-links${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(false)}>
                {sections.map(s => (
                    <li key={s.id}>
                        <a
                            href={`#${s.id}`}
                            className={active === s.id ? 'active' : undefined}
                            aria-current={active === s.id ? 'location' : undefined}
                        >
                            {s.label}
                        </a>
                    </li>
                ))}
                <li className="navbar-menu-only">
                    <Link to="/login">Sign in</Link>
                </li>
            </ul>
            <Link to="/login" className="navbar-button navbar-signin">Sign in</Link>
            <Link to="/register" className="navbar-button is-primary">Get started</Link>
        </nav>
    )
}

export default Navbar
