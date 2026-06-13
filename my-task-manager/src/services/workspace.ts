import { supabase } from "../supabaseClient";

export async function createWorkspace(name : string) {
    const {data : {session}} = await supabase.auth.getSession();
    if (!session) return {error : 'Not logged in'};

    const {data, error} = await supabase 
    .from('workspaces')
    .insert ({
        name,
        owner_id: session.user.id
    })
    .select()
    .single();

    return {data,error};
}

export async function getWorkspaces() {
    const {data : {session}} = await supabase.auth.getSession(); 
    if (!session) return {data: null, error: 'Not logged in'};

    const {data, error} = await supabase 
        .from('workspaces')
        .select('id, name')
        .eq('owner_id', session.user.id)
        .order('created_at', {ascending: true});

    return {data, error};
}