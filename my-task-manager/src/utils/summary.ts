import type { Task } from '../services/tasks'
import { addDays, todayKey } from './dates'

export function summarize(tasks: Task[]) {
    const today = todayKey()
    const open = tasks.filter(t => t.status !== 'done')
    return {
        open,
        overdue: open.filter(t => t.due_date && t.due_date < today),
        dueToday: open.filter(t => t.due_date === today),
    }
}

export const isDueSoon = (task: Task) => !!task.due_date && task.due_date <= addDays(todayKey(), 7)
