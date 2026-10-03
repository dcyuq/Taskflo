-- A task's creator can only delete it while they are still a member of the
-- workspace. The workspace owner can always delete.

drop policy "Creator or owner can delete tasks" on public.tasks;

create policy "Creator (if still a member) or owner can delete tasks"
  on public.tasks for delete
  to authenticated
  using (
    private.is_workspace_owner(workspace_id)
    or (
      created_by = (select auth.uid())
      and private.is_workspace_member(workspace_id)
    )
  );
