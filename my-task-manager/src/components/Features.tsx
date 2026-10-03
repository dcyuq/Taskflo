import './Features.css'

function Features() {
    return(
        <section className="features" id="features">
            <h2>Everything your team needs</h2>
            <div className='features-grid'>
                <div className='feature-card'>
                    <h3>Task assignment</h3>
                    <p>Give each task an owner, a deadline and a priority.</p>
                </div>

                <div className='feature-card'>
                    <h3>Progress tracking</h3>
                    <p>See the status of every task across your team.</p>
                </div>

                <div className='feature-card'>
                    <h3>AI assistant <span className="feature-soon">Coming soon</span></h3>
                    <p>Suggested priorities and assignments based on each person's workload.</p>
                </div>
            </div>
        </section>
    )
}

export default Features
