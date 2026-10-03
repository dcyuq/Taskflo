import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useEffect, useState } from 'react'
import AuthLayout from '../components/AuthLayout'
import PasswordField from '../components/PasswordField'
import SignUpDemo from '../components/SignUpDemo'
import { includesPersonal, passwordRules, personalParts } from '../utils/passwordRules'

type Errors = { first?: string, last?: string, email?: string, password?: string, confirm?: string, code?: string, form?: string }

const COOLDOWN = 60

function FieldError({ id, msg }: { id: string, msg?: string }) {
    return msg ? <p className="field-error" id={id}>{msg}</p> : null
}

const invalid = (id: string, msg?: string) => ({
    'aria-invalid': !!msg,
    'aria-describedby': msg ? `${id}-error` : undefined,
})

function Register() {
    const navigate = useNavigate()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [otpSent, setOtpSent] = useState(false)
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Errors>({})
    const [notice, setNotice] = useState('')
    const [cooldown, setCooldown] = useState(0)

    useEffect(() => {
        if (cooldown <= 0) return
        const id = setTimeout(() => setCooldown(c => c - 1), 1000)
        return () => clearTimeout(id)
    }, [cooldown])

    const personal = personalParts(firstName, lastName, email)
    const checks = [
        ...passwordRules.map(rule => ({ label: rule.label, met: rule.test(password) })),
        { label: 'Doesn’t include your name or email', met: password.length > 0 && !includesPersonal(password, personal) },
    ]

    async function handleReg(e: React.SyntheticEvent) {
        e.preventDefault()
        if (loading) return
        const next: Errors = {}
        if (!firstName.trim()) next.first = 'Enter your first name.'
        if (!lastName.trim()) next.last = 'Enter your last name.'
        if (!email.trim()) next.email = 'Enter your email.'
        else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'That email doesn’t look right. Check it and try again.'
        if (!password) next.password = 'Choose a password.'
        else if (!checks.every(c => c.met)) next.password = 'Your password needs to meet every rule above.'
        if (!confirmPassword) next.confirm = 'Type your password again.'
        else if (password !== confirmPassword) next.confirm = 'The passwords don’t match.'
        setErrors(next)
        if (Object.keys(next).length) return

        setLoading(true)
        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { first_name: firstName.trim(), last_name: lastName.trim() } },
        })
        setLoading(false)
        if (error) {
            if (error.code === 'weak_password') setErrors({ password: 'That password is too weak. Try a longer one.' })
            else if (error.code === 'over_email_send_rate_limit') setErrors({ form: 'Too many attempts. Wait a minute and try again.' })
            else setErrors({ form: 'Couldn’t create your account. Check your connection and try again.' })
            return
        }
        if (data.user?.identities?.length === 0) {
            setErrors({ email: 'An account with this email already exists. Sign in instead.' })
            return
        }
        setCode('')
        setNotice('')
        setCooldown(COOLDOWN)
        setOtpSent(true)
    }

    async function handleVerify(e: React.SyntheticEvent) {
        e.preventDefault()
        if (loading) return
        if (code.length !== 6) {
            setErrors({ code: 'Enter the 6-digit code from the email.' })
            return
        }
        setLoading(true)
        setErrors({})
        const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: 'email' })
        if (error) {
            setErrors({ code: 'That code didn’t work. It may have expired. Check it, or send a new one.' })
            setLoading(false)
            return
        }
        navigate('/dashboard')
    }

    async function handleResend() {
        if (cooldown > 0) return
        setErrors({})
        setNotice('')
        setCooldown(COOLDOWN)
        const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() })
        if (error) {
            setErrors({ form: 'Couldn’t send a new code. Wait a minute and try again.' })
            return
        }
        setNotice(`A new code is on its way to ${email.trim()}.`)
    }

    function goBack() {
        setOtpSent(false)
        setErrors({})
        setNotice('')
    }

    return (
        <AuthLayout preview={<SignUpDemo />}>
            {!otpSent ? (
                <form key="details" onSubmit={handleReg} noValidate>
                    <h1>Create your account</h1>
                    <p className="auth-lede">Set up Taskflo for you and your team.</p>

                    <div className="auth-row">
                        <div className="field">
                            <label htmlFor="reg-first">First name</label>
                            <input id="reg-first" type="text" autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} {...invalid('reg-first', errors.first)} />
                            <FieldError id="reg-first-error" msg={errors.first} />
                        </div>
                        <div className="field">
                            <label htmlFor="reg-last">Last name</label>
                            <input id="reg-last" type="text" autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} {...invalid('reg-last', errors.last)} />
                            <FieldError id="reg-last-error" msg={errors.last} />
                        </div>
                    </div>

                    <div className="field">
                        <label htmlFor="reg-email">Email</label>
                        <input id="reg-email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} {...invalid('reg-email', errors.email)} />
                        <FieldError id="reg-email-error" msg={errors.email} />
                    </div>

                    <PasswordField id="reg-password" label="Password" autoComplete="new-password" value={password} onChange={setPassword} error={errors.password} checks={checks} />
                    <PasswordField id="reg-confirm" label="Confirm password" autoComplete="new-password" value={confirmPassword} onChange={setConfirmPassword} error={errors.confirm} />

                    {errors.form && <p className="field-error" role="alert">{errors.form}</p>}

                    <button type="submit" className="auth-submit" disabled={loading} aria-busy={loading}>
                        {loading ? 'Creating account…' : 'Create account'}
                    </button>
                    <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
                </form>
            ) : (
                <form key="code" onSubmit={handleVerify} noValidate>
                    <h1>Check your email</h1>
                    <p className="auth-lede">We sent a 6-digit code to <strong>{email.trim()}</strong>. Enter it below to finish creating your account.</p>

                    <div className="field">
                        <label htmlFor="reg-code">Verification code</label>
                        <input
                            id="reg-code"
                            className="auth-code"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="123456"
                            value={code}
                            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            {...invalid('reg-code', errors.code)}
                        />
                        <FieldError id="reg-code-error" msg={errors.code} />
                    </div>

                    {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
                    {notice && <p className="form-notice" role="status">{notice}</p>}

                    <button type="submit" className="auth-submit" disabled={loading} aria-busy={loading}>
                        {loading ? 'Verifying…' : 'Verify email'}
                    </button>

                    <div className="auth-actions">
                        <button type="button" className="auth-link" onClick={handleResend} disabled={cooldown > 0}>
                            {cooldown > 0 ? `Resend code in ${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}` : 'Resend code'}
                        </button>
                        <button type="button" className="auth-link" onClick={goBack}>Wrong email? Go back</button>
                    </div>
                </form>
            )}
        </AuthLayout>
    )
}

export default Register
