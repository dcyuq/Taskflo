import type { Task } from '../services/tasks'
import { todayKey } from './dates'

export function summarize(tasks: Task[]) {
    const today = todayKey()
    const open = tasks.filter(t => t.status !== 'done')
    return {
        open,
        overdue: open.filter(t => t.due_date && t.due_date < today),
        dueToday: open.filter(t => t.due_date === today),
    }
}
