begin;

update public.profiles
set role = 'kas'
where role = 'admin';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('lid', 'leiding', 'groepsleiding', 'kas'));

create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
as $$
  select case public.get_my_role()
    when 'groepsleiding' then required_role in ('groepsleiding', 'kas', 'leiding', 'lid')
    when 'kas'           then required_role in ('kas', 'leiding', 'lid')
    when 'leiding'       then required_role in ('leiding', 'lid')
    when 'lid'           then required_role = 'lid'
    else false
  end;
$$;

drop policy if exists "Admin can update any profile" on public.profiles;
create policy "Kas can update any profile"
  on public.profiles for update
  using (public.has_role('kas'))
  with check (public.has_role('kas'));

drop policy if exists "Admin can manage groups" on public.groups;
create policy "Kas can manage groups"
  on public.groups for all
  using (public.has_role('kas'))
  with check (public.has_role('kas'));

drop policy if exists "Admin can manage group members" on public.group_members;
create policy "Kas can manage group members"
  on public.group_members for all
  using (public.has_role('kas'))
  with check (public.has_role('kas'));

drop policy if exists "Admin can manage consumptions" on public.consumptions;
create policy "Kas can manage consumptions"
  on public.consumptions for all
  using (public.has_role('kas'))
  with check (public.has_role('kas'));

drop policy if exists "Admin can manage all group consumptions" on public.group_consumptions;
create policy "Kas can manage all group consumptions"
  on public.group_consumptions for all
  using (public.has_role('kas'))
  with check (public.has_role('kas'));

commit;
