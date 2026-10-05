import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { acceptInvite, declineInvite, previewInvite } from '../services/workspace'
import { friendlyError } from '../utils/errors'
import NotFound from './NotFound'
import './Dashboard.css'
import './NotFound.css'

type State =
    | { status: 'loading' | 'signed-out' | 'missing' }
    | { status: 'ready', kind: 'email' | 'link', name: string }

function InvitePage() {
    const { token = '' } = useParams()
    const navigate = useNavigate()
    const [state, setState] = useState<State>({ status: 'loading' })
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const valid = /^[0-9a-f]{64}$/.test(token)

    useEffect(() => {
        if (!valid) return
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session) return setState({ status: 'signed-out' })
            const { data, error } = await previewInvite(token)
            if (error) friendlyError(error)
            setState(data ? { status: 'ready', kind: data.kind, name: data.workspace_name } : { status: 'missing' })
        })
    }, [token, valid])

    async function accept() {
        setBusy(true)
        setError('')
        const { workspaceId, error } = await acceptInvite(token)
        if (error || !workspaceId) {
            setError(friendlyError(error, 'Couldn’t join this workspace. The invite may have expired.'))
            setBusy(false)
            return
        }
        navigate(`/dashboard/workspace/${workspaceId}`, { replace: true })
    }

    async function decline() {
        setBusy(true)
        setError('')
        const { error } = await declineInvite(token)
        if (error) {
            setError(friendlyError(error, 'Couldn’t decline the invite. Try again.'))
            setBusy(false)
            return
        }
        navigate('/dashboard', { replace: true })
    }

    if (state.status === 'signed-out') return <Navigate to={`/login?next=${encodeURIComponent(`/invite/${token}`)}`} replace />
    if (!valid || state.status === 'missing') return <main><NotFound /></main>
    if (state.status !== 'ready') return <div className="firstrun-loading" role="status">Loading invite…</div>

    return (
        <main className="notfound dot-grid">
            <div className="notfound-body">
                <h1 className="notfound-title">Join {state.name}</h1>
                <p className="notfound-text">You’ve been invited to work on tasks with this team in Taskflo.</p>
                <div className="notfound-actions">
                    <button type="button" className="btn btn-primary" disabled={busy} onClick={accept}>{busy ? 'Joining…' : 'Join workspace'}</button>
                    {state.kind === 'email'
                        ? <button type="button" className="btn btn-outline" disabled={busy} onClick={decline}>Decline</button>
                        : <Link className="btn btn-outline" to="/dashboard">Not now</Link>}
                </div>
                {error && <p className="field-error" role="alert">{error}</p>}
            </div>
        </main>
    )
}

export default InvitePage
