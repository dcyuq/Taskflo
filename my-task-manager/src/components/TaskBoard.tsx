import { useState } from 'react'
import Assignee from './Assignee'
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    type Announcements,
    type DragEndEvent,
    type KeyboardCoordinateGetter,
} from '@dnd-kit/core'
import { motion, useReducedMotion } from 'motion/react'
import DueChip from './DueChip'
import GripIcon from './GripIcon'
import { statuses, type Task, type TaskPatch, type TaskStatus } from '../services/tasks'
import { ease, rise } from '../utils/motion'
import { groupOf } from '../utils/summary'
import './TaskBoard.css'

interface TaskBoardProps {
    tasks: Task[]
    nameOf: (id: string | null) => string | undefined
    onEdit: (task: Task) => void
    onAdd: (status: TaskStatus) => void
    onPatch: (task: Task, change: TaskPatch) => void
}

const order = statuses.map(s => s.id)
const labelOf = (id: unknown) => statuses.find(s => s.id === id)?.label ?? 'a column'

const columnKeys: KeyboardCoordinateGetter = (event, { context, currentCoordinates }) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.code]
    if (!step) return undefined
    event.preventDefault()
    const from = (context.over?.id ?? context.active?.data.current?.status) as TaskStatus
    const target = order[order.indexOf(from) + step]
    const rect = target && context.droppableRects.get(target)
    if (!rect) return currentCoordinates
    const width = context.collisionRect?.width ?? 0
    return { x: rect.left + (rect.width - width) / 2, y: rect.top + 56 }
}

function CardBody({ task, who, onEdit }: { task: Task, who?: string, onEdit?: () => void }) {
    return (
        <>
            <button type="button" className="board-card-title" onClick={onEdit} tabIndex={onEdit ? 0 : -1}>{task.title}</button>
            <div className="board-card-meta">
                <DueChip task={task} />
                <Assignee name={who} />
            </div>
        </>
    )
}

function BoardCard({ task, who, onEdit }: { task: Task, who?: string, onEdit: () => void }) {
    const reduce = useReducedMotion()
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: task.id, data: { status: task.status } })
    const { onKeyDown, ...pointer } = listeners ?? {}

    return (
        <motion.article
            ref={setNodeRef}
            layout={!reduce}
            className={`board-card${isDragging ? ' is-placeholder' : ''}${task.status === 'done' ? ' is-done' : ''}`}
            {...pointer}
        >
            <CardBody task={task} who={who} onEdit={onEdit} />
            <button
                type="button"
                ref={setActivatorNodeRef}
                className="board-card-grip"
                {...attributes}
                aria-label={`Move ${task.title}`}
                onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLButtonElement> | undefined}
            >
                <GripIcon />
            </button>
        </motion.article>
    )
}

function Column({ status, label, children, count, dragging, onAdd }: { status: TaskStatus, label: string, children: React.ReactNode, count: number, dragging: boolean, onAdd: () => void }) {
    const { setNodeRef, isOver } = useDroppable({ id: status })
    return (
        <motion.section ref={setNodeRef} className={`board-col${isOver ? ' is-over' : ''}`} aria-labelledby={`col-${status}`} variants={rise}>
            <header className="board-col-head">
                <h2 id={`col-${status}`}>
                    {label}
                    <span className="task-group-count">{count}</span>
                </h2>
            </header>
            <div className="board-col-body">
                {children}
                {count === 0 && <p className={`board-col-empty${dragging ? ' is-target' : ''}`}>{dragging ? 'Drop here' : 'No tasks'}</p>}
                <button type="button" className="board-col-add" onClick={onAdd}>
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                        <path d="M8 3v10M3 8h10" />
                    </svg>
                    Add task<span className="sr-only"> to {label}</span>
                </button>
            </div>
        </motion.section>
    )
}

function TaskBoard({ tasks, nameOf, onEdit, onAdd, onPatch }: TaskBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null)
    const reduce = useReducedMotion()
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: columnKeys }),
    )
    const titleOf = (id: unknown) => tasks.find(t => t.id === id)?.title ?? 'Task'
    const active = tasks.find(t => t.id === activeId)

    const announcements: Announcements = {
        onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}. Use the arrow keys to choose a column, then press Space to drop it.`,
        onDragOver: ({ active, over }) => over ? `${titleOf(active.id)} is over ${labelOf(over.id)}.` : `${titleOf(active.id)} is not over a column.`,
        onDragEnd: ({ active, over }) => over ? `${titleOf(active.id)} moved to ${labelOf(over.id)}.` : `${titleOf(active.id)} was put back.`,
        onDragCancel: ({ active }) => `Moving ${titleOf(active.id)} was cancelled.`,
    }

    function handleEnd({ active, over }: DragEndEvent) {
        setActiveId(null)
        const task = tasks.find(t => t.id === active.id)
        if (task && over && over.id !== task.status) onPatch(task, { status: over.id as TaskStatus })
    }

    return (
        <DndContext
            sensors={sensors}
            accessibility={{
                announcements,
                screenReaderInstructions: { draggable: 'To move a task, press Space or Enter on its move button, use the arrow keys to choose a column, then press Space or Enter to drop it. Press Escape to cancel.' },
            }}
            onDragStart={({ active }) => setActiveId(String(active.id))}
            onDragEnd={handleEnd}
            onDragCancel={() => setActiveId(null)}
        >
            <div className="board">
                {statuses.map(status => {
                    const column = groupOf(tasks, status.id)
                    return (
                        <Column key={status.id} status={status.id} label={status.label} count={column.length} dragging={!!activeId} onAdd={() => onAdd(status.id)}>
                            {column.map(task => (
                                <BoardCard key={task.id} task={task} who={nameOf(task.assignee_id)} onEdit={() => onEdit(task)} />
                            ))}
                        </Column>
                    )
                })}
            </div>
            <DragOverlay dropAnimation={reduce ? null : { duration: 260, easing: `cubic-bezier(${ease.join(', ')})` }}>
                {active && (
                    <div className="board-card is-overlay">
                        <CardBody task={active} who={nameOf(active.assignee_id)} />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    )
}

export default TaskBoard
