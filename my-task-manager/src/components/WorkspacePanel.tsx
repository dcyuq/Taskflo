import { useState } from 'react'
import ActionMenu from './ActionMenu'
import BoardTree, { type TreeAsking } from './BoardTree'
import type { BoardsApi } from '../hooks/useBoards'
import type { WorkspaceSummary } from '../services/workspace'
import { menuFor, type MenuAt } from '../utils/menu'

interface WorkspacePanelProps {
    workspace: WorkspaceSummary
    me: string
    api: BoardsApi
    selectedId?: string
    onOptions: (e: React.MouseEvent) => void
    onNavigate?: () => void
}

function WorkspacePanel({ workspace, me, api, selectedId, onOptions, onNavigate }: WorkspacePanelProps) {
    const [menu, setMenu] = useState<MenuAt | null>(null)
    const [asking, setAsking] = useState<TreeAsking>(null)
    const isOwner = workspace.owner_id === me

    return (
        <section className="sidebar-section is-spaced" aria-labelledby="sidebar-current">
            <div className="sidebar-section-head" onContextMenu={onOptions}>
                <h2 className="sidebar-label sidebar-current" id="sidebar-current">{workspace.name}</h2>
                <span className="sidebar-head-actions">
                    {isOwner && (
                        <button
                            type="button"
                            className="sidebar-icon-btn is-small"
                            aria-label="Add a category or board"
                            aria-haspopup="menu"
                            title="Add"
                            onClick={e => setMenu(menuFor(e, 'Add', [
                                { label: 'New category', onSelect: () => setAsking({ kind: 'new-category' }) },
                                { label: 'New board', onSelect: () => setAsking({ kind: 'new-board', categoryId: null }) },
                            ]))}
                        >
                            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                                <path d="M8 3v10M3 8h10" />
                            </svg>
                        </button>
                    )}
                    <button type="button" className="sidebar-icon-btn is-small" aria-label={`${workspace.name} options`} aria-haspopup="menu" onClick={onOptions}>
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                            <circle cx="3.5" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="12.5" cy="8" r="1.3" />
                        </svg>
                    </button>
                </span>
            </div>

            {api.tree ? (
                <BoardTree tree={api.tree} api={api} canEdit={isOwner} selectedId={selectedId} asking={asking} setAsking={setAsking} onNavigate={onNavigate} />
            ) : api.error ? (
                <p className="sidebar-error" role="alert">{api.error}</p>
            ) : (
                <div className="sidebar-skeleton" role="status">
                    <span className="sr-only">Loading boards</span>
                    {[0, 1].map(i => <span key={i} className="skeleton sidebar-skeleton-row" />)}
                </div>
            )}

            {menu && <ActionMenu at={menu} onClose={() => setMenu(null)} />}
        </section>
    )
}

export default WorkspacePanel