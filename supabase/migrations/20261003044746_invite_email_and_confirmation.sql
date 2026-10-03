-- Invites: store emails lowercased, and only let confirmed emails accept.

-------------------------------------------------------------------------------
-- Normalize invite emails on write
-------------------------------------------------------------------------------

create or replace function private.normalize_invite_email()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.email := lower(btrim(new.email));
  return new;
end;
$$;

revoke all on function private.normalize_invite_email() from public, anon, authenticated;

-- Runs before the table's check constraint, so "Ana@Example.com " is stored
-- as "ana@example.com" instead of being rejected.
create trigger invites_normalize_email
  before insert or update of email on public.invites
  for each row execute function private.normalize_invite_email();

-------------------------------------------------------------------------------
-- accept_invite: require a confirmed email
-------------------------------------------------------------------------------

-- The only way to accept an invite: there is no UPDATE policy on invites, and
-- only owners can insert into workspace_members. The invitee's email comes
-- from auth.users (not the JWT) and must be confirmed.
create or replace function public.accept_invite(invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id      uuid := auth.uid();
  v_email        text;
  v_invite_id    uuid;
  v_workspace_id uuid;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to accept an invite'
      using errcode = '42501';
  end if;

  select lower(u.email) into v_email
  from auth.users u
  where u.id = v_user_id
    and u.email_confirmed_at is not null;

  if v_email is null then
    raise exception 'Confirm your email address before accepting invites'
      using errcode = '42501';
  end if;

  -- Lock the row so the same invite can't be accepted twice concurrently.
  select i.id, i.workspace_id
    into v_invite_id, v_workspace_id
  from public.invites i
  where i.token = invite_token
    and i.email = v_email
    and i.expires_at > now()
    and i.accepted_at is null
    and i.declined_at is null
  for update;

  if v_invite_id is null then
    raise exception 'Invite not found, expired, or already used'
      using errcode = 'P0002';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, v_user_id, 'member')
  on conflict (workspace_id, user_id) do nothing;

  update public.invites
  set accepted_at = now()
  where id = v_invite_id;

  return v_workspace_id;
end;
$$;

revoke all on function public.accept_invite(uuid) from public, anon;
grant execute on function public.accept_invite(uuid) to authenticated;
