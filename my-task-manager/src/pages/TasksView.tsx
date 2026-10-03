import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import TaskDialog from '../components/TaskDialog'
import TaskList from '../components/TaskList'
import TaskBoard from '../components/TaskBoard'
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
    const { create, patch, remove, canDelete, error, setError } = useTaskActions()
    const reduce = useReducedMotion()
    const [params, setParams] = useSearchParams()
    const [quick, setQuick] = useState('')
    const [adding, setAdding] = useState(false)
    const [editing, setEditing] = useState<Editing>(() => {
        const linked = tasks.find(t => t.id === params.get('task'))
        return linked ? { task: linked } : null
    })
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
        const created = await create({ title })
        setAdding(false)
        if (created) setQuick('')
    }

    const editTask = editing && 'task' in editing ? editing.task : null
    const { open, overdue, dueToday } = summarize(tasks)

    return (
        <motion.div className="tasks" initial={reduce ? false : 'hidden'} animate="show" variants={staggered}>
            {tasks.length > 0 && (
                <motion.div className="glance" role="group" aria-label="At a glance" variants={rise}>
                    <span className={`glance-stat${overdue.length ? ' is-alert' : ''}`}><strong>{overdue.length}</strong> overdue</span>
                    <span className="glance-stat"><strong>{dueToday.length}</strong> due today</span>
                    <span className="glance-people">
                        {members.map(member => {
                            const count = open.filter(t => t.assignee_id === member.id).length
                            return (
                                <span key={member.id} className="glance-person" title={`${member.name}: ${count} open`}>
                                    <span aria-hidden="true">{member.name.split(' ')[0]}</span>
                                    <strong aria-hidden="true">{count}</strong>
                                    <span className="sr-only">{count} open for {member.name}</span>
                                </span>
                            )
                        })}
                    </span>
                </motion.div>
            )}

            <motion.div className="tasks-toolbar" variants={rise}>
                <form className="quick-add" onSubmit={handleQuickAdd}>
                    <label htmlFor="quick-add" className="sr-only">Add a task</label>
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                        <path d="M8 3v10M3 8h10" />
                    </svg>
                    <input
                        id="quick-add"
                        type="text"
                        maxLength={200}
                        autoComplete="off"
                        placeholder="Add a task"
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
                <TaskList tasks={tasks} nameOf={nameOf} onEdit={task => setEditing({ task })} onPatch={patch} />
            ) : (
                <TaskBoard tasks={tasks} nameOf={nameOf} onEdit={task => setEditing({ task })} onAdd={status => setEditing({ status })} onPatch={patch} />
            )}

            {editing && (
                <TaskDialog
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
        </motion.div>
    )
}

export default TasksView
