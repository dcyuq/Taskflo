revoke update on public.tasks from anon, authenticated;
grant update (title, status, assignee_id, due_date) on public.tasks to authenticated;

revoke update on public."Users" from anon, authenticated;
grant update (first_name, last_name) on public."Users" to authenticated;

create or replace function private.confirmed_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(u.email)
  from auth.users u
  where u.id = (select auth.uid())
    and u.email_confirmed_at is not null;
$$;

revoke all on function private.confirmed_email() from public, anon;
grant execute on function private.confirmed_email() to authenticated;

drop policy "Owner and invitee can read invites" on public.invites;
create policy "Owner and confirmed invitee can read invites"
  on public.invites for select
  to authenticated
  using (
    private.is_workspace_owner(workspace_id)
    or email = (select private.confirmed_email())
  );

drop policy "Invitees can read invited workspace" on public.workspaces;
create policy "Confirmed invitees can read invited workspace"
  on public.workspaces for select
  to authenticated
  using (
    exists (
      select 1 from public.invites i
      where i.workspace_id = workspaces.id
        and i.accepted_at is null
        and i.declined_at is null
        and i.expires_at > now()
        and i.email = (select private.confirmed_email())
    )
  );

create or replace function public.decline_invite(invite_token uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := private.confirmed_email();
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to decline an invite'
      using errcode = '42501';
  end if;

  if v_email is null then
    raise exception 'Confirm your email address before declining invites'
      using errcode = '42501';
  end if;

  update public.invites i
  set declined_at = now()
  where i.token = invite_token
    and i.email = v_email
    and i.accepted_at is null
    and i.declined_at is null;

  if not found then
    raise exception 'Invite not found or already used'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.decline_invite(uuid) from public, anon;
grant execute on function public.decline_invite(uuid) to authenticated;
