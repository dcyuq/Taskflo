import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useState } from 'react'
import './Login.css'

function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        if (email === '' || password === '') {
            alert('Please fill in all fields')
            return
        }

        setLoading(true)
        
        const {error} = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })

        if (error){
            alert(error.message)
            setLoading(false)
            return
        }
        navigate('/dashboard')
    }

    return (
        <div className='login-page'> 
            <div className='login-box'>
                <h1> Welcome Back. </h1>
                <p> Sign in to your workspace </p>

                <div> 
                    <label> Email </label>
                    <input type='email' placeholder='you@company.com' value={email} onChange={(e) => setEmail(e.target.value)}></input>
                </div>

                <div> 
                    <label> Password </label>
                    <input type='password' placeholder='Enter your password' value={password} onChange={(e) => setPassword(e.target.value)}></input>
                </div>

                <div> 
                    <button onClick={handleLogin} disabled={loading}> {loading ? 'Signing in...' : 'Sign in'} </button>

                </div>

                <div>
                    <p>Don't have an account? <Link to="/">Go back home</Link></p>
                </div>

                
            </div>

        </div>
    )
}

export default Login