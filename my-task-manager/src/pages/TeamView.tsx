import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import Avatar from '../components/Avatar'
import ConfirmDialog from '../components/ConfirmDialog'
import InviteLinks from '../components/InviteLinks'
import InviteForm from '../components/InviteForm'
import { useWorkspace } from '../hooks/useWorkspace'
import { listWorkspaceInvites, removeMember, revokeInvite, type Member, type WorkspaceInvite } from '../services/members'
import { rise, staggered } from '../utils/motion'
import { friendlyError } from '../utils/errors'

type InviteState = { status: 'loading' } | { status: 'error' } | { status: 'ready', invites: WorkspaceInvite[] }

function expiresIn(iso: string) {
    const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 864e5)
    return days <= 1 ? 'Expires within a day' : `Expires in ${days} days`
}

const statusLabel = (invite: WorkspaceInvite) =>
    invite.status === 'pending' ? expiresIn(invite.expiresAt)
        : invite.status === 'accepted' ? 'Accepted'
            : invite.status === 'declined' ? 'Declined' : 'Expired'

function TeamView() {
    const { workspace, members, tasks, me, isOwner, reload, liveKey } = useWorkspace()
    const reduce = useReducedMotion()
    const [invites, setInvites] = useState<InviteState>({ status: 'loading' })
    const [removing, setRemoving] = useState<Member | null>(null)
    const [inviteError, setInviteError] = useState('')
    const [showHistory, setShowHistory] = useState(false)
    const sent = invites.status === 'ready' ? invites.invites : []
    const pending = sent.filter(i => i.status === 'pending')
    const history = sent.filter(i => i.status !== 'pending')
    const shown = showHistory ? sent : pending

    const loadInvites = useCallback(() => {
        if (!isOwner) return Promise.resolve()
        return listWorkspaceInvites(workspace.id).then(({ data, error }) => {
            setInvites(error || !data ? { status: 'error' } : { status: 'ready', invites: data })
        })
    }, [isOwner, workspace.id])

    useEffect(() => {
        loadInvites()
    }, [loadInvites, liveKey])

    async function handleCancel(invite: WorkspaceInvite) {
        setInviteError('')
        const { error } = await revokeInvite(invite.id)
        if (error) {
            setInviteError(friendlyError(error, `Couldn’t cancel the invite to ${invite.email}. Try again.`))
            return
        }
        setInvites(s => s.status === 'ready' ? { status: 'ready', invites: s.invites.filter(i => i.id !== invite.id) } : s)
    }

    const openTasksFor = (id: string) => tasks.filter(t => t.assignee_id === id && t.status !== 'done').length

    return (
        <motion.div className="team" initial={reduce ? false : 'hidden'} animate="show" variants={staggered}>
            <div className="team-col is-main">
                <motion.section className="team-card is-members" aria-labelledby="members-title" variants={rise}>
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
                                    <button type="button" className="btn btn-quiet member-remove" onClick={() => setRemoving(member)}>
                                        Remove<span className="sr-only"> {member.name}</span>
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                    {!isOwner && <p className="team-note">Only the workspace owner can invite or remove people.</p>}
                </motion.section>

                {isOwner && <InviteLinks workspaceId={workspace.id} liveKey={liveKey} />}
            </div>

            {isOwner && (
                <div className="team-col">
                    <motion.section className="team-card is-invite" aria-labelledby="invite-title" variants={rise}>
                        <div className="team-card-head">
                            <h2 id="invite-title">Invite people</h2>
                        </div>
                        <p className="team-lede">They’ll get an email with a link to join, and see the invite when they sign in with that email. Invites last 7 days.</p>
                        <InviteForm
                            id="team-emails"
                            workspaceId={workspace.id}
                            exclude={[...members.map(m => m.email), ...pending.map(i => i.email)].filter(Boolean)}
                            onSent={loadInvites}
                        />
                    </motion.section>

                    <motion.section className="team-card is-sent" aria-labelledby="pending-title" variants={rise}>
                        <div className="team-card-head">
                            <h2 id="pending-title">Sent invites</h2>
                            {invites.status === 'ready' && <span className="task-group-count">{pending.length} pending</span>}
                            {history.length > 0 && (
                                <button type="button" className="btn btn-quiet team-history" aria-pressed={showHistory} onClick={() => setShowHistory(s => !s)}>
                                    {showHistory ? 'Hide history' : 'Show history'}
                                </button>
                            )}
                        </div>
                        {invites.status === 'loading' && (
                            <div role="status">
                                <span className="sr-only">Loading invites</span>
                                {[0, 1].map(i => <span key={i} className="skeleton team-skeleton" />)}
                            </div>
                        )}
                        {invites.status === 'error' && (
                            <div className="team-error" role="alert">
                                <span>Couldn’t load sent invites.</span>
                                <button type="button" className="btn btn-quiet" onClick={() => { setInvites({ status: 'loading' }); loadInvites() }}>Try again</button>
                            </div>
                        )}
                        {invites.status === 'ready' && shown.length === 0 && (
                            <p className="team-empty">No pending invites.</p>
                        )}
                        {shown.length > 0 && (
                            <ul className="member-list">
                                {shown.map(invite => (
                                    <li key={invite.id} className={`member-row${invite.status === 'pending' ? '' : ' is-past'}`}>
                                        <Avatar name={invite.email} size={36} />
                                        <span className="member-who">
                                            <span className="member-name">{invite.email}</span>
                                            <span className="member-email">{statusLabel(invite)}</span>
                                        </span>
                                        {invite.status === 'pending' && (
                                            <button type="button" className="btn btn-quiet member-remove" onClick={() => handleCancel(invite)}>
                                                Cancel<span className="sr-only"> invite to {invite.email}</span>
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {inviteError && <p className="field-error" role="alert">{inviteError}</p>}
                    </motion.section>
                </div>
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
