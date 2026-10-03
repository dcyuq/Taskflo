import { useNavigate, Link } from 'react-router-dom'
import { supabase } from "../supabaseClient";
import {useState} from "react";
import './Register.css'



function Register() {
    const [FirstName, setFirstname] = useState("");
    const [LastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const navigate = useNavigate()
    const [otpSent, setOtpSent] = useState(false);  // which view to show
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    async function handleReg(e: React.SyntheticEvent) {
        e.preventDefault();
        if(!FirstName || !LastName || !email || !password || !confirmPassword) {
            setError("Fill in every field to create your account.");
            return;
        }

        if (password !== confirmPassword) {
            setError("The passwords don’t match.");
            return;
        }

        setLoading(true);
        setError("");

        const {data, error} = await supabase.auth.signUp({
            email: email,
            password: password,
            options : {
                data: {
                    first_name: FirstName,
                    last_name: LastName,
                },
            },
        });
        setLoading(false);
        if (error) {
            setError(error.message);
            return;
        }
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            setError("An account with this email already exists. Sign in instead.");
            return
        }
        setCode("");
        setNotice("");
        setOtpSent(true);
    }

    async function handleVerify(e: React.SyntheticEvent) {
        e.preventDefault();
        if (code.trim().length !== 6) {
            setError("Enter the 6-digit code from the email.");
            return;
        }
        setLoading(true);
        setError("");
        const {error} = await supabase.auth.verifyOtp({
            email: email,
            token: code.trim(),
            type: "email",
        });
        if (error) {
            setError("That code didn’t work. It may have expired. Check it, or send a new one.");
            setLoading(false);
            return;
        }
        navigate("/dashboard");
    }

    async function handleResend() {
        setError("");
        setNotice("");
        const {error} = await supabase.auth.resend({type: "signup", email});
        if (error) {
            setError("Couldn’t send a new code. Wait a minute and try again.");
            return;
        }
        setNotice(`A new code is on its way to ${email}.`);
    }


    return (
        <div className='RegisterPage'>
            <div className='RegisterBox'>
                {!otpSent && (
                    <form onSubmit={handleReg} noValidate>
                        <h1>Create your account</h1>
                        <p>Set up Taskflo for you and your team.</p>

                        <div>
                            <label htmlFor="reg-first">First name</label>
                            <input id="reg-first" type='text' autoComplete="given-name" value={FirstName} onChange={(e) => setFirstname(e.target.value)} ></input>
                        </div>

                        <div>
                            <label htmlFor="reg-last">Last name</label>
                            <input id="reg-last" type='text' autoComplete="family-name" value={LastName} onChange={(e) => setLastName(e.target.value)} ></input>
                        </div>

                        <div>
                            <label htmlFor="reg-email">Email</label>
                            <input id="reg-email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}></input>
                        </div>

                        <div>
                            <label htmlFor="reg-password">Password</label>
                            <input id="reg-password" type='password' autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)}></input>
                        </div>

                        <div>
                            <label htmlFor="reg-confirm">Confirm password</label>
                            <input id="reg-confirm" type='password' autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}></input>
                        </div>

                        {error && <div className="form-error" role="alert">{error}</div>}

                        <button type="submit" className="register-btn" disabled={loading}>{loading ? "Creating account…" : "Create account"}</button>
                        <p className="register-login-link">Already have an account? <Link to="/login">Sign in</Link></p>
                    </form>
                )}

                {otpSent && (
                    <form onSubmit={handleVerify} noValidate>
                        <h1>Check your email</h1>
                        <p>We sent a 6-digit code to {email}. Enter it below to finish creating your account.</p>
                        <label htmlFor="reg-code">Verification code</label>
                        <input id="reg-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}></input>
                        {error && <div className="form-error" role="alert">{error}</div>}
                        {notice && <div className="form-notice" role="status">{notice}</div>}
                        <button type="submit" className="register-btn" disabled={loading}>{loading ? "Verifying…" : "Verify email"}</button>
                        <p className="register-login-link">
                            <button type="button" className="link-btn" onClick={handleResend}>Send a new code</button>
                            {" · "}
                            <button type="button" className="link-btn" onClick={() => { setOtpSent(false); setError(""); }}>Use a different email</button>
                        </p>
                    </form>
                )}


            </div>
        </div>
    )
}

export default Register
