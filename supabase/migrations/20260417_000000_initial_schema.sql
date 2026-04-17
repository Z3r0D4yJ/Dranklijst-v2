-- -----------------------------------------------------------------------------
-- Migration: initial_schema
-- Date: 2026-04-17
-- Purpose: Volledige initiële database setup voor Dranklijst
-- -----------------------------------------------------------------------------

-- Extensies
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

create type public.user_role as enum ('super_admin', 'group_admin', 'member');
create type public.period_status as enum ('active', 'closed');
create type public.membership_status as enum ('pending', 'active', 'removed');

-- -----------------------------------------------------------------------------
-- Helper: updated_at trigger
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Tabel: groups
-- -----------------------------------------------------------------------------

create table public.groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  invite_code text unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_groups_invite_code on public.groups(invite_code);

create trigger trg_groups_updated
  before update on public.groups
  for each row execute function public.set_updated_at();

alter table public.groups enable row level security;

-- -----------------------------------------------------------------------------
-- Tabel: users (extends auth.users)
-- -----------------------------------------------------------------------------

create table public.users (
  id                 uuid primary key references auth.users(id) on delete cascade,
  display_name       text not null,
  role               public.user_role not null default 'member',
  group_id           uuid references public.groups(id) on delete set null,
  membership_status  public.membership_status not null default 'pending',
  joined_group_at    timestamptz,
  pin_hash           text,
  biometric_enabled  boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_users_group_id on public.users(group_id);
create index idx_users_role on public.users(role);

create trigger trg_users_updated
  before update on public.users
  for each row execute function public.set_updated_at();

-- Trigger: maak automatisch een public.users record aan bij signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger trg_auth_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.users enable row level security;

-- -----------------------------------------------------------------------------
-- Tabel: products (beheerd door super_admin)
-- -----------------------------------------------------------------------------

create table public.products (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  icon        text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_products_sort_order on public.products(sort_order);

create trigger trg_products_updated
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

-- Initiële producten
insert into public.products (name, icon, sort_order) values
  ('Pint',   'Beer',     1),
  ('Cola',   'Coffee',   2),
  ('Fanta',  'Orange',   3),
  ('Water',  'Drop',     4);

-- -----------------------------------------------------------------------------
-- Tabel: group_products (prijzen per groep)
-- -----------------------------------------------------------------------------

create table public.group_products (
  id          uuid primary key default uuid_generate_v4(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  price       numeric(10, 2) not null check (price >= 0),
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (group_id, product_id)
);

create index idx_group_products_group_id on public.group_products(group_id);

create trigger trg_group_products_updated
  before update on public.group_products
  for each row execute function public.set_updated_at();

alter table public.group_products enable row level security;

-- -----------------------------------------------------------------------------
-- Tabel: periods
-- -----------------------------------------------------------------------------

create table public.periods (
  id          uuid primary key default uuid_generate_v4(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  name        text not null,
  status      public.period_status not null default 'active',
  started_at  timestamptz not null default now(),
  closed_at   timestamptz,
  closed_by   uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Maximaal 1 actieve periode per groep
create unique index idx_periods_one_active_per_group
  on public.periods(group_id)
  where (status = 'active');

create index idx_periods_group_id on public.periods(group_id);

create trigger trg_periods_updated
  before update on public.periods
  for each row execute function public.set_updated_at();

alter table public.periods enable row level security;

-- -----------------------------------------------------------------------------
-- Tabel: consumptions
-- -----------------------------------------------------------------------------

create table public.consumptions (
  id               uuid primary key default uuid_generate_v4(),
  local_uuid       uuid not null,
  user_id          uuid not null references public.users(id) on delete cascade,
  group_id         uuid not null references public.groups(id) on delete cascade,
  group_product_id uuid not null references public.group_products(id) on delete restrict,
  period_id        uuid not null references public.periods(id) on delete restrict,
  quantity         integer not null check (quantity > 0),
  unit_price       numeric(10, 2) not null check (unit_price >= 0),
  registered_at    timestamptz not null default now(),
  deleted_at       timestamptz,
  is_late_sync     boolean not null default false,
  created_at       timestamptz not null default now(),
  unique (user_id, local_uuid)
);

create index idx_consumptions_user_id on public.consumptions(user_id);
create index idx_consumptions_period_id on public.consumptions(period_id);
create index idx_consumptions_group_id on public.consumptions(group_id);
create index idx_consumptions_registered_at on public.consumptions(registered_at);

alter table public.consumptions enable row level security;

-- -----------------------------------------------------------------------------
-- Tabel: payments
-- -----------------------------------------------------------------------------

create table public.payments (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  period_id     uuid not null references public.periods(id) on delete restrict,
  amount        numeric(10, 2) not null check (amount >= 0),
  confirmed_by  uuid references public.users(id) on delete set null,
  confirmed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, period_id)
);

create index idx_payments_user_id on public.payments(user_id);
create index idx_payments_period_id on public.payments(period_id);

create trigger trg_payments_updated
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

-- -----------------------------------------------------------------------------
-- RLS helper functions
-- -----------------------------------------------------------------------------

create or replace function public.is_super_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.is_group_admin(group_uuid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role = 'group_admin'
      and group_id = group_uuid
      and membership_status = 'active'
  );
$$;

create or replace function public.current_user_group()
returns uuid language sql security definer stable as $$
  select group_id from public.users where id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- RLS policies: groups
-- -----------------------------------------------------------------------------

create policy "groups: iedereen mag lezen"
  on public.groups for select
  using (true);

create policy "groups: alleen super_admin mag aanmaken"
  on public.groups for insert
  with check (public.is_super_admin());

create policy "groups: admin mag eigen groep updaten"
  on public.groups for update
  using (public.is_group_admin(id) or public.is_super_admin())
  with check (public.is_group_admin(id) or public.is_super_admin());

-- -----------------------------------------------------------------------------
-- RLS policies: users
-- -----------------------------------------------------------------------------

create policy "users: eigen profiel lezen"
  on public.users for select
  using (
    id = auth.uid()
    or group_id = public.current_user_group()
    or public.is_super_admin()
  );

create policy "users: eigen profiel updaten"
  on public.users for update
  using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

-- Insert wordt gedaan door de trigger handle_new_user (security definer)

-- -----------------------------------------------------------------------------
-- RLS policies: products
-- -----------------------------------------------------------------------------

create policy "products: iedereen mag lezen"
  on public.products for select
  using (true);

create policy "products: alleen super_admin mag beheren"
  on public.products for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- RLS policies: group_products
-- -----------------------------------------------------------------------------

create policy "group_products: leden van groep mogen lezen"
  on public.group_products for select
  using (group_id = public.current_user_group() or public.is_super_admin());

create policy "group_products: admin mag eigen groep beheren"
  on public.group_products for all
  using (public.is_group_admin(group_id) or public.is_super_admin())
  with check (public.is_group_admin(group_id) or public.is_super_admin());

-- -----------------------------------------------------------------------------
-- RLS policies: periods
-- -----------------------------------------------------------------------------

create policy "periods: leden van groep mogen lezen"
  on public.periods for select
  using (group_id = public.current_user_group() or public.is_super_admin());

create policy "periods: admin mag periodes beheren"
  on public.periods for all
  using (public.is_group_admin(group_id) or public.is_super_admin())
  with check (public.is_group_admin(group_id) or public.is_super_admin());

-- -----------------------------------------------------------------------------
-- RLS policies: consumptions
-- -----------------------------------------------------------------------------

create policy "consumptions: leden van groep mogen lezen"
  on public.consumptions for select
  using (group_id = public.current_user_group() or public.is_super_admin());

create policy "consumptions: lid mag eigen consumptie registreren"
  on public.consumptions for insert
  with check (
    user_id = auth.uid()
    and group_id = public.current_user_group()
  );

create policy "consumptions: lid mag eigen consumptie soft-deleten"
  on public.consumptions for update
  using (user_id = auth.uid() or public.is_group_admin(group_id) or public.is_super_admin())
  with check (user_id = auth.uid() or public.is_group_admin(group_id) or public.is_super_admin());

-- -----------------------------------------------------------------------------
-- RLS policies: payments
-- -----------------------------------------------------------------------------

create policy "payments: leden van groep mogen lezen"
  on public.payments for select
  using (
    user_id = auth.uid()
    or public.is_group_admin(public.current_user_group())
    or public.is_super_admin()
  );

create policy "payments: lid mag eigen betaling aanmaken"
  on public.payments for insert
  with check (user_id = auth.uid());

create policy "payments: admin mag betalingen bevestigen"
  on public.payments for update
  using (public.is_group_admin(
    (select group_id from public.periods where id = period_id)
  ) or public.is_super_admin())
  with check (public.is_group_admin(
    (select group_id from public.periods where id = period_id)
  ) or public.is_super_admin());

-- -----------------------------------------------------------------------------
-- View: leaderboard
-- -----------------------------------------------------------------------------

create or replace view public.leaderboard as
select
  c.user_id,
  c.period_id,
  u.display_name,
  sum(c.quantity)                          as total_quantity,
  sum(c.quantity * c.unit_price)::numeric  as total_amount
from public.consumptions c
join public.users u on u.id = c.user_id
where c.deleted_at is null
group by c.user_id, c.period_id, u.display_name;
