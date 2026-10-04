import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useMatch, useSearchParams } from 'react-router-dom'
import TopNav from '../components/TopNav'
import JumpDialog from '../components/JumpDialog'
import Sidebar, { type ListState } from '../components/Sidebar'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { orderedBoards, useBoards, type BoardsApi } from '../hooks/useBoards'
import type { Board } from '../services/boards'
import { getWorkspaces, orderWorkspaces, type WorkspaceSummary } from '../services/workspace'
import { listOpenTasks, type Task } from '../services/tasks'
import { supabase } from '../supabaseClient'
import './Dashboard.css'

export interface DashboardContext {
    workspaces: WorkspaceSummary[]
    openTasks: Task[]
    me: string
    reloadOpen: () => void
    boards: BoardsApi
    board: Board | null
}

function Dashboard() {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [list, setList] = useState<ListState>({ status: 'loading' })
    const [openTasks, setOpenTasks] = useState<Task[]>([])
    const [me, setMe] = useState('')
    const [searching, setSearching] = useState(false)
    const desktop = useMediaQuery('(min-width: 1024px)')
    const { pathname } = useLocation()
    const match = useMatch('/dashboard/workspace/:id/*')
    const [params] = useSearchParams()
    const boards = useBoards(match?.params.id)
    const inOrder = boards.tree ? orderedBoards(boards.tree) : []
    const board = inOrder.find(b => b.id === params.get('board')) ?? inOrder[0] ?? null

    const load = useCallback(() => {
        getWorkspaces().then(({ data, error }) => {
            setList(error || !data ? { status: 'error' } : { status: 'ready', workspaces: data })
        })
    }, [])

    async function reorder(next: WorkspaceSummary[]) {
        const before = list
        setList({ status: 'ready', workspaces: next })
        const { error } = await orderWorkspaces(next.map(w => w.id))
        if (error) setList(before)
        return !error
    }

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

    const workspaces = list.status === 'ready' ? list.workspaces : []
    const current = workspaces.find(w => w.id === match?.params.id)
    const context: DashboardContext = { workspaces, openTasks, me, reloadOpen, boards, board }

    return (
        <div className={`app${desktop ? ' is-desktop' : ''}`}>
            <a className="skip-link" href="#app-main">Skip to content</a>
            {!desktop && <TopNav title={current?.name} menuOpen={drawerOpen} onMenu={() => setDrawerOpen(o => !o)} onSearch={() => setSearching(true)} />}
            <div className="app-body">
                <Sidebar
                    desktop={desktop}
                    open={drawerOpen}
                    list={list}
                    current={current}
                    boards={boards}
                    selectedBoard={board?.id}
                    openTasks={openTasks}
                    me={me}
                    onSearch={() => { setDrawerOpen(false); setSearching(true) }}
                    onRetry={() => { setList({ status: 'loading' }); load() }}
                    onReorder={reorder}
                    onChanged={load}
                    onClose={() => setDrawerOpen(false)}
                />
                <main className="app-main dot-grid" id="app-main" tabIndex={-1}>
                    <Outlet context={context} />
                </main>
            </div>
            {searching && <JumpDialog workspaces={workspaces} tasks={openTasks} onClose={() => setSearching(false)} />}
        </div>
    )
}

export default Dashboard
