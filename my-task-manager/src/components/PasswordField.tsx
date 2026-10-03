import { useState } from 'react'
import type { ReactNode } from 'react'
import { PASSWORD_MAX } from '../utils/passwordRules'

type Props = {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
    autoComplete: 'current-password' | 'new-password'
    error?: string
    checks?: { label: string, met: boolean }[]
    children?: ReactNode
}

function PasswordField({ id, label, value, onChange, autoComplete, error, checks, children }: Props) {
    const [visible, setVisible] = useState(false)
    const describedBy = [checks && `${id}-rules`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

    return (
        <div className="field">
            <label htmlFor={id}>{label}</label>
            <div className="password-wrap">
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    autoComplete={autoComplete}
                    maxLength={PASSWORD_MAX}
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
            {children}
            {checks && (
                <ul className="password-rules" id={`${id}-rules`}>
                    {checks.map(check => (
                        <li key={check.label} className={check.met ? 'is-met' : undefined}>
                            {check.label}
                            <span className="sr-only">{check.met ? ', done' : ', not yet'}</span>
                        </li>
                    ))}
                </ul>
            )}
            {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
        </div>
    )
}

export default PasswordField
