import { useNavigate } from 'react-router-dom'
import ConfirmDialog from './ConfirmDialog'
import NameDialog from './NameDialog'
import { deleteWorkspace, renameWorkspace, type WorkspaceSummary } from '../services/workspace'
import { removeMember } from '../services/members'
import { friendlyError } from '../utils/errors'

export interface WorkspaceAsk {
    kind: 'rename' | 'delete' | 'leave'
    workspace: WorkspaceSummary
}

interface WorkspaceDialogsProps {
    ask: WorkspaceAsk
    me: string
    current?: string
    onChanged: () => void
    onClose: () => void
}

function WorkspaceDialogs({ ask, me, current, onChanged, onClose }: WorkspaceDialogsProps) {
    const navigate = useNavigate()
    const { workspace } = ask

    function gone() {
        onChanged()
        if (workspace.id === current) navigate('/dashboard', { replace: true })
        return null
    }

    if (ask.kind === 'rename') {
        return (
            <NameDialog
                title="Rename workspace"
                label="Workspace name"
                initial={workspace.name}
                submitLabel="Rename"
                maxLength={80}
                onSubmit={async name => {
                    const { error } = await renameWorkspace(workspace.id, name)
                    if (error) return friendlyError(error, 'Couldn’t rename this workspace. Only its owner can.')
                    onChanged()
                    return null
                }}
                onClose={onClose}
            />
        )
    }

    if (ask.kind === 'delete') {
        return (
            <ConfirmDialog
                title={`Delete ${workspace.name}?`}
                message="This deletes every task in it and removes everyone from it. It can’t be undone."
                confirmLabel="Delete workspace"
                requireText={workspace.name}
                onConfirm={async () => {
                    const { error } = await deleteWorkspace(workspace.id)
                    return error ? friendlyError(error, 'Couldn’t delete this workspace. Only its owner can, so check you still own it and try again.') : gone()
                }}
                onClose={onClose}
            />
        )
    }

    return (
        <ConfirmDialog
            title={`Leave ${workspace.name}?`}
            message="You’ll lose access to its tasks, and tasks assigned to you become unassigned. The owner can invite you back."
            confirmLabel="Leave workspace"
            onConfirm={async () => {
                const { error } = await removeMember(workspace.id, me)
                return error ? friendlyError(error, 'Couldn’t leave this workspace. Check your connection and try again.') : gone()
            }}
            onClose={onClose}
        />
    )
}

export default WorkspaceDialogs
