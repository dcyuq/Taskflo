import { supabase } from '../supabaseClient'

export interface Category {
    id: string
    name: string
    position: number
}

export async function listCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, position')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })
    return { data: data as Category[] | null, error }
}

export async function createCategory(name: string, position: number) {
    const { data, error } = await supabase
        .from('categories')
        .insert({ name, position })
        .select('id, name, position')
        .single()
    return { data: data as Category | null, error }
}

export async function renameCategory(id: string, name: string) {
    const { data, error } = await supabase.from('categories').update({ name }).eq('id', id).select('id')
    return { error: error ?? (data?.length ? null : new Error('Not allowed')) }
}

export async function deleteCategory(id: string) {
    const { data, error } = await supabase.from('categories').delete().eq('id', id).select('id')
    return { error: error ?? (data?.length ? null : new Error('Not allowed')) }
}

export async function orderCategories(rows: { id: string, position: number }[]) {
    const results = await Promise.all(rows.map(({ id, position }) => supabase.from('categories').update({ position }).eq('id', id).select('id')))
    const failed = results.find(r => r.error || !r.data?.length)
    return { error: failed ? failed.error ?? new Error('Not allowed') : null }
}
