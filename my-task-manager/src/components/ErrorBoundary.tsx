import { Component, type ReactNode } from 'react'
import { friendlyError } from '../utils/errors'
import '../pages/Dashboard.css'
import '../pages/NotFound.css'

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false }

    static getDerivedStateFromError() {
        return { failed: true }
    }

    componentDidCatch(error: unknown) {
        friendlyError(error)
    }

    render() {
        if (!this.state.failed) return this.props.children
        return (
            <main className="notfound dot-grid">
                <div className="notfound-body" role="alert">
                    <h1 className="notfound-title">Something went wrong</h1>
                    <p className="notfound-text">Reload the page to try again. If it keeps happening, head back to the start.</p>
                    <div className="notfound-actions">
                        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reload page</button>
                        <a className="btn btn-outline" href="/">Back to home</a>
                    </div>
                </div>
            </main>
        )
    }
}

export default ErrorBoundary
