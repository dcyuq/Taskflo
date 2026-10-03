import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setAuthenticated(!!session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setAuthenticated(!!session);
        });
        return () => subscription.unsubscribe();
    }, []);

    if (authenticated === null) return <div className="firstrun-loading" role="status">Loading…</div>;
    return authenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
