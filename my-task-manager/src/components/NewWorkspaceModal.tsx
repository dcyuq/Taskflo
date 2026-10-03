import './NewWorkspaceModal.css';
import { createWorkspace } from '../services/workspace';
import { useEffect, useRef, useState } from 'react';

interface NewWorkspaceModalProps {
    onClose: () => void;
    onCreated: () => void;
}

// Native <dialog> + showModal() gives focus trapping, Esc to close and inert background.
function NewWorkspaceModal({onClose, onCreated} : NewWorkspaceModalProps) {

    const dialogRef = useRef<HTMLDialogElement>(null);
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

        const {error} = await createWorkspace(name.trim());

        if (error) {
            setError("Couldn't create the workspace. Check your connection and try again.");
            setLoading(false);
            return;
        }

        onCreated();
        onClose();
    }
    return (
        <dialog
            ref={dialogRef}
            className="modal"
            aria-labelledby="new-workspace-title"
            onClose={onClose}
            onClick={(e) => e.target === dialogRef.current && onClose()}
        >
            <form onSubmit={handleCreate} noValidate>
                <div className="modal-header">
                    <h2 id="new-workspace-title" className='modal-title'>New workspace</h2>
                    <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    <label className="modal-label" htmlFor="new-workspace-name">Workspace name</label>
                    <input id="new-workspace-name" className='modal-input' type="text" placeholder="e.g. Marketing team" autoComplete="off" maxLength={80} value={name} onChange={(e) => setName(e.target.value)}/>
                    {error && <div className="form-error" role="alert">{error}</div>}
                </div>

                <div className="modal-footer">
                    <button type="submit" className="modal-create" disabled={loading}>{loading ? 'Creating…' : 'Create workspace'}</button>
                    <button type="button" className="modal-cancel" onClick={onClose}>Cancel</button>
                </div>
            </form>
        </dialog>

    )
}

export default NewWorkspaceModal;
