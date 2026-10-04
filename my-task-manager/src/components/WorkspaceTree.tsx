import { useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
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
import { byPosition, inCategory, type SidebarTree } from '../hooks/useSidebarTree'
import { sortAnnouncements, useSortSensors } from '../hooks/useSortable'
import type { Category } from '../services/categories'
import type { WorkspaceSummary } from '../services/workspace'
import { menuFor, type MenuAt, type MenuItem } from '../utils/menu'
import { readStored, store } from '../utils/storage'

const COLLAPSED_KEY = 'taskflo:collapsed-categories'

type Kind = 'workspace' | 'head' | 'category'
type Drop = { id: string, after: boolean } | null
type Asking = { kind: 'rename' | 'delete', category: Category } | null

interface WorkspaceTreeProps {
    tree: SidebarTree
    workspaces: WorkspaceSummary[]
    categories: Category[]
    countOf: (id: string) => number
    actionsFor: (workspace: WorkspaceSummary) => MenuItem[]
    onNavigate?: () => void
}

const kindOf = (data: unknown) => (data as { kind?: Kind } | undefined)?.kind
const idOf = (key: string | number) => String(key).slice(2)
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

const lineFor = (drop: Drop, key: string) => drop?.id === key ? (drop.after ? ' drop-after' : ' drop-before') : ''

function DotsIcon() {
    return (
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
            <circle cx="3.5" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="12.5" cy="8" r="1.3" />
        </svg>
    )
}

function WorkspaceRow({ workspace, count, drop, onMenu, onNavigate }: {
    workspace: WorkspaceSummary
    count: number
    drop: Drop
    onMenu: (e: React.MouseEvent) => void
    onNavigate?: () => void
}) {
    const key = `w:${workspace.id}`
    const drag = useDraggable({ id: key, data: { kind: 'workspace' } })
    const zone = useDroppable({ id: key, data: { kind: 'workspace' } })

    return (
        <li
            ref={node => {
                drag.setNodeRef(node)
                zone.setNodeRef(node)
            }}
            className={`tree-row${drag.isDragging ? ' is-placeholder' : ''}${lineFor(drop, key)}`}
            onContextMenu={onMenu}
            {...drag.listeners}
        >
            <NavLink className="sidebar-item tree-link" to={`/dashboard/workspace/${workspace.id}`} draggable={false} onClick={onNavigate}>
                <span className="sidebar-initial" aria-hidden="true">{workspace.name.trim().charAt(0).toUpperCase()}</span>
                <span className="sidebar-name">{workspace.name}</span>
                {count > 0 && <span className="sidebar-count">{count}<span className="sr-only"> open</span></span>}
            </NavLink>
            <button type="button" className="tree-action" aria-label={`${workspace.name} options`} aria-haspopup="menu" onClick={onMenu}>
                <DotsIcon />
            </button>
        </li>
    )
}

function CategorySection({ category, open, drop, onToggle, onMenu, children }: {
    category: Category
    open: boolean
    drop: Drop
    onToggle: () => void
    onMenu: (e: React.MouseEvent) => void
    children: React.ReactNode
}) {
    const key = `c:${category.id}`
    const drag = useDraggable({ id: key, data: { kind: 'category' } })
    const { setNodeRef: setSectionRef } = useDroppable({ id: key, data: { kind: 'category' } })
    const head = useDroppable({ id: `h:${category.id}`, data: { kind: 'head' } })

    return (
        <li ref={setSectionRef} className={`tree-category${drag.isDragging ? ' is-placeholder' : ''}${lineFor(drop, key)}`}>
            <div
                ref={node => {
                    drag.setNodeRef(node)
                    head.setNodeRef(node)
                }}
                className={`tree-head${drop?.id === `h:${category.id}` ? ' drop-into' : ''}`}
                onContextMenu={onMenu}
                {...drag.listeners}
            >
                <button type="button" className="tree-toggle" aria-expanded={open} onClick={onToggle}>
                    <svg className={`tree-chevron${open ? ' is-open' : ''}`} viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 4l4 4-4 4" />
                    </svg>
                    <span className="sidebar-name">{category.name}</span>
                </button>
                <button type="button" className="tree-action" aria-label={`${category.name} options`} aria-haspopup="menu" onClick={onMenu}>
                    <DotsIcon />
                </button>
            </div>
            {open && children}
        </li>
    )
}

function WorkspaceTree({ tree, workspaces, categories, countOf, actionsFor, onNavigate }: WorkspaceTreeProps) {
    const [collapsed, setCollapsed] = useState<string[]>(() => {
        try {
            return JSON.parse(readStored(COLLAPSED_KEY) ?? '[]')
        } catch {
            return []
        }
    })
    const [menu, setMenu] = useState<MenuAt | null>(null)
    const [asking, setAsking] = useState<Asking>(null)
    const [active, setActive] = useState<string | null>(null)
    const [drop, setDrop] = useState<Drop>(null)
    const expandTimer = useRef(0)
    const blockClick = useRef(false)
    const sensors = useSortSensors()
    const ordered = byPosition(categories)
    const nameOf = (key: string | number) => {
        const id = idOf(key)
        return workspaces.find(w => w.id === id)?.name ?? categories.find(c => c.id === id)?.name ?? 'item'
    }

    function setOpen(id: string, open: boolean) {
        setCollapsed(list => {
            const next = open ? list.filter(x => x !== id) : [...new Set([...list, id])]
            store(COLLAPSED_KEY, JSON.stringify(next))
            return next
        })
    }

    function shift<T extends { id: string, position: number }>(list: T[], item: T, step: number) {
        const rest = list.filter(x => x.id !== item.id)
        rest.splice(list.findIndex(x => x.id === item.id) + step, 0, item)
        return renumber(rest)
    }

    function merge(changed: WorkspaceSummary[]) {
        const byId = new Map(changed.map(w => [w.id, w]))
        return workspaces.map(w => byId.get(w.id) ?? w)
    }

    function place(workspace: WorkspaceSummary, categoryId: string | null, index: number) {
        const target = inCategory(workspaces, categoryId).filter(w => w.id !== workspace.id)
        target.splice(index, 0, { ...workspace, category_id: categoryId })
        const source = workspace.category_id === categoryId ? [] : renumber(inCategory(workspaces, workspace.category_id).filter(w => w.id !== workspace.id))
        tree.arrange(merge([...source, ...renumber(target)]), categories)
    }

    function workspaceMenu(e: React.MouseEvent, workspace: WorkspaceSummary) {
        const base = menuFor(e, `${workspace.name} options`, [])
        const siblings = inCategory(workspaces, workspace.category_id)
        const index = siblings.findIndex(w => w.id === workspace.id)
        const targets = [
            ...(workspace.category_id ? [{ id: null, name: 'Uncategorized' }] : []),
            ...ordered.filter(c => c.id !== workspace.category_id),
        ]
        const actions = actionsFor(workspace)
        const items: MenuItem[] = [
            ...actions.filter(a => !a.danger),
            ...(targets.length ? [{
                label: 'Move to category',
                onSelect: () => setMenu({
                    ...base,
                    label: `Move ${workspace.name} to`,
                    items: targets.map(t => ({ label: t.name, onSelect: () => place(workspace, t.id, inCategory(workspaces, t.id).length) })),
                }),
            }] : []),
            ...(index > 0 ? [{ label: 'Move up', onSelect: () => tree.arrange(merge(shift(siblings, workspace, -1)), categories) }] : []),
            ...(index < siblings.length - 1 ? [{ label: 'Move down', onSelect: () => tree.arrange(merge(shift(siblings, workspace, 1)), categories) }] : []),
            ...actions.filter(a => a.danger).map(a => ({ ...a, separated: true })),
        ]
        setMenu({ ...base, items })
    }

    function categoryMenu(e: React.MouseEvent, category: Category) {
        const index = ordered.findIndex(c => c.id === category.id)
        setMenu(menuFor(e, `${category.name} options`, [
            { label: 'Rename', onSelect: () => setAsking({ kind: 'rename', category }) },
            ...(index > 0 ? [{ label: 'Move up', onSelect: () => tree.arrange(workspaces, shift(ordered, category, -1)) }] : []),
            ...(index < ordered.length - 1 ? [{ label: 'Move down', onSelect: () => tree.arrange(workspaces, shift(ordered, category, 1)) }] : []),
            { label: 'Delete category', danger: true, separated: true, onSelect: () => setAsking({ kind: 'delete', category }) },
        ]))
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

    function reset() {
        window.clearTimeout(expandTimer.current)
        expandTimer.current = 0
        setActive(null)
        setDrop(null)
    }

    function finish(event: DragEndEvent) {
        reset()
        const target = placement(event)
        if (!target) return
        const moving = idOf(event.active.id)
        const at = idOf(target.id)

        if (kindOf(event.active.data.current) === 'category') {
            const rest = ordered.filter(c => c.id !== moving)
            rest.splice(rest.findIndex(c => c.id === at) + (target.after ? 1 : 0), 0, ordered.find(c => c.id === moving)!)
            tree.arrange(workspaces, renumber(rest))
            return
        }

        const workspace = workspaces.find(w => w.id === moving)
        if (!workspace) return
        if (target.id.startsWith('h:')) {
            place(workspace, at, 0)
            return
        }
        const over = workspaces.find(w => w.id === at)
        if (!over) return
        const list = inCategory(workspaces, over.category_id).filter(w => w.id !== moving)
        place(workspace, over.category_id, list.findIndex(w => w.id === at) + (target.after ? 1 : 0))
    }

    const row = (workspace: WorkspaceSummary) => (
        <WorkspaceRow
            key={workspace.id}
            workspace={workspace}
            count={countOf(workspace.id)}
            drop={drop}
            onMenu={e => workspaceMenu(e, workspace)}
            onNavigate={onNavigate}
        />
    )

    return (
        <>
            {tree.error && (
                <div className="sidebar-error" role="alert">
                    <p>{tree.error}</p>
                    <button type="button" className="btn btn-quiet btn-small" onClick={() => tree.setError('')}>Dismiss</button>
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
                onDragCancel={reset}
            >
                <div
                    className="tree"
                    onPointerDownCapture={() => { blockClick.current = false }}
                    onClickCapture={e => blockClick.current && e.preventDefault()}
                >
                    <ul className="sidebar-list">{inCategory(workspaces, null).map(row)}</ul>
                    {ordered.length > 0 && (
                        <ul className="tree-categories">
                            {ordered.map(category => (
                                <CategorySection
                                    key={category.id}
                                    category={category}
                                    open={!collapsed.includes(category.id) && active !== `c:${category.id}`}
                                    drop={drop}
                                    onToggle={() => setOpen(category.id, collapsed.includes(category.id))}
                                    onMenu={e => categoryMenu(e, category)}
                                >
                                    <ul className="sidebar-list tree-items">{inCategory(workspaces, category.id).map(row)}</ul>
                                </CategorySection>
                            ))}
                        </ul>
                    )}
                </div>
                <DragOverlay dropAnimation={null}>
                    {active && <div className={`tree-ghost${active.startsWith('c:') ? ' is-category' : ''}`}>{nameOf(active)}</div>}
                </DragOverlay>
            </DndContext>

            {menu && <ActionMenu key={menu.label} at={menu} onClose={() => setMenu(null)} />}

            {asking?.kind === 'rename' && (
                <NameDialog
                    title="Rename category"
                    label="Category name"
                    initial={asking.category.name}
                    submitLabel="Rename"
                    maxLength={60}
                    onSubmit={name => tree.rename(asking.category.id, name)}
                    onClose={() => setAsking(null)}
                />
            )}
            {asking?.kind === 'delete' && (
                <ConfirmDialog
                    title={`Delete ${asking.category.name}?`}
                    message="The category goes away. Its workspaces move back to the top of the list. Nothing else changes."
                    confirmLabel="Delete category"
                    onConfirm={() => tree.remove(asking.category.id)}
                    onClose={() => setAsking(null)}
                />
            )}
        </>
    )
}

export default WorkspaceTree
