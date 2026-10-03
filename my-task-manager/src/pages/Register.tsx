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
                        <h1> New Here? </h1>
                        <p>Register now!</p>


                        <div>
                            <label htmlFor="reg-first"> Name</label>
                            <input id="reg-first" type='text' autoComplete="given-name" aria-label="First name" placeholder="First Name" value={FirstName} onChange={(e) => setFirstname(e.target.value)} ></input>
                            <input type='text' autoComplete="family-name" aria-label="Last name" placeholder="Last Name" value={LastName} onChange={(e) => setLastName(e.target.value)} ></input>
                        </div>

                        <div>
                            <label htmlFor="reg-email">Email</label>
                            <input id="reg-email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}></input>
                        </div>

                        <div>
                            <label htmlFor="reg-password"> Password </label>
                            <input id="reg-password" type='password' autoComplete="new-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)}></input>
                        </div>

                        <div>
                            <label htmlFor="reg-confirm"> Confirm Passowrd </label>
                            <input id="reg-confirm" type='password' autoComplete="new-password" placeholder="Confirm Your Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}></input>
                        </div>

                        {error && <div className="form-error" role="alert">{error}</div>}

                        <button type="submit" className="register-btn" disabled={loading}> {loading ? "Creating account..." : "Create Account"}</button>
                        <p className="register-login-link">Already have an account? <Link to="/login">Sign in</Link></p>
                    </form>
                )}

                {otpSent && (
                    <form onSubmit={handleVerify} noValidate>
                        <h1>Check your Email</h1>
                        <p>We sent a 6-digit code to {email}</p>
                        <label htmlFor="reg-code">Code</label>
                        <input id="reg-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="Enter Code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}></input>
                        {error && <div className="form-error" role="alert">{error}</div>}
                        {notice && <div className="form-notice" role="status">{notice}</div>}
                        <button type="submit" className="register-btn" disabled={loading}>{loading ? "Verifying..." : "Verify"}</button>
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
