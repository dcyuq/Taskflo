import { Link } from 'react-router-dom'
import Assignee from '../components/Assignee'
import { motion, useReducedMotion } from 'motion/react'
import Avatar from '../components/Avatar'
import UndoNote from '../components/UndoNote'
import { useWorkspace } from '../hooks/useWorkspace'
import { useTaskActions } from '../hooks/useTaskActions'
import { dateKey } from '../utils/dates'
import { summarize } from '../utils/summary'
import { duration, ease, rise, staggered } from '../utils/motion'

function startOfWeek() {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return d
}

function OverviewView() {
    const { tasks, members } = useWorkspace()
    const { complete, undoDone, justDone, error, setError } = useTaskActions()
    const reduce = useReducedMotion()
    const weekStart = startOfWeek()
    const { open, overdue, dueToday } = summarize(tasks)
    const doneThisWeek = tasks.filter(t => t.status === 'done' && dateKey(new Date(t.updated_at)) >= dateKey(weekStart))

    const people = [
        ...members.map(m => ({ id: m.id, name: m.name })),
        { id: null, name: 'Unassigned' },
    ].map(p => ({
        ...p,
        open: open.filter(t => t.assignee_id === p.id).length,
        overdue: overdue.filter(t => t.assignee_id === p.id).length,
    })).filter(p => p.id !== null || p.open > 0)
    const most = Math.max(1, ...people.map(p => p.open))

    const stats = [
        { label: 'Open tasks', value: open.length },
        { label: 'Overdue', value: overdue.length, alert: overdue.length > 0 },
        { label: 'Due today', value: dueToday.length },
        { label: 'Done this week', value: doneThisWeek.length },
    ]

    return (
        <motion.div className="overview" initial={reduce ? false : 'hidden'} animate="show" variants={staggered}>
            <motion.ul className="stat-grid" variants={staggered}>
                {stats.map(stat => (
                    <motion.li key={stat.label} className={`stat-card${stat.alert ? ' is-alert' : ''}`} variants={rise}>
                        <span className="stat-value">{stat.value}</span>
                        <span className="stat-label">{stat.label}</span>
                    </motion.li>
                ))}
            </motion.ul>

            {error && (
                <div className="tasks-error" role="alert">
                    <span>{error}</span>
                    <button type="button" className="btn btn-quiet btn-small" onClick={() => setError('')}>Dismiss</button>
                </div>
            )}

            <div className="overview-grid">
                <motion.section className="team-card" aria-labelledby="load-title" variants={rise}>
                    <div className="team-card-head">
                        <h2 id="load-title">Open tasks per person</h2>
                    </div>
                    <ul className="load-list">
                        {people.map(p => (
                            <li key={p.id ?? 'none'} className="load-item">
                                <Avatar name={p.id ? p.name : undefined} size={32} />
                                <span className="load-body">
                                    <span className="load-top">
                                        <span className="load-person">{p.name}</span>
                                        <span className="load-count">
                                            {p.open} open
                                            {p.overdue > 0 && <span className="load-overdue"> · {p.overdue} overdue</span>}
                                        </span>
                                    </span>
                                    <span className="load-track" aria-hidden="true">
                                        <motion.span
                                            className="load-fill"
                                            initial={reduce ? false : { scaleX: 0 }}
                                            animate={{ scaleX: p.open / most }}
                                            transition={{ duration, ease }}
                                        />
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </motion.section>

                <motion.section className="team-card" aria-labelledby="today-title" variants={rise}>
                    <div className="team-card-head">
                        <h2 id="today-title">Due today</h2>
                        <span className="task-group-count">{dueToday.length}</span>
                    </div>
                    {dueToday.length === 0 ? (
                        <p className="team-empty">Nothing due today.</p>
                    ) : (
                        <ul className="today-list">
                            {dueToday.map(task => {
                                const who = members.find(m => m.id === task.assignee_id)?.name
                                return (
                                    <li key={task.id} className="today-row">
                                        <button type="button" className="task-check" aria-label={`Mark ${task.title} as done`} onClick={() => complete(task)} />
                                        <span className="today-title">{task.title}</span>
                                        <Assignee name={who} />
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                    <Link to=".." relative="path" className="overview-link">View all tasks</Link>
                </motion.section>
            </div>
            <UndoNote task={justDone} onUndo={undoDone} />
        </motion.div>
    )
}

export default OverviewView
