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

    async function handleReg() {
        if(!FirstName || !LastName || !email || !password || !confirmPassword) {
            alert("Please fill in all fields!")
            return;
        }

        if (password !== confirmPassword) {
        alert("Passwords do not match")
        return;
        }

        setLoading(true); 

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
        if (error) {
            alert(error.message);
            setLoading(false);
            return;
        }
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            alert("An account with this email already exists. Please sign in instead.")
            setLoading(false)
            return
        }
        setCode("");
        setOtpSent(true);
    }

    async function handleVerify() {
        const {error} = await supabase.auth.verifyOtp({
            email: email,
            token: code,
            type: "email",
        });
        if (error) {
            alert(error.message);
            return;
        }
        navigate("/dashboard");
    }
    

    return (
        <div className='RegisterPage'>
            <div className='RegisterBox'>
                {!otpSent && (
                    <>
                        <h1> New Here? </h1>
                        <p>Register now!</p>


                        <div> 
                            <label> Name</label>
                            <input type='text' placeholder="First Name" value={FirstName} onChange={(e) => setFirstname(e.target.value)} ></input>
                            <input type='text' placeholder="Last Name" value={LastName} onChange={(e) => setLastName(e.target.value)} ></input>
                        </div>

                        <div> 
                            <label>Email</label>
                            <input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}></input>
                        </div>

                        <div>
                            <label> Password </label>
                            <input type='password' placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)}></input>
                        </div>

                        <div>
                            <label> Confirm Passowrd </label>
                            <input type='password' placeholder="Confirm Your Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}></input>
                        </div>

                        <button className="register-btn" onClick={handleReg} disabled={loading}> {loading ? "Creating account..." : "Create Account"}</button>
                        <p className="register-login-link">Already have an account? <Link to="/login">Sign in</Link></p>
                    </>     
                )}

                {otpSent && (
                    <>
                        <h1>Check your Email</h1>
                        <p>We sent a 6-digit code to {email}</p>
                        <input type="text" placeholder="Enter Code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off"></input>
                        <button className="register-btn" onClick={handleVerify}>Verify</button>
                    </>
                )}


            </div>
        </div>
    )
}

export default Register