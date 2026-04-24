begin;

-- Allow kas to delete any transaction
create policy "Kas can delete transactions"
  on public.transactions for delete
  using (public.has_role('kas'));

-- Fix consumptions management: old policy referenced 'admin' role which no longer exists
drop policy if exists "Admin can manage consumptions" on public.consumptions;
create policy "Kas can manage consumptions"
  on public.consumptions for all
  using (public.has_role('kas'));

-- Allow kas to read all consumptions (not just active ones)
drop policy if exists "Authenticated users can read active consumptions" on public.consumptions;
create policy "Users can read active consumptions"
  on public.consumptions for select
  using (auth.uid() is not null and is_active = true);

create policy "Kas can read all consumptions"
  on public.consumptions for select
  using (public.has_role('kas'));

commit;
