# Dranklijst — PWA voor Chiro jeugdbeweging

## Projectoverzicht
Dranklijst is een Progressive Web App die de papieren streepjeslijst van een Chiro vervangt.
Leden en leiding kunnen digitaal consumpties registreren. De Kas beheert periodes en
betaalverzoeken worden automatisch via push notificaties verstuurd.

## Tech Stack
- **Frontend:** React + Vite (PWA via vite-plugin-pwa)
- **Backend/Database:** Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **Styling:** Tailwind CSS + shadcn/ui
- **Iconen:** Phosphor Icons (`@phosphor-icons/react`)
- **Push notificaties:** Web Push API via Supabase Edge Functions
- **Auth:** Supabase Auth (email/wachtwoord nu, Google OAuth later)
- **Package manager:** npm

## Projectstructuur
```
dranklijst/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── components/        # Herbruikbare UI componenten
│   ├── pages/             # Pagina componenten per route
│   │   ├── auth/          # Login, Register, JoinGroup
│   │   ├── user/          # Home (kopen), Transactions, Leaderboard, Profile
│   │   ├── leiding/       # GroupManagement, GroupTransactions
│   │   └── admin/         # Consumptions, Users, Periods, Finance
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Supabase client, helpers
│   ├── context/           # Auth context, App context
│   └── App.jsx
├── supabase/
│   ├── migrations/        # SQL migraties
│   └── functions/         # Edge Functions (push notificaties)
├── .env.local             # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── AGENTS.md
└── package.json
```

## Omgevingsvariabelen (.env.local)
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
VITE_VAPID_PUBLIC_KEY=xxxx
```

---

## Rollen & Rechten

| Rol            | Beschrijving                                                    | Leaderboard |
|----------------|-----------------------------------------------------------------|-------------|
| `lid`          | Lid van één groep, koopt consumpties                            | Telt mee    |
| `leiding`      | Groep-owner, zit in eigen groep + automatisch in groep Leiding  | Telt niet   |
| `groepsleiding`| Ziet en beheert alles, alle groepen zichtbaar                   | Telt niet   |
| `kas`          | Financieel beheer: periodes starten/sluiten, betalingen checken | Telt niet   |
| `admin`        | Technisch beheer: consumpties, gebruikers, rollen               | Telt niet   |

**Rolhiërarchie voor toegangscontrole:** `admin` > `groepsleiding` > `kas` > `leiding` > `lid`

Row Level Security (RLS) in Supabase afdwingen op basis van deze rollen via `auth.users` metadata.

---

## Groepen

Vaste groepen (worden aangemaakt via seed):
- Reinaertjes, Speelclub, Rakwi, Tito, Keti, Aspi, Leiding

Regels:
- Een `lid` zit in precies één groep
- Een `leiding` zit in zijn eigen groep én automatisch in de groep "Leiding"
- `groepsleiding` en `kas` zien alle groepen
- Om lid te worden dient een gebruiker een join-aanvraag in → leiding van die groep keurt goed/af
- Leiding kan leden verwijderen uit hun groep

---

## Database Schema (Supabase / PostgreSQL)

### `profiles`
Uitbreiding op `auth.users`. Wordt automatisch aangemaakt via trigger bij registratie.
```sql
id          uuid references auth.users primary key
full_name   text not null
role        text not null default 'lid'  -- lid | leiding | groepsleiding | kas | admin
created_at  timestamptz default now()
```

### `groups`
```sql
id          uuid primary key default gen_random_uuid()
name        text not null unique   -- bv. "Rakwi", "Leiding"
description text
created_at  timestamptz default now()
```

### `group_members`
```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references profiles(id) on delete cascade
group_id    uuid references groups(id) on delete cascade
joined_at   timestamptz default now()
unique(user_id, group_id)
```

### `join_requests`
```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references profiles(id) on delete cascade
group_id    uuid references groups(id) on delete cascade
status      text default 'pending'   -- pending | approved | rejected
created_at  timestamptz default now()
resolved_at timestamptz
resolved_by uuid references profiles(id)
```

### `consumptions`
Globale pool, beheerd door admin.
```sql
id          uuid primary key default gen_random_uuid()
name        text not null
price       numeric(6,2) not null
category    text not null   -- alcoholisch | niet-alcoholisch | snack
icon        text            -- Phosphor icon naam, bv. "BeerBottle"
is_active   boolean default true
created_at  timestamptz default now()
```

### `group_consumptions`
Welke consumpties zichtbaar zijn per groep (+ optionele prijsoverschrijving).
```sql
id              uuid primary key default gen_random_uuid()
group_id        uuid references groups(id) on delete cascade
consumption_id  uuid references consumptions(id) on delete cascade
custom_price    numeric(6,2)   -- null = gebruik globale prijs
is_visible      boolean default true
unique(group_id, consumption_id)
```

### `periods`
```sql
id          uuid primary key default gen_random_uuid()
name        text not null   -- bv. "Zomerkamp 2025"
started_at  timestamptz default now()
ended_at    timestamptz
is_active   boolean default true
created_by  uuid references profiles(id)
```

### `transactions`
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references profiles(id) on delete cascade
consumption_id  uuid references consumptions(id)
period_id       uuid references periods(id)
quantity        int not null default 1
unit_price      numeric(6,2) not null   -- prijs op moment van aankoop
total_price     numeric(6,2) generated always as (quantity * unit_price) stored
created_at      timestamptz default now()
```

