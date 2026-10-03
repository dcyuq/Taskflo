import type { EmailChips } from '../hooks/useEmailChips'

interface EmailChipFieldProps {
    id: string
    chips: EmailChips
    autoFocus?: boolean
}

function EmailChipField({ id, chips, autoFocus }: EmailChipFieldProps) {
    const { inputRef, draft, setDraft, emails, error, setError, notice, commit, remove, onKeyDown, onPaste } = chips

    return (
        <>
            <div className={`firstrun-chipfield${error ? ' is-invalid' : ''}`} onClick={() => inputRef.current?.focus()}>
                <ul className="firstrun-chips" aria-label="Invites to send">
                    {emails.map(email => (
                        <li key={email} className="firstrun-chip">
                            <span>{email}</span>
                            <button
                                type="button"
                                className="firstrun-chip-remove"
                                aria-label={`Remove ${email}`}
                                onClick={e => {
                                    e.stopPropagation()
                                    remove(email)
                                }}
                            >
                                <svg className="firstrun-icon" viewBox="0 0 16 16" aria-hidden="true">
                                    <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ul>
                <input
                    ref={inputRef}
                    id={id}
                    className="firstrun-chip-input"
                    type="email"
                    inputMode="email"
                    autoComplete="off"
                    autoFocus={autoFocus}
                    placeholder={emails.length === 0 ? 'name@company.com' : ''}
                    value={draft}
                    onChange={e => {
                        setDraft(e.target.value)
                        if (error) setError('')
                    }}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    onBlur={() => draft.trim() && commit(draft)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${id}-error` : `${id}-hint`}
                />
            </div>
            {error ? (
                <p id={`${id}-error`} className="firstrun-error" role="alert">{error}</p>
            ) : (
                <p id={`${id}-hint`} className="firstrun-hint">
                    {notice || 'Press Enter after each address, or paste a list.'}
                </p>
            )}
        </>
    )
}

export default EmailChipField
