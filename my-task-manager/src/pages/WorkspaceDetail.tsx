import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';


function WorkspaceDetail() {

    const { id } = useParams();
    const [workspaceName, setWorkspaceName] = useState('');

    useEffect(() => {
        async function fetchWorkspace() {
            const { data } = await supabase
                .from('workspaces')
                .select('name')
                .eq('id', id)
                .single();
        
            if (data) setWorkspaceName(data.name);
        }
        fetchWorkspace();
    }, [id]);


    return (
        <div className="workspace-detail">
            <h1>{workspaceName}</h1>
        </div>
    );
}

export default WorkspaceDetail;