### `payments`
```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references profiles(id) on delete cascade
period_id   uuid references periods(id) on delete cascade
amount_due  numeric(8,2) not null
amount_paid numeric(8,2) default 0
status      text default 'unpaid'   -- unpaid | pending | paid
paid_at     timestamptz
confirmed_by uuid references profiles(id)
unique(user_id, period_id)
```

### `push_subscriptions`
```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references profiles(id) on delete cascade
endpoint    text not null
p256dh      text not null
auth        text not null
created_at  timestamptz default now()
```

---

## Use Cases per Rol

### Lid
- Registreren & inloggen
- Join-aanvraag indienen voor een groep
- Consumpties kopen (eigen groep zichtbaar)
- Eigen transactieoverzicht bekijken per periode
- Leaderboard van eigen groep bekijken
- Push notificatie ontvangen bij periode-afsluiting met verschuldigd bedrag
- Betaling markeren als gedaan in de app

### Leiding
- Alles wat een lid kan
- Join-aanvragen van eigen groep goedkeuren of afwijzen
- Leden van eigen groep bekijken
- Alle transacties van eigen groep bekijken
- Instellen welke consumpties zichtbaar zijn voor eigen groep
- Push notificatie ontvangen bij nieuwe join-aanvraag

### Groepsleiding
- Alles zien: alle groepen, alle transacties, alle leden
- Leaderboard van alle groepen bekijken
- Gebruikersrollen aanpassen
- Financieel overzicht van alle groepen

### Kas
- Nieuwe periode starten (naam opgeven)
- Actieve periode afsluiten
  - Automatisch `payments` records aanmaken per user met openstaand saldo
  - Push notificaties versturen naar alle gebruikers met saldo > 0
- Betaalstatus per persoon per periode bekijken
- Betaling manueel bevestigen (na controle)
- Financieel overzicht exporteren naar CSV

### Admin
- CRUD voor consumpties (globale pool)
- Per groep instellen welke consumpties actief zijn
- Gebruikers beheren (rollen toewijzen, deactiveren)
- Alle data inzien

---

## Schermen & Routing

### Publiek (niet ingelogd)
- `/login` — Inloggen
- `/register` — Registreren

### Gebruiker (alle ingelogde users)
- `/` — Home: consumpties kopen
- `/transactions` — Mijn transacties
- `/leaderboard` — Leaderboard van eigen groep
- `/profile` — Profiel & betaalstatus

### Leiding
- `/leiding/groep` — Groepsbeheer (aanvragen, leden)
- `/leiding/transacties` — Transacties van eigen groep

### Admin / Kas / Groepsleiding
- `/admin/consumpties` — Consumptie beheer
- `/admin/gebruikers` — Gebruikersbeheer
- `/admin/periodes` — Periodes beheren
- `/admin/financieel` — Financieel overzicht + CSV export

**Routing:** Gebruik React Router v6 met beschermde routes op basis van rol.

---

## Push Notificaties

Implementatie via Web Push API + Supabase Edge Functions:

| Trigger                     | Ontvanger                     | Bericht                                                        |
|-----------------------------|-------------------------------|----------------------------------------------------------------|
| Periode afgesloten          | Leden met saldo > 0           | "Je hebt X uitstaan voor [periode]. Betaal via [betaalinfo]."  |
| Join-aanvraag ingediend     | Leiding van die groep         | "[Naam] wil lid worden van jouw groep."                        |
| Join-aanvraag goedgekeurd   | Aanvrager                     | "Je bent toegevoegd aan [groep]!"                              |
| Join-aanvraag afgekeurd     | Aanvrager                     | "Je aanvraag voor [groep] werd niet goedgekeurd."              |
| Betaling bevestigd door Kas | Betalende gebruiker           | "Je betaling voor [periode] is bevestigd."                     |

---

