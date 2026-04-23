begin;

create or replace function public.get_manageable_join_requests(p_group_id uuid default null)
returns table (
  id uuid,
  user_id uuid,
  group_id uuid,
  status text,
  created_at timestamptz,
  full_name text,
  avatar_url text,
  group_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    jr.id,
    jr.user_id,
    jr.group_id,
    jr.status,
    jr.created_at,
    p.full_name,
    p.avatar_url,
    g.name as group_name
  from public.join_requests jr
  join public.profiles p on p.id = jr.user_id
  join public.groups g on g.id = jr.group_id
  where jr.status = 'pending'
    and (
      public.has_role('kas')
      or (
        public.get_my_role() = 'leiding'
        and jr.group_id = public.get_my_leiding_group()
      )
    )
    and (
      p_group_id is null
      or jr.group_id = p_group_id
      or public.has_role('kas')
    )
  order by jr.created_at asc;
$$;

grant execute on function public.get_manageable_join_requests(uuid) to authenticated;

commit;
