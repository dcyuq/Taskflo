import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useState } from 'react'
import AuthLayout from '../components/AuthLayout'
import PasswordField from '../components/PasswordField'
import SignInDemo from '../components/SignInDemo'
import { friendlyError } from '../utils/errors'
import { useThrottle, waitMessage } from '../hooks/useThrottle'

type Errors = { email?: string, password?: string, form?: string }

function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Errors>({})
    const throttle = useThrottle(5)

    const handleLogin = async (e: React.SyntheticEvent) => {
        e.preventDefault()
        if (loading) return
        const next: Errors = {}
        if (!email.trim()) next.email = 'Enter your email.'
        else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'That email doesn’t look right. Check it and try again.'
        if (!password) next.password = 'Enter your password.'
        setErrors(next)
        if (next.email || next.password) return
        const wait = throttle()
        if (wait) {
            setErrors({ form: waitMessage(wait) })
            return
        }

        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) {
            setErrors({ form: friendlyError(error, 'Couldn’t sign in. Check your connection and try again.') })
            setLoading(false)
            return
        }
        navigate('/dashboard')
    }

    return (
        <AuthLayout preview={<SignInDemo />}>
            <form onSubmit={handleLogin} noValidate>
                <h1>Welcome back</h1>
                <p className="auth-lede">Sign in to see your team's work.</p>

                <div className="field">
                    <label htmlFor="login-email">Email</label>
                    <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'login-email-error' : undefined}
                    />
                    {errors.email && <p className="field-error" id="login-email-error">{errors.email}</p>}
                </div>

                <PasswordField id="login-password" label="Password" autoComplete="current-password" value={password} onChange={setPassword} error={errors.password} />

                {errors.form && <p className="field-error" role="alert">{errors.form}</p>}

                <button type="submit" className="auth-submit" disabled={loading} aria-busy={loading}>
                    {loading ? 'Signing in…' : 'Sign in'}
                </button>

                <p className="auth-switch">No account? <Link to="/register">Sign up</Link></p>
            </form>
        </AuthLayout>
    )
}

export default Login
