begin;

create or replace function public.is_member_of_group(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.user_id = auth.uid()
      and gm.group_id = p_group_id
  );
$$;

create or replace function public.shares_group_with_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members mine
    join public.group_members theirs on theirs.group_id = mine.group_id
    where mine.user_id = auth.uid()
      and theirs.user_id = p_user_id
  );
$$;

grant execute on function public.is_member_of_group(uuid) to authenticated;
grant execute on function public.shares_group_with_user(uuid) to authenticated;

drop policy if exists "Members can read group members" on public.group_members;
create policy "Members can read group members"
  on public.group_members for select
  using (public.is_member_of_group(group_id));

drop policy if exists "Members can read profiles in shared groups" on public.profiles;
create policy "Members can read profiles in shared groups"
  on public.profiles for select
  using (public.shares_group_with_user(id));

commit;
