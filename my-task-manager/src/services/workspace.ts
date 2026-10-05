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
    category_id: string | null;
    position: number;
}

export async function getWorkspaces() {
    const {data : {session}} = await supabase.auth.getSession();
    if (!session) return {data: null, error: 'Not logged in'};

    const {data, error} = await supabase
        .from('workspace_members')
        .select('category_id, workspaces(id, name, owner_id)')
        .eq('user_id', session.user.id)
        .order('position', {ascending: true, nullsFirst: false})
        .order('joined_at', {ascending: true});

    return {data: data?.map((row, position) => ({...(row.workspaces as unknown as WorkspaceSummary), category_id: row.category_id, position})) ?? null, error};
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
    invitedBy: string | null;
    createdAt: string;
}

export interface InvitePreview {
    kind: 'email' | 'link';
    workspace_id: string;
    workspace_name: string;
    member_count: number;
    invited_by_name: string | null;
    expires_at: string | null;
    already_member: boolean;
}

export async function getPendingInvites() {
    const {data, error} = await supabase.rpc('my_invites');
    const invites: PendingInvite[] | null = (data as {id: string; token: string; workspace_id: string; workspace_name: string; invited_by_name: string | null; created_at: string}[] | null)
        ?.map(row => ({id: row.id, token: row.token, workspaceId: row.workspace_id, workspaceName: row.workspace_name, invitedBy: row.invited_by_name, createdAt: row.created_at})) ?? null;
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
    const {data, error} = await supabase.functions.invoke('send-invites', {body: {workspaceId, emails}});
    if (!error) return {data: data as {invited: number; emailed: number}, error: null};
    const body = await error.context?.json?.().catch(() => null);
    return {data: null, error: body?.error ? {code: String(body.error)} : error};
}

export async function previewInvite(token: string) {
    const {data, error} = await supabase.rpc('invite_preview', {invite_token: token});
    const row = (data as InvitePreview[] | null)?.[0] ?? null;
    return {data: row, error};
}

export async function placeWorkspaces(rows: {id: string; position: number; category_id: string | null}[]) {
    const {data : {session}} = await supabase.auth.getSession();
    if (!session) return {error : 'Not logged in'};

    const results = await Promise.all(rows.map(({id, position, category_id}) => supabase
        .from('workspace_members')
        .update({position, category_id})
        .eq('workspace_id', id)
        .eq('user_id', session.user.id)
        .select('workspace_id')));

    const failed = results.find(r => r.error || !r.data?.length);
    return {error: failed ? failed.error ?? new Error('Not allowed') : null};
}

export async function renameWorkspace(id: string, name: string) {
    const {data, error} = await supabase.from('workspaces').update({name}).eq('id', id).select('id');
    return {error: error ?? (data?.length ? null : new Error('Not allowed'))};
}
