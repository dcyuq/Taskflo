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

export async function getWorkspace(id: string) {
    const {data, error} = await supabase
        .from('workspaces')
        .select('id, name, owner_id')
        .eq('id', id)
        .maybeSingle();
    return {data, error};
}

export interface WorkspaceSummary {
    id: string;
    name: string;
    owner_id: string | null;
}

export async function getWorkspaces() {
    const {data : {session}} = await supabase.auth.getSession();
    if (!session) return {data: null, error: 'Not logged in'};

    const {data, error} = await supabase
        .from('workspace_members')
        .select('workspaces(id, name, owner_id)')
        .eq('user_id', session.user.id)
        .order('position', {ascending: true, nullsFirst: false})
        .order('joined_at', {ascending: true});

    return {data: data?.map(row => row.workspaces as unknown as WorkspaceSummary) ?? null, error};
}

export async function deleteWorkspace(id: string) {
    const {data, error} = await supabase.from('workspaces').delete().eq('id', id).select('id');
    return {error: error ?? (data?.length ? null : new Error('Not allowed'))};
}

export interface PendingInvite {
    id: string;
    token: string;
    workspaceId: string;
    workspaceName: string;
}

export async function getPendingInvites() {
    const {data : {session}} = await supabase.auth.getSession();
    if (!session?.user.email) return {data: null, error: 'Not logged in'};

    const {data, error} = await supabase
        .from('invites')
        .select('id, token, workspace_id, workspaces(name)')
        .eq('email', session.user.email.toLowerCase())
        .is('accepted_at', null)
        .is('declined_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', {ascending: true});

    const invites: PendingInvite[] | null = data?.map(row => {
        const ws = row.workspaces as unknown as {name: string} | null;
        return {id: row.id, token: row.token, workspaceId: row.workspace_id, workspaceName: ws?.name ?? 'A workspace'};
    }) ?? null;

    return {data: invites, error};
}

export async function acceptInvite(token: string) {
    const {data, error} = await supabase.rpc('accept_invite', {invite_token: token});
    return {workspaceId: data as string | null, error};
}

export async function declineInvite(token: string) {
    const {error} = await supabase.rpc('decline_invite', {invite_token: token});
    return {error};
}

export async function sendInvites(workspaceId: string, emails: string[]) {
    const {data : {session}} = await supabase.auth.getSession();
    if (!session) return {error : 'Not logged in'};

    const {error} = await supabase
        .from('invites')
        .insert(emails.map(email => ({
            workspace_id: workspaceId,
            email,
            invited_by: session.user.id,
        })));

    return {error};
}

export async function orderWorkspaces(ids: string[]) {
    const {data : {session}} = await supabase.auth.getSession();
    if (!session) return {error : 'Not logged in'};

    const results = await Promise.all(ids.map((id, position) => supabase
        .from('workspace_members')
        .update({position})
        .eq('workspace_id', id)
        .eq('user_id', session.user.id)));

    return {error: results.find(r => r.error)?.error ?? null};
}
