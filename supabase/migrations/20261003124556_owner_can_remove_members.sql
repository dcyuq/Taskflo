create policy "Owner can remove other members"
  on public.workspace_members for delete
  to authenticated
  using (
    private.is_workspace_owner(workspace_id)
    and user_id <> (select auth.uid())
  );
