import { useOutletContext } from 'react-router-dom'
import type { Dispatch, SetStateAction } from 'react'
import type { Task } from '../services/tasks'
import type { Member } from '../services/members'
import type { Board } from '../services/boards'

export interface WorkspaceContext {
    workspace: { id: string, name: string, owner_id: string | null }
    members: Member[]
    tasks: Task[]
    board: Board | null
    setTasks: Dispatch<SetStateAction<Task[]>>
    me: string
    isOwner: boolean
    reload: () => Promise<void>
}

export const LAST_WORKSPACE_KEY = 'taskflo:last-workspace'

export const useWorkspace = () => useOutletContext<WorkspaceContext>()
