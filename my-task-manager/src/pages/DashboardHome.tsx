import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import FirstRun from './FirstRun';
import { getPendingInvites, getWorkspaces, type PendingInvite } from '../services/workspace';
import './FirstRun.css';

type HomeState =
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'has-workspace'; workspaceId: string }
    | { status: 'first-run'; invites: PendingInvite[] };

// /dashboard index: send returning users to their first workspace, and show
// the first-run screen to anyone who isn't in a workspace yet.
function DashboardHome() {
    const [state, setState] = useState<HomeState>({ status: 'loading' });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            const [workspaces, invites] = await Promise.all([getWorkspaces(), getPendingInvites()]);
            if (cancelled) return;

            if (workspaces.error || !workspaces.data) {
                setState({ status: 'error' });
            } else if (workspaces.data.length > 0) {
                setState({ status: 'has-workspace', workspaceId: workspaces.data[0].id });
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
