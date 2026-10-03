import { useEffect, useRef, useState } from 'react'
import './TaskDialog.css'

interface ConfirmDialogProps {
    title: string
    message: string
    confirmLabel: string
    onConfirm: () => Promise<string | null>
    onClose: () => void
}

function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        dialogRef.current?.showModal()
    }, [])

    async function handleConfirm() {
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
            <h2 id="confirm-title" className="confirm-title">{title}</h2>
            <p id="confirm-message" className="confirm-message">{message}</p>
            {error && <p className="field-error" role="alert">{error}</p>}
            <div className="task-dialog-actions">
                <div className="task-dialog-save">
                    <button type="button" className="btn btn-quiet" onClick={onClose} autoFocus>Cancel</button>
                    <button type="button" className="btn btn-danger" disabled={busy} aria-busy={busy} onClick={handleConfirm}>
                        {busy ? 'Working…' : confirmLabel}
                    </button>
                </div>
            </div>
        </dialog>
    )
}

export default ConfirmDialog
