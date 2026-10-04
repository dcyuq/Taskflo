import './Sidebar.css'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import NewWorkspaceModal from './NewWorkspaceModal'
import WorkspacePanel from './WorkspacePanel'
import GripIcon from './GripIcon'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { sortAnnouncements, useSortSensors } from '../hooks/useSortable'
import ProfileMenu from './ProfileMenu'
import type { Task } from '../services/tasks'
import type { WorkspaceSummary } from '../services/workspace'
import { isDueSoon } from '../utils/summary'
import wordmark from '../assets/taskflo-wordmark.svg?raw'
import { duration, ease } from '../utils/motion'
import { readStored, store } from '../utils/storage'

const COLLAPSED_KEY = 'taskflo:sidebar-collapsed'

export type ListState =
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'ready', workspaces: WorkspaceSummary[] }

interface SidebarProps {
    desktop: boolean
    open: boolean
    list: ListState
    current?: WorkspaceSummary
    openTasks: Task[]
    me: string
    onSearch: () => void
    onRetry: () => void
    onReorder: (next: WorkspaceSummary[]) => Promise<boolean>
    onCreated: () => void
    onClose: () => void
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

function PlusIcon() {
    return (
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M8 3v10M3 8h10" />
        </svg>
    )
}

interface WorkspaceRowProps {
    workspace: WorkspaceSummary
    count: number
    collapsed: boolean
    onNavigate?: () => void
}

function WorkspaceRow({ workspace, count, collapsed, onNavigate }: WorkspaceRowProps) {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: workspace.id })

    return (
        <li
            ref={setNodeRef}
            className={`sidebar-row${isDragging ? ' is-dragging' : ''}`}
            style={{ transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined, transition }}
        >
            <NavLink className="sidebar-item" to={`/dashboard/workspace/${workspace.id}`} onClick={onNavigate} title={collapsed ? workspace.name : undefined}>
                <span className="sidebar-initial" aria-hidden="true">{workspace.name.trim().charAt(0).toUpperCase()}</span>
                <span className="sidebar-name">{workspace.name}</span>
                {count > 0 && <span className="sidebar-count">{count}<span className="sr-only"> open</span></span>}
            </NavLink>
            {!collapsed && (
                <button ref={setActivatorNodeRef} type="button" className="sidebar-grip" {...attributes} {...listeners} aria-label={`Move ${workspace.name}`}>
                    <GripIcon />
                </button>
            )}
        </li>
    )
}

