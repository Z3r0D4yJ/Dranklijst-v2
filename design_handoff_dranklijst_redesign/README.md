# Handoff: Dranklijst Redesign

## Overview
Volledige visuele refresh van de Dranklijst PWA: layout, kleuren, typografie, darkmode en een set kalme animaties. Het doel is om de bestaande functionaliteit ongewijzigd te laten en **enkel** de presentatielaag (components, tokens, transitions) aan te passen.

## About the Design Files
De bestanden in deze bundle zijn **design references** gemaakt in HTML/JSX — prototypes die bedoeling en gevoel tonen, geen productiecode om letterlijk te kopiëren. De taak is om deze designs **te hermaken binnen de bestaande codebase** (React 19 + Vite + Tailwind + shadcn/ui + Phosphor Icons) met de reeds gevestigde patronen. Gebruik de HTML als visuele referentie, gebruik dit README als specificatie.

## Fidelity
**High-fidelity.** Alle kleuren, typografie, spacing, radii en animatie-timings zijn definitief. Neem de waarden één-op-één over.

---

## Design Tokens

### Kleur — Light mode
Werk deze waarden in `src/index.css` onder `:root`:
```css
--color-bg:             #F4F6FB;   /* iets koeler dan huidige #F8FAFC */
--color-surface:        #FFFFFF;
--color-surface-alt:    #F8FAFC;
--color-border:         #ECEFF5;
--color-border-mid:     #E2E8F0;
--color-text-primary:   #0B1220;
--color-text-secondary: #5B6678;
--color-text-muted:     #94A3B8;

/* Primary — Chiro blauw, iets rijker dan huidig #2563EB */
--color-primary:        oklch(0.55 0.21 221);   /* ≈ #2D5CE8 */
--color-primary-pale:   oklch(0.97 0.03 221);
--color-primary-border: oklch(0.88 0.06 221);
--color-primary-on:     oklch(0.40 0.20 221);   /* tekst op pale bg */

/* Header — warmer/tonaler dan flat navy */
--color-header:         oklch(0.30 0.14 260);
--color-header-fg:      #FFFFFF;

/* Accent — vos-oranje (mascotte) */
--color-accent:         #EA580C;
--color-accent-bg:      #FFF4ED;
--color-accent-on:      #9A3412;
--color-accent-border:  #FED7AA;

/* Semantic */
--color-success:        #059669;
--color-success-bg:     #ECFDF5;
--color-warning:        #B45309;
--color-warning-bg:     #FFFBEB;
--color-warning-border: #FDE68A;
--color-danger:         #DC2626;
--color-danger-bg:      #FEF2F2;

/* Podium */
--color-gold:           #D97706;
--color-silver:         #64748B;
--color-bronze:         #B45309;

/* FAB is the only element with shadow */
--shadow-fab: 0 8px 20px oklch(0.55 0.21 221 / 0.32),
              0 2px 6px  oklch(0.55 0.21 221 / 0.22);

/* Category tones — kleuren per consumptie-type. Alleen op icon chips, niet op tekst. */
--color-cat-beer-bg:   oklch(0.93 0.07 75);   --color-cat-beer-fg:   oklch(0.48 0.13 75);
--color-cat-wine-bg:   oklch(0.93 0.06 15);   --color-cat-wine-fg:   oklch(0.45 0.14 15);
--color-cat-soda-bg:   oklch(0.93 0.06 25);   --color-cat-soda-fg:   oklch(0.52 0.16 25);
--color-cat-water-bg:  oklch(0.94 0.04 210);  --color-cat-water-fg:  oklch(0.50 0.12 210);
--color-cat-coffee-bg: oklch(0.92 0.04 55);   --color-cat-coffee-fg: oklch(0.42 0.07 55);
```

