import { useEffect, useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { acceptInvite, declineInvite, previewInvite, type InvitePreview, type PendingInvite } from '../services/workspace'
import { friendlyError } from '../utils/errors'
import { relativeTime } from '../utils/dates'
import { inviteCode } from '../utils/invite'
import { rise, staggered } from '../utils/motion'
import type { DashboardContext } from './Dashboard'
import './Workspace.css'

const INVALID = 'This invite is invalid or expired.'

type Lookup =
    | { status: 'idle' | 'loading' }
    | { status: 'failed', message: string }
    | { status: 'ready', token: string, preview: InvitePreview }

const initialOf = (name: string) => name.trim().charAt(0).toUpperCase()

function toLookup(token: string, { data, error }: Awaited<ReturnType<typeof previewInvite>>): Lookup {
    if (error) return { status: 'failed', message: friendlyError(error, 'Couldn’t look up that invite. Try again.') }
    return data ? { status: 'ready', token, preview: data } : { status: 'failed', message: INVALID }
}

function InvitesView() {
    const { invites, reloadInvites, reloadWorkspaces } = useOutletContext<DashboardContext>()
    const reduce = useReducedMotion()
    const [params, setParams] = useSearchParams()
    const linked = params.get('code')
    const linkedToken = linked ? inviteCode(linked) : null
    const [code, setCode] = useState(linked ?? '')
    const [lookup, setLookup] = useState<Lookup>(() =>
        !linked ? { status: 'idle' } : linkedToken ? { status: 'loading' } : { status: 'failed', message: INVALID })
    const [joined, setJoined] = useState<{ id: string, name: string } | null>(null)
    const [busy, setBusy] = useState<string | null>(null)
    const [listError, setListError] = useState('')

    useEffect(() => {
        if (linkedToken) previewInvite(linkedToken).then(result => setLookup(toLookup(linkedToken, result)))
    }, [linkedToken])

    function look(raw: string) {
        const token = inviteCode(raw)
        if (!token) return setLookup({ status: 'failed', message: INVALID })
        setLookup({ status: 'loading' })
        previewInvite(token).then(result => setLookup(toLookup(token, result)))
    }

    function clear() {
        setLookup({ status: 'idle' })
        setCode('')
        if (linked) setParams({}, { replace: true })
    }

    async function join(token: string, name: string, fromCard: boolean) {
        setBusy(token)
        setListError('')
        const { workspaceId, error } = await acceptInvite(token)
        setBusy(null)
        if (error || !workspaceId) {
            const message = friendlyError(error, fromCard ? INVALID : `Couldn’t join ${name}. The invite may have expired.`)
            if (fromCard) setLookup({ status: 'failed', message })
            else setListError(message)
            return
        }
        setJoined({ id: workspaceId, name })
        if (fromCard) clear()
        reloadInvites()
        reloadWorkspaces()
    }

    async function decline(invite: PendingInvite) {
        setBusy(invite.token)
        setListError('')
        const { error } = await declineInvite(invite.token)
        setBusy(null)
        if (error) {
            setListError(friendlyError(error, `Couldn’t decline the invite to ${invite.workspaceName}. Try again.`))
            return
        }
        reloadInvites()
    }

    function handleLookup(e: React.SyntheticEvent) {
        e.preventDefault()
        setJoined(null)
        look(code)
    }

    return (
        <motion.div className="ws invites" initial={reduce ? false : 'hidden'} animate="show" variants={staggered}>
            <motion.header className="personal-head" variants={rise}>
                <h1 className="ws-title">Invites</h1>
                <p className="personal-lede">Join workspaces you’ve been invited to, or paste an invite link.</p>
            </motion.header>

            <div className="invites-note" role="status">
                {joined && (
                    <p className="invites-joined">
                        You joined {joined.name}. <Link to={`/dashboard/workspace/${joined.id}`}>Open workspace</Link>
                    </p>
                )}
            </div>

            <motion.section className="team-card invites-join" aria-labelledby="join-title" variants={rise}>
                <h2 id="join-title" className="invites-heading">Join a workspace</h2>
                <form className="invites-form" onSubmit={handleLookup} noValidate>
                    <label htmlFor="invite-code" className="sr-only">Invite link or code</label>
                    <input
                        id="invite-code"
                        className="invites-input"
                        placeholder="Paste an invite link or code"
                        autoComplete="off"
                        spellCheck={false}
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        aria-invalid={lookup.status === 'failed'}
                        aria-describedby={lookup.status === 'failed' ? 'invite-code-error' : undefined}
                    />
                    <button type="submit" className="btn btn-primary" disabled={!code.trim() || lookup.status === 'loading'}>
                        {lookup.status === 'loading' ? 'Looking…' : 'Look up'}
                    </button>
                </form>
                {lookup.status === 'failed' && <p className="field-error" id="invite-code-error" role="alert">{lookup.message}</p>}
                {lookup.status === 'ready' && (
                    <div className="invite-card">
                        <span className="invite-badge is-large" aria-hidden="true">{initialOf(lookup.preview.workspace_name)}</span>
                        <div className="invite-card-body">
                            <p className="invite-card-name">{lookup.preview.workspace_name}</p>
                            <p className="invite-meta">
                                {lookup.preview.member_count} {lookup.preview.member_count === 1 ? 'member' : 'members'}
                                {' · '}{lookup.preview.kind === 'link' ? 'Link from' : 'Invited by'} {lookup.preview.invited_by_name ?? 'a teammate'}
                                {' · '}{lookup.preview.expires_at ? `Expires ${relativeTime(lookup.preview.expires_at)}` : 'Never expires'}
                            </p>
                            {lookup.preview.already_member && <p className="invite-meta">You’re already a member of this workspace.</p>}
                        </div>
                        <div className="invite-actions">
                            {lookup.preview.already_member ? (
                                <Link className="btn btn-primary" to={`/dashboard/workspace/${lookup.preview.workspace_id}`}>Open workspace</Link>
                            ) : (
                                <button type="button" className="btn btn-primary" disabled={busy === lookup.token} onClick={() => join(lookup.token, lookup.preview.workspace_name, true)}>
                                    {busy === lookup.token ? 'Joining…' : 'Accept'}
                                </button>
                            )}
                            <button type="button" className="btn btn-quiet" onClick={clear}>Cancel</button>
                        </div>
                    </div>
                )}
            </motion.section>

            <motion.section className="task-group" aria-labelledby="pending-invites" variants={rise}>
                <h2 className="task-group-title" id="pending-invites">
                    Pending invites
                    {invites.length > 0 && <span className="task-group-count">{invites.length}</span>}
                </h2>
                {listError && <p className="field-error" role="alert">{listError}</p>}
                {invites.length === 0 ? (
                    <p className="tasks-empty">No pending invites. When someone invites you, it shows up here.</p>
                ) : (
                    <ul className="invite-list">
                        {invites.map(invite => (
                            <li key={invite.id} className="invite-row">
                                <span className="invite-badge" aria-hidden="true">{initialOf(invite.workspaceName)}</span>
                                <span className="invite-row-who">
                                    <span className="invite-row-name">{invite.workspaceName}</span>
                                    <span className="invite-meta">From {invite.invitedBy ?? 'a teammate'} · {relativeTime(invite.createdAt)}</span>
                                </span>
                                <span className="invite-actions">
                                    <button type="button" className="btn btn-primary" disabled={busy === invite.token} onClick={() => join(invite.token, invite.workspaceName, false)}>
                                        Accept<span className="sr-only"> invite to {invite.workspaceName}</span>
                                    </button>
                                    <button type="button" className="btn btn-quiet" disabled={busy === invite.token} onClick={() => decline(invite)}>
                                        Decline<span className="sr-only"> invite to {invite.workspaceName}</span>
                                    </button>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </motion.section>
        </motion.div>
    )
}

export default InvitesView
