import { supabase } from '../supabaseClient'

export interface Category {
    id: string
    workspace_id: string
    name: string
    position: number
}

export interface Board {
    id: string
    workspace_id: string
    category_id: string | null
    name: string
    position: number
}

type Table = 'categories' | 'boards'

const byPosition = { ascending: true }

export async function listTree(workspaceId: string) {
    const [categories, boards] = await Promise.all([
        supabase.from('categories').select('id, workspace_id, name, position').eq('workspace_id', workspaceId).order('position', byPosition).order('created_at', byPosition),
        supabase.from('boards').select('id, workspace_id, category_id, name, position').eq('workspace_id', workspaceId).order('position', byPosition).order('created_at', byPosition),
    ])
    const error = categories.error ?? boards.error
    if (error) return { data: null, error }
    return { data: { categories: categories.data as Category[], boards: boards.data as Board[] }, error: null }
}

export async function createCategory(workspaceId: string, name: string, position: number) {
    const { data, error } = await supabase
        .from('categories')
        .insert({ workspace_id: workspaceId, name, position })
        .select('id, workspace_id, name, position')
        .single()
    return { data: data as Category | null, error }
}

export async function createBoard(workspaceId: string, categoryId: string | null, name: string, position: number) {
    const { data, error } = await supabase
        .from('boards')
        .insert({ workspace_id: workspaceId, category_id: categoryId, name, position })
        .select('id, workspace_id, category_id, name, position')
        .single()
    return { data: data as Board | null, error }
}

export async function renameItem(table: Table, id: string, name: string) {
    const { data, error } = await supabase.from(table).update({ name }).eq('id', id).select('id')
    return { error: error ?? (data?.length ? null : new Error('Not allowed')) }
}

export async function deleteItem(table: Table, id: string) {
    const { data, error } = await supabase.from(table).delete().eq('id', id).select('id')
    return { error: error ?? (data?.length ? null : new Error('Not allowed')) }
}

export async function savePlacement(table: Table, rows: { id: string, position: number, category_id?: string | null }[]) {
    const results = await Promise.all(rows.map(({ id, ...change }) => supabase.from(table).update(change).eq('id', id).select('id')))
    const failed = results.find(r => r.error || !r.data?.length)
    return { error: failed ? failed.error ?? new Error('Not allowed') : null }
}
