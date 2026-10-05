import { useCallback, useEffect, useState } from 'react'
import { createInviteLink, isLinkActive, listInviteLinks, revokeInviteLink, type InviteLink } from '../services/members'
import { friendlyError } from '../utils/errors'
import './TaskDialog.css'

const expiries = [
    { id: '1', label: '1 day', days: 1 },
    { id: '7', label: '7 days', days: 7 },
    { id: 'never', label: 'Never', days: 0 },
]

function linkStatus(link: InviteLink) {
    if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) return 'Expired'
    if (link.maxUses !== null && link.uses >= link.maxUses) return 'Used up'
    const expires = link.expiresAt
        ? `Expires ${new Date(link.expiresAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
        : 'Never expires'
    const uses = link.maxUses !== null ? `${link.uses} of ${link.maxUses} uses` : `${link.uses} ${link.uses === 1 ? 'use' : 'uses'}`
    return `${expires} · ${uses}`
}

function InviteLinks({ workspaceId, liveKey }: { workspaceId: string, liveKey: number }) {
    const [links, setLinks] = useState<InviteLink[] | null>(null)
    const [loadFailed, setLoadFailed] = useState(false)
    const [expiry, setExpiry] = useState('7')
    const [maxUses, setMaxUses] = useState('')
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState<string | null>(null)

    const load = useCallback(() => listInviteLinks(workspaceId).then(({ data, error }) => {
        if (error || !data) {
            friendlyError(error)
            setLoadFailed(true)
            return
        }
        setLoadFailed(false)
        setLinks(data)
    }), [workspaceId])

    useEffect(() => {
        load()
    }, [load, liveKey])

    async function handleCreate(e: React.SyntheticEvent) {
        e.preventDefault()
        const uses = maxUses.trim() ? Number(maxUses) : null
        if (uses !== null && (!Number.isInteger(uses) || uses < 1 || uses > 1000)) {
            setError('Max uses must be a whole number from 1 to 1000.')
            return
        }
        const days = expiries.find(o => o.id === expiry)?.days ?? 0
        setCreating(true)
        setError('')
        const { error } = await createInviteLink(workspaceId, days ? new Date(Date.now() + days * 864e5).toISOString() : null, uses)
        setCreating(false)
        if (error) {
            setError(friendlyError(error, 'Couldn’t create the link. Try again.'))
            return
        }
        setMaxUses('')
        load()
    }

    async function handleRevoke(link: InviteLink) {
        setError('')
        const { error } = await revokeInviteLink(link.id)
        if (error) {
            setError(friendlyError(error, 'Couldn’t revoke the link. Try again.'))
            return
        }
        setLinks(list => list?.filter(l => l.id !== link.id) ?? null)
    }

    function handleCopy(link: InviteLink, url: string) {
        navigator.clipboard.writeText(url).then(
            () => {
                setError('')
                setCopied(link.id)
            },
            () => setError('Couldn’t copy the link. Select it and copy it yourself.'),
        )
    }

    return (
        <section className="team-card is-links" aria-labelledby="links-title">
            <div className="team-card-head">
                <h2 id="links-title">Invite links</h2>
            </div>
            <p className="team-lede">Anyone with the link can join after they sign in. Revoke it any time.</p>
            <form onSubmit={handleCreate} noValidate>
                <div className="task-field-row">
                    <div className="task-field">
                        <label htmlFor="link-expiry">Expires after</label>
                        <select id="link-expiry" value={expiry} onChange={e => setExpiry(e.target.value)}>
                            {expiries.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                    </div>
                    <div className="task-field">
                        <label htmlFor="link-uses">Max uses (optional)</label>
                        <input id="link-uses" type="number" inputMode="numeric" min={1} max={1000} placeholder="No limit" value={maxUses} onChange={e => setMaxUses(e.target.value)} />
                    </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating…' : 'Create link'}</button>
            </form>
            {error && <p className="field-error" role="alert">{error}</p>}
            {loadFailed && (
                <div className="team-error" role="alert">
                    <span>Couldn’t load invite links.</span>
                    <button type="button" className="btn btn-quiet" onClick={load}>Try again</button>
                </div>
            )}
            {links && links.length > 0 && (
                <ul className="member-list invite-links">
                    {links.map(link => {
                        const url = `${window.location.origin}/invite/${link.token}`
                        const active = isLinkActive(link)
                        return (
                            <li key={link.id} className={`member-row${active ? '' : ' is-inactive'}`}>
                                <span className="member-who">
                                    <label className="sr-only" htmlFor={`link-${link.id}`}>Invite link</label>
                                    <input id={`link-${link.id}`} className="invite-link-url" readOnly value={url} onFocus={e => e.target.select()} />
                                    <span className="member-email">{linkStatus(link)}</span>
                                </span>
                                {active && (
                                    <button type="button" className="btn btn-outline member-remove" onClick={() => handleCopy(link, url)}>
                                        {copied === link.id ? 'Copied' : 'Copy'}<span className="sr-only"> invite link</span>
                                    </button>
                                )}
                                <button type="button" className="btn btn-quiet member-remove" onClick={() => handleRevoke(link)}>
                                    {active ? 'Revoke' : 'Remove'}<span className="sr-only"> invite link</span>
                                </button>
                            </li>
                        )
                    })}
                </ul>
            )}
            {copied && <p className="sr-only" role="status">Link copied</p>}
        </section>
    )
}

export default InviteLinks
