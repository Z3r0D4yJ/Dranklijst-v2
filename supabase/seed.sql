-- -----------------------------------------------------------------------------
-- Seed: mock data voor lokale dev en testing
-- Voer dit uit in Supabase SQL Editor NADAT je jezelf hebt aangemeld via de app.
-- -----------------------------------------------------------------------------

-- 1. Testgroep aanmaken
insert into public.groups (id, name, invite_code)
values (
  '00000000-0000-0000-0000-000000000001',
  'Chiro Sint-Jan',
  'CHIRO1'
)
on conflict (id) do nothing;

-- 2. Producten koppelen aan de groep met prijzen
--    (de producten zelf zijn al aangemaakt in de initiële migratie)
insert into public.group_products (group_id, product_id, price, sort_order)
select
  '00000000-0000-0000-0000-000000000001',
  p.id,
  case p.name
    when 'Pint'   then 2.00
    when 'Cola'   then 1.50
    when 'Fanta'  then 1.50
    when 'Water'  then 1.00
  end,
  p.sort_order
from public.products p
where p.name in ('Pint', 'Cola', 'Fanta', 'Water')
on conflict (group_id, product_id) do nothing;

-- 3. Actieve periode aanmaken
insert into public.periods (id, group_id, name, status)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Zomerkamp 2026',
  'active'
)
on conflict (id) do nothing;

-- 4. Koppel JOUW account aan de groep als group_admin
--    Vervang 'jouw-email@voorbeeld.be' door het e-mailadres waarmee je je aanmeldde.
update public.users
set
  role              = 'group_admin',
  group_id          = '00000000-0000-0000-0000-000000000001',
  membership_status = 'active',
  joined_group_at   = now()
where id = (
  select id from auth.users where email = 'jouw-email@voorbeeld.be'
);

-- Controleer of het gelukt is:
-- select id, display_name, role, group_id, membership_status from public.users;
