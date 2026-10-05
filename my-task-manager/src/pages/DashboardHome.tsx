import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import FirstRun from './FirstRun';
import { getPendingInvites, getWorkspaces, type PendingInvite } from '../services/workspace';
import './FirstRun.css';
import { LAST_WORKSPACE_KEY } from '../hooks/useWorkspace';
import { readStored } from '../utils/storage';
import { friendlyError } from '../utils/errors';

type HomeState =
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'has-workspace'; workspaceId: string }
    | { status: 'first-run'; invites: PendingInvite[] };

function DashboardHome() {
    const [state, setState] = useState<HomeState>({ status: 'loading' });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            const [workspaces, invites] = await Promise.all([getWorkspaces(), getPendingInvites()]);
            if (cancelled) return;

            if (workspaces.error || !workspaces.data) {
                friendlyError(workspaces.error);
                setState({ status: 'error' });
            } else if (workspaces.data.length > 0) {
                const last = readStored(LAST_WORKSPACE_KEY);
                const target = workspaces.data.find((w) => w.id === last) ?? workspaces.data[0];
                setState({ status: 'has-workspace', workspaceId: target.id });
            } else {
                setState({ status: 'first-run', invites: invites.data ?? [] });
            }
        }
        load();

        return () => {
            cancelled = true;
        };
    }, [attempt]);

    if (state.status === 'loading') {
        return <div className="firstrun-loading" role="status">Loading your workspaces…</div>;
    }

    if (state.status === 'error') {
        return (
            <div className="firstrun-loading" role="alert">
                <div>
                    <p>Couldn't load your workspaces.</p>
                    <button
                        type="button"
                        className="firstrun-btn-quiet"
                        onClick={() => {
                            setState({ status: 'loading' });
                            setAttempt((n) => n + 1);
                        }}
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    if (state.status === 'has-workspace') {
        return <Navigate to={`workspace/${state.workspaceId}`} replace />;
    }

    return <FirstRun invites={state.invites} />;
}

export default DashboardHome;