### Kleur — Dark mode (`.dark`)
```css
--color-bg:             oklch(0.18 0.02 250);
--color-surface:        oklch(0.23 0.02 250);
--color-surface-alt:    oklch(0.28 0.02 250);
--color-border:         oklch(0.30 0.015 250);
--color-border-mid:     oklch(0.36 0.015 250);
--color-text-primary:   oklch(0.96 0.005 250);
--color-text-secondary: oklch(0.72 0.01 250);
--color-text-muted:     oklch(0.54 0.015 250);

--color-primary:        oklch(0.68 0.17 221);   /* lichter voor contrast */
--color-primary-pale:   oklch(0.30 0.06 221);
--color-primary-border: oklch(0.42 0.10 221);
--color-primary-on:     oklch(0.82 0.11 221);

--color-header:         oklch(0.15 0.02 250);   /* diep */
--color-header-fg:      oklch(0.96 0.005 250);

--color-accent:         oklch(0.75 0.19 55);
--color-accent-bg:      oklch(0.32 0.08 55);
--color-accent-on:      oklch(0.88 0.14 55);
--color-accent-border:  oklch(0.45 0.12 55);

--color-success:        oklch(0.75 0.15 155);
--color-success-bg:     oklch(0.30 0.06 155);
--color-warning:        oklch(0.80 0.14 80);
--color-warning-bg:     oklch(0.32 0.06 80);
--color-warning-border: oklch(0.45 0.10 80);
--color-danger:         oklch(0.72 0.17 25);
--color-danger-bg:      oklch(0.30 0.07 25);
``` om deze tokens te exposen via classes (`bg-surface`, `text-primary`, etc.).

### Typografie
Font blijft **Plus Jakarta Sans**. Gewichten 400/500/600/700/800.
Schaal:
| Rol | Size | Weight | Tracking |
|---|---|---|---|
| Page title | 22px | 800 | −0.5 |
| Section label (UPPERCASE) | 11px | 800 | 1.2 |
| Card title | 14px | 700 | −0.1 |
| Body | 13–14px | 500–600 | 0 |
| Bedragen klein | 17px | 800 | −0.3 |
| Bedragen groot (totalen) | 22–40px | 800 | −0.5 tot −1 |
| Helper/muted | 11–12px | 500–600 | 0.2–0.8 |

**Altijd** `font-variant-numeric: tabular-nums` op prijzen en bedragen.

### Spacing / Radii
- Card radius: **16px** (was 14px)
- Icon chip radius: `size × 0.32` (ongeveer 12–14px)
- Button radius: 12–14px
- Phone-level padding: 20px horizontaal
- Gaps tussen cards: 10–14px

### Iconen
Blijf bij **Phosphor Icons** (`@phosphor-icons/react`). In de HTML staan inline SVG-paths — die zijn puur om de lib niet te hoeven laden in de mockup. Mapping:
- `house, receipt, trophy, user, plus, bell, beer, cola, coffee, wine, check, clock, warning, euro, x, minus, cart, sun, moon, monitor, users, gear, download, arrowDown, medal, crown, sparkle`

Size: 22px voor nav, 20px voor inline, 16–18px in icon chips. Weight: `regular` default, `bold` voor accenten.

---

## Screens

### 1. Home (`/`)
**Layout** (top → bottom):
1. **Header** (`bg: --color-header`, padding `14px 20px 32px`):
   - Links: 46×46 ronde avatar (witte bg, 2px witte transparante border) + "Hoi {naam}" (13px/500 opacity 0.7) en "Dorst?" (22px/800 tracking −0.4).
   - Rechts: 40×40 bel-knop op `rgba(255,255,255,0.12)` met 8px accent dot als ongelezen melding.
   - Onder: groep-chip (rgba 0.14 bg, groen dotje) + periode-naam (opacity 0.65).
2. **Balance card** — hangt −22px over header (`margin: -22px 20px 0`):
   - Card: `bg-surface`, `border-color-border`, radius 16, padding 16.
   - Links: 44×44 euro icon chip (primary pale bg).
   - Midden: label "DEZE PERIODE" (11/800/1.2, muted) + bedrag (22/800/−0.5, tabular-nums).
   - Rechts: label "RANG" + `#N` (22/800, primary).
