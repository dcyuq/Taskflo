import { useOutletContext } from 'react-router-dom'
import type { Dispatch, SetStateAction } from 'react'
import type { Task } from '../services/tasks'
import type { Member } from '../services/members'

export interface WorkspaceContext {
    workspace: { id: string, name: string, owner_id: string | null }
    members: Member[]
    tasks: Task[]
    setTasks: Dispatch<SetStateAction<Task[]>>
    me: string
    isOwner: boolean
    reload: () => Promise<void>
    liveKey: number
}

export const LAST_WORKSPACE_KEY = 'taskflo:last-workspace'

export const useWorkspace = () => useOutletContext<WorkspaceContext>()
