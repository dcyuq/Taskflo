import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useMatch } from 'react-router-dom'
import TopNav from '../components/TopNav'
import JumpDialog from '../components/JumpDialog'
import Sidebar from '../components/Sidebar'
import InviteBanner from '../components/InviteBanner'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { inOrder, useSidebarTree } from '../hooks/useSidebarTree'
import type { WorkspaceSummary } from '../services/workspace'
import { listOpenTasks, type Task } from '../services/tasks'
import { supabase } from '../supabaseClient'
import { useRealtime } from '../hooks/useRealtime'
import './Dashboard.css'

export interface DashboardContext {
    workspaces: WorkspaceSummary[]
    openTasks: Task[]
    me: string
    reloadOpen: () => void
    liveKey: number
}

function Dashboard() {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const tree = useSidebarTree()
    const { list, load } = tree
    const [openTasks, setOpenTasks] = useState<Task[]>([])
    const [me, setMe] = useState('')
    const [searching, setSearching] = useState(false)
    const desktop = useMediaQuery('(min-width: 1024px)')
    const { pathname, state } = useLocation()
    const [liveKey, setLiveKey] = useState(0)
    const [notice, setNotice] = useState('')
    const [seenState, setSeenState] = useState<unknown>(null)
    if (state !== seenState) {
        setSeenState(state)
        if (state?.notice) setNotice(state.notice)
    }
    const match = useMatch('/dashboard/workspace/:id/*')

    const reloadOpen = useCallback(() => {
        listOpenTasks().then(({ data }) => data && setOpenTasks(data))
    }, [])

    useEffect(load, [load, pathname])
    useEffect(reloadOpen, [reloadOpen, pathname])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                if (!document.querySelector('dialog[open]:not(.jump)')) setSearching(s => !s)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setMe(session?.user.id ?? ''))
    }, [])

    useRealtime(me ? `user:${me}` : null, () => {
        load()
        reloadOpen()
        setLiveKey(k => k + 1)
    })

    const workspaces = list.status === 'ready' ? inOrder(list.workspaces, list.categories) : []
    const current = workspaces.find(w => w.id === match?.params.id)
    const context: DashboardContext = { workspaces, openTasks, me, reloadOpen, liveKey }

    return (
        <div className={`app${desktop ? ' is-desktop' : ''}`}>
            <a className="skip-link" href="#app-main">Skip to content</a>
            {!desktop && <TopNav title={current?.name} menuOpen={drawerOpen} onMenu={() => setDrawerOpen(o => !o)} onSearch={() => setSearching(true)} />}
            <div className="app-body">
                <Sidebar
                    desktop={desktop}
                    open={drawerOpen}
                    tree={tree}
                    current={current}
                    openTasks={openTasks}
                    me={me}
                    onSearch={() => { setDrawerOpen(false); setSearching(true) }}
                    onClose={() => setDrawerOpen(false)}
                />
                <main className="app-main dot-grid" id="app-main" tabIndex={-1}>
                    {workspaces.length > 0 && <InviteBanner liveKey={liveKey} />}
                    <Outlet context={context} />
                </main>
            </div>
            <div className="undo-region app-notice" role="status">
                {notice && (
                    <div className="undo-note">
                        <span className="undo-text">{notice}</span>
                        <button type="button" className="undo-btn" onClick={() => setNotice('')}>Dismiss</button>
                    </div>
                )}
            </div>
            {searching && <JumpDialog workspaces={workspaces} tasks={openTasks} onClose={() => setSearching(false)} />}
        </div>
    )
}

export default Dashboard