3. **Body** scrollt, 22px top padding, 120px bottom (voor nav):
   - Secties per categorie: label (11/800/1.2 UPPERCASE muted) + "N items" rechts.
   - Grid 2-kolom, gap 10. Elke tile: padding 14, icon chip 38, naam (14/700), prijs (17/800 primary).
4. **Bottom nav** — fixed 88px hoog, 5 slots (Home / Transacties / FAB / Top / Profiel). FAB is 56×56 rond, `margin-top: -22px` zodat hij boven de bar uitsteekt, met `--shadow-fab`. **Enige component met shadow.**

### 2. Transactions (`/transactions`)
1. **Simple header** — witte bg, border-bottom, 22/800 titel + 12/500 muted subtitle (periodenaam).
2. **Total card** — `bg-primary`, white text, radius 20, padding 18/20:
   - Decoratieve cirkels op 8% witte opacity voor diepte.
   - Label "TOTAAL VERBRUIKT" (12/600, 0.75 opacity).
   - Bedrag 40/800/−1 tabular-nums.
   - Status chip onder (rgba 0.18 bg, witte dot + label).
   - Vos-avatar rechtsonder: `position: absolute; right:-20px; bottom:-28px; width:150px; rotate(8deg); opacity:0.95`.
3. **Lijst** gegroepeerd per datum ("Vandaag", "Gisteren", of `weekday d month`):
   - Sectielabel 11/800/1.2.
   - Card met rows (padding 14, border-top tussen rows): 36 icon chip + naam (14/700) + `{qty}× · {HH:mm}` (12/500 muted) + `−€{bedrag}` rechts (15/800 tabular-nums).

### 3. Leaderboard (`/leaderboard`)
1. Simple header "Leaderboard" + "{groep} · {periode}".
2. **Podium card** — `bg-surface`, padding 22/16/18. Drie pilaren (2–1–3 van links):
   - Elke pilaar: 44 ronde knop met crown/medal icon (1e = accent = **vos-oranje**, 2e = silver, 3e = bronze), naam (13/700), bedrag (13/800 primary), dan gekleurde staaf 74–140px hoog met het rangnummer groot wit (22/800) erin.
   - 1e plaats heeft `box-shadow: 0 6px 14px {tone}55`.
3. **Volledige ranking** — sectielabel + card met rows: 30 rang-badge (wit op tone kleur voor top 3, muted op surface-alt voor rest) + naam (14/700) + bedrag (14/800). **Eigen rij** krijgt `bg-primary-pale` en tekst in `primary-on`, met "(jij)" suffix.

### 4. Profile (`/profile`)
1. Simple header "Profiel".
2. **Identity card** — padding 18, gap 14:
   - 62×62 ronde **vos-avatar** (accent-bg, 2px accent-border).
   - Naam (16/800/−0.3), email (13/500 muted).
   - Onder: badges "Lid" (primary tone) en groep (neutral).
3. **Open payment card** (alleen als `openPayments > 0`) — `bg-warning-bg`, `border-warning-border`, radius 16:
   - Warning icon chip + "Nog te betalen" (14/800).
   - Periode-naam + bedrag in warning kleur (22/800).
   - Primary CTA "Ik heb betaald" met check icoon.
4. **Sectie "Weergave"** — segmented control voor thema (Licht/Donker/Auto): 3-kolom grid in `bg-surface-alt` container, actieve tab krijgt `bg-surface` + `text-primary` + kleine shadow.
5. **Sectie "Account"** — card met rows: Meldingen (success toggle), Installeer app, Mijn groep. Elke row: 36 icon chip + label (14/700) + sub (12/500 muted) + trailing.
6. **Uitloggen** — bordered button, danger-kleurige tekst + icon.

### 5. Buy Modal
Bottom sheet (`rounded-t-[28px]`), 12px top padding, 24px bottom, dim `rgba(0,0,0,0.45)` erachter:
- Grab handle 44×4 op borderMid, 18px margin.
- Header: 48 icon chip + categorie label (11/700/1 UPPERCASE muted) + naam (22/800/−0.5) + prijs-per-stuk (13/500 muted). Close-knop 34×34 rechts.
- Qty selector: minus-knop 52×52 (surface-alt bg), **big number** 56/800/−2 tabular-nums, plus-knop 52×52 (primary-pale bg, primary-border).
- Totaal-rij in surface-alt card (radius 14).
- Primary CTA full-width (14px padding, radius 14), shadow-fab, "Kopen voor €X,XX" met cart icoon.

