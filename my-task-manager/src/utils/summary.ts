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

const NO_DATE = '9999-12-31'

export const byDue = (a: Task, b: Task) => (a.due_date ?? NO_DATE).localeCompare(b.due_date ?? NO_DATE)

export const groupOf = (tasks: Task[], status: Task['status']) =>
    tasks.filter(t => t.status === status).sort(status === 'done' ? (a, b) => b.updated_at.localeCompare(a.updated_at) : byDue)

export const isDueSoon = (task: Task) => !!task.due_date && task.due_date <= addDays(todayKey(), 7)
