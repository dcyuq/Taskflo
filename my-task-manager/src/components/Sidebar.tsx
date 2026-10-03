import './Sidebar.css'
import { getWorkspaces } from '../services/workspace'
import { useCallback, useEffect, useState } from 'react'
import NewWorkspaceModal from './NewWorkspaceModal'
import { NavLink, useLocation } from 'react-router-dom'

interface SidebarProps {
    desktop: boolean
    open: boolean
    onClose: () => void
}

type ListState =
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'ready', workspaces: { id: string, name: string }[] }

function Sidebar({ desktop, open, onClose }: SidebarProps) {
    const [showModal, setShowModal] = useState(false)
    const [list, setList] = useState<ListState>({ status: 'loading' })
    const { pathname } = useLocation()
    const visible = desktop || open

    const load = useCallback(() => {
        getWorkspaces().then(({ data, error }) => {
            setList(error || !data ? { status: 'error' } : { status: 'ready', workspaces: data })
        })
    }, [])

    useEffect(load, [load, pathname])

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
                    <span className="sidebar-title">Workspaces</span>
                    {!desktop && (
                        <button type="button" className="sidebar-close" aria-label="Close workspaces" onClick={onClose}>
                            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                                <path d="M4 4l8 8M12 4l-8 8" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="sidebar-content">
                    {list.status === 'loading' && (
                        <div className="sidebar-skeleton" role="status">
                            <span className="sr-only">Loading workspaces</span>
                            {[0, 1, 2].map(i => <span key={i} className="skeleton sidebar-skeleton-row" />)}
                        </div>
                    )}

                    {list.status === 'error' && (
                        <div className="sidebar-error" role="alert">
                            <p>Couldn't load your workspaces.</p>
                            <button type="button" className="btn btn-quiet btn-small" onClick={() => { setList({ status: 'loading' }); load() }}>
                                Try again
                            </button>
                        </div>
                    )}

                    {list.status === 'ready' && list.workspaces.length === 0 && (
                        <p className="sidebar-empty">No workspaces yet.</p>
                    )}

                    {list.status === 'ready' && list.workspaces.length > 0 && (
                        <ul className="sidebar-list">
                            {list.workspaces.map(workspace => (
                                <li key={workspace.id}>
                                    <NavLink className="sidebar-workspace-item" to={`/dashboard/workspace/${workspace.id}`} onClick={desktop ? undefined : onClose}>
                                        <span className="sidebar-initial" aria-hidden="true">{workspace.name.trim().charAt(0).toUpperCase()}</span>
                                        <span className="sidebar-name">{workspace.name}</span>
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="sidebar-footer">
                    <button type="button" className="sidebar-new-workspace" onClick={() => setShowModal(true)}>
                        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                            <path d="M8 3v10M3 8h10" />
                        </svg>
                        New workspace
                    </button>
                </div>
            </nav>

            {showModal && <NewWorkspaceModal onClose={() => setShowModal(false)} onCreated={load} />}
        </>
    )
}

export default Sidebar
