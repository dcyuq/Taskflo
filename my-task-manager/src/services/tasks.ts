import { supabase } from '../supabaseClient'

export type TaskStatus = 'todo' | 'doing' | 'done'

export interface Task {
    id: string
    workspace_id: string
    board_id: string
    title: string
    status: TaskStatus
    assignee_id: string | null
    due_date: string | null
    created_by: string | null
    created_at: string
    updated_at: string
}

export type TaskPatch = Partial<Pick<Task, 'title' | 'status' | 'assignee_id' | 'due_date'>>

const columns = 'id, workspace_id, board_id, title, status, assignee_id, due_date, created_by, created_at, updated_at'

export const statuses: { id: TaskStatus, label: string }[] = [
    { id: 'todo', label: 'To do' },
    { id: 'doing', label: 'Doing' },
    { id: 'done', label: 'Done' },
]

export async function listTasks(workspaceId: string) {
    const { data, error } = await supabase
        .from('tasks')
        .select(columns)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true })
    return { data: data as Task[] | null, error }
}

export async function createTask(workspaceId: string, boardId: string, input: TaskPatch & { title: string }) {
    const { data, error } = await supabase
        .from('tasks')
        .insert({ workspace_id: workspaceId, board_id: boardId, ...input })
        .select(columns)
        .single()
    return { data: data as Task | null, error }
}

export async function updateTask(id: string, patch: TaskPatch) {
    const { data, error } = await supabase
        .from('tasks')
        .update(patch)
        .eq('id', id)
        .select(columns)
        .single()
    return { data: data as Task | null, error }
}

export async function deleteTask(id: string) {
    const { data, error } = await supabase.from('tasks').delete().eq('id', id).select('id')
    return { error: error ?? (data?.length ? null : new Error('Not allowed')) }
}

export async function listOpenTasks() {
    const { data, error } = await supabase
        .from('tasks')
        .select(columns)
        .neq('status', 'done')
        .order('due_date', { ascending: true, nullsFirst: false })
    return { data: data as Task[] | null, error }
}
