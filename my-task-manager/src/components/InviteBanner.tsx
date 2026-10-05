import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { acceptInvite, declineInvite, getPendingInvites, type PendingInvite } from '../services/workspace'
import { friendlyError } from '../utils/errors'

function InviteBanner() {
    const navigate = useNavigate()
    const [invites, setInvites] = useState<PendingInvite[]>([])
    const [busy, setBusy] = useState<string | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        getPendingInvites().then(({ data }) => data && setInvites(data))
    }, [])

    async function accept(invite: PendingInvite) {
        setBusy(invite.id)
        setError('')
        const { workspaceId, error } = await acceptInvite(invite.token)
        setBusy(null)
        if (error || !workspaceId) {
            setError(friendlyError(error, `Couldn’t join ${invite.workspaceName}. The invite may have expired.`))
            return
        }
        setInvites(list => list.filter(i => i.id !== invite.id))
        navigate(`/dashboard/workspace/${workspaceId}`)
    }

    async function decline(invite: PendingInvite) {
        setBusy(invite.id)
        setError('')
        const { error } = await declineInvite(invite.token)
        setBusy(null)
        if (error) {
            setError(friendlyError(error, `Couldn’t decline the invite to ${invite.workspaceName}. Try again.`))
            return
        }
        setInvites(list => list.filter(i => i.id !== invite.id))
    }

    if (!invites.length) return null

    return (
        <section className="invite-banner" aria-label="Pending invites">
            <ul>
                {invites.map(invite => (
                    <li key={invite.id} className="invite-banner-row">
                        <span>You’re invited to <strong>{invite.workspaceName}</strong></span>
                        <span className="invite-banner-actions">
                            <button type="button" className="btn btn-primary" disabled={busy === invite.id} onClick={() => accept(invite)}>Accept</button>
                            <button type="button" className="btn btn-quiet" disabled={busy === invite.id} onClick={() => decline(invite)}>Decline</button>
                        </span>
                    </li>
                ))}
            </ul>
            {error && <p className="field-error" role="alert">{error}</p>}
        </section>
    )
}

export default InviteBanner
