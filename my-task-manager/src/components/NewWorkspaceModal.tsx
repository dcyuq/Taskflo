import './NewWorkspaceModal.css';
import { createWorkspace } from '../services/workspace';
import { useState } from 'react';

interface NewWorkspaceModalProps {
    onClose: () => void;
    onCreated: () => void;
}

function NewWorkspaceModal({onClose, onCreated} : NewWorkspaceModalProps) {

    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleCreate() {
        if (!name.trim()) return;
        setLoading(true);

        const {error} = await createWorkspace(name.trim());

        if (error) {
            alert('Something went wrong. Please try again.');
            setLoading(false);
            return;
        }
        
        onCreated();
        onClose();
    }
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <span className='modal-title'>New Workspace</span>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    <label className="modal-label">Workspace Name</label>
                    <input className='modal-input' type="text" placeholder="e.g. Marketing Team" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)}/>

                </div>

                <div className="modal-footer">
                    <button className="modal-create" onClick={handleCreate} disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
                    <button className="modal-cancel" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>

    )
}

export default NewWorkspaceModal;