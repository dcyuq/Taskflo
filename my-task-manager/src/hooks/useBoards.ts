import { useCallback, useEffect, useState } from 'react'
import { createBoard, createCategory, deleteItem, listTree, renameItem, savePlacement, type Board, type Category } from '../services/boards'

export interface Tree {
    workspaceId: string
    categories: Category[]
    boards: Board[]
}

export type TreeKind = 'category' | 'board'

const tableOf = (kind: TreeKind) => kind === 'category' ? 'categories' : 'boards'

export const boardsIn = (boards: Board[], categoryId: string | null) =>
    boards.filter(b => b.category_id === categoryId).sort((a, b) => a.position - b.position)

export const orderedBoards = (tree: Tree) => [
    ...boardsIn(tree.boards, null),
    ...[...tree.categories].sort((a, b) => a.position - b.position).flatMap(c => boardsIn(tree.boards, c.id)),
]

export function useBoards(workspaceId?: string) {
    const [tree, setTree] = useState<Tree | null>(null)
    const [error, setError] = useState('')

    const load = useCallback(() => {
        if (!workspaceId) return
        listTree(workspaceId).then(({ data }) => {
            if (data) setTree({ workspaceId, ...data })
            else setError('Couldn’t load the boards. Check your connection and reload.')
        })
    }, [workspaceId])

    useEffect(load, [load])

    const current = tree?.workspaceId === workspaceId ? tree : null

    async function addCategory(name: string) {
        if (!current) return 'Not ready'
        const { data, error } = await createCategory(current.workspaceId, name, current.categories.length)
        if (error || !data) return 'Couldn’t create that category. Only the workspace owner can.'
        setTree(t => t && { ...t, categories: [...t.categories, data] })
        return null
    }

    async function addBoard(categoryId: string | null, name: string) {
        if (!current) return 'Not ready'
        const { data, error } = await createBoard(current.workspaceId, categoryId, name, boardsIn(current.boards, categoryId).length)
        if (error || !data) return 'Couldn’t create that board. Only the workspace owner can.'
        setTree(t => t && { ...t, boards: [...t.boards, data] })
        return null
    }

    async function rename(kind: TreeKind, id: string, name: string) {
        const { error } = await renameItem(tableOf(kind), id, name)
        if (error) return `Couldn’t rename that ${kind}. Check your connection and try again.`
        setTree(t => t && {
            ...t,
            categories: t.categories.map(c => c.id === id ? { ...c, name } : c),
            boards: t.boards.map(b => b.id === id ? { ...b, name } : b),
        })
        return null
    }

    async function remove(kind: TreeKind, id: string) {
        const { error } = await deleteItem(tableOf(kind), id)
        if (error) return `Couldn’t delete that ${kind}. Check your connection and try again.`
        load()
        return null
    }

    async function arrange(categories: Category[], boards: Board[]) {
        if (!current) return
        const before = current
        const movedCategories = categories.filter(c => before.categories.find(o => o.id === c.id)?.position !== c.position)
        const movedBoards = boards.filter(b => {
            const old = before.boards.find(o => o.id === b.id)
            return old?.position !== b.position || old?.category_id !== b.category_id
        })
        setError('')
        setTree({ ...before, categories, boards })
        const results = await Promise.all([
            movedCategories.length ? savePlacement('categories', movedCategories.map(({ id, position }) => ({ id, position }))) : { error: null },
            movedBoards.length ? savePlacement('boards', movedBoards.map(({ id, position, category_id }) => ({ id, position, category_id }))) : { error: null },
        ])
        if (results.some(r => r.error)) {
            setTree(before)
            setError('Couldn’t save the new order. Check your connection and try again.')
            load()
        }
    }

    return { tree: current, error, setError, addCategory, addBoard, rename, remove, arrange }
}

export type BoardsApi = ReturnType<typeof useBoards>
