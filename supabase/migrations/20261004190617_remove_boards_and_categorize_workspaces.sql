alter table public.tasks drop column board_id;

drop trigger on_workspace_created_add_board on public.workspaces;
drop function private.add_default_board();

drop table public.boards;
drop table public.categories;

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, id)
);

alter table public.categories enable row level security;

revoke update on public.categories from anon, authenticated;
grant update (name, position) on public.categories to authenticated;

create policy "Users can read their categories"
  on public.categories for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their categories"
  on public.categories for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their categories"
  on public.categories for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their categories"
  on public.categories for delete
  to authenticated
  using (user_id = (select auth.uid()));

alter table public.workspace_members
  add column category_id uuid,
  add foreign key (user_id, category_id)
    references public.categories (user_id, id)
    on delete set null (category_id);

create index workspace_members_category_id_idx on public.workspace_members (category_id);

grant update (position, category_id) on public.workspace_members to authenticated;
