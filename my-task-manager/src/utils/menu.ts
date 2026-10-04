export interface MenuItem {
    label: string
    danger?: boolean
    onSelect: () => void
}

export interface MenuAt {
    x: number
    y: number
    label: string
    items: MenuItem[]
}

export function menuFor(e: React.MouseEvent, label: string, items: MenuItem[]): MenuAt {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    return e.type === 'contextmenu'
        ? { x: e.clientX, y: e.clientY, label, items }
        : { x: rect.left, y: rect.bottom + 4, label, items }
}
