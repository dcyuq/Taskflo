import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import HeroDemo from './HeroDemo'
import wordmark from '../assets/taskflo-wordmark.svg?raw'
import './TopNav.css'
import './AuthLayout.css'

function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="auth">
            <aside className="auth-panel">
                <Link to="/" className="auth-brand" aria-label="Taskflo home">
                    <span className="brand-wordmark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: wordmark }} />
                </Link>
                <p className="auth-tagline">Assign. Track. Done.</p>
                <HeroDemo />
            </aside>
            <main className="auth-main dot-grid">
                <Link to="/" className="auth-back">← Back to home</Link>
                <div className="auth-body">
                    <div className="auth-card">{children}</div>
                </div>
            </main>
        </div>
    )
}

export default AuthLayout
