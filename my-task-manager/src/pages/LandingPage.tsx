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
                <h1>Manage Your Team With Clarity</h1>
                <p> Assign Tasks, Track Your Progress, Keep Everyone On Track</p>
                 <button className="Hero-button" onClick={() => navigate('/register')}> Get Started </button>
            </div>
            <Features />
            <Footer />
        </div>
    )
}

export default LandingPage