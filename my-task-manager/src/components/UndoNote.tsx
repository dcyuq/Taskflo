import type { Task } from '../services/tasks'

function UndoNote({ task, onUndo }: { task: Task | null, onUndo: () => void }) {
    return (
        <div className="undo-region" role="status">
            {task && (
                <div className="undo-note">
                    <span className="undo-text">Marked “{task.title}” as done.</span>
                    <button type="button" className="undo-btn" onClick={onUndo}>Undo</button>
                </div>
            )}
        </div>
    )
}

export default UndoNote
