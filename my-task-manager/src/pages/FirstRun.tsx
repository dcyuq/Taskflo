import './FirstRun.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import EmailChipField from '../components/EmailChipField';
import { useEmailChips } from '../hooks/useEmailChips';
import {
    acceptInvite,
    createWorkspace,
    declineInvite,
    sendInvites,
    type PendingInvite,
} from '../services/workspace';


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

    async function handleCreate(e: React.SyntheticEvent) {
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
    const [ownEmail, setOwnEmail] = useState('');
    const [sending, setSending] = useState(false);
    const chips = useEmailChips([ownEmail], "You're already in this workspace, so your own email was left out.");

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setOwnEmail(session?.user.email?.toLowerCase() ?? '');
        });
    }, []);

    function goToWorkspace() {
        navigate(`/dashboard/workspace/${workspace.id}`, { replace: true });
    }

    async function handleSend(e: React.SyntheticEvent) {
        e.preventDefault();
        const all = chips.collect();
        if (!all) return;
        if (all.length === 0) {
            chips.setError('Add at least one email, or skip this step.');
            chips.inputRef.current?.focus();
            return;
        }

        setSending(true);
        chips.setError('');
        const { error: sendError } = await sendInvites(workspace.id, all);
        if (sendError) {
            chips.setError("Couldn't send the invites. Check your connection and try again.");
            setSending(false);
            return;
        }
        goToWorkspace();
    }

    const count = chips.emails.length;

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
            <EmailChipField id="firstrun-emails" chips={chips} autoFocus />

            <div className="firstrun-actions">
                <button type="submit" className="firstrun-btn-primary" disabled={sending} onMouseDown={(e) => e.preventDefault()}>
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

export default FirstRun;
