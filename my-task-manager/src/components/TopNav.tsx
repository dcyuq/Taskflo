import './TopNav.css';
import { supabase } from "../supabaseClient";
import {useEffect, useState} from 'react';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';

function TopNav() {
    
    const [firstName, setFirstName] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();

    async function handleSignOut() {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
    }

        useEffect(() => {
            async function loadUser() {
                const { data : {session} } = await supabase.auth.getSession();

                if(!session) return;

                const {data} = await supabase 
                    .from('Users')
                    .select('first_name')
                    .eq('id', session.user.id)
                    .single();
            
                if (data) setFirstName(data.first_name);
            }
            loadUser();
        }, []);

return (
  <>
        <div className="topnav">
            <div className="drawer">
                <button className="drawer-btn" aria-label="Workspaces" onClick={() => setDrawerOpen(!drawerOpen)}>☰</button>
            </div>
                 <div className="topnav-brand">
                    <span className="topnav-mark">T</span>
                        Taskflo
                    </div>
                    <div className="topnav-actions">
                        <div className="topnav-profile">
                            <span className="topnav-avatar" aria-hidden="true">{firstName.charAt(0).toUpperCase()}</span>
                            <span className="topnav-profile-name">{firstName}</span>
                        </div>
                        <button className="topnav-signout" onClick={handleSignOut}>Sign out</button>
                    </div>
                </div>
            <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
    );
}

export default TopNav;