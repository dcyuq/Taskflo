import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useState } from 'react'
import './Login.css'

function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (email === '' || password === '') {
            setError('Enter your email and password.')
            return
        }

        setLoading(true)
        setError('')

        const {error} = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })

        if (error){
            setError(error.message === 'Invalid login credentials'
                ? 'That email and password don’t match. Check them and try again.'
                : 'Couldn’t sign in. Check your connection and try again.')
            setLoading(false)
            return
        }
        navigate('/dashboard')
    }

    return (
        <div className='login-page'>
            <form className='login-box' onSubmit={handleLogin} noValidate>
                <h1> Welcome Back. </h1>
                <p> Sign in to your workspace </p>

                <div>
                    <label htmlFor='login-email'> Email </label>
                    <input id='login-email' type='email' autoComplete='email' placeholder='you@company.com' value={email} onChange={(e) => setEmail(e.target.value)}></input>
                </div>

                <div>
                    <label htmlFor='login-password'> Password </label>
                    <input id='login-password' type='password' autoComplete='current-password' placeholder='Enter your password' value={password} onChange={(e) => setPassword(e.target.value)}></input>
                </div>

                {error && <div className='form-error' role='alert'>{error}</div>}

                <div>
                    <button type='submit' disabled={loading}> {loading ? 'Signing in...' : 'Sign in'} </button>
                </div>

                <div>
                    <p>Don't have an account? <Link to="/">Go back home</Link></p>
                </div>
            </form>
        </div>
    )
}

export default Login
