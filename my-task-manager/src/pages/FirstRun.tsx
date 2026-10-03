import './FirstRun.css';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    acceptInvite,
    createWorkspace,
    declineInvite,
    sendInvites,
    type PendingInvite,
} from '../services/workspace';

const EMAIL_PATTERN = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

interface FirstRunProps {
    invites: PendingInvite[];
}

function FirstRun({ invites: initialInvites }: FirstRunProps) {
    const [step, setStep] = useState<'workspace' | 'invite'>('workspace');
    const [workspace, setWorkspace] = useState<{ id: string; name: string } | null>(null);

    return (
        <main className="firstrun">
            <div className="firstrun-column" key={step}>
                {step === 'workspace' ? (
                    <WorkspaceStep
                        initialInvites={initialInvites}
                        onCreated={(ws) => {
                            setWorkspace(ws);
                            setStep('invite');
                        }}
                    />
                ) : (
                    workspace && <InviteStep workspace={workspace} />
                )}
            </div>
        </main>
    );
}

function WorkspaceStep({
    initialInvites,
    onCreated,
}: {
    initialInvites: PendingInvite[];
    onCreated: (ws: { id: string; name: string }) => void;
}) {
    const navigate = useNavigate();
    const [invites, setInvites] = useState(initialInvites);
    const [busyInvite, setBusyInvite] = useState<string | null>(null);
    const [inviteError, setInviteError] = useState('');

    const [name, setName] = useState('');
    const [creating, setCreating] = useState(false);
    const [nameError, setNameError] = useState('');

    const hasInvites = invites.length > 0;

    async function handleJoin(invite: PendingInvite) {
        setBusyInvite(invite.id);
        setInviteError('');
        const { workspaceId, error } = await acceptInvite(invite.token);
        if (error || !workspaceId) {
            setInviteError(`Couldn't join ${invite.workspaceName}. The invite may have expired. Ask the person who invited you to send a new one.`);
            setBusyInvite(null);
            return;
        }
        navigate(`/dashboard/workspace/${workspaceId}`, { replace: true });
    }

    async function handleDecline(invite: PendingInvite) {
        setBusyInvite(invite.id);
        setInviteError('');
        const { error } = await declineInvite(invite.token);
        setBusyInvite(null);
        if (error) {
            setInviteError(`Couldn't decline the invite to ${invite.workspaceName}. Try again.`);
            return;
        }
        setInvites((list) => list.filter((i) => i.id !== invite.id));
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setNameError('Give your workspace a name.');
            return;
        }
        if (trimmed.length > 80) {
            setNameError('Keep the name under 80 characters.');
            return;
        }

        setCreating(true);
        setNameError('');
        const { data, error } = await createWorkspace(trimmed);
        if (error || !data) {
            setNameError("Couldn't create the workspace. Check your connection and try again.");
            setCreating(false);
            return;
        }
        onCreated({ id: data.id, name: data.name });
    }

    return (
        <>
            {hasInvites && (
                <section className="firstrun-invites" aria-labelledby="firstrun-invites-heading">
                    <h1 id="firstrun-invites-heading" className="firstrun-title">
                        {invites.length === 1 ? "You've been invited" : `You have ${invites.length} invites`}
                    </h1>
                    <p className="firstrun-lede">Join your team to see the work assigned to you.</p>

                    <ul className="firstrun-invite-list">
                        {invites.map((invite) => (
                            <li key={invite.id} className="firstrun-invite">
                                <span className="firstrun-invite-initial" aria-hidden="true">
                                    {invite.workspaceName.trim().charAt(0).toUpperCase()}
                                </span>
                                <span className="firstrun-invite-name">{invite.workspaceName}</span>
                                <button
                                    type="button"
                                    className="firstrun-btn-quiet"
                                    onClick={() => handleDecline(invite)}
                                    disabled={busyInvite !== null}
                                    aria-label={`Decline invite to ${invite.workspaceName}`}
                                >
                                    Decline
                                </button>
                                <button
                                    type="button"
                                    className="firstrun-btn-primary firstrun-btn-small"
                                    onClick={() => handleJoin(invite)}
                                    disabled={busyInvite !== null}
                                >
                                    {busyInvite === invite.id ? 'Joining…' : 'Join'}
                                </button>
                            </li>
                        ))}
                    </ul>
                    {inviteError && <p className="firstrun-error" role="alert">{inviteError}</p>}

                    <div className="firstrun-divider"><span>or start your own</span></div>
                </section>
            )}

            <form className="firstrun-form" onSubmit={handleCreate} noValidate>
                {hasInvites ? (
                    <h2 className="firstrun-subtitle">Create a workspace</h2>
                ) : (
                    <>
                        <h1 className="firstrun-title">Name your workspace</h1>
                        <p className="firstrun-lede">
                            A workspace holds one team and its tasks. Use a name your teammates will recognise.
                        </p>
                    </>
                )}

                <label htmlFor="firstrun-name" className="firstrun-label">Workspace name</label>
                <input
                    id="firstrun-name"
                    className="firstrun-input"
                    type="text"
                    placeholder="e.g. Design team"
                    autoComplete="off"
                    autoFocus={!hasInvites}
                    maxLength={80}
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (nameError) setNameError('');
                    }}
                    aria-invalid={nameError ? true : undefined}
                    aria-describedby={nameError ? 'firstrun-name-error' : undefined}
                />
                {nameError && <p id="firstrun-name-error" className="firstrun-error" role="alert">{nameError}</p>}

                <div className="firstrun-actions">
                    <button type="submit" className="firstrun-btn-primary" disabled={creating}>
                        {creating ? 'Creating…' : 'Create workspace'}
                    </button>
                    <span className="firstrun-step">Step 1 of 2</span>
                </div>
            </form>
        </>
    );
}

