import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './Dashboard.css'
import './NotFound.css'

function NotFound() {
    const [signedIn, setSignedIn] = useState<boolean | null>(null)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSignedIn(!!session))
    }, [])

    return (
        <div className="notfound dot-grid">
            <div className="notfound-body">
                <p className="notfound-code" aria-hidden="true">404</p>
                <h1 className="notfound-title">This page doesn’t exist</h1>
                <p className="notfound-text">Check the link, or head back and pick up where you left off.</p>
                {signedIn !== null && (
                    <Link className="btn btn-primary" to={signedIn ? '/dashboard' : '/'}>
                        {signedIn ? 'Back to dashboard' : 'Back to home'}
                    </Link>
                )}
            </div>
        </div>
    )
}

export default NotFound
