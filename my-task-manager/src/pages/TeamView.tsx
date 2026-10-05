import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import Avatar from '../components/Avatar'
import ConfirmDialog from '../components/ConfirmDialog'
import EmailChipField from '../components/EmailChipField'
import { useWorkspace } from '../hooks/useWorkspace'
import { useEmailChips } from '../hooks/useEmailChips'
import { listWorkspaceInvites, removeMember, revokeInvite, type Member, type WorkspaceInvite } from '../services/members'
import { sendInvites } from '../services/workspace'
import { rise, staggered } from '../utils/motion'
import { friendlyError } from '../utils/errors'
import { useThrottle, waitMessage } from '../hooks/useThrottle'

type InviteState = { status: 'loading' } | { status: 'error' } | { status: 'ready', invites: WorkspaceInvite[] }

function expiresIn(iso: string) {
    const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 864e5)
    return days <= 1 ? 'Expires within a day' : `Expires in ${days} days`
}

function TeamView() {
    const { workspace, members, tasks, me, isOwner, reload } = useWorkspace()
    const reduce = useReducedMotion()
    const [invites, setInvites] = useState<InviteState>({ status: 'loading' })
    const [removing, setRemoving] = useState<Member | null>(null)
    const [sending, setSending] = useState(false)
    const [sentNotice, setSentNotice] = useState('')
    const [inviteError, setInviteError] = useState('')
    const throttle = useThrottle(5)
    const pendingEmails = invites.status === 'ready' ? invites.invites.map(i => i.email) : []
    const chips = useEmailChips(
        [...members.map(m => m.email), ...pendingEmails].filter(Boolean),
        'Some addresses are already members or invited, so they were left out.',
    )

    const loadInvites = useCallback(() => {
        if (!isOwner) return Promise.resolve()
        return listWorkspaceInvites(workspace.id).then(({ data, error }) => {
            setInvites(error || !data ? { status: 'error' } : { status: 'ready', invites: data })
        })
    }, [isOwner, workspace.id])

    useEffect(() => {
        loadInvites()
    }, [loadInvites])

    async function handleSend(e: React.SyntheticEvent) {
        e.preventDefault()
        setSentNotice('')
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
        const { error } = await sendInvites(workspace.id, all)
        setSending(false)
        if (error) {
            chips.setError(friendlyError(error, 'Couldn’t send the invites. Check your connection and try again.'))
            return
        }
        chips.reset()
        setSentNotice(all.length === 1 ? `Invite sent to ${all[0]}.` : `${all.length} invites sent.`)
        loadInvites()
    }

    async function handleRevoke(invite: WorkspaceInvite) {
        setInviteError('')
        const { error } = await revokeInvite(invite.id)
        if (error) {
            setInviteError(friendlyError(error, `Couldn’t revoke the invite to ${invite.email}. Try again.`))
            return
        }
        setInvites(s => s.status === 'ready' ? { status: 'ready', invites: s.invites.filter(i => i.id !== invite.id) } : s)
    }

    const openTasksFor = (id: string) => tasks.filter(t => t.assignee_id === id && t.status !== 'done').length

    return (
        <motion.div className="team" initial={reduce ? false : 'hidden'} animate="show" variants={staggered}>
            <motion.section className="team-card" aria-labelledby="members-title" variants={rise}>
                <div className="team-card-head">
                    <h2 id="members-title">Members</h2>
                    <span className="task-group-count">{members.length}</span>
                </div>
                <ul className="member-list">
                    {members.map(member => (
                        <li key={member.id} className="member-row">
                            <Avatar name={member.name} size={36} />
                            <span className="member-who">
                                <span className="member-name">
                                    {member.name}
                                    {member.id === me && <span className="member-you">You</span>}
                                </span>
                                <span className="member-email">{member.email}</span>
                            </span>
                            {member.role === 'owner' && <span className="member-badge">Owner</span>}
                            {isOwner && member.id !== me && member.role !== 'owner' && (
                                <button type="button" className="btn btn-quiet btn-small member-remove" onClick={() => setRemoving(member)}>
                                    Remove<span className="sr-only"> {member.name}</span>
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
                {!isOwner && <p className="team-note">Only the workspace owner can invite or remove people.</p>}
            </motion.section>

            {isOwner && (
                <motion.section className="team-card" aria-labelledby="invite-title" variants={rise}>
                    <div className="team-card-head">
                        <h2 id="invite-title">Invite people</h2>
                    </div>
                    <p className="team-lede">They’ll see the invite when they sign in to Taskflo with that email. Invites last 7 days.</p>
                    <form onSubmit={handleSend} noValidate>
                        <label htmlFor="team-emails" className="firstrun-label">Email addresses</label>
                        <EmailChipField id="team-emails" chips={chips} />
                        <div className="team-actions">
                            <button type="submit" className="btn btn-primary" disabled={sending} onMouseDown={e => e.preventDefault()}>
                                {sending ? 'Sending…' : chips.emails.length > 1 ? `Send ${chips.emails.length} invites` : 'Send invite'}
                            </button>
                            {sentNotice && <p className="form-notice team-notice" role="status">{sentNotice}</p>}
                        </div>
                    </form>
                </motion.section>
            )}

            {isOwner && (
                <motion.section className="team-card" aria-labelledby="pending-title" variants={rise}>
                    <div className="team-card-head">
                        <h2 id="pending-title">Pending invites</h2>
                        {invites.status === 'ready' && <span className="task-group-count">{invites.invites.length}</span>}
                    </div>
                    {invites.status === 'loading' && (
                        <div role="status">
                            <span className="sr-only">Loading invites</span>
                            {[0, 1].map(i => <span key={i} className="skeleton team-skeleton" />)}
                        </div>
                    )}
                    {invites.status === 'error' && (
                        <div className="team-error" role="alert">
                            <span>Couldn’t load pending invites.</span>
                            <button type="button" className="btn btn-quiet btn-small" onClick={() => { setInvites({ status: 'loading' }); loadInvites() }}>Try again</button>
                        </div>
                    )}
                    {invites.status === 'ready' && invites.invites.length === 0 && (
                        <p className="team-empty">No pending invites.</p>
                    )}
                    {invites.status === 'ready' && invites.invites.length > 0 && (
                        <ul className="member-list">
                            {invites.invites.map(invite => (
                                <li key={invite.id} className="member-row">
                                    <Avatar size={36} />
                                    <span className="member-who">
                                        <span className="member-name">{invite.email}</span>
                                        <span className="member-email">{expiresIn(invite.expiresAt)}</span>
                                    </span>
                                    <button type="button" className="btn btn-quiet btn-small member-remove" onClick={() => handleRevoke(invite)}>
                                        Revoke<span className="sr-only"> invite to {invite.email}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {inviteError && <p className="field-error" role="alert">{inviteError}</p>}
                </motion.section>
            )}

            {removing && (
                <ConfirmDialog
                    title={`Remove ${removing.name}?`}
                    message={`They’ll lose access to ${workspace.name}. ${openTasksFor(removing.id) === 1 ? 'Their 1 open task stays and becomes unassigned.' : `Their ${openTasksFor(removing.id)} open tasks stay and become unassigned.`}`}
                    confirmLabel="Remove"
                    onConfirm={async () => {
                        const { error } = await removeMember(workspace.id, removing.id)
                        if (error) return friendlyError(error, 'Couldn’t remove them. Only the workspace owner can remove members.')
                        await reload()
                        return null
                    }}
                    onClose={() => setRemoving(null)}
                />
            )}
        </motion.div>
    )
}

export default TeamView
