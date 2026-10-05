const messages: Record<string, string> = {
    invalid_credentials: 'That email and password don’t match. Check them and try again.',
    weak_password: 'That password isn’t strong enough. Try a longer phrase or a few unrelated words.',
    over_email_send_rate_limit: 'Too many attempts. Wait a minute and try again.',
    over_request_rate_limit: 'Too many attempts. Wait a minute and try again.',
    otp_expired: 'That code didn’t work. It may have expired. Check it, or send a new one.',
    '42501': 'You don’t have access to do that anymore.',
    PGRST116: 'That item no longer exists, or you don’t have access to it anymore. Reload to see the latest.',
}

export const GENERIC_ERROR = 'Something went wrong. Check your connection and try again.'

export function friendlyError(error: unknown, fallback = GENERIC_ERROR) {
    if (import.meta.env.DEV) console.error(error)
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
    return messages[code] ?? fallback
}
