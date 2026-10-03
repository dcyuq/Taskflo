import { useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Avatar from '../components/Avatar'
import TaskDialog from '../components/TaskDialog'
import DueChip from '../components/DueChip'
import { useWorkspace } from '../hooks/useWorkspace'
import { useTaskActions } from '../hooks/useTaskActions'
import { statuses, type Task } from '../services/tasks'
import { ease, rise, staggered } from '../utils/motion'

function CheckIcon() {
    return (
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3.5 8.5l3 3 6-7" />
        </svg>
    )
}

function TasksView() {
    const { tasks, members } = useWorkspace()
    const { create, patch, remove, canDelete, error, setError } = useTaskActions()
    const reduce = useReducedMotion()
    const [quick, setQuick] = useState('')
    const [adding, setAdding] = useState(false)
    const [editing, setEditing] = useState<Task | 'new' | null>(null)
    const quickRef = useRef<HTMLInputElement>(null)
    const nameOf = (id: string | null) => members.find(m => m.id === id)?.name

    async function handleQuickAdd(e: React.SyntheticEvent) {
        e.preventDefault()
        const title = quick.trim()
        if (!title || adding) return
        setAdding(true)
        const created = await create({ title })
        setAdding(false)
        if (created) setQuick('')
    }

    const item = {
        initial: reduce ? false : { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
        exit: reduce ? undefined : { opacity: 0, transition: { duration: 0.2 } },
    } as const

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
                <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>New task</button>
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
            ) : (
                statuses.map(status => {
                    const group = tasks.filter(t => t.status === status.id)
                    return (
                        <motion.section key={status.id} className="task-group" aria-labelledby={`group-${status.id}`} variants={rise}>
                            <h2 className="task-group-title" id={`group-${status.id}`}>
                                {status.label}
                                <span className="task-group-count">{group.length}</span>
                            </h2>
                            {group.length === 0 && <p className="task-group-empty">Nothing here.</p>}
                            <ul className="task-list">
                                <AnimatePresence initial={false}>
                                    {group.map(task => {
                                        const done = task.status === 'done'
                                        const who = nameOf(task.assignee_id)
                                        return (
                                            <motion.li key={task.id} layout={!reduce} className={`task-row${done ? ' is-done' : ''}`} {...item}>
                                                <button
                                                    type="button"
                                                    className="task-check"
                                                    aria-label={done ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
                                                    aria-pressed={done}
                                                    onClick={() => patch(task, { status: done ? 'todo' : 'done' })}
                                                >
                                                    {done && <CheckIcon />}
                                                </button>
                                                <button type="button" className="task-row-title" onClick={() => setEditing(task)}>
                                                    {task.title}
                                                </button>
                                                <DueChip task={task} />
                                                <span className="task-assignee" title={who ?? 'Unassigned'}>
                                                    <Avatar name={who} />
                                                    <span className="sr-only">{who ? `Assigned to ${who}` : 'Unassigned'}</span>
                                                </span>
                                            </motion.li>
                                        )
                                    })}
                                </AnimatePresence>
                            </ul>
                        </motion.section>
                    )
                })
            )}

            {editing && (
                <TaskDialog
                    task={editing === 'new' ? null : editing}
                    members={members}
                    canDelete={editing !== 'new' && canDelete(editing)}
                    onSave={async values => editing === 'new' ? !!(await create(values)) : patch(editing, values)}
                    onDelete={async () => editing !== 'new' && remove(editing)}
                    onClose={() => setEditing(null)}
                />
            )}
        </motion.div>
    )
}

export default TasksView
