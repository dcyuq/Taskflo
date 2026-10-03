import {useEffect, useState} from "react";
import {Navigate} from "react-router-dom";
import {supabase} from "../supabaseClient";


export default function ProtectedRoute({children} : {children : React.ReactNode}) {
    const[checking, setChecking] = useState(true);
    const[authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({data:{session}}) => {
            setAuthenticated(!!session);
            setChecking(false)
        });
    }, []);

    if (checking) return <div className="firstrun-loading" role="status">Loading…</div>;
    return authenticated ? <>{children}</> : <Navigate to="/login" replace />;
}