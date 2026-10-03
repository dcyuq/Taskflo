import './Navbar.css'
import './TopNav.css'
import { Link } from 'react-router-dom'

function Navbar() {
    return(
        <nav className="navbar">
            <Link to="/" className="topnav-brand navbar-brand">
                <span className="topnav-mark">T</span>
                Taskflo
            </Link>
            <Link to="/login" className="navbar-button">Sign in</Link>
        </nav>
    )
}

export default Navbar
