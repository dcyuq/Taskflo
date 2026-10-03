import { motion, useReducedMotion } from 'motion/react'
import Avatar from '../components/Avatar'
import { useWorkspace } from '../hooks/useWorkspace'
import { statuses, type Task } from '../services/tasks'
import { dueInfo } from '../utils/dates'
import { reveal, rise } from '../utils/motion'

function DueChip({ task }: { task: Task }) {
    const due = dueInfo(task.due_date, task.status === 'done')
    if (!due) return null
    return (
        <span className={`due-chip${due.overdue ? ' is-overdue' : ''}`}>
            {due.overdue ? `Overdue · ${due.label}` : due.label}
        </span>
    )
}

function TasksView() {
    const { tasks, members } = useWorkspace()
    const reduce = useReducedMotion()
    const nameOf = (id: string | null) => members.find(m => m.id === id)?.name

    return (
        <div className="tasks">
            {statuses.map(status => {
                const group = tasks.filter(t => t.status === status.id)
                return (
                    <section key={status.id} className="task-group" aria-labelledby={`group-${status.id}`}>
                        <h2 className="task-group-title" id={`group-${status.id}`}>
                            {status.label}
                            <span className="task-group-count">{group.length}</span>
                        </h2>
                        {group.length === 0 ? (
                            <p className="task-group-empty">Nothing here.</p>
                        ) : (
                            <motion.ul className="task-list" {...reveal(reduce)}>
                                {group.map(task => (
                                    <motion.li key={task.id} className={`task-row${task.status === 'done' ? ' is-done' : ''}`} variants={rise}>
                                        <span className="task-check" aria-hidden="true" />
                                        <span className="task-row-title">{task.title}</span>
                                        <DueChip task={task} />
                                        <span className="task-assignee" title={nameOf(task.assignee_id) ?? 'Unassigned'}>
                                            <Avatar name={nameOf(task.assignee_id)} />
                                            <span className="sr-only">{nameOf(task.assignee_id) ?? 'Unassigned'}</span>
                                        </span>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        )}
                    </section>
                )
            })}
        </div>
    )
}

export default TasksView
