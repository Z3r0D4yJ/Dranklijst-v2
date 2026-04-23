begin;

create or replace function public.get_my_leiding_group()
returns uuid
language sql
stable
security definer
as $$
  select gm.group_id
  from public.group_members gm
  join public.groups g on g.id = gm.group_id
  where gm.user_id = auth.uid()
    and g.name != 'Leiding'
    and public.get_my_role() in ('leiding', 'kas')
  limit 1;
$$;

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

create or replace function public.join_via_invite(p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_group_name text;
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

  perform public.submit_join_request(v_group_id);

  return v_group_name;
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

commit;
