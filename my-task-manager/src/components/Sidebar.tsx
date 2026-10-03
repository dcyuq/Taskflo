import './Sidebar.css'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import NewWorkspaceModal from './NewWorkspaceModal'
import ProfileMenu from './ProfileMenu'
import type { Task } from '../services/tasks'
import { isDueSoon } from '../utils/summary'
import wordmark from '../assets/taskflo-wordmark.svg?raw'

export type ListState =
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'ready', workspaces: { id: string, name: string }[] }

interface SidebarProps {
    desktop: boolean
    open: boolean
    list: ListState
    openTasks: Task[]
    me: string
    onRetry: () => void
    onCreated: () => void
    onClose: () => void
}

function PlusIcon() {
    return (
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M8 3v10M3 8h10" />
        </svg>
    )
}

function Sidebar({ desktop, open, list, openTasks, me, onRetry, onCreated, onClose }: SidebarProps) {
    const [showModal, setShowModal] = useState(false)
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

            <nav className={`sidebar${desktop ? ' is-desktop' : ''}${open ? ' open' : ''}`} aria-label="Main" inert={!visible}>
                <div className="sidebar-header">
                    <Link to="/dashboard" className="sidebar-brand" aria-label="Taskflo dashboard" onClick={closeOnMobile}>
                        <span className="brand-wordmark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: wordmark }} />
                    </Link>
                    {!desktop && (
                        <button type="button" className="sidebar-icon-btn" aria-label="Close navigation" onClick={onClose}>
                            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                                <path d="M4 4l8 8M12 4l-8 8" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="sidebar-scroll">
                    <ul className="sidebar-list" aria-label="Personal">
                        {personal.map(item => (
                            <li key={item.to}>
                                <NavLink className="sidebar-item" to={item.to} onClick={closeOnMobile}>
                                    <span className="sidebar-icon" aria-hidden="true">
                                        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                                    </span>
                                    <span className="sidebar-name">{item.label}</span>
                                    {item.count > 0 && <span className="sidebar-count" aria-label={`${item.count} open`}>{item.count}</span>}
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
                                <button type="button" className="btn btn-quiet btn-small" onClick={onRetry}>Try again</button>
                            </div>
                        )}

                        {list.status === 'ready' && list.workspaces.length === 0 && (
                            <p className="sidebar-empty">No workspaces yet.</p>
                        )}

                        {list.status === 'ready' && list.workspaces.length > 0 && (
                            <ul className="sidebar-list">
                                {list.workspaces.map(workspace => {
                                    const count = openTasks.filter(t => t.workspace_id === workspace.id).length
                                    return (
                                        <li key={workspace.id}>
                                            <NavLink className="sidebar-item" to={`/dashboard/workspace/${workspace.id}`} onClick={closeOnMobile}>
                                                <span className="sidebar-initial" aria-hidden="true">{workspace.name.trim().charAt(0).toUpperCase()}</span>
                                                <span className="sidebar-name">{workspace.name}</span>
                                                {count > 0 && <span className="sidebar-count" aria-label={`${count} open`}>{count}</span>}
                                            </NavLink>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </section>
                </div>

                <div className="sidebar-footer">
                    <ProfileMenu />
                </div>
            </nav>

            {showModal && <NewWorkspaceModal onClose={() => setShowModal(false)} onCreated={onCreated} />}
        </>
    )
}

export default Sidebar
