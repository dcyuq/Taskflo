import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ActionMenu from './ActionMenu'
import { menuFor, type MenuAt } from '../utils/menu'
import ConfirmDialog from './ConfirmDialog'
import { deleteWorkspace, type WorkspaceSummary } from '../services/workspace'
import { removeMember } from '../services/members'

type Asking = 'delete' | 'leave' | 'owner-leave' | null

function WorkspacePanel({ workspace, me }: { workspace: WorkspaceSummary, me: string }) {
    const navigate = useNavigate()
    const [menu, setMenu] = useState<MenuAt | null>(null)
    const [asking, setAsking] = useState<Asking>(null)
    const isOwner = workspace.owner_id === me

    const items = [
        ...(isOwner ? [{ label: 'Delete workspace', danger: true, onSelect: () => setAsking('delete') }] : []),
        { label: 'Leave workspace', danger: !isOwner, onSelect: () => setAsking(isOwner ? 'owner-leave' : 'leave') },
    ]

    async function handleDelete() {
        const { error } = await deleteWorkspace(workspace.id)
        if (error) return 'Couldn’t delete this workspace. Only its owner can, so check you still own it and try again.'
        navigate('/dashboard', { replace: true })
        return null
    }

    async function handleLeave() {
        const { error } = await removeMember(workspace.id, me)
        if (error) return 'Couldn’t leave this workspace. Check your connection and try again.'
        navigate('/dashboard', { replace: true })
        return null
    }

    return (
        <section className="sidebar-section is-spaced" aria-labelledby="sidebar-current">
            <div className="sidebar-section-head">
                <h2 className="sidebar-label sidebar-current" id="sidebar-current">{workspace.name}</h2>
                <button
                    type="button"
                    className="sidebar-icon-btn is-small"
                    aria-label={`${workspace.name} options`}
                    aria-haspopup="menu"
                    onClick={e => setMenu(menuFor(e, `${workspace.name} options`, items))}
                >
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                        <circle cx="3.5" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="12.5" cy="8" r="1.3" />
                    </svg>
                </button>
            </div>

            {menu && <ActionMenu at={menu} onClose={() => setMenu(null)} />}

            {asking === 'delete' && (
                <ConfirmDialog
                    title={`Delete ${workspace.name}?`}
                    message="This deletes every board, category and task in it and removes everyone from it. It can’t be undone."
                    confirmLabel="Delete workspace"
                    requireText={workspace.name}
                    onConfirm={handleDelete}
                    onClose={() => setAsking(null)}
                />
            )}
            {asking === 'leave' && (
                <ConfirmDialog
                    title={`Leave ${workspace.name}?`}
                    message="You’ll lose access to its tasks, and tasks assigned to you become unassigned. The owner can invite you back."
                    confirmLabel="Leave workspace"
                    onConfirm={handleLeave}
                    onClose={() => setAsking(null)}
                />
            )}
            {asking === 'owner-leave' && (
                <ConfirmDialog
                    title="You own this workspace"
                    message="Owners can’t leave. Delete the workspace instead if nobody needs it anymore."
                    onClose={() => setAsking(null)}
                />
            )}
        </section>
    )
}

export default WorkspacePanel