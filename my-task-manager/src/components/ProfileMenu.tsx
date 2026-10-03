import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function ProfileMenu({ compact = false }: { compact?: boolean }) {
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

    const initial = profile.name.charAt(0).toUpperCase()

    return (
        <>
            <button
                type="button"
                className={`profile-card${compact ? ' is-compact' : ''}`}
                popoverTarget="profile-menu"
                aria-label={profile.name ? `Account menu for ${profile.name}` : 'Account menu'}
            >
                <span className="topnav-avatar" aria-hidden="true">{initial}</span>
                {!compact && (
                    <span className="profile-card-who" aria-hidden="true">
                        <span className="profile-card-name">{profile.name}</span>
                        <span className="profile-card-email">{profile.email}</span>
                    </span>
                )}
            </button>
            <div id="profile-menu" className="profile-menu is-up" popover="auto">
                <div className="profile-menu-head">
                    <span className="topnav-avatar" aria-hidden="true">{initial}</span>
                    <span className="profile-menu-who">
                        <span className="profile-menu-name">{profile.name}</span>
                        <span className="profile-menu-email">{profile.email}</span>
                    </span>
                </div>
                <button type="button" className="profile-menu-item" onClick={handleSignOut}>Sign out</button>
            </div>
        </>
    )
}

export default ProfileMenu
