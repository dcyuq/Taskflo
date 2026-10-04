import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import TaskDialog from '../components/TaskDialog'
import TaskList from '../components/TaskList'
import TaskBoard from '../components/TaskBoard'
import UndoNote from '../components/UndoNote'
import { useWorkspace } from '../hooks/useWorkspace'
import { useTaskActions } from '../hooks/useTaskActions'
import type { Task, TaskStatus } from '../services/tasks'
import { rise, staggered } from '../utils/motion'
import { readStored, store } from '../utils/storage'
import { summarize } from '../utils/summary'

type View = 'list' | 'board'
type Editing = { task: Task } | { status: TaskStatus, title?: string } | null

const isView = (value: string | null): value is View => value === 'list' || value === 'board'

function TasksView() {
    const { workspace, tasks, members } = useWorkspace()
    const { create, patch, complete, undoDone, justDone, remove, canDelete, error, setError } = useTaskActions()
    const reduce = useReducedMotion()
    const [params, setParams] = useSearchParams()
    const [quick, setQuick] = useState('')
    const [adding, setAdding] = useState(false)
    const [allPeople, setAllPeople] = useState(false)
    const [editing, setEditing] = useState<Editing>(null)
    const linkedId = params.get('task')
    const [seenLink, setSeenLink] = useState<string | null>(null)
    if (linkedId !== seenLink) {
        setSeenLink(linkedId)
        const linked = tasks.find(t => t.id === linkedId)
        if (linked) setEditing({ task: linked })
    }
    const viewKey = `taskflo:view:${workspace.id}`
    const fromUrl = params.get('view')
    const stored = readStored(viewKey)
    const view: View = isView(fromUrl) ? fromUrl : isView(stored) ? stored : 'list'
    const nameOf = (id: string | null) => members.find(m => m.id === id)?.name

    function chooseView(next: View) {
        store(viewKey, next)
        setParams(p => {
            p.set('view', next)
            return p
        }, { replace: true })
    }

    async function handleQuickAdd(e: React.SyntheticEvent) {
        e.preventDefault()
        const title = quick.trim()
        if (!title || adding) return
        setAdding(true)
        const created = await create(quickFor ? { title, assignee_id: quickFor.id } : { title })
        setAdding(false)
        if (created) setQuick('')
    }

    function setFilter(id: string | null) {
        setParams(p => {
            if (id) p.set('assignee', id)
            else p.delete('assignee')
            return p
        }, { replace: true })
    }

    const editTask = editing && 'task' in editing ? editing.task : null
    const { open, overdue, dueToday } = summarize(tasks)
    const ownerOf = (t: Task) => t.assignee_id ?? 'none'
    const people = [...members.map(m => ({ id: m.id, name: m.name })), { id: 'none', name: 'Unassigned' }]
        .map(p => ({ ...p, open: open.filter(t => ownerOf(t) === p.id).length, late: overdue.filter(t => ownerOf(t) === p.id).length }))
        .filter(p => p.id !== 'none' || p.open > 0)
        .sort((a, b) => b.late - a.late || b.open - a.open)
    const filterId = params.get('assignee')
    const filtered = people.find(p => p.id === filterId)
    const chips = allPeople ? people : people.filter((p, i) => i < 5 || p.id === filterId)
    const shown = filtered ? tasks.filter(t => ownerOf(t) === filtered.id) : tasks
    const quickFor = filtered && filtered.id !== 'none' ? filtered : null

    return (
        <motion.div className="tasks" initial={reduce ? false : 'hidden'} animate="show" variants={staggered}>
            {tasks.length > 0 && (
                <motion.div className="glance" variants={rise}>
                    <span className={`glance-stat${overdue.length ? ' is-alert' : ''}`}><strong>{overdue.length}</strong> overdue</span>
                    <span className="glance-stat"><strong>{dueToday.length}</strong> due today</span>
                    <span className="glance-people" role="group" aria-label="Show tasks for one person">
                        {chips.map(p => (
                            <button
                                key={p.id}
                                type="button"
                                className={`glance-person${p.late ? ' is-late' : ''}`}
                                aria-pressed={p.id === filterId}
                                title={`${p.name}: ${p.open} open${p.late ? `, ${p.late} overdue` : ''}`}
                                onClick={() => setFilter(p.id === filterId ? null : p.id)}
                            >
                                <span aria-hidden="true">{p.id === 'none' ? p.name : p.name.split(' ')[0]}</span>
                                <strong aria-hidden="true">{p.open}</strong>
                                <span className="sr-only">{p.name}, {p.open} open{p.late ? `, ${p.late} overdue` : ''}</span>
                            </button>
                        ))}
                        {chips.length < people.length && (
                            <button type="button" className="glance-more" onClick={() => setAllPeople(true)}>
                                +{people.length - chips.length} more
                            </button>
                        )}
                        {filtered && (
                            <button type="button" className="glance-more" onClick={() => setFilter(null)}>Show everyone</button>
                        )}
                    </span>
                </motion.div>
            )}

            <motion.div className="tasks-toolbar" variants={rise}>
                <form className="quick-add" onSubmit={handleQuickAdd}>
                    <label htmlFor="quick-add" className="sr-only">{quickFor ? `Add a task for ${quickFor.name}` : 'Add a task'}</label>
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                        <path d="M8 3v10M3 8h10" />
                    </svg>
                    <input
                        id="quick-add"
                        type="text"
                        maxLength={200}
                        autoComplete="off"
                        placeholder={quickFor ? `Add a task for ${quickFor.name}` : 'Add a task'}
                        value={quick}
                        onChange={e => setQuick(e.target.value)}
                    />
                    <button type="button" className="quick-add-details" onClick={() => setEditing({ status: 'todo', title: quick.trim() })}>
                        Add details
                    </button>
                </form>
                <div className="view-toggle" role="group" aria-label="View">
                    {(['list', 'board'] as const).map(option => (
                        <button key={option} type="button" aria-pressed={view === option} onClick={() => chooseView(option)}>
                            {option === 'list' ? 'List' : 'Board'}
                        </button>
                    ))}
                </div>
            </motion.div>

            {error && (
                <div className="tasks-error" role="alert">
                    <span>{error}</span>
                    <button type="button" className="btn btn-quiet btn-small" onClick={() => setError('')}>Dismiss</button>
                </div>
            )}

            {tasks.length === 0 ? (
                <motion.p className="tasks-empty" variants={rise}>
                    No tasks yet. Type the first one above and press Enter.
                </motion.p>
            ) : view === 'list' ? (
                <TaskList tasks={shown} nameOf={nameOf} onEdit={task => setEditing({ task })} onPatch={(task, change) => change.status === 'done' ? complete(task) : patch(task, change)} />
            ) : (
                <TaskBoard tasks={shown} nameOf={nameOf} onEdit={task => setEditing({ task })} onAdd={status => setEditing({ status })} onPatch={patch} />
            )}

            {editing && (
                <TaskDialog
                    key={editTask?.id ?? 'new'}
                    task={editTask}
                    defaultStatus={'status' in editing ? editing.status : undefined}
                    defaultTitle={'title' in editing ? editing.title : undefined}
                    members={members}
                    canDelete={!!editTask && canDelete(editTask)}
                    onSave={async values => {
                        if (editTask) return patch(editTask, values)
                        const created = await create(values)
                        if (created && 'title' in editing && editing.title) setQuick('')
                        return !!created
                    }}
                    onDelete={async () => !!editTask && remove(editTask)}
                    onClose={() => {
                        setEditing(null)
                        if (params.has('task')) setParams(p => { p.delete('task'); return p }, { replace: true })
                    }}
                />
            )}
            <UndoNote task={justDone} onUndo={undoDone} />
        </motion.div>
    )
}

export default TasksView
