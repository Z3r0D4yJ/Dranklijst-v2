begin;

-- The app has exactly three roles:
-- lid = member, leiding = manages one age group, kas = leiding + app-wide beheer.
update public.profiles
set role = 'kas'
where role in ('admin', 'groepsleiding');

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('lid', 'leiding', 'kas'));

create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case public.get_my_role()
    when 'kas'     then required_role in ('kas', 'leiding', 'lid')
    when 'leiding' then required_role in ('leiding', 'lid')
    when 'lid'     then required_role = 'lid'
    else false
  end;
$$;

create or replace function public.get_my_leiding_group()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select gm.group_id
  from public.group_members gm
  join public.groups g on g.id = gm.group_id
  where gm.user_id = auth.uid()
    and g.name != 'Leiding'
    and public.get_my_role() in ('leiding', 'kas')
  order by gm.joined_at asc
  limit 1;
$$;

create or replace function public.set_user_role_and_group(
  p_user_id uuid,
  p_role text,
  p_group_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leiding_group_id uuid;
  v_group_name text;
begin
  if not public.has_role('kas') then
    raise exception 'Niet gemachtigd om gebruikers te beheren.';
  end if;

  if p_role not in ('lid', 'leiding', 'kas') then
    raise exception 'Ongeldige rol.';
  end if;

  if p_group_id is null then
    raise exception 'Voor deze rol is een groep verplicht.';
  end if;

  select name
  into v_group_name
  from public.groups
  where id = p_group_id;

  if v_group_name is null then
    raise exception 'Ongeldige groep.';
  end if;

  if v_group_name = 'Leiding' then
    raise exception 'De groep Leiding kan niet als hoofdgroep gekozen worden.';
  end if;

  update public.profiles
  set role = p_role
  where id = p_user_id;

  if not found then
    raise exception 'Gebruiker niet gevonden.';
  end if;

  delete from public.group_members
  where user_id = p_user_id;

  insert into public.group_members (user_id, group_id)
  values (p_user_id, p_group_id);

  if p_role in ('leiding', 'kas') then
    select id
    into v_leiding_group_id
    from public.groups
    where name = 'Leiding'
    limit 1;

    if v_leiding_group_id is not null and v_leiding_group_id <> p_group_id then
      insert into public.group_members (user_id, group_id)
      values (p_user_id, v_leiding_group_id)
      on conflict (user_id, group_id) do nothing;
    end if;
  end if;
end;
$$;

grant execute on function public.set_user_role_and_group(uuid, text, uuid) to authenticated;

create or replace function public.resolve_join_request(
  p_request_id uuid,
  p_approved boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.join_requests%rowtype;
begin
  select *
  into v_request
  from public.join_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Aanvraag niet gevonden.';
  end if;

  if not (
    public.has_role('kas')
    or (
      public.get_my_role() = 'leiding'
      and v_request.group_id = public.get_my_leiding_group()
    )
  ) then
    raise exception 'Niet gemachtigd om deze aanvraag te behandelen.';
  end if;

  update public.join_requests
  set status = case when p_approved then 'approved' else 'rejected' end,
      resolved_at = now(),
      resolved_by = auth.uid()
  where id = p_request_id;

  if p_approved then
    insert into public.group_members (user_id, group_id)
    values (v_request.user_id, v_request.group_id)
    on conflict (user_id, group_id) do nothing;
  end if;
end;
$$;

grant execute on function public.resolve_join_request(uuid, boolean) to authenticated;

-- profiles
drop policy if exists "Elevated roles can read all profiles" on public.profiles;
drop policy if exists "Kas can read all profiles" on public.profiles;
create policy "Kas can read all profiles"
  on public.profiles for select
  using (public.has_role('kas'));

drop policy if exists "Leiding can read profiles for own group" on public.profiles;
create policy "Leiding can read profiles for own group"
  on public.profiles for select
  using (
    public.get_my_role() = 'leiding'
    and (
      exists (
        select 1
        from public.group_members gm
        where gm.user_id = profiles.id
          and gm.group_id = public.get_my_leiding_group()
      )
      or exists (
        select 1
        from public.join_requests jr
        where jr.user_id = profiles.id
          and jr.group_id = public.get_my_leiding_group()
      )
    )
  );

-- group_members
drop policy if exists "Elevated roles can read all members" on public.group_members;
drop policy if exists "Admin can manage group members" on public.group_members;
drop policy if exists "Kas can manage group members" on public.group_members;
create policy "Kas can manage group members"
  on public.group_members for all
  using (public.has_role('kas'))
  with check (public.has_role('kas'));

drop policy if exists "Leiding can read their group members" on public.group_members;
drop policy if exists "Leiding and kas can read their group members" on public.group_members;
create policy "Leiding can read own group members"
  on public.group_members for select
  using (
    public.get_my_role() = 'leiding'
    and group_id = public.get_my_leiding_group()
  );

drop policy if exists "Leiding can remove members from own group" on public.group_members;
create policy "Leiding can remove members from own group"
  on public.group_members for delete
  using (
    public.get_my_role() = 'leiding'
    and group_id = public.get_my_leiding_group()
  );

-- join_requests
drop policy if exists "Elevated roles can read all join requests" on public.join_requests;
drop policy if exists "Kas can manage all join requests" on public.join_requests;
create policy "Kas can manage all join requests"
  on public.join_requests for all
  using (public.has_role('kas'))
  with check (public.has_role('kas'));

drop policy if exists "Leiding can read and resolve join requests for own group" on public.join_requests;
drop policy if exists "Leiding and kas can read join requests for own group" on public.join_requests;
drop policy if exists "Leiding can read join requests for own group" on public.join_requests;
create policy "Leiding can read join requests for own group"
  on public.join_requests for select
  using (
    public.get_my_role() = 'leiding'
    and group_id = public.get_my_leiding_group()
  );

drop policy if exists "Leiding can update join requests for own group" on public.join_requests;
drop policy if exists "Leiding and kas can update join requests for own group" on public.join_requests;
create policy "Leiding can update join requests for own group"
  on public.join_requests for update
  using (
    public.get_my_role() = 'leiding'
    and group_id = public.get_my_leiding_group()
  );

-- invite_codes
drop policy if exists "Elevated roles can manage all invite codes" on public.invite_codes;
drop policy if exists "Kas can manage all invite codes" on public.invite_codes;
create policy "Kas can manage all invite codes"
  on public.invite_codes for all
  using (public.has_role('kas'))
  with check (public.has_role('kas'));

drop policy if exists "Leiding can manage own group invite code" on public.invite_codes;
drop policy if exists "Leiding and kas can manage own group invite code" on public.invite_codes;
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

-- group_consumptions
drop policy if exists "Elevated roles can read all group consumptions" on public.group_consumptions;
drop policy if exists "Kas can manage all group consumptions" on public.group_consumptions;
create policy "Kas can manage all group consumptions"
  on public.group_consumptions for all
  using (public.has_role('kas'))
  with check (public.has_role('kas'));

drop policy if exists "Leiding can manage group consumptions for own group" on public.group_consumptions;
create policy "Leiding can manage group consumptions for own group"
  on public.group_consumptions for all
  using (
    public.get_my_role() = 'leiding'
    and group_id = public.get_my_leiding_group()
  )
  with check (
    public.get_my_role() = 'leiding'
    and group_id = public.get_my_leiding_group()
  );

-- transactions
drop policy if exists "Elevated roles can read all transactions" on public.transactions;
drop policy if exists "Kas can read all transactions" on public.transactions;
create policy "Kas can read all transactions"
  on public.transactions for select
  using (public.has_role('kas'));

drop policy if exists "Leiding can read transactions for own group" on public.transactions;
drop policy if exists "Leiding and kas can read transactions for own group" on public.transactions;
create policy "Leiding can read transactions for own group"
  on public.transactions for select
  using (
    public.get_my_role() = 'leiding'
    and exists (
      select 1
      from public.group_members
      where user_id = transactions.user_id
        and group_id = public.get_my_leiding_group()
    )
  );

commit;
