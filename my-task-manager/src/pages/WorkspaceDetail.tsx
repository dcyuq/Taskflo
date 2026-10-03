import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';


function WorkspaceDetail() {

    const { id } = useParams();
    // undefined = loading, null = not found or no access
    const [workspaceName, setWorkspaceName] = useState<string | null | undefined>(undefined);

    useEffect(() => {
        supabase
            .from('workspaces')
            .select('name')
            .eq('id', id)
            .maybeSingle()
            .then(({ data }) => setWorkspaceName(data?.name ?? null));
    }, [id]);

    if (workspaceName === undefined) {
        return <div className="firstrun-loading" role="status">Loading workspace…</div>;
    }

    if (workspaceName === null) {
        return (
            <div className="workspace-detail">
                <h1 className="firstrun-title">Workspace not found</h1>
                <p className="firstrun-lede">It may have been deleted, or you're not a member. <Link to="/dashboard">Go to your workspaces</Link></p>
            </div>
        );
    }

    return (
        <div className="workspace-detail">
            <h1 className="firstrun-title">{workspaceName}</h1>
        </div>
    );
}

export default WorkspaceDetail;
