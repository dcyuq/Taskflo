import Avatar from './Avatar'

function Assignee({ name, size = 26 }: { name?: string, size?: number }) {
    if (!name) return <span className="assignee is-none">Unassigned</span>
    return (
        <span className="assignee" title={name}>
            <Avatar name={name} size={size} />
            <span className="sr-only">Assigned to </span>
            <span className="assignee-name">{name.split(' ')[0]}</span>
        </span>
    )
}

export default Assignee
