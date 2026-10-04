import { useRef, useState } from 'react'
import type { Task } from '../services/tasks'

export function useJustDone() {
    const [task, setTask] = useState<Task | null>(null)
    const timer = useRef(0)

    function show(next: Task | null) {
        window.clearTimeout(timer.current)
        setTask(next)
        if (next) timer.current = window.setTimeout(() => setTask(null), 6000)
    }

    return [task, show] as const
}
