import './TopNav.css';
import { supabase } from "../supabaseClient";
import {useEffect, useState} from 'react';
import Sidebar from './Sidebar';

function TopNav() {
    
    const [firstName, setFirstName] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);

        useEffect(() => {
            async function loadUser() {
                const { data : {session} } = await supabase.auth.getSession();
                console.log("session:", session);

                if(!session) return;

                const {data, error} = await supabase 
                    .from('Users')
                    .select('first_name')
                    .eq('id', session.user.id)
                    .single();
                    console.log("data:", data);
                    console.log("error:", error);
            
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
                    <div className="topnav-search">
                        <input type="text" placeholder="Search tasks, people, workspaces..." />
                    </div>
                    <div className="topnav-actions">
                        <button className="topnav-iconbtn" aria-label="Create new">+</button>
                        <button className="topnav-iconbtn" aria-label="Notifications">🔔</button>
                        <button className="topnav-profile">
                            <span className="topnav-avatar"></span>
                            <span className="topnav-profile-name">{firstName}</span>
                        </button>
                    </div>
                </div>
            <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
    );
}

export default TopNav;