## Leaderboard Regels
- Enkel gebruikers met rol `lid` tellen mee
- Ranking op basis van totaal uitgegeven bedrag in de **actieve** periode
- Gegroepeerd per groep
- `groepsleiding` ziet leaderboard van alle groepen
- Leiding ziet leaderboard van eigen groep maar staat er niet in

---

## PWA Vereisten
- `manifest.json` met naam, iconen, `display: standalone`, `theme_color`
- Service Worker via `vite-plugin-pwa` (Workbox)
- Offline fallback pagina
- Installeerbaar op iOS en Android

---

## Ontwikkelfases

### Fase 1 — Auth & Groepen
- [ ] Supabase project opzetten + migraties draaien
- [ ] Registreren / inloggen (email + wachtwoord)
- [ ] Auth context + beschermde routes
- [ ] Join-aanvraag indienen
- [ ] Leiding keurt aanvraag goed/af
- [ ] Profielpagina

### Fase 2 — Consumpties kopen & Transacties
- [ ] Homescherm met consumptielijst (gefilterd op groep)
- [ ] Consumptie kopen (quantity picker + bevestiging)
- [ ] Transactieoverzicht per periode
- [ ] Saldo berekening

### Fase 3 — Leaderboard
- [ ] Leaderboard per groep op basis van actieve periode
- [ ] Groepsleiding ziet alle groepen

### Fase 4 — Periodes & Betaalflow
- [ ] Kas start/sluit periode
- [ ] Payments records aanmaken bij afsluiten
- [ ] Gebruiker markeert betaling als gedaan
- [ ] Kas bevestigt betaling

### Fase 5 — Push Notificaties
- [ ] Web Push subscriptie opslaan
- [ ] Supabase Edge Function voor versturen
- [ ] Triggers koppelen aan periode-afsluiting & join-flow

### Fase 6 — Admin Dashboard
- [ ] CRUD consumpties
- [ ] Gebruikersbeheer + rollen
- [ ] Financieel overzicht
- [ ] CSV export

### Fase 7 — Polish & Optimalisatie
- [ ] Google OAuth via Supabase
- [ ] PWA installatie optimalisatie
- [ ] Offline support
- [ ] Dark mode

---

## Conventies
- Gebruik altijd TypeScript (`.tsx` / `.ts`)
- Supabase client in `src/lib/supabase.ts`
- Alle database queries via Supabase JS client (geen raw fetch naar REST)
- RLS policies afdwingen voor alle tabellen — nooit beveiligingslogica enkel in de frontend
- Componentnamen in PascalCase, bestanden in kebab-case
- Gebruik `react-query` of Supabase Realtime voor data fetching/caching
- Mobiel-first design, admin side ook bruikbaar op desktop

---

## Design System

### Filosofie
Clean, modern mobile-first UI gebouwd op **shadcn/ui** als componentbasis. Diepte en hiërarchie worden uitgedrukt via kleur en witruimte — niet via schaduwen, glows of gradients. Denk fintech-app: kalm, betrouwbaar, snel te begrijpen.

**Absolute regels:**
- Geen emoji's in de UI — altijd Phosphor Icons
- Geen glows, geen gradient achtergronden
- Schaduwen zo minimaal mogelijk: enkel de FAB-knop (center bottom nav) krijgt een subtiele shadow
- Kaarten worden onderscheiden via een lichte border en achtergrondkleur, niet via shadow
- Geen decoratieve effecten, geen animaties die de aandacht opeisen

---

### shadcn/ui
Gebruik shadcn als componentbasis voor alle interactieve elementen. Initialiseer met:

```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog sheet toast table select dropdown-menu badge avatar tabs
```

Overschrijf enkel de primaire kleurvariabelen in `globals.css` naar chiro-blauw:

```css
/* globals.css */
:root {
  --primary: 219 91% 53%;          /* #2563EB */
  --primary-foreground: 0 0% 100%;
  --ring: 219 91% 53%;
}
```

Alle shadcn knoppen, focus rings en actieve states worden daarmee automatisch chiro-blauw. Pas geen andere shadcn tokens aan — de standaard neutrale stijl is de bedoeling. Nooit terugvallen op de default shadcn paarse primaire kleur.

---

### Iconen
Gebruik uitsluitend **Phosphor Icons**. Nooit emoji's in de UI.

```bash
npm install @phosphor-icons/react
```

```tsx
import { Bell, House, Trophy, Plus, Receipt, User, BeerBottle } from '@phosphor-icons/react'
```

- `size={20}` + `weight="regular"` voor navigatie
- `size={18}` + `weight="regular"` voor inline iconen in kaarten
- `weight="bold"` enkel voor visuele accentuering

---

### Kleurenpalet