function InviteStep({ workspace }: { workspace: { id: string; name: string } }) {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const [draft, setDraft] = useState('');
    const [emails, setEmails] = useState<string[]>([]);
    const [ownEmail, setOwnEmail] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setOwnEmail(session?.user.email?.toLowerCase() ?? '');
        });
    }, []);

    function goToWorkspace() {
        navigate(`/dashboard/workspace/${workspace.id}`, { replace: true });
    }

    // Turn whatever is in the field into chips. Returns false if something
    // couldn't be added so the caller can keep the text for correction.
    function commit(raw: string) {
        const parts = raw.split(/[\s,;]+/).map((p) => p.trim().toLowerCase()).filter(Boolean);
        if (parts.length === 0) return true;

        const invalid = parts.filter((p) => !EMAIL_PATTERN.test(p));
        const valid = parts.filter((p) => EMAIL_PATTERN.test(p) && p !== ownEmail);
        const includedSelf = parts.includes(ownEmail);

        setEmails((list) => [...list, ...valid.filter((v) => !list.includes(v))].filter((v, i, a) => a.indexOf(v) === i));

        if (invalid.length > 0) {
            setDraft(invalid.join(', '));
            setError(
                invalid.length === 1
                    ? `"${invalid[0]}" doesn't look like an email address.`
                    : `${invalid.length} entries don't look like email addresses.`
            );
            return false;
        }
        setDraft('');
        setError('');
        setNotice(includedSelf ? "You're already in this workspace, so your own email was left out." : '');
        return true;
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
            if (draft.trim()) {
                e.preventDefault();
                commit(draft);
            }
        } else if (e.key === 'Backspace' && draft === '' && emails.length > 0) {
            setEmails((list) => list.slice(0, -1));
        }
    }

    function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
        const text = e.clipboardData.getData('text');
        if (/[\s,;]/.test(text.trim())) {
            e.preventDefault();
            commit(draft + ' ' + text);
        }
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (draft.trim() && !commit(draft)) return;

        // commit() updates state asynchronously, so recompute the final list here.
        const pending = draft
            .split(/[\s,;]+/)
            .map((p) => p.trim().toLowerCase())
            .filter((p) => EMAIL_PATTERN.test(p) && p !== ownEmail);
        const all = [...new Set([...emails, ...pending])];

        if (all.length === 0) {
            setError('Add at least one email, or skip this step.');
            inputRef.current?.focus();
            return;
        }

        setSending(true);
        setError('');
        const { error: sendError } = await sendInvites(workspace.id, all);
        if (sendError) {
            setError("Couldn't send the invites. Check your connection and try again.");
            setSending(false);
            return;
        }
        goToWorkspace();
    }

    const count = emails.length;

    return (
        <form className="firstrun-form" onSubmit={handleSend} noValidate>
            <p className="firstrun-created" role="status">
                <CheckIcon />
                <span><strong>{workspace.name}</strong> is ready</span>
            </p>

            <h1 className="firstrun-title">Invite your team</h1>
            <p className="firstrun-lede">
                Add the people you'll assign work to. They'll see the invite when they sign in to Taskflo with that email address.
            </p>

            <label htmlFor="firstrun-emails" className="firstrun-label">Email addresses</label>
            <div
                className={`firstrun-chipfield${error ? ' is-invalid' : ''}`}
                onClick={() => inputRef.current?.focus()}
            >
                <ul className="firstrun-chips" aria-label="Invites to send">
                    {emails.map((email) => (
                        <li key={email} className="firstrun-chip">
                            <span>{email}</span>
                            <button
                                type="button"
                                className="firstrun-chip-remove"
                                aria-label={`Remove ${email}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEmails((list) => list.filter((x) => x !== email));
                                    inputRef.current?.focus();
                                }}
                            >
                                <CrossIcon />
                            </button>
                        </li>
                    ))}
                </ul>
                <input
                    ref={inputRef}
                    id="firstrun-emails"
                    className="firstrun-chip-input"
                    type="email"
                    inputMode="email"
                    autoComplete="off"
                    autoFocus
                    placeholder={count === 0 ? 'name@company.com' : ''}
                    value={draft}
                    onChange={(e) => {
                        setDraft(e.target.value);
                        if (error) setError('');
                    }}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    onBlur={() => draft.trim() && commit(draft)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? 'firstrun-emails-error' : 'firstrun-emails-hint'}
                />
            </div>
            {error ? (
                <p id="firstrun-emails-error" className="firstrun-error" role="alert">{error}</p>
            ) : (
                <p id="firstrun-emails-hint" className="firstrun-hint">
                    {notice || 'Press Enter after each address, or paste a list.'}
                </p>
            )}

            <div className="firstrun-actions">
                <button type="submit" className="firstrun-btn-primary" disabled={sending}>
                    {sending ? 'Sending…' : count > 1 ? `Send ${count} invites` : 'Send invite'}
                </button>
                <button type="button" className="firstrun-btn-quiet" onClick={goToWorkspace} disabled={sending}>
                    Skip for now
                </button>
                <span className="firstrun-step">Step 2 of 2</span>
            </div>
        </form>
    );
}

function CheckIcon() {
    return (
        <svg className="firstrun-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CrossIcon() {
    return (
        <svg className="firstrun-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
    );
}

export default FirstRun;
