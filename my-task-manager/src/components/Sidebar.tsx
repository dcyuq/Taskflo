import './Sidebar.css'
import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import NewWorkspaceModal from './NewWorkspaceModal'
import WorkspaceDialogs, { type WorkspaceAsk } from './WorkspaceDialogs'
import ActionMenu from './ActionMenu'
import NameDialog from './NameDialog'
import WorkspaceTree from './WorkspaceTree'
import ProfileMenu from './ProfileMenu'
import { inOrder, type SidebarTree } from '../hooks/useSidebarTree'
import { menuFor, type MenuAt, type MenuItem } from '../utils/menu'
import type { Task } from '../services/tasks'
import type { WorkspaceSummary } from '../services/workspace'
import { isDueSoon } from '../utils/summary'
import wordmark from '../assets/taskflo-wordmark.svg?raw'
import { duration, ease } from '../utils/motion'
import { readStored, store } from '../utils/storage'

const COLLAPSED_KEY = 'taskflo:sidebar-collapsed'

interface SidebarProps {
    desktop: boolean
    open: boolean
    tree: SidebarTree
    current?: WorkspaceSummary
    openTasks: Task[]
    inviteCount: number
    me: string
    onSearch: () => void
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

function Sidebar({ desktop, open, tree, current, openTasks, inviteCount, me, onSearch, onClose }: SidebarProps) {
    const [showModal, setShowModal] = useState(false)
    const [addingCategory, setAddingCategory] = useState(false)
    const [collapsedPref, setCollapsedPref] = useState(() => readStored(COLLAPSED_KEY) === '1')
    const [menu, setMenu] = useState<MenuAt | null>(null)
    const [ask, setAsk] = useState<WorkspaceAsk | null>(null)
    const navigate = useNavigate()
    const reduce = useReducedMotion()
    const collapsed = desktop && collapsedPref
    const list = tree.list

    function toggleCollapsed() {
        store(COLLAPSED_KEY, collapsedPref ? '0' : '1')
        setCollapsedPref(c => !c)
    }

    function retry() {
        tree.setList({ status: 'loading' })
        tree.load()
    }

    function actionsFor(workspace: WorkspaceSummary): MenuItem[] {
        return workspace.owner_id === me
            ? [
                { label: 'Rename', onSelect: () => setAsk({ kind: 'rename', workspace }) },
                { label: 'Invite members', onSelect: () => navigate(`/dashboard/workspace/${workspace.id}/team`) },
                { label: 'Delete workspace', danger: true, separated: true, onSelect: () => setAsk({ kind: 'delete', workspace }) },
            ]
            : [{ label: 'Leave workspace', danger: true, onSelect: () => setAsk({ kind: 'leave', workspace }) }]
    }

    const visible = desktop || open
    const closeOnMobile = desktop ? undefined : onClose
    const countOf = (id: string) => openTasks.filter(t => t.workspace_id === id).length
    const mine = openTasks.filter(t => t.assignee_id === me)
    const personal = [
        { to: '/dashboard/my-tasks', label: 'My tasks', count: mine.length, icon: <path d="M3.5 8.5l3 3 6-7" /> },
        { to: '/dashboard/due-soon', label: 'Due soon', count: mine.filter(isDueSoon).length, icon: <><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3l2 1.5" /></> },
        { to: '/dashboard/invites', label: 'Invites', count: inviteCount, badge: true, icon: <><rect x="2" y="3.5" width="12" height="9" rx="1.5" /><path d="M2.5 4.5L8 9l5.5-4.5" /></> },
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
                                    {item.count > 0 && (item.badge
                                        ? <span className="sidebar-badge">{item.count}<span className="sr-only"> pending</span></span>
                                        : <span className="sidebar-count">{item.count}<span className="sr-only"> open</span></span>)}
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    <section className="sidebar-section is-spaced" aria-labelledby="sidebar-workspaces">
                        <div className="sidebar-section-head">
                            <h2 className="sidebar-label" id="sidebar-workspaces">Workspaces</h2>
                            <button
                                type="button"
                                className="sidebar-icon-btn is-small"
                                aria-label="Add a workspace or category"
                                aria-haspopup="menu"
                                title="Add"
                                onClick={e => setMenu(menuFor(e, 'Add', [
                                    { label: 'New workspace', onSelect: () => setShowModal(true) },
                                    { label: 'New category', onSelect: () => setAddingCategory(true) },
                                ]))}
                            >
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
                                    <button type="button" className="sidebar-icon-btn is-error" aria-label="Couldn't load your workspaces. Try again" title="Couldn't load your workspaces. Try again" onClick={retry}>
                                        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M13 8a5 5 0 1 1-1.5-3.5M13 2.5v3h-3" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button type="button" className="btn btn-quiet btn-small" onClick={retry}>Try again</button>
                                )}
                            </div>
                        )}

                        {list.status === 'ready' && list.workspaces.length === 0 && list.categories.length === 0 && (
                            <p className="sidebar-empty">No workspaces yet.</p>
                        )}

                        {list.status === 'ready' && collapsed && (
                            <ul className="sidebar-list">
                                {inOrder(list.workspaces, list.categories).map(workspace => (
                                    <li key={workspace.id}>
                                        <NavLink className="sidebar-item" to={`/dashboard/workspace/${workspace.id}`} title={workspace.name}>
                                            <span className="sidebar-initial" aria-hidden="true">{workspace.name.trim().charAt(0).toUpperCase()}</span>
                                            <span className="sidebar-name">{workspace.name}</span>
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {list.status === 'ready' && !collapsed && (
                            <WorkspaceTree
                                tree={tree}
                                workspaces={list.workspaces}
                                categories={list.categories}
                                countOf={countOf}
                                actionsFor={actionsFor}
                                onNavigate={closeOnMobile}
                            />
                        )}
                    </section>
                </div>

                <div className="sidebar-footer">
                    <ProfileMenu compact={collapsed} />
                </div>
            </motion.nav>

            {showModal && <NewWorkspaceModal onClose={() => setShowModal(false)} onCreated={tree.load} />}
            {addingCategory && (
                <NameDialog title="New category" label="Category name" submitLabel="Create category" maxLength={60} onSubmit={tree.addCategory} onClose={() => setAddingCategory(false)} />
            )}
            {menu && <ActionMenu key={menu.label} at={menu} onClose={() => setMenu(null)} />}
            {ask && <WorkspaceDialogs ask={ask} me={me} current={current?.id} onChanged={tree.load} onClose={() => setAsk(null)} />}
        </>
    )
}

export default Sidebar
