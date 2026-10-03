import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Features from '../components/Features'
import Footer from '../components/Footer'
import './LandingPage.css'


function LandingPage() {
    const navigate = useNavigate()

    return (
        <div>
            <Navbar />
            <div className='Hero'>
                <h1>Manage your team with clarity</h1>
                <p>Assign tasks, track progress, and keep everyone on track.</p>
                 <button className="Hero-button" onClick={() => navigate('/register')}>Get started</button>
            </div>
            <Features />
            <Footer />
        </div>
    )
}

export default LandingPage