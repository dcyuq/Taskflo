import './Features.css'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

function Card({ ink, wide, children }: { ink?: boolean, wide?: boolean, children: ReactNode }) {
    const reduce = useReducedMotion()
    return (
        <motion.article
            className={`bento-card${ink ? ' is-ink' : ''}${wide ? ' is-wide' : ''}`}
            whileHover={reduce ? undefined : { y: -3 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        >
            {children}
        </motion.article>
    )
}

function Features() {
    return(
        <section className="features" id="features">
            <h2>Everything your team needs</h2>
            <div className="bento">
                <Card ink wide>
                    <div className="bento-text">
                        <h3>Task assignment</h3>
                        <p>Give each task an owner, a deadline and a priority.</p>
                    </div>
                    <div className="bento-visual" aria-hidden="true"></div>
                </Card>

                <Card>
                    <div className="bento-text">
                        <h3>Progress tracking</h3>
                        <p>See the status of every task across your team.</p>
                    </div>
                    <div className="bento-visual" aria-hidden="true"></div>
                </Card>

                <Card>
                    <div className="bento-text">
                        <h3>AI assistant <span className="feature-soon">Coming soon</span></h3>
                        <p>Suggested priorities and assignments based on each person's workload.</p>
                    </div>
                    <div className="bento-visual" aria-hidden="true"></div>
                </Card>
            </div>
        </section>
    )
}

export default Features
