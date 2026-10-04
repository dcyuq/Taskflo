import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Assignee from './Assignee'
import DueChip from './DueChip'
import { statuses, type Task, type TaskPatch } from '../services/tasks'
import { ease, rise } from '../utils/motion'
import { groupOf } from '../utils/summary'

interface TaskListProps {
    tasks: Task[]
    nameOf: (id: string | null) => string | undefined
    onEdit: (task: Task) => void
    onPatch: (task: Task, change: TaskPatch) => void
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3.5 8.5l3 3 6-7" />
        </svg>
    )
}

function TaskList({ tasks, nameOf, onEdit, onPatch }: TaskListProps) {
    const reduce = useReducedMotion()
    const [showDone, setShowDone] = useState(false)
    const item = {
        initial: reduce ? false : { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
        exit: reduce ? undefined : { opacity: 0, transition: { duration: 0.2 } },
    } as const

    return statuses.map(status => {
        const group = groupOf(tasks, status.id)
        const foldable = status.id === 'done' && group.length > 0
        return (
            <motion.section key={status.id} className="task-group" aria-labelledby={`group-${status.id}`} variants={rise}>
                <div className="task-group-head">
                    <h2 className="task-group-title" id={`group-${status.id}`}>
                        {status.label}
                        <span className="task-group-count">{group.length}</span>
                    </h2>
                    {foldable && (
                        <button type="button" className="task-group-toggle" aria-expanded={showDone} aria-controls="task-list-done" onClick={() => setShowDone(s => !s)}>
                            {showDone ? 'Hide done' : `Show ${group.length} done`}
                        </button>
                    )}
                </div>
                {group.length === 0 && <p className="task-group-empty">No tasks</p>}
                <ul className="task-list" id={`task-list-${status.id}`} hidden={foldable && !showDone}>
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
                                        onClick={() => onPatch(task, { status: done ? 'todo' : 'done' })}
                                    >
                                        {done && <CheckIcon />}
                                    </button>
                                    <button type="button" className="task-row-title" onClick={() => onEdit(task)}>
                                        {task.title}
                                    </button>
                                    <DueChip task={task} />
                                    <Assignee name={who} />
                                </motion.li>
                            )
                        })}
                    </AnimatePresence>
                </ul>
            </motion.section>
        )
    })
}

export default TaskList
