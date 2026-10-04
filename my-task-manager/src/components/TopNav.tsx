import './TopNav.css'
import { Link } from 'react-router-dom'
import wordmark from '../assets/taskflo-wordmark.svg?raw'

interface TopNavProps {
    title?: string
    menuOpen: boolean
    onMenu: () => void
    onSearch: () => void
}

function TopNav({ title, menuOpen, onMenu, onSearch }: TopNavProps) {
    return (
        <header className="topnav">
            <button type="button" className="topnav-menu" aria-label="Open navigation" aria-expanded={menuOpen} onClick={onMenu}>
                <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
                </svg>
            </button>
            {title ? (
                <span className="topnav-title">{title}</span>
            ) : (
                <Link to="/dashboard" className="topnav-brand" aria-label="Taskflo dashboard">
                    <span className="brand-wordmark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: wordmark }} />
                </Link>
            )}
            <button type="button" className="topnav-menu" aria-label="Search workspaces and tasks" onClick={onSearch}>
                <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" />
                </svg>
            </button>
        </header>
    )
}

export default TopNav
