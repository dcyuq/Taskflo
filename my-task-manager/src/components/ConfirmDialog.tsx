import { useEffect, useRef, useState } from 'react'
import './TaskDialog.css'

interface ConfirmDialogProps {
    title: string
    message: string
    confirmLabel: string
    requireText?: string
    onConfirm: () => Promise<string | null>
    onClose: () => void
}

function ConfirmDialog({ title, message, confirmLabel, requireText, onConfirm, onClose }: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [typed, setTyped] = useState('')
    const matches = !requireText || typed.trim() === requireText.trim()

    useEffect(() => {
        dialogRef.current?.showModal()
    }, [])

    async function handleConfirm(e: React.SyntheticEvent) {
        e.preventDefault()
        if (!matches || busy) return
        setBusy(true)
        const failed = await onConfirm()
        setBusy(false)
        if (failed) setError(failed)
        else onClose()
    }

    return (
        <dialog
            ref={dialogRef}
            className="task-dialog confirm-dialog"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            onClose={onClose}
            onClick={e => e.target === dialogRef.current && onClose()}
        >
            <form onSubmit={handleConfirm} noValidate>
                <h2 id="confirm-title" className="confirm-title">{title}</h2>
                <p id="confirm-message" className="confirm-message">{message}</p>
                {requireText && (
                    <div className="task-field">
                        <label htmlFor="confirm-text">Type <strong>{requireText}</strong> to confirm</label>
                        <input id="confirm-text" type="text" autoComplete="off" spellCheck={false} value={typed} onChange={e => setTyped(e.target.value)} autoFocus />
                    </div>
                )}
                {error && <p className="field-error" role="alert">{error}</p>}
                <div className="task-dialog-actions">
                    <div className="task-dialog-save">
                        <button type="button" className="btn btn-quiet" onClick={onClose} autoFocus={!requireText}>Cancel</button>
                        <button type="submit" className="btn btn-danger" disabled={busy || !matches} aria-busy={busy}>
                            {busy ? 'Working…' : confirmLabel}
                        </button>
                    </div>
                </div>
            </form>
        </dialog>
    )
}

export default ConfirmDialog