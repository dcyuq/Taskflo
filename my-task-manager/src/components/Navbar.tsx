import './Navbar.css'
import './TopNav.css'
import { Link } from 'react-router-dom'
import wordmark from '../assets/taskflo-wordmark.svg?raw'

const sections = [
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How it works' },
    { id: 'faq', label: 'FAQ' },
]

function Navbar() {
    return(
        <nav className="navbar">
            <Link to="/" className="topnav-brand" aria-label="Taskflo">
                <span className="brand-wordmark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: wordmark }} />
            </Link>
            <ul className="navbar-links">
                {sections.map(s => (
                    <li key={s.id}>
                        <a href={`#${s.id}`}>{s.label}</a>
                    </li>
                ))}
            </ul>
            <Link to="/login" className="navbar-button">Sign in</Link>
        </nav>
    )
}

export default Navbar
