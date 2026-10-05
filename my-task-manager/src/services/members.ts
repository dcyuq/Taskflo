import { supabase } from '../supabaseClient'

export interface Member {
    id: string
    role: 'owner' | 'member'
    name: string
    email: string
    joinedAt: string | null
}

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export interface WorkspaceInvite {
    id: string
    email: string
    status: InviteStatus
    expiresAt: string
}

export interface InviteLink {
    id: string
    token: string
    expiresAt: string | null
    maxUses: number | null
    uses: number
}

export async function listMembers(workspaceId: string) {
    const { data: rows, error } = await supabase
        .from('workspace_members')
        .select('user_id, role, joined_at')
        .eq('workspace_id', workspaceId)
        .order('joined_at', { ascending: true })
    if (error || !rows) return { data: null, error }

    const { data: profiles, error: profileError } = await supabase
        .from('Users')
        .select('id, first_name, last_name, email')
        .in('id', rows.map(r => r.user_id))
    if (profileError) return { data: null, error: profileError }

    const byId = new Map((profiles ?? []).map(p => [p.id, p]))
    const members: Member[] = rows.map(r => {
        const p = byId.get(r.user_id)
        const email = p?.email ?? ''
        const name = [p?.first_name, p?.last_name].filter(Boolean).join(' ') || email.split('@')[0] || 'Teammate'
        return { id: r.user_id, role: r.role === 'owner' ? 'owner' : 'member', name, email, joinedAt: r.joined_at }
    })
    return { data: members, error: null }
}

export async function removeMember(workspaceId: string, userId: string) {
    const { data, error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .select('user_id')
    return { error: error ?? (data?.length ? null : new Error('Not allowed')) }
}

export async function listWorkspaceInvites(workspaceId: string) {
    const { data, error } = await supabase
        .from('invites')
        .select('id, email, expires_at, accepted_at, declined_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(50)
    const now = Date.now()
    const invites: WorkspaceInvite[] | null = data?.map(i => ({
        id: i.id,
        email: i.email,
        expiresAt: i.expires_at,
        status: i.accepted_at ? 'accepted' : i.declined_at ? 'declined' : new Date(i.expires_at).getTime() <= now ? 'expired' : 'pending',
    })) ?? null
    return { data: invites, error }
}

export async function revokeInvite(id: string) {
    const { data, error } = await supabase.from('invites').delete().eq('id', id).select('id')
    return { error: error ?? (data?.length ? null : new Error('Not allowed')) }
}

export async function listInviteLinks(workspaceId: string) {
    const { data, error } = await supabase
        .from('invite_links')
        .select('id, token, expires_at, max_uses, uses')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
    const links: InviteLink[] | null = data?.map(l => ({ id: l.id, token: l.token, expiresAt: l.expires_at, maxUses: l.max_uses, uses: l.uses })) ?? null
    return { data: links, error }
}

export async function createInviteLink(workspaceId: string, expiresAt: string | null, maxUses: number | null) {
    const { error } = await supabase.from('invite_links').insert({ workspace_id: workspaceId, expires_at: expiresAt, max_uses: maxUses })
    return { error }
}

export async function revokeInviteLink(id: string) {
    const { data, error } = await supabase.from('invite_links').delete().eq('id', id).select('id')
    return { error: error ?? (data?.length ? null : new Error('Not allowed')) }
}
