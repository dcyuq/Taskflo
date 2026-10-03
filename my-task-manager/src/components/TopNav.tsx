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
    const [profile, setProfile] = useState({ name: '', email: '' })
    const navigate = useNavigate()

    async function handleSignOut() {
        await supabase.auth.signOut()
        navigate('/login', { replace: true })
    }

    useEffect(() => {
        async function loadUser() {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return
            const email = session.user.email ?? ''
            const { data } = await supabase.from('Users').select('first_name, last_name').eq('id', session.user.id).maybeSingle()
            const full = [data?.first_name, data?.last_name].filter(Boolean).join(' ')
            setProfile({ name: full || email.split('@')[0], email })
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
                <button type="button" className="topnav-profile" popoverTarget="profile-menu" aria-label={profile.name ? `Account menu for ${profile.name}` : 'Account menu'}>
                    <span className="topnav-avatar" aria-hidden="true">{profile.name.charAt(0).toUpperCase()}</span>
                    <span className="topnav-profile-name" aria-hidden="true">{profile.name.split(' ')[0]}</span>
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 6l4 4 4-4" />
                    </svg>
                </button>
                <div id="profile-menu" className="profile-menu" popover="auto">
                    <div className="profile-menu-head">
                        <span className="topnav-avatar" aria-hidden="true">{profile.name.charAt(0).toUpperCase()}</span>
                        <span className="profile-menu-who">
                            <span className="profile-menu-name">{profile.name}</span>
                            <span className="profile-menu-email">{profile.email}</span>
                        </span>
                    </div>
                    <button type="button" className="profile-menu-item" onClick={handleSignOut}>Sign out</button>
                </div>
            </div>
        </header>
    )
}

export default TopNav
