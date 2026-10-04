import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    DndContext,
    DragOverlay,
    MeasuringStrategy,
    closestCenter,
    pointerWithin,
    useDraggable,
    useDroppable,
    type CollisionDetection,
    type DragEndEvent,
    type DragMoveEvent,
} from '@dnd-kit/core'
import ActionMenu from './ActionMenu'
import ConfirmDialog from './ConfirmDialog'
import NameDialog from './NameDialog'
import { boardsIn, type BoardsApi, type Tree } from '../hooks/useBoards'
import { sortAnnouncements, useSortSensors } from '../hooks/useSortable'
import type { Board, Category } from '../services/boards'
import { menuFor, type MenuAt, type MenuItem } from '../utils/menu'
import { readStored, store } from '../utils/storage'

type Kind = 'board' | 'head' | 'category'
type Drop = { id: string, after: boolean } | null
type Asking =
    | { kind: 'new-board', categoryId: string | null }
    | { kind: 'new-category' }
    | { kind: 'rename', item: Board | Category, type: 'board' | 'category' }
    | { kind: 'delete', item: Board | Category, type: 'board' | 'category' }
    | null

interface BoardTreeProps {
    tree: Tree
    api: BoardsApi
    canEdit: boolean
    selectedId?: string
    asking: Asking
    setAsking: (asking: Asking) => void
    onNavigate?: () => void
}

const kindOf = (data: unknown) => (data as { kind?: Kind } | undefined)?.kind
const idOf = (key: string | number) => String(key).slice(2)
const byPosition = <T extends { position: number }>(list: T[]) => [...list].sort((a, b) => a.position - b.position)
const renumber = <T extends { position: number }>(list: T[]) => list.map((item, position) => ({ ...item, position }))

const collide: CollisionDetection = args => {
    const dragging = kindOf(args.active.data.current)
    const scoped = {
        ...args,
        droppableContainers: args.droppableContainers.filter(c => (kindOf(c.data.current) === 'category') === (dragging === 'category')),
    }
    const hits = pointerWithin(scoped)
    return hits.length ? hits : closestCenter(scoped)
}

function placement({ active, over }: DragMoveEvent | DragEndEvent): Drop {
    const rect = active.rect.current.translated
    if (!over || !rect || over.id === active.id) return null
    if (kindOf(over.data.current) === 'head') return { id: String(over.id), after: true }
    return { id: String(over.id), after: rect.top + rect.height / 2 > over.rect.top + over.rect.height / 2 }
}

function Chevron({ open }: { open: boolean }) {
    return (
        <svg className={`tree-chevron${open ? ' is-open' : ''}`} viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 4l4 4-4 4" />
        </svg>
    )
}

function BoardRow({ board, workspaceId, selected, canEdit, drop, onMenu, onNavigate }: {
    board: Board
    workspaceId: string
    selected: boolean
    canEdit: boolean
    drop: Drop
    onMenu: (e: React.MouseEvent, board: Board) => void
    onNavigate?: () => void
}) {
    const key = `b:${board.id}`
    const drag = useDraggable({ id: key, data: { kind: 'board' }, disabled: !canEdit })
    const zone = useDroppable({ id: key, data: { kind: 'board' }, disabled: !canEdit })
    const line = drop?.id === key ? (drop.after ? ' drop-after' : ' drop-before') : ''

    return (
        <li
            ref={node => {
                drag.setNodeRef(node)
                zone.setNodeRef(node)
            }}
            className={`tree-board${drag.isDragging ? ' is-placeholder' : ''}${line}`}
            onContextMenu={canEdit ? e => onMenu(e, board) : undefined}
            {...drag.listeners}
        >
            <Link
                className={`sidebar-item tree-board-link${selected ? ' active' : ''}`}
                to={`/dashboard/workspace/${workspaceId}?board=${board.id}`}
                aria-current={selected ? 'page' : undefined}
                draggable={false}
                onClick={onNavigate}
            >
                <span className="sidebar-icon" aria-hidden="true">
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6.5 2.5l-1.5 11M11 2.5l-1.5 11M3 6h10.5M2.5 10H13" /></svg>
                </span>
                <span className="sidebar-name">{board.name}</span>
            </Link>
            {canEdit && (
                <button type="button" className="tree-action" aria-label={`${board.name} options`} aria-haspopup="menu" onClick={e => onMenu(e, board)}>
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="3.5" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="12.5" cy="8" r="1.3" /></svg>
                </button>
            )}
        </li>
    )
}

