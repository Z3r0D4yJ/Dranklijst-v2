-- Helper function: get current user role
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper function: check if user has minimum role
create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
as $$
  select case public.get_my_role()
    when 'admin'        then true
    when 'groepsleiding' then required_role in ('groepsleiding', 'kas', 'leiding', 'lid')
    when 'kas'          then required_role in ('kas', 'leiding', 'lid')
    when 'leiding'      then required_role in ('leiding', 'lid')
    when 'lid'          then required_role = 'lid'
    else false
  end;
$$;

-- Helper: get group_id for the leiding user (their own group, not "Leiding")
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
    and public.get_my_role() = 'leiding'
  limit 1;
$$;

-- =====================
-- profiles RLS
-- =====================
create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Elevated roles can read all profiles"
  on public.profiles for select
  using (public.has_role('leiding'));

create policy "Users can update own profile name"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admin can update any profile"
  on public.profiles for update
  using (public.get_my_role() = 'admin');

-- =====================
-- groups RLS
-- =====================
create policy "Everyone can read groups"
  on public.groups for select
  using (auth.uid() is not null);

create policy "Admin can manage groups"
  on public.groups for all
  using (public.get_my_role() = 'admin');

-- =====================
-- group_members RLS
-- =====================
create policy "Users can read own memberships"
  on public.group_members for select
  using (user_id = auth.uid());

create policy "Leiding can read their group members"
  on public.group_members for select
  using (
    public.get_my_role() = 'leiding'
    and group_id = public.get_my_leiding_group()
  );

create policy "Elevated roles can read all members"
  on public.group_members for select
  using (public.has_role('groepsleiding'));

create policy "Admin can manage group members"
  on public.group_members for all
  using (public.get_my_role() = 'admin');

create policy "Leiding can remove members from own group"
  on public.group_members for delete
  using (
    public.get_my_role() = 'leiding'
    and group_id = public.get_my_leiding_group()
  );

-- =====================
-- join_requests RLS
-- =====================
create policy "Users can read own join requests"
  on public.join_requests for select
  using (user_id = auth.uid());

create policy "Users can create join requests"
  on public.join_requests for insert
  with check (user_id = auth.uid() and status = 'pending');

create policy "Leiding can read and resolve join requests for own group"
  on public.join_requests for select
  using (
    public.get_my_role() = 'leiding'
    and group_id = public.get_my_leiding_group()
  );

create policy "Leiding can update join requests for own group"
  on public.join_requests for update
  using (
    public.get_my_role() = 'leiding'
    and group_id = public.get_my_leiding_group()
  );

create policy "Elevated roles can read all join requests"
  on public.join_requests for select
  using (public.has_role('groepsleiding'));

-- =====================
-- consumptions RLS
-- =====================
create policy "Authenticated users can read active consumptions"
  on public.consumptions for select
  using (auth.uid() is not null and is_active = true);

create policy "Admin can manage consumptions"
  on public.consumptions for all
  using (public.get_my_role() = 'admin');

-- =====================
-- group_consumptions RLS
-- =====================
create policy "Users can read visible group consumptions for own group"
  on public.group_consumptions for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.group_members
      where user_id = auth.uid() and group_id = group_consumptions.group_id
    )
  );

create policy "Elevated roles can read all group consumptions"
  on public.group_consumptions for select
  using (public.has_role('groepsleiding'));

create policy "Leiding can manage group consumptions for own group"
  on public.group_consumptions for all
  using (
    public.get_my_role() = 'leiding'
    and group_id = public.get_my_leiding_group()
  );

create policy "Admin can manage all group consumptions"
  on public.group_consumptions for all
  using (public.get_my_role() = 'admin');

-- =====================
-- periods RLS
-- =====================
create policy "Authenticated users can read active periods"
  on public.periods for select
  using (auth.uid() is not null);

create policy "Kas can manage periods"
  on public.periods for all
  using (public.has_role('kas'));

-- =====================
-- transactions RLS
-- =====================
create policy "Users can read own transactions"
  on public.transactions for select
  using (user_id = auth.uid());

create policy "Users can create own transactions"
  on public.transactions for insert
  with check (user_id = auth.uid());

create policy "Leiding can read transactions for own group"
  on public.transactions for select
  using (
    public.get_my_role() = 'leiding'
    and exists (
      select 1 from public.group_members
      where user_id = transactions.user_id
        and group_id = public.get_my_leiding_group()
    )
  );

create policy "Elevated roles can read all transactions"
  on public.transactions for select
  using (public.has_role('groepsleiding'));

-- =====================
-- payments RLS
-- =====================
create policy "Users can read own payments"
  on public.payments for select
  using (user_id = auth.uid());

create policy "Users can update own payment status to pending"
  on public.payments for update
  using (user_id = auth.uid())
  with check (status = 'pending');

create policy "Kas can read and manage all payments"
  on public.payments for all
  using (public.has_role('kas'));

-- =====================
-- push_subscriptions RLS
-- =====================
create policy "Users can manage own push subscriptions"
  on public.push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Service role can read push subscriptions"
  on public.push_subscriptions for select
  using (public.has_role('kas'));
