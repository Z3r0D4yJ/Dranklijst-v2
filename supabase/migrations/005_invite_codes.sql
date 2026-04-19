-- Invite codes: each group has one persistent invite code
create table public.invite_codes (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid references public.groups(id) on delete cascade not null unique,
  code       text not null unique,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now()
);

alter table public.invite_codes enable row level security;

create policy "Leiding can manage own group invite code"
  on public.invite_codes for all
  using (
    public.get_my_role() = 'leiding'
    and group_id = public.get_my_leiding_group()
  )
  with check (
    public.get_my_role() = 'leiding'
    and group_id = public.get_my_leiding_group()
  );

create policy "Elevated roles can manage all invite codes"
  on public.invite_codes for all
  using (public.has_role('groepsleiding'));

-- Authenticated users can look up a code to join
create policy "Authenticated users can read invite codes"
  on public.invite_codes for select
  using (auth.uid() is not null);

-- Join a group via invite code — runs as postgres to bypass RLS on group_members
create or replace function public.join_via_invite(p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id   uuid;
  v_group_name text;
  v_user_id    uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Niet ingelogd';
  end if;

  select ic.group_id, g.name
    into v_group_id, v_group_name
    from public.invite_codes ic
    join public.groups g on g.id = ic.group_id
   where ic.code = upper(trim(p_code));

  if v_group_id is null then
    raise exception 'Ongeldige uitnodigingscode';
  end if;

  -- Already a member — succeed silently
  if exists (
    select 1 from public.group_members
     where user_id = v_user_id and group_id = v_group_id
  ) then
    return v_group_name;
  end if;

  -- Clean up any pending join request for this combination
  delete from public.join_requests
   where user_id = v_user_id and group_id = v_group_id;

  insert into public.group_members (user_id, group_id)
  values (v_user_id, v_group_id);

  return v_group_name;
end;
$$;
