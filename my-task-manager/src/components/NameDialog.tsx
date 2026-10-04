import { useEffect, useRef, useState } from 'react'
import './TaskDialog.css'

interface NameDialogProps {
    title: string
    label: string
    initial?: string
    submitLabel: string
    maxLength: number
    onSubmit: (name: string) => Promise<string | null>
    onClose: () => void
}

function NameDialog({ title, label, initial = '', submitLabel, maxLength, onSubmit, onClose }: NameDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [name, setName] = useState(initial)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        dialogRef.current?.showModal()
    }, [])

    async function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault()
        const trimmed = name.trim()
        if (!trimmed) {
            setError('Give it a name.')
            return
        }
        if (busy) return
        setBusy(true)
        setError('')
        const failed = trimmed === initial.trim() ? null : await onSubmit(trimmed)
        setBusy(false)
        if (failed) setError(failed)
        else onClose()
    }

    return (
        <dialog
            ref={dialogRef}
            className="task-dialog confirm-dialog"
            aria-labelledby="name-dialog-title"
            onClose={onClose}
            onClick={e => e.target === dialogRef.current && onClose()}
        >
            <form onSubmit={handleSubmit} noValidate>
                <h2 id="name-dialog-title" className="confirm-title">{title}</h2>
                <div className="task-field">
                    <label htmlFor="name-dialog-input">{label}</label>
                    <input
                        id="name-dialog-input"
                        type="text"
                        autoComplete="off"
                        maxLength={maxLength}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onFocus={e => e.target.select()}
                        aria-invalid={!!error}
                        aria-describedby={error ? 'name-dialog-error' : undefined}
                        autoFocus
                    />
                    {error && <p className="field-error" id="name-dialog-error" role="alert">{error}</p>}
                </div>
                <div className="task-dialog-actions">
                    <div className="task-dialog-save">
                        <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={busy} aria-busy={busy}>{busy ? 'Saving…' : submitLabel}</button>
                    </div>
                </div>
            </form>
        </dialog>
    )
}

export default NameDialog