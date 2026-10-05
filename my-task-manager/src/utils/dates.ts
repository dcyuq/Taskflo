const pad = (n: number) => String(n).padStart(2, '0')

export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayKey = () => dateKey(new Date())

export function addDays(key: string, days: number) {
    const d = new Date(`${key}T00:00:00`)
    d.setDate(d.getDate() + days)
    return dateKey(d)
}

export function dueInfo(due: string | null, done: boolean) {
    if (!due) return null
    const today = todayKey()
    const overdue = !done && due < today
    const label = due === today
        ? 'Today'
        : due === addDays(today, 1)
            ? 'Tomorrow'
            : new Date(`${due}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    return { label, overdue, today: due === today }
}

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

export function relativeTime(iso: string) {
    const seconds = (new Date(iso).getTime() - Date.now()) / 1000
    const units: [Intl.RelativeTimeFormatUnit, number][] = [['day', 86400], ['hour', 3600], ['minute', 60]]
    const [unit, size] = units.find(([, size]) => Math.abs(seconds) >= size) ?? ['second', 1]
    return relative.format(Math.round(seconds / size), unit)
}
