create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 60),
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  unique (workspace_id, id)
);

create table public.boards (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  category_id  uuid,
  name         text not null check (char_length(btrim(name)) between 1 and 60),
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, category_id)
    references public.categories (workspace_id, id)
    on delete set null (category_id)
);

create index boards_category_id_idx on public.boards (category_id);

alter table public.categories enable row level security;
alter table public.boards enable row level security;

revoke update on public.categories from anon, authenticated;
grant update (name, position) on public.categories to authenticated;
revoke update on public.boards from anon, authenticated;
grant update (name, position, category_id) on public.boards to authenticated;

create policy "Members can read categories"
  on public.categories for select
  to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "Owner can create categories"
  on public.categories for insert
  to authenticated
  with check (private.is_workspace_owner(workspace_id));

create policy "Owner can update categories"
  on public.categories for update
  to authenticated
  using (private.is_workspace_owner(workspace_id))
  with check (private.is_workspace_owner(workspace_id));

create policy "Owner can delete categories"
  on public.categories for delete
  to authenticated
  using (private.is_workspace_owner(workspace_id));

create policy "Members can read boards"
  on public.boards for select
  to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "Owner can create boards"
  on public.boards for insert
  to authenticated
  with check (private.is_workspace_owner(workspace_id));

create policy "Owner can update boards"
  on public.boards for update
  to authenticated
  using (private.is_workspace_owner(workspace_id))
  with check (private.is_workspace_owner(workspace_id));

create policy "Owner can delete boards"
  on public.boards for delete
  to authenticated
  using (private.is_workspace_owner(workspace_id));

create or replace function private.add_default_board()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.boards (workspace_id, name) values (new.id, 'General');
  return new;
end;
$$;

create trigger on_workspace_created_add_board
  after insert on public.workspaces
  for each row execute function private.add_default_board();

insert into public.boards (workspace_id, name)
select id, 'General' from public.workspaces;

alter table public.tasks add column board_id uuid;

alter table public.tasks disable trigger tasks_set_updated_at;
update public.tasks t
set board_id = b.id
from public.boards b
where b.workspace_id = t.workspace_id;
alter table public.tasks enable trigger tasks_set_updated_at;

alter table public.tasks
  alter column board_id set not null,
  add foreign key (workspace_id, board_id)
    references public.boards (workspace_id, id)
    on delete cascade;

create index tasks_board_id_idx on public.tasks (board_id);
