import { useState } from 'react'
import { passwordRules } from '../utils/passwordRules'

type Props = {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
    autoComplete: 'current-password' | 'new-password'
    error?: string
    showRules?: boolean
}

function PasswordField({ id, label, value, onChange, autoComplete, error, showRules }: Props) {
    const [visible, setVisible] = useState(false)
    const describedBy = [showRules && `${id}-rules`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

    return (
        <div className="field">
            <label htmlFor={id}>{label}</label>
            <div className="password-wrap">
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    autoComplete={autoComplete}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={describedBy}
                />
                <button
                    type="button"
                    className="password-toggle"
                    aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                    aria-controls={id}
                    onClick={() => setVisible(v => !v)}
                >
                    {visible ? 'Hide' : 'Show'}
                </button>
            </div>
            {showRules && (
                <ul className="password-rules" id={`${id}-rules`}>
                    {passwordRules.map(rule => {
                        const met = rule.test(value)
                        return (
                            <li key={rule.label} className={met ? 'is-met' : undefined}>
                                {rule.label}
                                <span className="sr-only">{met ? ', done' : ', not yet'}</span>
                            </li>
                        )
                    })}
                </ul>
            )}
            {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
        </div>
    )
}

export default PasswordField
