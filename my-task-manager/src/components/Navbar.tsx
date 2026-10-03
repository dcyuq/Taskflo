import './Navbar.css'
import { useNavigate } from 'react-router-dom'

function Navbar() {
    const navigate = useNavigate()

    return(
        <nav className="navbar">
            <h1>Taskflo</h1>
            <button className="navbar-button" onClick={() => navigate('/login')}>Sign in</button>
        </nav>
    )
}

export default Navbar