function Sidebar({ desktop, open, list, current, openTasks, me, onSearch, onRetry, onReorder, onCreated, onClose }: SidebarProps) {
    const [showModal, setShowModal] = useState(false)
    const [collapsedPref, setCollapsedPref] = useState(() => readStored(COLLAPSED_KEY) === '1')
    const [orderError, setOrderError] = useState('')
    const sensors = useSortSensors()
    const reduce = useReducedMotion()
    const collapsed = desktop && collapsedPref

    function toggleCollapsed() {
        store(COLLAPSED_KEY, collapsedPref ? '0' : '1')
        setCollapsedPref(c => !c)
    }
    async function handleReorder(next: WorkspaceSummary[]) {
        setOrderError('')
        if (!await onReorder(next)) setOrderError('Couldn’t save the new order. Check your connection and try again.')
    }

    const visible = desktop || open
    const closeOnMobile = desktop ? undefined : onClose
    const mine = openTasks.filter(t => t.assignee_id === me)
    const personal = [
        { to: '/dashboard/my-tasks', label: 'My tasks', count: mine.length, icon: <path d="M3.5 8.5l3 3 6-7" /> },
        { to: '/dashboard/due-soon', label: 'Due soon', count: mine.filter(isDueSoon).length, icon: <><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3l2 1.5" /></> },
    ]

    useEffect(() => {
        if (desktop || !open) return
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [desktop, open, onClose])

    return (
        <>
            {!desktop && <div className={`sidebar-overlay${open ? ' visible' : ''}`} onClick={onClose} />}

            <motion.nav
                className={`sidebar${desktop ? ' is-desktop' : ''}${collapsed ? ' is-collapsed' : ''}${open ? ' open' : ''}`}
                aria-label="Main"
                inert={!visible}
                initial={false}
                animate={desktop ? { width: collapsed ? 68 : 264 } : undefined}
                transition={{ duration: reduce ? 0 : duration * 0.45, ease }}
            >
                <div className="sidebar-header">
                    {!collapsed && (
                        <Link to="/dashboard" className="sidebar-brand" aria-label="Taskflo dashboard" onClick={closeOnMobile}>
                            <span className="brand-wordmark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: wordmark }} />
                        </Link>
                    )}
                    {desktop && (
                        <button
                            type="button"
                            className="sidebar-icon-btn"
                            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            aria-expanded={!collapsed}
                            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            onClick={toggleCollapsed}
                        >
                            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="2" y="2.5" width="12" height="11" rx="2" /><path d="M6 2.5v11" />
                                <path d={collapsed ? 'M9 6.5l1.5 1.5L9 9.5' : 'M11 6.5L9.5 8l1.5 1.5'} />
                            </svg>
                        </button>
                    )}
                    {!desktop && (
                        <button type="button" className="sidebar-icon-btn" aria-label="Close navigation" onClick={onClose}>
                            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                                <path d="M4 4l8 8M12 4l-8 8" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="sidebar-search-wrap">
                    <button type="button" className="sidebar-search" onClick={onSearch} aria-keyshortcuts="Control+K Meta+K" title={collapsed ? 'Search' : undefined}>
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                            <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" />
                        </svg>
                        <span className="sidebar-name">Search</span>
                        <kbd className="sidebar-kbd" aria-hidden="true">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
                    </button>
                </div>

                <div className="sidebar-scroll">
                    <ul className="sidebar-list" aria-label="Personal">
                        {personal.map(item => (
                            <li key={item.to}>
                                <NavLink className="sidebar-item" to={item.to} onClick={closeOnMobile} title={collapsed ? item.label : undefined}>
                                    <span className="sidebar-icon" aria-hidden="true">
                                        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                                    </span>
                                    <span className="sidebar-name">{item.label}</span>
                                    {item.count > 0 && <span className="sidebar-count">{item.count}<span className="sr-only"> open</span></span>}
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    <section className="sidebar-section is-spaced" aria-labelledby="sidebar-workspaces">
                        <div className="sidebar-section-head">
                            <h2 className="sidebar-label" id="sidebar-workspaces">Workspaces</h2>
                            <button type="button" className="sidebar-icon-btn is-small" aria-label="New workspace" title="New workspace" onClick={() => setShowModal(true)}>
                                <PlusIcon />
                            </button>
                        </div>

                        {list.status === 'loading' && (
                            <div className="sidebar-skeleton" role="status">
                                <span className="sr-only">Loading workspaces</span>
                                {[0, 1, 2].map(i => <span key={i} className="skeleton sidebar-skeleton-row" />)}
                            </div>
                        )}

                        {list.status === 'error' && (
                            <div className="sidebar-error" role="alert">
                                <p>Couldn't load your workspaces.</p>
                                {collapsed ? (
                                    <button type="button" className="sidebar-icon-btn is-error" aria-label="Couldn't load your workspaces. Try again" title="Couldn't load your workspaces. Try again" onClick={onRetry}>
                                        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M13 8a5 5 0 1 1-1.5-3.5M13 2.5v3h-3" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button type="button" className="btn btn-quiet btn-small" onClick={onRetry}>Try again</button>
                                )}
                            </div>
                        )}

                        {list.status === 'ready' && list.workspaces.length === 0 && (
                            <p className="sidebar-empty">No workspaces yet.</p>
                        )}

                        {list.status === 'ready' && list.workspaces.length > 0 && (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                accessibility={{ announcements: sortAnnouncements(id => list.workspaces.find(w => w.id === id)?.name ?? 'workspace') }}
                                onDragEnd={({ active, over }) => {
                                    if (!over || active.id === over.id) return
                                    const ids = list.workspaces.map(w => w.id)
                                    handleReorder(arrayMove(list.workspaces, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))))
                                }}
                            >
                                <SortableContext items={list.workspaces} strategy={verticalListSortingStrategy}>
                                    <ul className="sidebar-list">
                                        {list.workspaces.map(workspace => (
                                            <WorkspaceRow
                                                key={workspace.id}
                                                workspace={workspace}
                                                count={openTasks.filter(t => t.workspace_id === workspace.id).length}
                                                collapsed={collapsed}
                                                onNavigate={closeOnMobile}
                                            />
                                        ))}
                                    </ul>
                                </SortableContext>
                            </DndContext>
                        )}

                        {orderError && <p className="sidebar-error" role="alert">{orderError}</p>}
                    </section>

                    {current && !collapsed && <WorkspacePanel key={current.id} workspace={current} me={me} />}
                </div>

                <div className="sidebar-footer">
                    <ProfileMenu compact={collapsed} />
                </div>
            </motion.nav>

            {showModal && <NewWorkspaceModal onClose={() => setShowModal(false)} onCreated={onCreated} />}
        </>
    )
}

export default Sidebar
