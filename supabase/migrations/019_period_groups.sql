-- =====================
-- period_groups (junction)
-- =====================
-- Geen rijen voor een period_id = globale periode (geldt voor alle groepen)
-- Eén of meer rijen = scope tot die specifieke groepen.
create table public.period_groups (
  id          uuid primary key default gen_random_uuid(),
  period_id   uuid not null references public.periods(id) on delete cascade,
  group_id    uuid not null references public.groups(id) on delete cascade,
  unique(period_id, group_id)
);

alter table public.period_groups enable row level security;

create policy "period_groups read" on public.period_groups
  for select using (auth.uid() is not null);

create policy "period_groups manage" on public.period_groups
  for all using (public.has_role('kas')) with check (public.has_role('kas'));

create index period_groups_period_idx on public.period_groups(period_id);
create index period_groups_group_idx on public.period_groups(group_id);