function CategorySection({ category, open, canEdit, drop, onToggle, onMenu, onAdd, children }: {
    category: Category
    open: boolean
    canEdit: boolean
    drop: Drop
    onToggle: () => void
    onMenu: (e: React.MouseEvent, category: Category) => void
    onAdd: () => void
    children: React.ReactNode
}) {
    const key = `c:${category.id}`
    const drag = useDraggable({ id: key, data: { kind: 'category' }, disabled: !canEdit })
    const { setNodeRef: setSectionRef } = useDroppable({ id: key, data: { kind: 'category' }, disabled: !canEdit })
    const head = useDroppable({ id: `h:${category.id}`, data: { kind: 'head' }, disabled: !canEdit })
    const line = drop?.id === key ? (drop.after ? ' drop-after' : ' drop-before') : ''
    const into = drop?.id === `h:${category.id}` ? ' drop-into' : ''

    return (
        <li ref={setSectionRef} className={`tree-category${drag.isDragging ? ' is-placeholder' : ''}${line}`}>
            <div
                ref={node => {
                    drag.setNodeRef(node)
                    head.setNodeRef(node)
                }}
                className={`tree-head${into}`}
                onContextMenu={canEdit ? e => onMenu(e, category) : undefined}
                {...drag.listeners}
            >
                <button type="button" className="tree-toggle" aria-expanded={open} onClick={onToggle}>
                    <Chevron open={open} />
                    <span className="sidebar-name">{category.name}</span>
                </button>
                {canEdit && (
                    <>
                        <button type="button" className="tree-action" aria-label={`New board in ${category.name}`} title="New board" onClick={onAdd}>
                            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
                        </button>
                        <button type="button" className="tree-action" aria-label={`${category.name} options`} aria-haspopup="menu" onClick={e => onMenu(e, category)}>
                            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="3.5" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="12.5" cy="8" r="1.3" /></svg>
                        </button>
                    </>
                )}
            </div>
            {open && children}
        </li>
    )
}

