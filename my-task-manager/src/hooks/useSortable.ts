import { MouseSensor, TouchSensor, useSensor, useSensors, type Announcements, type UniqueIdentifier } from '@dnd-kit/core'

export function useSortSensors() {
    return useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
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
