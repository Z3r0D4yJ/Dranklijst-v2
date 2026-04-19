-- Enable UUID extension
create extension if not exists "pgcrypto";

-- =====================
-- profiles
-- =====================
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  full_name   text not null,
  role        text not null default 'lid' check (role in ('lid', 'leiding', 'groepsleiding', 'kas', 'admin')),
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'lid'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================
-- groups
-- =====================
create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz default now()
);

alter table public.groups enable row level security;

-- =====================
-- group_members
-- =====================
create table public.group_members (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  group_id    uuid references public.groups(id) on delete cascade not null,
  joined_at   timestamptz default now(),
  unique(user_id, group_id)
);

alter table public.group_members enable row level security;

-- =====================
-- join_requests
-- =====================
create table public.join_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  group_id    uuid references public.groups(id) on delete cascade not null,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id)
);

alter table public.join_requests enable row level security;

-- =====================
-- consumptions
-- =====================
create table public.consumptions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price       numeric(6,2) not null,
  category    text not null check (category in ('alcoholisch', 'niet-alcoholisch')),
  emoji       text,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

alter table public.consumptions enable row level security;

-- =====================
-- group_consumptions
-- =====================
create table public.group_consumptions (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid references public.groups(id) on delete cascade not null,
  consumption_id  uuid references public.consumptions(id) on delete cascade not null,
  custom_price    numeric(6,2),
  is_visible      boolean default true,
  unique(group_id, consumption_id)
);

alter table public.group_consumptions enable row level security;

-- =====================
-- periods
-- =====================
create table public.periods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  started_at  timestamptz default now(),
  ended_at    timestamptz,
  is_active   boolean default true,
  created_by  uuid references public.profiles(id)
);

alter table public.periods enable row level security;

-- =====================
-- transactions
-- =====================
create table public.transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade not null,
  consumption_id  uuid references public.consumptions(id) not null,
  period_id       uuid references public.periods(id) not null,
  quantity        int not null default 1 check (quantity > 0),
  unit_price      numeric(6,2) not null,
  total_price     numeric(6,2) generated always as (quantity * unit_price) stored,
  created_at      timestamptz default now()
);

alter table public.transactions enable row level security;

-- =====================
-- payments
-- =====================
create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  period_id    uuid references public.periods(id) on delete cascade not null,
  amount_due   numeric(8,2) not null,
  amount_paid  numeric(8,2) default 0,
  status       text not null default 'unpaid' check (status in ('unpaid', 'pending', 'paid')),
  paid_at      timestamptz,
  confirmed_by uuid references public.profiles(id),
  unique(user_id, period_id)
);

alter table public.payments enable row level security;

-- =====================
-- push_subscriptions
-- =====================
create table public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz default now()
);

alter table public.push_subscriptions enable row level security;
