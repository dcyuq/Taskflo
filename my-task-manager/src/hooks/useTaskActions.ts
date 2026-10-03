import { useState } from 'react'
import { useWorkspace } from './useWorkspace'
import { createTask, deleteTask, updateTask, type Task, type TaskPatch } from '../services/tasks'

export function useTaskActions() {
    const { workspace, setTasks, me, isOwner } = useWorkspace()
    const [error, setError] = useState('')

    const canDelete = (task: Task) => isOwner || task.created_by === me

    async function create(input: TaskPatch & { title: string }) {
        setError('')
        const { data, error } = await createTask(workspace.id, input)
        if (error || !data) {
            setError('Couldn’t add that task. Check your connection and try again.')
            return null
        }
        setTasks(ts => [...ts, data])
        return data
    }

    async function patch(task: Task, change: TaskPatch) {
        setError('')
        setTasks(ts => ts.map(t => (t.id === task.id ? { ...t, ...change } : t)))
        const { data, error } = await updateTask(task.id, change)
        if (error || !data) {
            setTasks(ts => ts.map(t => (t.id === task.id ? task : t)))
            setError('Couldn’t save that change. Check your connection and try again.')
            return false
        }
        setTasks(ts => ts.map(t => (t.id === data.id ? data : t)))
        return true
    }

    async function remove(task: Task) {
        setError('')
        const { error } = await deleteTask(task.id)
        if (error) {
            setError('Couldn’t delete that task. Only its creator or the workspace owner can delete it.')
            return false
        }
        setTasks(ts => ts.filter(t => t.id !== task.id))
        return true
    }

    return { create, patch, remove, canDelete, error, setError }
}
