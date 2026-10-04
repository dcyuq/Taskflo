import { useEffect, useRef } from 'react'
import type { MenuAt } from '../utils/menu'

function ActionMenu({ at, onClose }: { at: MenuAt, onClose: () => void }) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const opener = document.activeElement as HTMLElement | null
        ref.current?.showPopover()
        ref.current?.querySelector('button')?.focus()
        return () => opener?.focus()
    }, [])

    function onKeyDown(e: React.KeyboardEvent) {
        const step = { ArrowDown: 1, ArrowUp: -1 }[e.key]
        if (!step) return
        e.preventDefault()
        const buttons = [...(ref.current?.querySelectorAll('button') ?? [])]
        const i = buttons.indexOf(document.activeElement as HTMLButtonElement)
        buttons[(i + step + buttons.length) % buttons.length]?.focus()
    }

    return (
        <div
            ref={ref}
            popover="auto"
            role="menu"
            aria-label={at.label}
            className="profile-menu action-menu"
            style={{ top: Math.min(at.y, window.innerHeight - 56 * at.items.length - 24), left: Math.min(at.x, window.innerWidth - 216) }}
            onToggle={e => e.newState === 'closed' && onClose()}
            onKeyDown={onKeyDown}
        >
            {at.items.map(item => (
                <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    className={`profile-menu-item${item.danger ? ' is-danger' : ''}`}
                    onClick={() => {
                        onClose()
                        item.onSelect()
                    }}
                >
                    {item.label}
                </button>
            ))}
        </div>
    )
}

export default ActionMenu