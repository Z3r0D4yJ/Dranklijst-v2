begin;

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

  if p_role in ('lid', 'leiding') and p_group_id is null then
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

  if p_role = 'lid' then
    insert into public.group_members (user_id, group_id)
    values (p_user_id, p_group_id);
  elsif p_role = 'leiding' then
    insert into public.group_members (user_id, group_id)
    values (p_user_id, p_group_id);

    select id
    into v_leiding_group_id
    from public.groups
    where name = 'Leiding'
    limit 1;

    if v_leiding_group_id is not null and v_leiding_group_id <> p_group_id then
      insert into public.group_members (user_id, group_id)
      values (p_user_id, v_leiding_group_id);
    end if;
  end if;
end;
$$;

grant execute on function public.set_user_role_and_group(uuid, text, uuid) to authenticated;

commit;
