import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useOutletContext, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { supabase } from '../supabaseClient'
import { getWorkspace } from '../services/workspace'
import { listMembers, type Member } from '../services/members'
import { listTasks, type Task } from '../services/tasks'
import { LAST_WORKSPACE_KEY, type WorkspaceContext } from '../hooks/useWorkspace'
import { rise } from '../utils/motion'
import type { DashboardContext } from './Dashboard'
import { store } from '../utils/storage'
import NotFound from './NotFound'

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
import './Workspace.css'

type Status = 'loading' | 'error' | 'missing' | 'ready'

type Loaded =
    | { status: 'error' | 'missing' }
    | { status: 'ready', workspace: WorkspaceContext['workspace'], members: Member[], tasks: Task[], me: string }

async function fetchWorkspace(id: string): Promise<Loaded> {
    const { data: { session } } = await supabase.auth.getSession()
    const [ws, mem, list] = await Promise.all([getWorkspace(id), listMembers(id), listTasks(id)])
    if (ws.error || mem.error || list.error) return { status: 'error' }
    const me = session?.user.id ?? ''
    if (!ws.data || !mem.data?.some(m => m.id === me)) return { status: 'missing' }
    return { status: 'ready', workspace: ws.data, members: mem.data, tasks: list.data ?? [], me }
}

function WorkspaceLayout({ id }: { id: string }) {
    const reduce = useReducedMotion()
    const { workspaces } = useOutletContext<DashboardContext>()
    const [status, setStatus] = useState<Status>('loading')
    const [workspace, setWorkspace] = useState<WorkspaceContext['workspace'] | null>(null)
    const [members, setMembers] = useState<Member[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [me, setMe] = useState('')

    const apply = useCallback((result: Loaded, quiet = false) => {
        if (result.status !== 'ready') {
            if (!quiet || result.status === 'missing') setStatus(result.status)
            return
        }
        setWorkspace(result.workspace)
        setMembers(result.members)
        setTasks(result.tasks)
        setMe(result.me)
        setStatus('ready')
        store(LAST_WORKSPACE_KEY, id)
    }, [id])

    const load = useCallback((quiet = false) => fetchWorkspace(id).then(result => apply(result, quiet)), [id, apply])

    useEffect(() => {
        fetchWorkspace(id).then(result => apply(result))
    }, [id, apply])

    useEffect(() => {
        const onVisible = () => document.visibilityState === 'visible' && load(true)
        document.addEventListener('visibilitychange', onVisible)
        return () => document.removeEventListener('visibilitychange', onVisible)
    }, [load])

    if (status === 'loading') {
        return (
            <div className="ws" role="status">
                <span className="sr-only">Loading workspace</span>
                <span className="skeleton ws-skeleton-title" />
                <span className="skeleton ws-skeleton-tabs" />
                {[0, 1, 2, 3, 4].map(i => <span key={i} className="skeleton ws-skeleton-row" />)}
            </div>
        )
    }

    if (status === 'error') {
        return (
            <div className="ws ws-state" role="alert">
                <h1 className="ws-state-title">Couldn't load this workspace</h1>
                <p className="ws-state-text">Check your connection and try again.</p>
                <button type="button" className="btn btn-primary" onClick={() => { setStatus('loading'); load() }}>Try again</button>
            </div>
        )
    }

    if (status === 'missing' || !workspace) return <NotFound />


    const context: WorkspaceContext = {
        workspace,
        members,
        tasks,
        setTasks,
        me,
        isOwner: workspace.owner_id === me,
        reload: () => load(true),
    }

    return (
        <div className="ws">
            <motion.header className="ws-head" initial={reduce ? false : 'hidden'} animate="show" variants={rise}>
                <h1 className="ws-title">{workspaces.find(w => w.id === id)?.name ?? workspace.name}</h1>
                <nav className="ws-tabs" aria-label="Workspace">
                    <NavLink to="" end className="ws-tab">Tasks</NavLink>
                    <NavLink to="overview" className="ws-tab">Overview</NavLink>
                    <NavLink to="team" className="ws-tab">Team</NavLink>
                </nav>
            </motion.header>
            <Outlet context={context} />
        </div>
    )
}

function WorkspaceRoute() {
    const { id = '' } = useParams()
    if (!isUuid(id)) return <NotFound />
    return <WorkspaceLayout key={id} id={id} />
}

export default WorkspaceRoute
