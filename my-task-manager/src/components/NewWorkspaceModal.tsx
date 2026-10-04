import './TaskDialog.css';
import { createWorkspace } from '../services/workspace';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface NewWorkspaceModalProps {
    onClose: () => void;
    onCreated: () => void;
}

function NewWorkspaceModal({onClose, onCreated} : NewWorkspaceModalProps) {

    const dialogRef = useRef<HTMLDialogElement>(null);
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    async function handleCreate(e: React.SyntheticEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setError('Give your workspace a name.');
            return;
        }
        setLoading(true);
        setError('');

        const {data, error} = await createWorkspace(name.trim());

        if (error || !data) {
            setError("Couldn't create the workspace. Check your connection and try again.");
            setLoading(false);
            return;
        }

        onCreated();
        onClose();
        navigate(`/dashboard/workspace/${data.id}`);
    }
    return (
        <dialog
            ref={dialogRef}
            className="task-dialog confirm-dialog"
            aria-labelledby="new-workspace-title"
            onClose={onClose}
            onClick={(e) => e.target === dialogRef.current && onClose()}
        >
            <form onSubmit={handleCreate} noValidate>
                <div className="task-dialog-head">
                    <h2 id="new-workspace-title">New workspace</h2>
                    <button type="button" className="task-dialog-close" aria-label="Close" onClick={onClose}>
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                            <path d="M4 4l8 8M12 4l-8 8" />
                        </svg>
                    </button>
                </div>

                <div className="task-field">
                    <label htmlFor="new-workspace-name">Workspace name</label>
                    <input
                        id="new-workspace-name"
                        type="text"
                        placeholder="e.g. Marketing team"
                        autoComplete="off"
                        maxLength={80}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        aria-invalid={!!error && !name.trim()}
                        aria-describedby={error ? 'new-workspace-error' : undefined}
                    />
                    {error && <p className="field-error" id="new-workspace-error" role="alert">{error}</p>}
                </div>

                <div className="task-dialog-actions">
                    <div className="task-dialog-save">
                        <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading} aria-busy={loading}>{loading ? 'Creating…' : 'Create workspace'}</button>
                    </div>
                </div>
            </form>
        </dialog>

    )
}

export default NewWorkspaceModal;
