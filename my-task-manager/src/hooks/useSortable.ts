import { KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, type Announcements, type UniqueIdentifier } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

export function useSortSensors() {
    return useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )
}

export function sortAnnouncements(nameOf: (id: UniqueIdentifier) => string): Announcements {
    return {
        onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
        onDragOver: ({ active, over }) => over ? `${nameOf(active.id)} is next to ${nameOf(over.id)}.` : undefined,
        onDragEnd: ({ active, over }) => over ? `Dropped ${nameOf(active.id)} next to ${nameOf(over.id)}.` : `Dropped ${nameOf(active.id)}.`,
        onDragCancel: ({ active }) => `Stopped moving ${nameOf(active.id)}. It's back where it was.`,
    }
}
