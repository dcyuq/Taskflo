import './Navbar.css'
import './TopNav.css'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import wordmark from '../assets/taskflo-wordmark.svg?raw'

const sections = [
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How it works' },
    { id: 'faq', label: 'FAQ' },
]

function Navbar() {
    const [active, setActive] = useState('')

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

    return(
        <nav className="navbar">
            <Link to="/" className="topnav-brand" aria-label="Taskflo">
                <span className="brand-wordmark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: wordmark }} />
            </Link>
            <ul className="navbar-links">
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
            </ul>
            <Link to="/login" className="navbar-button">Sign in</Link>
        </nav>
    )
}

export default Navbar
