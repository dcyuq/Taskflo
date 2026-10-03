import './Sidebar.css'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import NewWorkspaceModal from './NewWorkspaceModal'
import ProfileMenu from './ProfileMenu'
import wordmark from '../assets/taskflo-wordmark.svg?raw'

export type ListState =
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'ready', workspaces: { id: string, name: string }[] }

interface SidebarProps {
    desktop: boolean
    open: boolean
    list: ListState
    onRetry: () => void
    onCreated: () => void
    onClose: () => void
}

function Sidebar({ desktop, open, list, onRetry, onCreated, onClose }: SidebarProps) {
    const [showModal, setShowModal] = useState(false)
    const visible = desktop || open

    useEffect(() => {
        if (desktop || !open) return
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [desktop, open, onClose])

    return (
        <>
            {!desktop && <div className={`sidebar-overlay${open ? ' visible' : ''}`} onClick={onClose} />}

            <nav className={`sidebar${desktop ? ' is-desktop' : ''}${open ? ' open' : ''}`} aria-label="Workspaces" inert={!visible}>
                <div className="sidebar-header">
                    {desktop ? (
                        <Link to="/dashboard" className="sidebar-brand" aria-label="Taskflo dashboard">
                            <span className="brand-wordmark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: wordmark }} />
                        </Link>
                    ) : (
                        <>
                            <span className="sidebar-title">Workspaces</span>
                            <button type="button" className="sidebar-close" aria-label="Close workspaces" onClick={onClose}>
                                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                                    <path d="M4 4l8 8M12 4l-8 8" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>

                <div className="sidebar-content">
                    {desktop && <h2 className="sidebar-title sidebar-section">Workspaces</h2>}

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

                    {list.status === 'ready' && (
                        <ul className="sidebar-list">
                            {list.workspaces.map(workspace => (
                                <li key={workspace.id}>
                                    <NavLink className="sidebar-workspace-item" to={`/dashboard/workspace/${workspace.id}`} onClick={desktop ? undefined : onClose}>
                                        <span className="sidebar-initial" aria-hidden="true">{workspace.name.trim().charAt(0).toUpperCase()}</span>
                                        <span className="sidebar-name">{workspace.name}</span>
                                    </NavLink>
                                </li>
                            ))}
                            <li>
                                <button type="button" className="sidebar-workspace-item sidebar-new" onClick={() => setShowModal(true)}>
                                    <span className="sidebar-initial" aria-hidden="true">
                                        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M8 3v10M3 8h10" />
                                        </svg>
                                    </span>
                                    <span className="sidebar-name">New workspace</span>
                                </button>
                            </li>
                        </ul>
                    )}
                </div>

                {desktop && (
                    <div className="sidebar-footer">
                        <ProfileMenu placement="up" />
                    </div>
                )}
            </nav>

            {showModal && <NewWorkspaceModal onClose={() => setShowModal(false)} onCreated={onCreated} />}
        </>
    )
}

export default Sidebar