function BoardTree({ tree, api, canEdit, selectedId, asking, setAsking, onNavigate }: BoardTreeProps) {
    const collapsedKey = `taskflo:collapsed:${tree.workspaceId}`
    const [collapsed, setCollapsed] = useState<string[]>(() => {
        try {
            return JSON.parse(readStored(collapsedKey) ?? '[]')
        } catch {
            return []
        }
    })
    const [menu, setMenu] = useState<MenuAt | null>(null)
    const [active, setActive] = useState<string | null>(null)
    const [drop, setDrop] = useState<Drop>(null)
    const expandTimer = useRef(0)
    const blockClick = useRef(false)
    const sensors = useSortSensors(false)
    const categories = byPosition(tree.categories)
    const loose = boardsIn(tree.boards, null)
    const nameOf = (key: string | number) => {
        const id = idOf(key)
        return tree.boards.find(b => b.id === id)?.name ?? tree.categories.find(c => c.id === id)?.name ?? 'item'
    }

    function setOpen(id: string, open: boolean) {
        setCollapsed(list => {
            const next = open ? list.filter(x => x !== id) : [...new Set([...list, id])]
            store(collapsedKey, JSON.stringify(next))
            return next
        })
    }

    function swap<T extends { id: string, position: number }>(list: T[], item: T, step: number) {
        const ordered = list.filter(x => x.id !== item.id)
        ordered.splice(list.findIndex(x => x.id === item.id) + step, 0, item)
        return renumber(ordered)
    }

    function moveBoard(board: Board, categoryId: string | null, index: number) {
        const target = boardsIn(tree.boards, categoryId).filter(b => b.id !== board.id)
        target.splice(index, 0, { ...board, category_id: categoryId })
        const source = board.category_id === categoryId ? [] : renumber(boardsIn(tree.boards, board.category_id).filter(b => b.id !== board.id))
        const changed = new Map([...source, ...renumber(target)].map(b => [b.id, b]))
        api.arrange(tree.categories, tree.boards.map(b => changed.get(b.id) ?? b))
    }

    function boardItems(board: Board, base: MenuAt): MenuItem[] {
        const siblings = boardsIn(tree.boards, board.category_id)
        const index = siblings.findIndex(b => b.id === board.id)
        const targets = [
            ...(board.category_id ? [{ id: null, name: 'Uncategorized' }] : []),
            ...categories.filter(c => c.id !== board.category_id),
        ]
        return [
            { label: 'Rename', onSelect: () => setAsking({ kind: 'rename', item: board, type: 'board' }) },
            ...(targets.length ? [{
                label: 'Move to category',
                onSelect: () => setMenu({
                    ...base,
                    label: `Move ${board.name} to`,
                    items: targets.map(t => ({ label: t.name, onSelect: () => moveBoard(board, t.id, boardsIn(tree.boards, t.id).length) })),
                }),
            }] : []),
            ...(index > 0 ? [{ label: 'Move up', onSelect: () => api.arrange(tree.categories, mergeBoards(swap(siblings, board, -1))) }] : []),
            ...(index < siblings.length - 1 ? [{ label: 'Move down', onSelect: () => api.arrange(tree.categories, mergeBoards(swap(siblings, board, 1))) }] : []),
            { label: 'Delete board', danger: true, separated: true, onSelect: () => setAsking({ kind: 'delete', item: board, type: 'board' }) },
        ]
    }

    function categoryItems(category: Category): MenuItem[] {
        const index = categories.findIndex(c => c.id === category.id)
        return [
            { label: 'Rename', onSelect: () => setAsking({ kind: 'rename', item: category, type: 'category' }) },
            { label: 'Create board', onSelect: () => setAsking({ kind: 'new-board', categoryId: category.id }) },
            ...(index > 0 ? [{ label: 'Move up', onSelect: () => api.arrange(swap(categories, category, -1), tree.boards) }] : []),
            ...(index < categories.length - 1 ? [{ label: 'Move down', onSelect: () => api.arrange(swap(categories, category, 1), tree.boards) }] : []),
            { label: 'Delete category', danger: true, separated: true, onSelect: () => setAsking({ kind: 'delete', item: category, type: 'category' }) },
        ]
    }

    function mergeBoards(changed: Board[]) {
        const byId = new Map(changed.map(b => [b.id, b]))
        return tree.boards.map(b => byId.get(b.id) ?? b)
    }

    function track(event: DragMoveEvent) {
        const next = placement(event)
        if (next?.id !== drop?.id || next?.after !== drop?.after) setDrop(next)
        const head = next?.id.startsWith('h:') ? idOf(next.id) : null
        if (head && collapsed.includes(head)) {
            if (!expandTimer.current) expandTimer.current = window.setTimeout(() => setOpen(head, true), 600)
        } else {
            window.clearTimeout(expandTimer.current)
            expandTimer.current = 0
        }
    }

    function finish(event: DragEndEvent) {
        window.clearTimeout(expandTimer.current)
        expandTimer.current = 0
        setActive(null)
        setDrop(null)
        const target = placement(event)
        if (!target) return
        const moving = idOf(event.active.id)
        const at = idOf(target.id)

        if (kindOf(event.active.data.current) === 'category') {
            const rest = categories.filter(c => c.id !== moving)
            const index = rest.findIndex(c => c.id === at) + (target.after ? 1 : 0)
            rest.splice(index, 0, categories.find(c => c.id === moving)!)
            api.arrange(renumber(rest), tree.boards)
            return
        }

        const board = tree.boards.find(b => b.id === moving)
        if (!board) return
        if (target.id.startsWith('h:')) {
            moveBoard(board, at, 0)
            return
        }
        const over = tree.boards.find(b => b.id === at)
        if (!over) return
        const list = boardsIn(tree.boards, over.category_id).filter(b => b.id !== moving)
        moveBoard(board, over.category_id, list.findIndex(b => b.id === at) + (target.after ? 1 : 0))
    }

    function openMenu(e: React.MouseEvent, label: string, build: (base: MenuAt) => MenuItem[]) {
        const base = menuFor(e, label, [])
        setMenu({ ...base, items: build(base) })
    }
    const row = (board: Board) => (
        <BoardRow
            key={board.id}
            board={board}
            workspaceId={tree.workspaceId}
            selected={board.id === selectedId}
            canEdit={canEdit}
            drop={drop}
            onMenu={(e, b) => openMenu(e, `${b.name} options`, base => boardItems(b, base))}
            onNavigate={onNavigate}
        />
    )
    const activeName = active ? nameOf(active) : ''
    const asked = asking && 'item' in asking ? asking.item : null

    return (
        <>
            {api.error && (
                <div className="sidebar-error" role="alert">
                    <p>{api.error}</p>
                    <button type="button" className="btn btn-quiet btn-small" onClick={() => api.setError('')}>Dismiss</button>
                </div>
            )}
            <DndContext
                sensors={sensors}
                collisionDetection={collide}
                measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                accessibility={{ announcements: sortAnnouncements(nameOf) }}
                onDragStart={({ active }) => {
                    blockClick.current = true
                    setActive(String(active.id))
                }}
                onDragMove={track}
                onDragEnd={finish}
                onDragCancel={() => {
                    setActive(null)
                    setDrop(null)
                }}
            >
                <div
                    className="tree"
                    onPointerDownCapture={() => { blockClick.current = false }}
                    onClickCapture={e => blockClick.current && e.preventDefault()}
                >
                    {loose.length > 0 && <ul className="sidebar-list tree-boards">{loose.map(row)}</ul>}
                    <ul className="tree-categories">
                        {categories.map(category => (
                            <CategorySection
                                key={category.id}
                                category={category}
                                open={!collapsed.includes(category.id) && active !== `c:${category.id}`}
                                canEdit={canEdit}
                                drop={drop}
                                onToggle={() => setOpen(category.id, collapsed.includes(category.id))}
                                onMenu={(e, c) => openMenu(e, `${c.name} options`, () => categoryItems(c))}
                                onAdd={() => setAsking({ kind: 'new-board', categoryId: category.id })}
                            >
                                <ul className="sidebar-list tree-boards">{boardsIn(tree.boards, category.id).map(row)}</ul>
                            </CategorySection>
                        ))}
                    </ul>
                    {tree.boards.length === 0 && tree.categories.length === 0 && (
                        <p className="sidebar-empty">{canEdit ? 'No boards yet. Use + to add one.' : 'No boards yet.'}</p>
                    )}
                </div>
                <DragOverlay dropAnimation={null}>
                    {active && (
                        <div className={`tree-ghost${active.startsWith('c:') ? ' is-category' : ''}`}>{activeName}</div>
                    )}
                </DragOverlay>
            </DndContext>

            {menu && <ActionMenu key={menu.label} at={menu} onClose={() => setMenu(null)} />}

            {asking?.kind === 'new-category' && (
                <NameDialog title="New category" label="Category name" submitLabel="Create category" maxLength={60} onSubmit={api.addCategory} onClose={() => setAsking(null)} />
            )}
            {asking?.kind === 'new-board' && (
                <NameDialog title="New board" label="Board name" submitLabel="Create board" maxLength={60} onSubmit={name => api.addBoard(asking.categoryId, name)} onClose={() => setAsking(null)} />
            )}
            {asking?.kind === 'rename' && asked && (
                <NameDialog
                    title={`Rename ${asking.type}`}
                    label={asking.type === 'board' ? 'Board name' : 'Category name'}
                    initial={asked.name}
                    submitLabel="Rename"
                    maxLength={60}
                    onSubmit={name => api.rename(asking.type, asked.id, name)}
                    onClose={() => setAsking(null)}
                />
            )}
            {asking?.kind === 'delete' && asked && (
                <ConfirmDialog
                    title={`Delete ${asked.name}?`}
                    message={asking.type === 'board'
                        ? 'This deletes the board and every task in it. It can’t be undone.'
                        : 'The category goes away. Its boards move to the top of the list and keep their tasks.'}
                    confirmLabel={asking.type === 'board' ? 'Delete board' : 'Delete category'}
                    onConfirm={() => api.remove(asking.type, asked.id)}
                    onClose={() => setAsking(null)}
                />
            )}
        </>
    )
}

export type { Asking as TreeAsking }
export default BoardTree