---

## Animations

Voeg dit toe aan `src/index.css` (injecteer één keer globaal):

```css
@keyframes dl-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
@keyframes dl-wiggle {
  0%, 100% { transform: rotate(-2deg); }
  50%      { transform: rotate(2deg); }
}
@keyframes dl-bubble-up {
  0%   { transform: translate(0, 0) scale(0.6); opacity: 0; }
  20%  { opacity: 1; }
  100% { transform: translate(var(--dx, 0), -58px) scale(1); opacity: 0; }
}
@keyframes dl-toast-in {
  0%   { transform: translate(-50%, -24px); opacity: 0; }
  60%  { transform: translate(-50%, 4px);   opacity: 1; }
  100% { transform: translate(-50%, 0);     opacity: 1; }
}
@keyframes dl-check-draw {
  0%   { stroke-dashoffset: 22; }
  100% { stroke-dashoffset: 0; }
}

.dl-skel {
  background: linear-gradient(90deg,
    var(--skel-base) 0%, var(--skel-hl) 50%, var(--skel-base) 100%);
  background-size: 200% 100%;
  animation: dl-shimmer 1.6s linear infinite;
  border-radius: 8px;
}
```

### Regels
- **Geen animatie > 700ms**, behalve idle-wiggle.
- **Respecteer `prefers-reduced-motion`** — alle animaties uit behalve opacity-transitions.
- **Nooit** iets blokkerends — de user kan altijd direct weer tappen.

### Loading
- **Skeleton** — vervang spinners in `Home`, `Transactions`, `Leaderboard`, `Profile` door `.dl-skel` elementen die de layout matchen. Zie `anim-demo.jsx` → `HomeSkeleton` voor concrete grote. Zet op je skeleton container `--skel-base: var(--color-surface-alt); --skel-hl: var(--color-border);`.
- **Vos-wiggle** op de avatar/illustration alleen in empty states en tijdens eerste page-load. `animation: dl-wiggle 2.6s ease-in-out infinite;`

### Na aankoop (het "fijn moment")
Context: `Home.tsx` → `handleSuccess`. Doe daar dit:
1. **Tap feedback** — on click, voeg kortstondig `scale(0.96)` toe aan de tile, transition 180ms `cubic-bezier(0.34, 1.56, 0.64, 1)` (kleine overshoot).
2. **Bubble burst** — render 5 kleine `--color-accent` cirkels (4–7px, diverse `--dx`) vanuit het tap-punt met `animation: dl-bubble-up 640ms cubic-bezier(0.22, 0.61, 0.36, 1) ${delay}ms forwards`. Delays: 0, 40, 90, 130, 170ms. Position absolute in een portaal of in de phone-frame container. Zie `anim-demo.jsx` → `BubbleBurst`.
3. **Balance count-up** — de balance-card toont `€ X,XX` dat in 550ms met ease-out-cubic (`1 − (1−t)³`) optelt van oude naar nieuwe waarde. Zie `useCountUp` hook in `anim-demo.jsx`.
4. **Toast** — top center pill, `bg: var(--color-text-primary)`, 10px/16px padding, radius 99, `animation: dl-toast-in 280ms cubic-bezier(0.2, 0.7, 0.3, 1.2) forwards`. Check-icoon tekent zich in met `dl-check-draw 260ms 100ms ease-out forwards` op een `<path strokeDasharray="22" style="stroke-dashoffset: 22">`. Auto-dismiss na 2200ms.

