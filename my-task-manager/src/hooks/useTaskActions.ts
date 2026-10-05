import { useState } from 'react'
import { useWorkspace } from './useWorkspace'
import { useJustDone } from './useJustDone'
import { createTask, deleteTask, updateTask, type Task, type TaskPatch } from '../services/tasks'
import { friendlyError } from '../utils/errors'

export function useTaskActions() {
    const { workspace, setTasks, me, isOwner } = useWorkspace()
    const [error, setError] = useState('')
    const [justDone, showDone] = useJustDone()

    const canDelete = (task: Task) => isOwner || task.created_by === me

    async function create(input: TaskPatch & { title: string }) {
        setError('')
        const { data, error } = await createTask(workspace.id, input)
        if (error || !data) {
            setError(friendlyError(error, 'Couldn’t add that task. Check your connection and try again.'))
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
            setError(friendlyError(error, 'Couldn’t save that change. Check your connection and try again.'))
            return false
        }
        setTasks(ts => ts.map(t => (t.id === data.id ? data : t)))
        return true
    }

    async function complete(task: Task) {
        showDone(task)
        if (!await patch(task, { status: 'done' })) showDone(null)
    }

    async function undoDone() {
        if (!justDone) return
        showDone(null)
        await patch({ ...justDone, status: 'done' }, { status: justDone.status })
    }

    async function remove(task: Task) {
        setError('')
        const { error } = await deleteTask(task.id)
        if (error) {
            setError(friendlyError(error, 'Couldn’t delete that task. Only its creator or the workspace owner can delete it.'))
            return false
        }
        setTasks(ts => ts.filter(t => t.id !== task.id))
        return true
    }

    return { create, patch, complete, undoDone, justDone, remove, canDelete, error, setError }
}
