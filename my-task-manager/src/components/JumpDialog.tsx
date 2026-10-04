import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Task } from '../services/tasks'
import './JumpDialog.css'

interface JumpDialogProps {
    workspaces: { id: string, name: string }[]
    tasks: Task[]
    onClose: () => void
}

type Result = { id: string, kind: 'workspace' | 'task', label: string, detail?: string, to: string }

function JumpDialog({ workspaces, tasks, onClose }: JumpDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [active, setActive] = useState(0)
    const q = query.trim().toLowerCase()
    const nameOf = (id: string) => workspaces.find(w => w.id === id)?.name

    const results: Result[] = [
        ...workspaces
            .filter(w => w.name.toLowerCase().includes(q))
            .map(w => ({ id: w.id, kind: 'workspace' as const, label: w.name, to: `/dashboard/workspace/${w.id}` })),
        ...(q ? tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 8) : []).map(t => ({
            id: t.id,
            kind: 'task' as const,
            label: t.title,
            detail: nameOf(t.workspace_id),
            to: `/dashboard/workspace/${t.workspace_id}?board=${t.board_id}&task=${t.id}`,
        })),
    ]
    const current = Math.min(active, Math.max(results.length - 1, 0))

    useEffect(() => {
        dialogRef.current?.showModal()
    }, [])

    function go(result?: Result) {
        if (!result) return
        onClose()
        navigate(result.to)
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive(Math.min(current + 1, results.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive(Math.max(current - 1, 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            go(results[current])
        }
    }

    return (
        <dialog
            ref={dialogRef}
            className="jump"
            aria-label="Jump to a workspace or task"
            onClose={onClose}
            onClick={e => e.target === dialogRef.current && onClose()}
        >
            <div className="jump-field">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" />
                </svg>
                <input
                    type="text"
                    role="combobox"
                    aria-label="Search workspaces and tasks"
                    aria-expanded={results.length > 0}
                    aria-controls="jump-results"
                    aria-activedescendant={results[current] ? `jump-${results[current].id}` : undefined}
                    aria-autocomplete="list"
                    autoComplete="off"
                    placeholder="Find a workspace or task"
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value)
                        setActive(0)
                    }}
                    onKeyDown={onKeyDown}
                    autoFocus
                />
                <kbd className="jump-esc">Esc</kbd>
            </div>
            <ul id="jump-results" className="jump-results" role="listbox" aria-label="Results">
                {results.map((result, i) => (
                    <li
                        key={`${result.kind}-${result.id}`}
                        id={`jump-${result.id}`}
                        role="option"
                        aria-selected={i === current}
                        className={`jump-result${i === current ? ' is-active' : ''}`}
                        onMouseMove={() => setActive(i)}
                        onClick={() => go(result)}
                    >
                        <span className={`jump-kind is-${result.kind}`} aria-hidden="true">
                            {result.kind === 'workspace' ? result.label.charAt(0).toUpperCase() : ''}
                        </span>
                        <span className="jump-label">{result.label}</span>
                        {result.detail && <span className="jump-detail">{result.detail}</span>}
                    </li>
                ))}
            </ul>
            {results.length === 0 && <p className="jump-empty" role="status">No workspace or open task matches “{query.trim()}”.</p>}
        </dialog>
    )
}

export default JumpDialog
