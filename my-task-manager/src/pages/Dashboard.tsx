import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TopNav from '../components/TopNav'
import Sidebar from '../components/Sidebar'
import { useMediaQuery } from '../hooks/useMediaQuery'
import './Dashboard.css'

function Dashboard() {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const desktop = useMediaQuery('(min-width: 1024px)')

    return (
        <div className="app">
            <a className="skip-link" href="#app-main">Skip to content</a>
            <TopNav showMenu={!desktop} menuOpen={drawerOpen} onMenu={() => setDrawerOpen(o => !o)} />
            <div className="app-body">
                <Sidebar desktop={desktop} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
                <main className="app-main dot-grid" id="app-main" tabIndex={-1}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Dashboard
