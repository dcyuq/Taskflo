alter table public.workspace_members add column position integer;

revoke update on public.workspace_members from anon, authenticated;
grant update (position) on public.workspace_members to authenticated;

create policy "Members can order their own workspaces"
  on public.workspace_members for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Members can leave workspaces they don't own"
  on public.workspace_members for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    and not private.is_workspace_owner(workspace_id)
  );

create policy "Owner can delete workspace"
  on public.workspaces for delete
  to authenticated
  using (owner_id = (select auth.uid()));
