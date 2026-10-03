import './TopNav.css'
import { supabase } from '../supabaseClient'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import wordmark from '../assets/taskflo-wordmark.svg?raw'

interface TopNavProps {
    showMenu: boolean
    menuOpen: boolean
    onMenu: () => void
}

function TopNav({ showMenu, menuOpen, onMenu }: TopNavProps) {
    const [firstName, setFirstName] = useState('')
    const navigate = useNavigate()

    async function handleSignOut() {
        await supabase.auth.signOut()
        navigate('/login', { replace: true })
    }

    useEffect(() => {
        async function loadUser() {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return
            const { data } = await supabase.from('Users').select('first_name').eq('id', session.user.id).maybeSingle()
            if (data?.first_name) setFirstName(data.first_name)
        }
        loadUser()
    }, [])

    return (
        <header className="topnav">
            {showMenu && (
                <button type="button" className="topnav-menu" aria-label="Workspaces" aria-expanded={menuOpen} onClick={onMenu}>
                    <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                        <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
                    </svg>
                </button>
            )}
            <Link to="/dashboard" className="topnav-brand" aria-label="Taskflo dashboard">
                <span className="brand-wordmark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: wordmark }} />
            </Link>
            <div className="topnav-actions">
                <div className="topnav-profile">
                    <span className="topnav-avatar" aria-hidden="true">{firstName.charAt(0).toUpperCase()}</span>
                    <span className="topnav-profile-name">{firstName}</span>
                </div>
                <button type="button" className="topnav-signout" onClick={handleSignOut}>Sign out</button>
            </div>
        </header>
    )
}

export default TopNav
