create table if not exists public."Users" (
  id         uuid not null default auth.uid() primary key,
  first_name text,
  last_name  text,
  role       text,
  created_at timestamptz default now(),
  email      text
);

create table if not exists public.workspaces (
  id         uuid not null default gen_random_uuid() primary key,
  name       text not null,
  owner_id   uuid references auth.users (id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null default 'member',
  joined_at    timestamptz default now(),
  primary key (workspace_id, user_id)
);

alter table public."Users" enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

do $do$
begin
  if obj_description('public."Users"'::regclass, 'pg_class') is distinct from 'profiles' then
    comment on table public."Users" is 'profiles';
  end if;

  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  ) then
    execute $fn$
      create function public.handle_new_user()
      returns trigger
      language plpgsql
      security definer
      set search_path = ''
      as $body$
      begin
        insert into public."Users" (id, first_name, last_name, email)
        values (
          new.id,
          new.raw_user_meta_data->>'first_name',
          new.raw_user_meta_data->>'last_name',
          new.email
        );
        return new;
      end;
      $body$
    $fn$;
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created' and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'Users' and policyname = 'Users can read their own row'
  ) then
    create policy "Users can read their own row"
      on public."Users" for select
      using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workspaces' and policyname = 'Users can create workspaces'
  ) then
    create policy "Users can create workspaces"
      on public.workspaces for insert
      with check (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workspaces' and policyname = 'Users can read their workspaces'
  ) then
    create policy "Users can read their workspaces"
      on public.workspaces for select
      using (
        auth.uid() = owner_id
        or exists (
          select 1 from public.workspace_members
          where workspace_members.workspace_id = workspaces.id
            and workspace_members.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workspace_members' and policyname = 'Owners can add members'
  ) then
    create policy "Owners can add members"
      on public.workspace_members for insert
      with check (
        exists (
          select 1 from public.workspaces
          where workspaces.id = workspace_members.workspace_id
            and workspaces.owner_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workspace_members' and cmd = 'SELECT'
  ) then
    create policy "Users can read workspace members"
      on public.workspace_members for select
      using (user_id = auth.uid());
  end if;
end
$do$;
