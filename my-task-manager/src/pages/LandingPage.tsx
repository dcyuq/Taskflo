import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Features from '../components/Features'
import Footer from '../components/Footer'
import './LandingPage.css'


function LandingPage() {
    return (
        <div>
            <Navbar />
            <main className='Hero'>
                <h1>Manage your team with clarity</h1>
                <p>Assign tasks, track progress, and keep everyone on track.</p>
                <Link className="Hero-button" to="/register">Get started</Link>
            </main>
            <Features />
            <Footer />
        </div>
    )
}

export default LandingPage
