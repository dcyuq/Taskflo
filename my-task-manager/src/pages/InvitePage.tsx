import { Navigate, useParams } from 'react-router-dom'

function InvitePage() {
    const { token = '' } = useParams()
    return <Navigate to={`/dashboard/invites?code=${encodeURIComponent(token)}`} replace />
}

export default InvitePage
