import { useRef, useState } from 'react'
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

type View = 'list' | 'board'
type Editing = { task: Task } | { status: TaskStatus } | null

const isView = (value: string | null): value is View => value === 'list' || value === 'board'

function TasksView() {
    const { workspace, tasks, members } = useWorkspace()
    const { create, patch, remove, canDelete, error, setError } = useTaskActions()
    const reduce = useReducedMotion()
    const [params, setParams] = useSearchParams()
    const [quick, setQuick] = useState('')
    const [adding, setAdding] = useState(false)
    const [editing, setEditing] = useState<Editing>(null)
    const quickRef = useRef<HTMLInputElement>(null)
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

    return (
        <motion.div className="tasks" initial={reduce ? false : 'hidden'} animate="show" variants={staggered}>
            <motion.div className="tasks-toolbar" variants={rise}>
                <form className="quick-add" onSubmit={handleQuickAdd}>
                    <label htmlFor="quick-add" className="sr-only">Add a task</label>
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                        <path d="M8 3v10M3 8h10" />
                    </svg>
                    <input
                        id="quick-add"
                        ref={quickRef}
                        type="text"
                        maxLength={200}
                        autoComplete="off"
                        placeholder="Add a task"
                        value={quick}
                        onChange={e => setQuick(e.target.value)}
                    />
                </form>
                <div className="view-toggle" role="group" aria-label="View">
                    {(['list', 'board'] as const).map(option => (
                        <button key={option} type="button" aria-pressed={view === option} onClick={() => chooseView(option)}>
                            {option === 'list' ? 'List' : 'Board'}
                        </button>
                    ))}
                </div>
                <button type="button" className="btn btn-primary" onClick={() => setEditing({ status: 'todo' })}>New task</button>
            </motion.div>

            {error && (
                <div className="tasks-error" role="alert">
                    <span>{error}</span>
                    <button type="button" className="btn btn-quiet btn-small" onClick={() => setError('')}>Dismiss</button>
                </div>
            )}

            {tasks.length === 0 ? (
                <motion.div className="tasks-empty" variants={rise}>
                    <h2>No tasks yet</h2>
                    <p>Add the first one and give it an owner and a due date.</p>
                    <button type="button" className="btn btn-outline" onClick={() => quickRef.current?.focus()}>Add a task</button>
                </motion.div>
            ) : view === 'list' ? (
                <TaskList tasks={tasks} nameOf={nameOf} onEdit={task => setEditing({ task })} onPatch={patch} />
            ) : (
                <TaskBoard tasks={tasks} nameOf={nameOf} onEdit={task => setEditing({ task })} onAdd={status => setEditing({ status })} onPatch={patch} />
            )}

            {editing && (
                <TaskDialog
                    task={editTask}
                    defaultStatus={'status' in editing ? editing.status : undefined}
                    members={members}
                    canDelete={!!editTask && canDelete(editTask)}
                    onSave={async values => editTask ? patch(editTask, values) : !!(await create(values))}
                    onDelete={async () => !!editTask && remove(editTask)}
                    onClose={() => setEditing(null)}
                />
            )}
        </motion.div>
    )
}

export default TasksView
