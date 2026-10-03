import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function ProfileMenu({ placement }: { placement: 'down' | 'up' }) {
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
                className={`topnav-profile is-${placement}`}
                popoverTarget="profile-menu"
                aria-label={profile.name ? `Account menu for ${profile.name}` : 'Account menu'}
            >
                <span className="topnav-avatar" aria-hidden="true">{initial}</span>
                <span className="topnav-profile-name" aria-hidden="true">{placement === 'up' ? profile.name : profile.name.split(' ')[0]}</span>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={placement === 'up' ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'} />
                </svg>
            </button>
            <div id="profile-menu" className={`profile-menu is-${placement}`} popover="auto">
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
