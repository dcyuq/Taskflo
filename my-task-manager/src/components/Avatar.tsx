function Avatar({ name, size = 28 }: { name?: string, size?: number }) {
    const initials = name
        ? name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('')
        : ''
    return (
        <span className={`avatar${name ? '' : ' is-empty'}`} style={{ width: size, height: size }} aria-hidden="true">
            {initials}
        </span>
    )
}

export default Avatar
