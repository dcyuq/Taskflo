import { useCallback, useState } from 'react'
import { getWorkspaces, placeWorkspaces, type WorkspaceSummary } from '../services/workspace'
import { createCategory, deleteCategory, listCategories, orderCategories, renameCategory, type Category } from '../services/categories'

export type ListState =
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'ready', workspaces: WorkspaceSummary[], categories: Category[] }

export const inCategory = (workspaces: WorkspaceSummary[], categoryId: string | null) =>
    workspaces.filter(w => w.category_id === categoryId).sort((a, b) => a.position - b.position)

export const byPosition = <T extends { position: number }>(list: T[]) => [...list].sort((a, b) => a.position - b.position)

export function inOrder(workspaces: WorkspaceSummary[], categories: Category[]) {
    return [...inCategory(workspaces, null), ...byPosition(categories).flatMap(c => inCategory(workspaces, c.id))]
}

export function useSidebarTree() {
    const [list, setList] = useState<ListState>({ status: 'loading' })
    const [error, setError] = useState('')

    const load = useCallback(() => {
        Promise.all([getWorkspaces(), listCategories()]).then(([ws, cats]) => {
            if (ws.error || !ws.data || cats.error || !cats.data) setList({ status: 'error' })
            else setList({ status: 'ready', workspaces: ws.data, categories: cats.data.map((c, position) => ({ ...c, position })) })
        })
    }, [])

    const ready = list.status === 'ready' ? list : null

    async function arrange(workspaces: WorkspaceSummary[], categories: Category[]) {
        if (!ready) return
        const movedWorkspaces = workspaces.filter(w => {
            const old = ready.workspaces.find(o => o.id === w.id)
            return old?.position !== w.position || old?.category_id !== w.category_id
        })
        const movedCategories = categories.filter(c => ready.categories.find(o => o.id === c.id)?.position !== c.position)
        setError('')
        setList({ ...ready, workspaces, categories })
        const results = await Promise.all([
            movedWorkspaces.length ? placeWorkspaces(movedWorkspaces.map(({ id, position, category_id }) => ({ id, position, category_id }))) : { error: null },
            movedCategories.length ? orderCategories(movedCategories.map(({ id, position }) => ({ id, position }))) : { error: null },
        ])
        if (results.some(r => r.error)) {
            setList(ready)
            setError('Couldn’t save the new order. Check your connection and try again.')
            load()
        }
    }

    async function addCategory(name: string) {
        if (!ready) return 'Not ready'
        const { data, error } = await createCategory(name, ready.categories.length)
        if (error || !data) return 'Couldn’t create that category. Check your connection and try again.'
        setList(l => l.status === 'ready' ? { ...l, categories: [...l.categories, data] } : l)
        return null
    }

    async function rename(id: string, name: string) {
        const { error } = await renameCategory(id, name)
        if (error) return 'Couldn’t rename that category. Check your connection and try again.'
        setList(l => l.status === 'ready' ? { ...l, categories: l.categories.map(c => c.id === id ? { ...c, name } : c) } : l)
        return null
    }

    async function remove(id: string) {
        const { error } = await deleteCategory(id)
        if (error) return 'Couldn’t delete that category. Check your connection and try again.'
        if (ready) {
            const after = Math.max(-1, ...ready.workspaces.map(w => w.position)) + 1
            await placeWorkspaces(inCategory(ready.workspaces, id).map((w, i) => ({ id: w.id, position: after + i, category_id: null })))
        }
        load()
        return null
    }

    return { list, setList, load, error, setError, arrange, addCategory, rename, remove }
}

export type SidebarTree = ReturnType<typeof useSidebarTree>
