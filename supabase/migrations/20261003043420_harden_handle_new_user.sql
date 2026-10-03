-- Fix Supabase advisor warnings for public.handle_new_user:
--   0011 function_search_path_mutable
--   0028/0029 security definer function executable by anon/authenticated
-- The function only needs to run from the on_auth_user_created trigger, which
-- does not require EXECUTE to be granted to the inserting role.

alter function public.handle_new_user() set search_path = '';

revoke execute on function public.handle_new_user() from public, anon, authenticated;