```css
:root {
  /* Primary — Chiro blauw */
  --color-primary-dark:   #1E3A8A;   /* header achtergrond */
  --color-primary:        #2563EB;   /* knoppen, actieve states */
  --color-primary-light:  #3B82F6;   /* hover states */
  --color-primary-pale:   #EFF6FF;   /* icon wrappers, lichte badges */
  --color-primary-border: #BFDBFE;   /* borders op blauwe highlight rijen */

  /* Neutrals */
  --color-dark:           #0F172A;
  --color-text-primary:   #0F172A;
  --color-text-secondary: #64748B;
  --color-text-muted:     #94A3B8;
  --color-bg:             #F8FAFC;   /* pagina achtergrond */
  --color-surface:        #FFFFFF;   /* kaarten */
  --color-border:         #F1F5F9;   /* kaart borders */
  --color-border-mid:     #E2E8F0;

  /* Semantisch */
  --color-success:        #10B981;
  --color-success-bg:     #ECFDF5;
  --color-warning:        #F59E0B;
  --color-warning-bg:     #FFFBEB;
  --color-warning-border: #FDE68A;
  --color-danger:         #EF4444;
  --color-danger-bg:      #FEF2F2;

  /* Enkel voor de FAB-knop */
  --shadow-fab:           0 4px 12px rgba(37, 99, 235, 0.28);
}
```

---

### Typografie
Font: **Plus Jakarta Sans** via Google Fonts (400 / 500 / 600 / 700 / 800).

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

Gewichten: `400` body — `500` labels — `600` kaarttitels — `700` section headers — `800` bedragen en grote cijfers.

---

### Tailwind config

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#2563EB',
        dark:    '#1E3A8A',
        light:   '#3B82F6',
        pale:    '#EFF6FF',
      },
    },
    fontFamily: {
      sans: ['Plus Jakarta Sans', 'sans-serif'],
    },
    boxShadow: {
      fab: '0 4px 12px rgba(37, 99, 235, 0.28)',
    },
  },
}
```

---

### Paginastructuur (mobiel)
```
+-----------------------------+
|  HEADER  bg:#1E3A8A         |  <- donkerblauw, avatar + naam + bell
|  +---------------------+   |
|  |  BALANCE CARD (wit) |   |  <- witte kaart, hangt over header heen
|  +---------------------+   |
+-----------------------------+
|  BODY  bg:#F8FAFC           |  <- lichtgrijs-blauw
|  secties, kaarten, lijsten  |
+-----------------------------+
|  BOTTOM NAV  bg:wit         |  <- border-top, FAB in midden
+-----------------------------+
```

---

### Kaartcomponent
Geen shadow. Border + achtergrond onderscheiden de kaart van de pagina.

```tsx
<div className="bg-white rounded-[14px] border border-[#F1F5F9] p-4">
  {children}
</div>
```

### Icon wrapper in kaarten
```tsx
<div className="w-10 h-10 bg-[#EFF6FF] rounded-xl flex items-center justify-center">
  <BeerBottle size={18} color="#2563EB" />
</div>
```

### Bottom Navigation FAB
De FAB is de **enige** knop in de app met een shadow.

```tsx
<button
  className="w-[52px] h-[52px] rounded-full bg-blue-600 flex items-center justify-center -mt-5"
  style={{ boxShadow: 'var(--shadow-fab)' }}
>
  <Plus size={22} color="white" />
</button>
```

### Interactie feedback
Enkel `active:scale-[0.98] transition-transform` op knoppen. Geen andere animaties.

### Leaderboard rijen
- Rang 1: `bg-[#FFF7ED] border-[#FDE68A]`, bedrag in `#D97706`
- Rang 2: `bg-[#F8FAFC] border-[#E2E8F0]`
- Rang 3: `bg-[#FFF7ED] border-[#FED7AA]`, bedrag in `#C2410C`
- Eigen rij: `bg-[#EFF6FF] border-[#BFDBFE]`, naam + bedrag in `#2563EB`

---

### Do's & Don'ts

**Doen:**
- shadcn componenten voor alle interactieve UI (buttons, modals, sheets, toasts, tables)
- Border + achtergrondkleur om kaarten te onderscheiden
- Lichtblauwe icon wrappers `bg-[#EFF6FF]` voor iconen in kaarten
- `font-weight: 800` voor bedragen en grote cijfers
- Ruime padding en witruimte in plaats van effecten

**Niet doen:**
- Geen emoji's in de UI
- Geen `box-shadow` op kaarten of lijstitems (enkel FAB)
- Geen `drop-shadow`, `blur`, of `backdrop-filter`
- Geen gradient achtergronden
- Geen glow effecten