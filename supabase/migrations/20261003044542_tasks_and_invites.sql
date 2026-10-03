-- Tasks and invites, scoped to workspace members.
--
-- Also fixes the existing membership model so tasks can work:
--   * workspace owners become a row in workspace_members (role 'owner')
--   * members can see each other (needed to pick an assignee)
--   * members can read teammates' profiles in "Users" (needed to show names)
--
-- RLS helper functions live in a non-exposed `private` schema so they are not
-- callable through /rest/v1/rpc and do not recurse through RLS.

-------------------------------------------------------------------------------
-- private helpers
-------------------------------------------------------------------------------

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_workspace_owner(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspaces w
    where w.id = ws and w.owner_id = (select auth.uid())
  );
$$;

create or replace function private.shares_workspace_with(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members me
    join public.workspace_members them on them.workspace_id = me.workspace_id
    where me.user_id = (select auth.uid()) and them.user_id = other
  );
$$;

revoke all on function private.is_workspace_member(uuid) from public, anon;
revoke all on function private.is_workspace_owner(uuid) from public, anon;
revoke all on function private.shares_workspace_with(uuid) from public, anon;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.is_workspace_owner(uuid) to authenticated;
grant execute on function private.shares_workspace_with(uuid) to authenticated;

-------------------------------------------------------------------------------
-- workspace owners are members
-------------------------------------------------------------------------------

create or replace function private.add_owner_as_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is not null then
    insert into public.workspace_members (workspace_id, user_id, role)
    values (new.id, new.owner_id, 'owner')
    on conflict (workspace_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function private.add_owner_as_member() from public, anon, authenticated;

create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function private.add_owner_as_member();

-- Backfill any existing workspaces.
insert into public.workspace_members (workspace_id, user_id, role)
select id, owner_id, 'owner' from public.workspaces where owner_id is not null
on conflict (workspace_id, user_id) do nothing;

-------------------------------------------------------------------------------
-- membership + profile visibility
-------------------------------------------------------------------------------

drop policy "Users can read workspace members" on public.workspace_members;
create policy "Members can read workspace members"
  on public.workspace_members for select
  to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "Members can read teammates' profiles"
  on public."Users" for select
  to authenticated
  using (private.shares_workspace_with(id));

-------------------------------------------------------------------------------
-- tasks
-------------------------------------------------------------------------------

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  status       text not null default 'todo'
               check (status in ('todo', 'doing', 'done')),
  assignee_id  uuid,
  due_date     date,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- The assignee must be a member of the task's workspace. If they leave,
  -- the task stays and becomes unassigned.
  foreign key (workspace_id, assignee_id)
    references public.workspace_members (workspace_id, user_id)
    on delete set null (assignee_id)
);

create index tasks_workspace_id_idx on public.tasks (workspace_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);
create index tasks_created_by_idx on public.tasks (created_by);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function private.set_updated_at();

alter table public.tasks enable row level security;

create policy "Members can read tasks"
  on public.tasks for select
  to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "Members can create tasks"
  on public.tasks for insert
  to authenticated
  with check (
    private.is_workspace_member(workspace_id)
    and created_by = (select auth.uid())
  );

create policy "Members can update tasks"
  on public.tasks for update
  to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

create policy "Creator or owner can delete tasks"
  on public.tasks for delete
  to authenticated
  using (
    created_by = (select auth.uid())
    or private.is_workspace_owner(workspace_id)
  );

-------------------------------------------------------------------------------
-- invites
-------------------------------------------------------------------------------

create table public.invites (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email        text not null check (email = lower(btrim(email)) and email like '%_@_%'),
  token        uuid not null unique default gen_random_uuid(),
  invited_by   uuid default auth.uid() references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '7 days',
  -- An invite is single-use: once accepted or declined it can't be used again.
  accepted_at  timestamptz,
  declined_at  timestamptz,
  check (accepted_at is null or declined_at is null)
);

-- One open invite per email per workspace.
create unique index invites_open_unique
  on public.invites (workspace_id, email)
  where accepted_at is null and declined_at is null;
create index invites_email_idx on public.invites (email);
create index invites_invited_by_idx on public.invites (invited_by);

alter table public.invites enable row level security;

create policy "Owner and invitee can read invites"
  on public.invites for select
  to authenticated
  using (
    private.is_workspace_owner(workspace_id)
    or email = lower((select auth.jwt() ->> 'email'))
  );

create policy "Owner can create invites"
  on public.invites for insert
  to authenticated
  with check (
    private.is_workspace_owner(workspace_id)
    and invited_by = (select auth.uid())
  );

create policy "Owner can revoke invites"
  on public.invites for delete
  to authenticated
  using (private.is_workspace_owner(workspace_id));

-- Invitees can see the name of a workspace they have an open invite to.
create policy "Invitees can read invited workspace"
  on public.workspaces for select
  to authenticated
  using (
    exists (
      select 1 from public.invites i
      where i.workspace_id = workspaces.id
        and i.accepted_at is null
        and i.declined_at is null
        and i.expires_at > now()
        and i.email = lower((select auth.jwt() ->> 'email'))
    )
  );

-- The only way to accept an invite. There is no UPDATE policy on invites and
-- no INSERT policy on workspace_members for non-owners, so joining a workspace
-- must go through here. Checks token, email match, expiry and single use, then
-- joins the workspace and marks the invite used in one transaction.
-- Exposed as /rest/v1/rpc/accept_invite to signed-in users only.
create or replace function public.accept_invite(invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv_id uuid;
  ws     uuid;
begin
  select i.id, i.workspace_id into inv_id, ws
  from public.invites i
  where i.token = invite_token
    and i.email = lower(auth.jwt() ->> 'email')
    and i.expires_at > now()
    and i.accepted_at is null
    and i.declined_at is null
  for update;

  if inv_id is null then
    raise exception 'Invite not found, expired, or already used' using errcode = 'P0002';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws, auth.uid(), 'member')
  on conflict (workspace_id, user_id) do nothing;

  update public.invites set accepted_at = now() where id = inv_id;

  return ws;
end;
$$;

revoke all on function public.accept_invite(uuid) from public, anon;
grant execute on function public.accept_invite(uuid) to authenticated;

-- Declining marks the invite used instead of deleting it, so only the owner
-- can ever remove an invite.
create or replace function public.decline_invite(invite_token uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.invites i
  set declined_at = now()
  where i.token = invite_token
    and i.accepted_at is null
    and i.declined_at is null
    and i.email = lower(auth.jwt() ->> 'email');

  if not found then
    raise exception 'Invite not found or already used' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.decline_invite(uuid) from public, anon;
grant execute on function public.decline_invite(uuid) to authenticated;
