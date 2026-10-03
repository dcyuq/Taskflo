import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useMatch } from 'react-router-dom'
import TopNav from '../components/TopNav'
import Sidebar, { type ListState } from '../components/Sidebar'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { getWorkspaces } from '../services/workspace'
import { listOpenTasks, type Task } from '../services/tasks'
import { supabase } from '../supabaseClient'
import './Dashboard.css'

export interface DashboardContext {
    workspaces: { id: string, name: string }[]
    openTasks: Task[]
    me: string
    reloadOpen: () => void
}

function Dashboard() {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [list, setList] = useState<ListState>({ status: 'loading' })
    const [openTasks, setOpenTasks] = useState<Task[]>([])
    const [me, setMe] = useState('')
    const desktop = useMediaQuery('(min-width: 1024px)')
    const { pathname } = useLocation()
    const match = useMatch('/dashboard/workspace/:id/*')

    const load = useCallback(() => {
        getWorkspaces().then(({ data, error }) => {
            setList(error || !data ? { status: 'error' } : { status: 'ready', workspaces: data })
        })
    }, [])

    const reloadOpen = useCallback(() => {
        listOpenTasks().then(({ data }) => data && setOpenTasks(data))
    }, [])

    useEffect(load, [load, pathname])
    useEffect(reloadOpen, [reloadOpen, pathname])

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setMe(session?.user.id ?? ''))
    }, [])

    const workspaces = list.status === 'ready' ? list.workspaces : []
    const current = workspaces.find(w => w.id === match?.params.id)?.name
    const context: DashboardContext = { workspaces, openTasks, me, reloadOpen }

    return (
        <div className={`app${desktop ? ' is-desktop' : ''}`}>
            <a className="skip-link" href="#app-main">Skip to content</a>
            {!desktop && <TopNav title={current} menuOpen={drawerOpen} onMenu={() => setDrawerOpen(o => !o)} />}
            <div className="app-body">
                <Sidebar
                    desktop={desktop}
                    open={drawerOpen}
                    list={list}
                    openTasks={openTasks}
                    onRetry={() => { setList({ status: 'loading' }); load() }}
                    onCreated={load}
                    onClose={() => setDrawerOpen(false)}
                />
                <main className="app-main dot-grid" id="app-main" tabIndex={-1}>
                    <Outlet context={context} />
                </main>
            </div>
        </div>
    )
}

export default Dashboard
