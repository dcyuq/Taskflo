import { useEffect, useRef, useState } from 'react'
import InviteForm from './InviteForm'
import { activeInviteLink } from '../services/members'
import { friendlyError } from '../utils/errors'
import './TaskDialog.css'

function QuickInviteDialog({ workspace, onClose }: { workspace: { id: string, name: string }, onClose: () => void }) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [copying, setCopying] = useState(false)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        dialogRef.current?.showModal()
    }, [])

    async function copyLink() {
        setCopying(true)
        setError('')
        const { token, error } = await activeInviteLink(workspace.id)
        if (error || !token) {
            setCopying(false)
            setError(friendlyError(error, 'Couldn’t get an invite link. Try again.'))
            return
        }
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`)
            setCopied(true)
        } catch {
            setError('Couldn’t copy the link. Open the Team tab to copy it yourself.')
        }
        setCopying(false)
    }

    return (
        <dialog
            ref={dialogRef}
            className="task-dialog confirm-dialog quick-invite"
            aria-labelledby="quick-invite-title"
            onClose={onClose}
            onClick={e => e.target === dialogRef.current && onClose()}
        >
            <div className="task-dialog-head">
                <h2 id="quick-invite-title">Invite to {workspace.name}</h2>
                <button type="button" className="task-dialog-close" aria-label="Close" onClick={onClose}>
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                        <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                </button>
            </div>
            <InviteForm id="quick-invite-emails" workspaceId={workspace.id} />
            <div className="quick-invite-link">
                <p>Or share a link anyone can use to join after signing in.</p>
                <button type="button" className="btn btn-outline" disabled={copying} onClick={copyLink}>
                    {copied ? 'Link copied' : copying ? 'Getting link…' : 'Copy invite link'}
                </button>
            </div>
            <p className="sr-only" role="status">{copied ? 'Invite link copied' : ''}</p>
            {error && <p className="field-error" role="alert">{error}</p>}
        </dialog>
    )
}

export default QuickInviteDialog
