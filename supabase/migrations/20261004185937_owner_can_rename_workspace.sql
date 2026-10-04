revoke update on public.workspaces from anon, authenticated;
grant update (name) on public.workspaces to authenticated;

alter table public.workspaces
  add constraint workspaces_name_length
  check (char_length(btrim(name)) between 1 and 80);

create policy "Owner can rename workspace"
  on public.workspaces for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
