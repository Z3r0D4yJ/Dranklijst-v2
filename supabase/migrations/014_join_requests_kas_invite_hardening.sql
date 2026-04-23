begin;

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

  if p_role not in ('lid', 'leiding', 'kas', 'groepsleiding') then
    raise exception 'Ongeldige rol.';
  end if;

  if p_role in ('lid', 'leiding', 'kas') and p_group_id is null then
    raise exception 'Voor deze rol is een groep verplicht.';
  end if;

  if p_group_id is not null then
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
  end if;

  update public.profiles
  set role = p_role
  where id = p_user_id;

  if not found then
    raise exception 'Gebruiker niet gevonden.';
  end if;

  delete from public.group_members
  where user_id = p_user_id;

  if p_role in ('lid', 'leiding', 'kas') then
    insert into public.group_members (user_id, group_id)
    values (p_user_id, p_group_id);
  end if;

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

create or replace function public.submit_join_request(p_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_group_name text;
  v_request_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Niet ingelogd';
  end if;

  select name
  into v_group_name
  from public.groups
  where id = p_group_id;

  if v_group_name is null then
    raise exception 'Ongeldige groep';
  end if;

  if v_group_name = 'Leiding' then
    raise exception 'Je kan deze groep niet aanvragen.';
  end if;

  if exists (
    select 1
    from public.group_members
    where user_id = v_user_id
      and group_id = p_group_id
  ) then
    raise exception 'Je bent al lid van deze groep.';
  end if;

  select id
  into v_request_id
  from public.join_requests
  where user_id = v_user_id
    and group_id = p_group_id
    and status = 'pending'
  order by created_at desc
  limit 1;

  if v_request_id is not null then
    return v_request_id;
  end if;

  update public.join_requests
  set status = 'pending',
      created_at = now(),
      resolved_at = null,
      resolved_by = null
  where id = (
    select id
    from public.join_requests
    where user_id = v_user_id
      and group_id = p_group_id
      and status = 'rejected'
    order by created_at desc
    limit 1
  )
  returning id into v_request_id;

  if v_request_id is not null then
    return v_request_id;
  end if;

  insert into public.join_requests (user_id, group_id, status)
  values (v_user_id, p_group_id, 'pending')
  returning id into v_request_id;

  return v_request_id;
end;
$$;

grant execute on function public.submit_join_request(uuid) to authenticated;

create or replace function public.submit_join_request_by_invite_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_group_name text;
  v_request_id uuid;
begin
  if auth.uid() is null then
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

  v_request_id := public.submit_join_request(v_group_id);

  return jsonb_build_object(
    'request_id', v_request_id,
    'group_id', v_group_id,
    'group_name', v_group_name
  );
end;
$$;

grant execute on function public.submit_join_request_by_invite_code(text) to authenticated;

create or replace function public.join_via_invite(p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  v_result := public.submit_join_request_by_invite_code(p_code);
  return v_result->>'group_name';
end;
$$;

grant execute on function public.join_via_invite(text) to authenticated;

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
    public.has_role('groepsleiding')
    or (
      public.get_my_role() in ('leiding', 'kas')
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

drop policy if exists "Leiding can read their group members" on public.group_members;
create policy "Leiding and kas can read their group members"
  on public.group_members for select
  using (
    public.get_my_role() in ('leiding', 'kas')
    and group_id = public.get_my_leiding_group()
  );

drop policy if exists "Leiding can read and resolve join requests for own group" on public.join_requests;
drop policy if exists "Leiding and kas can read join requests for own group" on public.join_requests;
create policy "Leiding and kas can read join requests for own group"
  on public.join_requests for select
  using (
    public.get_my_role() in ('leiding', 'kas')
    and group_id = public.get_my_leiding_group()
  );

drop policy if exists "Leiding can update join requests for own group" on public.join_requests;
drop policy if exists "Leiding and kas can update join requests for own group" on public.join_requests;
create policy "Leiding and kas can update join requests for own group"
  on public.join_requests for update
  using (
    public.get_my_role() in ('leiding', 'kas')
    and group_id = public.get_my_leiding_group()
  );

drop policy if exists "Leiding can manage own group invite code" on public.invite_codes;
drop policy if exists "Leiding and kas can manage own group invite code" on public.invite_codes;
create policy "Leiding and kas can manage own group invite code"
  on public.invite_codes for all
  using (
    public.get_my_role() in ('leiding', 'kas')
    and group_id = public.get_my_leiding_group()
  )
  with check (
    public.get_my_role() in ('leiding', 'kas')
    and group_id = public.get_my_leiding_group()
  );

commit;
