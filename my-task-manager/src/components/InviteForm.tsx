import { useState } from 'react'
import EmailChipField from './EmailChipField'
import { useEmailChips } from '../hooks/useEmailChips'
import { useThrottle, waitMessage } from '../hooks/useThrottle'
import { sendInvites } from '../services/workspace'
import { friendlyError } from '../utils/errors'

interface InviteFormProps {
    id: string
    workspaceId: string
    exclude?: string[]
    onSent?: () => void
}

function InviteForm({ id, workspaceId, exclude = [], onSent }: InviteFormProps) {
    const [sending, setSending] = useState(false)
    const [notice, setNotice] = useState('')
    const throttle = useThrottle(5)
    const chips = useEmailChips(exclude, 'Some addresses are already members or invited, so they were left out.')

    async function handleSend(e: React.SyntheticEvent) {
        e.preventDefault()
        setNotice('')
        const all = chips.collect()
        if (!all) return
        if (all.length === 0) {
            chips.setError('Add at least one email address.')
            chips.inputRef.current?.focus()
            return
        }
        const wait = throttle()
        if (wait) {
            chips.setError(waitMessage(wait))
            return
        }
        setSending(true)
        const { data, error } = await sendInvites(workspaceId, all)
        setSending(false)
        if (error || !data) {
            chips.setError(friendlyError(error, 'Couldn’t send the invites. Check your connection and try again.'))
            return
        }
        chips.reset()
        setNotice(data.invited === 0
            ? 'Everyone you added is already a member or invited.'
            : data.emailed < data.invited
                ? 'Invites saved, but some emails couldn’t be sent. They’ll still see the invite when they sign in.'
                : data.invited === 1 && all.length === 1 ? `Invite sent to ${all[0]}.` : `${data.invited} invites sent.`)
        onSent?.()
    }

    return (
        <form onSubmit={handleSend} noValidate>
            <label htmlFor={id} className="firstrun-label">Email addresses</label>
            <EmailChipField id={id} chips={chips} />
            <div className="team-actions">
                <button type="submit" className="btn btn-primary" disabled={sending} onMouseDown={e => e.preventDefault()}>
                    {sending ? 'Sending…' : chips.emails.length > 1 ? `Send ${chips.emails.length} invites` : 'Send invite'}
                </button>
                {notice && <p className="form-notice team-notice" role="status">{notice}</p>}
            </div>
        </form>
    )
}

export default InviteForm
