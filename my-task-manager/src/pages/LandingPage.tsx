import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Features from '../components/Features'
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
            <section className="features">
                <h2>How it works</h2>
                <ol className="features-grid steps">
                    <li className="feature-card">
                        <span className="step-num">1</span>
                        <h3>Create a workspace</h3>
                        <p>Name it after your team. One workspace holds one team and its work.</p>
                    </li>
                    <li className="feature-card">
                        <span className="step-num">2</span>
                        <h3>Invite your team</h3>
                        <p>Add teammates by email. They see the invite when they sign in with that address.</p>
                    </li>
                    <li className="feature-card">
                        <span className="step-num">3</span>
                        <h3>Assign tasks</h3>
                        <p>Give each task an owner and a due date, so everyone knows what's theirs.</p>
                    </li>
                </ol>
            </section>
            <section className="features">
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
            <Footer />
        </div>
    )
}

export default LandingPage
