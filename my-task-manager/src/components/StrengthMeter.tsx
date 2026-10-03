const levels = ['Weak', 'Weak', 'Weak', 'Fair', 'Strong']

function StrengthMeter({ score }: { score: number | null }) {
    const filled = score === null ? 0 : score >= 4 ? 3 : score >= 3 ? 2 : 1
    return (
        <div className="strength">
            <span className="strength-bar" aria-hidden="true">
                {[1, 2, 3].map(n => <span key={n} className={n <= filled ? 'is-on' : undefined} />)}
            </span>
            <span className="strength-label" aria-live="polite">
                {score === null ? 'Strength' : `Strength: ${levels[score]}`}
            </span>
        </div>
    )
}

export default StrengthMeter
