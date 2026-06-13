import './Features.css'

function Features() {
    return(
        <div className="features">
            <h2>Everything Your Team needs</h2>
            <div className='features-grid'>
                <div className='feature-card'>
                    <h3> Task Assignment</h3>
                    <p>Assign tasks to specific employees with deadlines and priorities.</p>
                </div>

                <div className='feature-card'>
                    <h3>Progress Tracking</h3>
                    <p>See real-time status of every task across your team.</p>
                </div>

                <div className='feature-card'>
                    <h3>AI Assistant</h3>
                    <p>Let AI suggest priorities and auto-assign based on workload</p>
                </div>
            </div>
        </div>
    )
}

export default Features