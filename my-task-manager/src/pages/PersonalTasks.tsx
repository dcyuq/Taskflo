import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import DueChip from '../components/DueChip'
import UndoNote from '../components/UndoNote'
import { useJustDone } from '../hooks/useJustDone'
import { updateTask, type Task } from '../services/tasks'
import { isDueSoon } from '../utils/summary'
import { rise, staggered } from '../utils/motion'
import type { DashboardContext } from './Dashboard'
import './Workspace.css'

function PersonalTasks({ mode }: { mode: 'mine' | 'soon' }) {
    const { workspaces, openTasks, me, reloadOpen } = useOutletContext<DashboardContext>()
    const reduce = useReducedMotion()
    const [error, setError] = useState('')
    const [doneIds, setDoneIds] = useState<string[]>([])
    const [justDone, showDone] = useJustDone()
    const mine = openTasks.filter(t => t.assignee_id === me && !doneIds.includes(t.id))
    const tasks = mode === 'mine' ? mine : mine.filter(isDueSoon)
    const groups = workspaces
        .map(w => ({ ...w, tasks: tasks.filter(t => t.workspace_id === w.id) }))
        .filter(g => g.tasks.length > 0)

    async function markDone(task: Task) {
        setError('')
        setDoneIds(ids => [...ids, task.id])
        showDone(task)
        const { error } = await updateTask(task.id, { status: 'done' })
        if (error) {
            setDoneIds(ids => ids.filter(x => x !== task.id))
            showDone(null)
            setError('Couldn’t mark that task as done. Check your connection and try again.')
            return
        }
        reloadOpen()
    }

    async function undoDone() {
        if (!justDone) return
        const task = justDone
        showDone(null)
        const { error } = await updateTask(task.id, { status: task.status })
        if (error) {
            setError('Couldn’t undo that. Open the task’s workspace to change it back.')
            return
        }
        setDoneIds(ids => ids.filter(x => x !== task.id))
        reloadOpen()
    }

    return (
        <motion.div className="ws" initial={reduce ? false : 'hidden'} animate="show" variants={staggered}>
            <motion.header className="personal-head" variants={rise}>
                <h1 className="ws-title">{mode === 'mine' ? 'My tasks' : 'Due soon'}</h1>
                <p className="personal-lede">
                    {mode === 'mine' ? 'Open tasks assigned to you, across every workspace.' : 'Your open tasks that are overdue or due in the next 7 days.'}
                </p>
            </motion.header>

            {error && (
                <div className="tasks-error" role="alert">
                    <span>{error}</span>
                    <button type="button" className="btn btn-quiet btn-small" onClick={() => setError('')}>Dismiss</button>
                </div>
            )}

            {groups.length === 0 ? (
                <motion.p className="tasks-empty" variants={rise}>
                    {mode === 'mine' ? 'Nothing is assigned to you right now.' : 'Nothing of yours is due in the next 7 days.'}
                </motion.p>
            ) : (
                <div className="tasks">
                    {groups.map(group => (
                        <motion.section key={group.id} className="task-group" aria-labelledby={`personal-${group.id}`} variants={rise}>
                            <h2 className="task-group-title" id={`personal-${group.id}`}>
                                <Link className="personal-ws" to={`/dashboard/workspace/${group.id}`}>{group.name}</Link>
                                <span className="task-group-count">{group.tasks.length}</span>
                            </h2>
                            <ul className="task-list">
                                {group.tasks.map(task => (
                                    <li key={task.id} className="task-row">
                                        <button type="button" className="task-check" aria-label={`Mark ${task.title} as done`} onClick={() => markDone(task)} />
                                        <Link className="task-row-title" to={`/dashboard/workspace/${group.id}?board=${task.board_id}&task=${task.id}`}>{task.title}</Link>
                                        <DueChip task={task} />
                                    </li>
                                ))}
                            </ul>
                        </motion.section>
                    ))}
                </div>
            )}
            <UndoNote task={justDone} onUndo={undoDone} />
        </motion.div>
    )
}

export default PersonalTasks
