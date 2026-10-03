import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import Footer from '../components/Footer'
import './LandingPage.css'


function LandingPage() {
    return (
        <div>
            <Navbar />
            <main className="Hero">
                <span className="Hero-mark" aria-hidden="true"></span>
                <h1>Manage your team with clarity</h1>
                <p>Assign tasks, track progress, and keep everyone on track.</p>
                <Link className="Hero-button" to="/register">Get started</Link>
            </main>
            <Features />
            <HowItWorks />
            <section className="features" id="faq">
                <h2>FAQ</h2>
                <div className="faq">
                    <details>
                        <summary>Who is Taskflo for?</summary>
                        <p>Leads of small teams, roughly 3 to 20 people, who want one simple place to bring their team together.</p>
                    </details>
                    <details>
                        <summary>How do teammates join?</summary>
                        <p>Add their email when you set up your workspace. When they sign in to Taskflo with that address, the invite is waiting for them to accept.</p>
                    </details>
                    <details>
                        <summary>Do invites expire?</summary>
                        <p>Yes. An invite lasts 7 days and can only be used once.</p>
                    </details>
                    <details>
                        <summary>Who can see my workspace?</summary>
                        <p>Only its members. Someone you've invited can see the workspace name until they accept or decline.</p>
                    </details>
                    <details>
                        <summary>Can I have more than one workspace?</summary>
                        <p>Yes. Create one per team and switch between them from the sidebar.</p>
                    </details>
                </div>
            </section>
            <section className="Cta" id="get-started" aria-labelledby="cta-title">
                <h2 id="cta-title">Get your team going in minutes</h2>
                <p>Create a workspace, invite your team by email and hand out the first task.</p>
                <Link className="Hero-button" to="/register">Get started</Link>
            </section>
            <Footer />
        </div>
    )
}

export default LandingPage
