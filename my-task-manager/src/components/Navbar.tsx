import './Navbar.css'
import './TopNav.css'
import { Link } from 'react-router-dom'

function Navbar() {
    return(
        <nav className="navbar">
            <Link to="/" className="topnav-brand" aria-label="Taskflo">
                <span className="brand-wordmark" aria-hidden="true"></span>
            </Link>
            <Link to="/login" className="navbar-button">Sign in</Link>
        </nav>
    )
}

export default Navbar