### Leaderboard
- Bij eerste render: **stagger** rijen met opacity 0→1 + translateY 6→0, 40ms per rij, 180ms duur.
- Als eigen rang verandert: `transition: transform 400ms cubic-bezier(0.2, 0.7, 0.3, 1)` op de row, zodat hij visueel naar de nieuwe positie schuift (gebruik CSS transform / FLIP of Framer Motion's `layout`).

### Betaling bevestigd
- Warning-card cross-faden naar success-card: achtergrond + border-color `transition: 600ms`, icon met cross-fade (fade-out warning, fade-in check), check tekent in met `dl-check-draw`.

### Interactie feedback (globaal)
- Alle knoppen: `active:scale-[0.98]` + `transition-transform 150ms`. Geen hover-scale (PWA touch-first).
- Modal open/close: 220ms ease-out, overlay fade.
- Navigatie tussen tabs: geen transitie — laat React Router routes direct swappen; animatie trekt hier alleen aandacht weg.

---

## State Management
Geen wijzigingen nodig. Supabase/React Query blijft bronwaarheid. De extra state die je **wel** nodig hebt voor animaties:

```ts
// In Home.tsx
const [bubbleBursts, setBubbleBursts] = useState<{id: string; x: number; y: number}[]>([])
const [toast, setToast] = useState<{id: string; name: string} | null>(null)
const animatedSpend = useCountUp(totalSpend, 550)  // custom hook
```

`useCountUp` hook staat in `anim-demo.jsx` — kopieer die over naar `src/hooks/useCountUp.ts`.

---

## Assets
- `assets/fox.png` — mascotte avatar. Gebruiken in:
  - Home header (46×46 ronde avatar, `object-position: center 22%`)
  - Profile identity card (62×62, accent-border)
  - Transactions total card (150×150, rotated 8°, `right:-20px bottom:-28px`, opacity 0.95)
  - Empty states (met wiggle animatie)
- Phosphor Icons — reeds geïnstalleerd.

---

## Implementatie-checklist

1. [ ] Update `src/index.css` — nieuwe CSS variables (light + dark) en keyframes.
2. [ ] Update `tailwind.config.js` — nieuwe kleur-aliases voor de tokens.
3. [ ] Voeg `public/fox.png` toe (al meegeleverd in dit pakket).
4. [ ] Refactor `src/components/BottomNav.tsx` — voeg FAB slot toe in midden (opent Buy flow of snel-kies).
5. [ ] Refactor `src/pages/user/Home.tsx` — nieuwe header met avatar, floating balance card, count-up, bubble burst, toast.
6. [ ] Refactor `src/pages/user/Transactions.tsx` — total card met vos + decoratieve cirkels, datum-groepering.
7. [ ] Refactor `src/pages/user/Leaderboard.tsx` — podium met echte pilaren in accent/silver/bronze, eigen rij in primary-pale.
8. [ ] Refactor `src/pages/user/Profile.tsx` — fox avatar, warning-card voor open payments met primary CTA, segmented thema-control.
9. [ ] Refactor `src/components/BuyModal.tsx` — grotere qty number (56px), icon chip in header, shadow-fab op CTA.
10. [ ] Voeg `src/hooks/useCountUp.ts` toe.
11. [ ] Voeg skeleton loaders toe in elke page (vervang spinners).
12. [ ] Test darkmode switch — alle oklch waarden moeten correct renderen.
13. [ ] Test `prefers-reduced-motion` — alle animaties behalve opacity moeten uitgeschakeld worden.

---

## Files in dit pakket
- `README.md` — dit document
- `Dranklijst Redesign.html` — de live mockup met alle schermen, light + dark, interactief
- `screens.jsx` — React code van de statische mockups (visuele referentie)
- `anim-demo.jsx` — React code van de animatie-demo (count-up, bubbles, toast, skeleton)
- `design-canvas.jsx` — canvas wrapper (niet relevant voor de implementatie)
- `fox.png` — mascotte asset om naar `public/` te kopiëren

---

## Vragen aan de developer
Als iets onduidelijk is, open de HTML mockup in je browser (`open "Dranklijst Redesign.html"`), tik op de geanimeerde telefoon om het gevoel te voelen. Wijkt je implementatie af qua snelheid of toon → vergelijk met de demo, niet met code; de code is één van vele manieren om het gevoel te bereiken.
