# Dranklijst

Offline-first PWA voor jeugdbewegingen om consumpties (pint, cola, fanta...) te registreren in plaats van een papieren streepjeslijst. Vervangt het ouderwetse systeem dat scheurt, verloren gaat en manueel moet worden geteld.

## Belangrijke context

Dit is een persoonlijk project van Jasper voor gebruik in zijn jeugdbeweging. Het moet **super snel** zijn (mensen skippen registratie als het te lang duurt) en **offline werken** (chirogebouw heeft vaak geen bereik).

## Tech stack

- **Frontend**: Next.js 15 (App Router, Turbopack), TypeScript, Tailwind CSS
- **Icons**: Phosphor Icons (`@phosphor-icons/react`)
- **State**: Zustand
- **Backend**: Supabase (Postgres + Auth + Realtime)
- **Local storage**: Dexie.js (IndexedDB wrapper) — **kritiek voor offline**
- **PWA**: Workbox voor service worker + app caching
- **Deploy**: Vercel (op termijn)

## Kernprincipes — NIET onderhandelbaar

1. **Offline-first**: UI wacht NOOIT op de server. Alles eerst lokaal, sync op achtergrond.
2. **Snelheid boven alles**: Max 2-3 taps om te registreren. Geen bevestigingsdialogen, wel toasts met undo.
3. **Haptische feedback** bij elke actie (géén geluid — werkt in luide ruimtes).
4. **Één user zit in exact één groep.** Geen multi-group membership (vereenvoudigt alles).
5. **Periodes zijn definitief na afsluiten.** Geen heropenen mogelijk.
6. **Prijs wordt bevroren per consumption** (unit_price gekopieerd op registratiemoment).

## Architectuur — hoe data stroomt

```
User actie → Dexie (lokaal) → UI update direct → Sync queue → Supabase
                ↑                                         ↓
                └──────── bij online, automatisch ────────┘
```

**Nooit** direct naar Supabase schrijven vanuit de UI. Altijd via de lokale laag.

## Offline sync regels

- Elke consumption krijgt een `local_uuid` (gegenereerd client-side).
- Database heeft `unique(user_id, local_uuid)` — voorkomt dubbele sync.
- Retry interval: elke 10 seconden bij online.
- **7 dagen limiet**: oudere niet-gesyncte items vragen gebruiker om bewaren/verwijderen.
- **Late sync**: als periode afgesloten is tijdens offline, consumption gaat alsnog naar originele periode met `is_late_sync = true` flag.
- **Device klok check**: als lokale tijd >24u afwijkt van server, gebruik server tijd.

## Database

Zie `supabase/migrations/` voor het volledige schema. 7 hoofdtabellen:

- `groups` — jeugdbewegingen
- `users` — extends `auth.users`, heeft `group_id` + `role`
- `products` — centrale productlijst (super-admin beheert)
- `group_products` — welke producten een groep gebruikt + hun prijs
- `periods` — afrekenperiodes (actief / closed, uniek actief per groep)
- `consumptions` — de registraties zelf (met `local_uuid`, `deleted_at` voor soft delete)
- `payments` — "ik heb betaald" → admin bevestigt

**RLS is strict**. Test altijd queries als authenticated user, niet via service role.

## Rollen

- `super_admin` (Jasper) — beheert productcatalogus, maakt groepen aan
- `group_admin` — beheert één groep: periodes, leden, betalingen
- `member` — registreert consumpties, ziet leaderboard, betaalt

## UX regels

- **Bottom nav** voor member: Registreer / Mij / Ranking / Meer
- **Sidebar nav** voor admin desktop
- **Lijst met +/− stepper** voor producten (geen tegels — mensen bestellen 4 pinten tegelijk)
- **Winkelmandje + bevestigen knop** (groep van items ineens registreren)
- **Toast met groep-undo** 5 seconden (alles ongedaan als gebruiker klikt)
- **Sync indicator alleen bij issues** (rustig = alles ok)
- **Sentence case overal** — nooit Title Case of ALL CAPS

## Belangrijke don'ts

- **Geen** `localStorage`/`sessionStorage` voor app data — gebruik Dexie.
- **Geen** bevestigingsdialogen voor normale acties — alleen undo toasts.
- **Geen** server-roundtrips in de hot path (consumption registratie).
- **Geen** payment processing in de app (afrekenen gebeurt extern).
- **Geen** rondjes trakteren functionaliteit (besloten om niet te doen).
- **Geen** meerdere groepen per user.

## Development workflow

- Branch per feature: `feat/hoofdscherm`, `feat/offline-sync`, etc.
- Schema changes altijd via nieuwe migratie in `supabase/migrations/`.
- Test offline scenarios met DevTools → Network → Offline.
- Test op een echte telefoon (PWA install flow werkt anders dan desktop).

## Buildfasen

1. Setup (Next.js init, Supabase init, schema)
2. Member basics (login, hoofdscherm, registreren online)
3. Offline layer (Dexie, sync queue, retry)
4. Leaderboard + Mij pagina
5. Admin dashboard basics
6. Periodes + betalingen
7. Super-admin panel
8. PWA polish (service worker, install, notifications)
9. Testen & deploy

Momenteel bezig met: **fase 1**.

## Specifieke skill

Voor diepere patterns (database queries, offline sync code, UI componenten), raadpleeg de `dranklijst` skill in `.claude/skills/dranklijst/SKILL.md`.
