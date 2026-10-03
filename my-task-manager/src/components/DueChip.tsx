import type { Task } from '../services/tasks'
import { dueInfo } from '../utils/dates'

function DueChip({ task }: { task: Task }) {
    const due = dueInfo(task.due_date, task.status === 'done')
    if (!due) return null
    return (
        <span className={`due-chip${due.overdue ? ' is-overdue' : ''}`}>
            {due.overdue ? `Overdue · ${due.label}` : due.label}
        </span>
    )
}

export default DueChip
