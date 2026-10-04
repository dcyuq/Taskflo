import { useEffect, useRef, useState } from 'react'
import type { Member } from '../services/members'
import { statuses, type Task, type TaskPatch, type TaskStatus } from '../services/tasks'
import './TaskDialog.css'

interface TaskDialogProps {
    task: Task | null
    defaultStatus?: TaskStatus
    defaultTitle?: string
    members: Member[]
    canDelete: boolean
    onSave: (values: TaskPatch & { title: string }) => Promise<boolean>
    onDelete: () => Promise<boolean>
    onClose: () => void
}

function TaskDialog({ task, defaultStatus = 'todo', defaultTitle = '', members, canDelete, onSave, onDelete, onClose }: TaskDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [title, setTitle] = useState(task?.title ?? defaultTitle)
    const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus)
    const [assignee, setAssignee] = useState(task?.assignee_id ?? '')
    const [due, setDue] = useState(task?.due_date ?? '')
    const [titleError, setTitleError] = useState('')
    const [saving, setSaving] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [failed, setFailed] = useState('')

    useEffect(() => {
        dialogRef.current?.showModal()
    }, [])

    async function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault()
        if (saving) return
        const trimmed = title.trim()
        if (!trimmed) {
            setTitleError('Give the task a title.')
            return
        }
        setTitleError('')
        setFailed('')
        setSaving(true)
        const ok = await onSave({ title: trimmed, status, assignee_id: assignee || null, due_date: due || null })
        setSaving(false)
        if (ok) onClose()
        else setFailed('Couldn’t save the task. Check your connection and try again.')
    }

    async function handleDelete() {
        setSaving(true)
        const ok = await onDelete()
        setSaving(false)
        if (ok) onClose()
        else {
            setConfirming(false)
            setFailed('Couldn’t delete the task. Only its creator or the workspace owner can delete it.')
        }
    }

    return (
        <dialog
            ref={dialogRef}
            className="task-dialog"
            aria-labelledby="task-dialog-title"
            onClose={onClose}
            onClick={e => e.target === dialogRef.current && onClose()}
        >
            <form onSubmit={handleSubmit} noValidate>
                <div className="task-dialog-head">
                    <h2 id="task-dialog-title">{task ? 'Edit task' : 'New task'}</h2>
                    <button type="button" className="task-dialog-close" aria-label="Close" onClick={onClose}>
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                            <path d="M4 4l8 8M12 4l-8 8" />
                        </svg>
                    </button>
                </div>

                <div className="task-field">
                    <label htmlFor="task-title">Title</label>
                    <input
                        id="task-title"
                        type="text"
                        autoComplete="off"
                        maxLength={200}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        aria-invalid={!!titleError}
                        aria-describedby={titleError ? 'task-title-error' : undefined}
                    />
                    {titleError && <p className="field-error" id="task-title-error">{titleError}</p>}
                </div>

                <div className="task-field-row">
                    <div className="task-field">
                        <label htmlFor="task-status">Status</label>
                        <select id="task-status" value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
                            {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                    </div>
                    <div className="task-field">
                        <label htmlFor="task-due">Due date</label>
                        <input id="task-due" type="date" value={due} onChange={e => setDue(e.target.value)} />
                    </div>
                </div>

                <div className="task-field">
                    <label htmlFor="task-assignee">Assignee</label>
                    <select id="task-assignee" value={assignee} onChange={e => setAssignee(e.target.value)}>
                        <option value="">Unassigned</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>

                {failed && <p className="field-error" role="alert">{failed}</p>}

                <div className="task-dialog-actions">
                    {task && canDelete && !confirming && (
                        <button type="button" className="btn btn-quiet task-dialog-delete" onClick={() => setConfirming(true)}>Delete</button>
                    )}
                    {confirming ? (
                        <div className="task-dialog-confirm" role="group" aria-label="Confirm delete">
                            <span>Delete this task? This can’t be undone.</span>
                            <button type="button" className="btn btn-quiet" onClick={() => setConfirming(false)}>Keep</button>
                            <button type="button" className="btn btn-danger" disabled={saving} onClick={handleDelete}>Delete</button>
                        </div>
                    ) : (
                        <div className="task-dialog-save">
                            <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving} aria-busy={saving}>
                                {saving ? 'Saving…' : task ? 'Save' : 'Add task'}
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </dialog>
    )
}

export default TaskDialog
