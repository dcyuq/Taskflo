import { Fragment, useEffect, useEffectEvent, useLayoutEffect, useRef } from 'react'
import type { MenuAt } from '../utils/menu'

function ActionMenu({ at, onClose }: { at: MenuAt, onClose: () => void }) {
    const ref = useRef<HTMLDivElement>(null)
    const close = useEffectEvent(onClose)

    useLayoutEffect(() => {
        const menu = ref.current
        if (!menu) return
        const opener = document.activeElement as HTMLElement | null
        if (!menu.matches(':popover-open')) menu.showPopover()
        const { width, height } = menu.getBoundingClientRect()
        menu.style.left = `${Math.max(8, at.x + width > innerWidth - 8 ? at.x - width : at.x)}px`
        menu.style.top = `${Math.max(8, at.y + height > innerHeight - 8 ? at.above - height : at.y)}px`
        menu.querySelector('button')?.focus()
        return () => opener?.focus()
    }, [at])

    useEffect(() => {
        const onScroll = (e: Event) => !ref.current?.contains(e.target as Node) && close()
        window.addEventListener('scroll', onScroll, true)
        window.addEventListener('resize', close)
        return () => {
            window.removeEventListener('scroll', onScroll, true)
            window.removeEventListener('resize', close)
        }
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
            onToggle={e => e.newState === 'closed' && onClose()}
            onKeyDown={onKeyDown}
        >
            {at.items.map(item => (
                <Fragment key={item.label}>
                    {item.separated && <div role="separator" className="action-menu-separator" />}
                    <button
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
                </Fragment>
            ))}
        </div>
    )
}

export default ActionMenu
