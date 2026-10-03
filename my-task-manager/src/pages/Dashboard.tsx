import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useMatch } from 'react-router-dom'
import TopNav from '../components/TopNav'
import Sidebar, { type ListState } from '../components/Sidebar'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { getWorkspaces } from '../services/workspace'
import './Dashboard.css'

function Dashboard() {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [list, setList] = useState<ListState>({ status: 'loading' })
    const desktop = useMediaQuery('(min-width: 1024px)')
    const { pathname } = useLocation()
    const match = useMatch('/dashboard/workspace/:id/*')

    const load = useCallback(() => {
        getWorkspaces().then(({ data, error }) => {
            setList(error || !data ? { status: 'error' } : { status: 'ready', workspaces: data })
        })
    }, [])

    useEffect(load, [load, pathname])

    const current = list.status === 'ready' ? list.workspaces.find(w => w.id === match?.params.id)?.name : undefined

    return (
        <div className={`app${desktop ? ' is-desktop' : ''}`}>
            <a className="skip-link" href="#app-main">Skip to content</a>
            {!desktop && <TopNav title={current} menuOpen={drawerOpen} onMenu={() => setDrawerOpen(o => !o)} />}
            <div className="app-body">
                <Sidebar
                    desktop={desktop}
                    open={drawerOpen}
                    list={list}
                    onRetry={() => { setList({ status: 'loading' }); load() }}
                    onCreated={load}
                    onClose={() => setDrawerOpen(false)}
                />
                <main className="app-main dot-grid" id="app-main" tabIndex={-1}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Dashboard
