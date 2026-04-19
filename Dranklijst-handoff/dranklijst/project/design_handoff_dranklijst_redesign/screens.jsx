// Dranklijst redesign — all 4 core screens, theme-aware via parent `.dark` class.
// Uses the project's design system tokens (Chiro blue, Plus Jakarta Sans, Phosphor-style
// glyphs drawn inline as small SVGs so we don't have to pull a lib).

// ─── Tokens ──────────────────────────────────────────────────
const T = /*EDITMODE-BEGIN*/{
  "accentHue": 221,
  "density": "comfortable",
  "showPodium": true
}/*EDITMODE-END*/;

// Light + dark palette. All hi-fi colors are oklch so the dark swap stays tonally honest.
const palette = (dark, hue = 221) => dark ? {
  // Dark mode — deep slate with a touch of blue
  bg:         'oklch(0.18 0.02 250)',     // page
  surface:    'oklch(0.23 0.02 250)',     // cards
  surfaceAlt: 'oklch(0.28 0.02 250)',     // nested / chips
  border:     'oklch(0.30 0.015 250)',
  borderMid:  'oklch(0.36 0.015 250)',
  text:       'oklch(0.96 0.005 250)',
  textSec:    'oklch(0.72 0.01 250)',
  textMuted:  'oklch(0.54 0.015 250)',
  primary:    `oklch(0.68 0.17 ${hue})`,  // brighter in dark
  primaryFg:  'oklch(0.15 0.02 250)',
  primaryPale:`oklch(0.30 0.06 ${hue})`,
  primaryBorder: `oklch(0.42 0.10 ${hue})`,
  primaryOn:  `oklch(0.82 0.11 ${hue})`,  // text on pale
  success:    'oklch(0.75 0.15 155)',
  successBg:  'oklch(0.30 0.06 155)',
  warning:    'oklch(0.80 0.14 80)',
  warningBg:  'oklch(0.32 0.06 80)',
  warningBorder: 'oklch(0.45 0.10 80)',
  danger:     'oklch(0.72 0.17 25)',
  dangerBg:   'oklch(0.30 0.07 25)',
  gold:       'oklch(0.80 0.15 85)',
  silver:     'oklch(0.72 0.01 250)',
  bronze:     'oklch(0.65 0.12 50)',
  accent:     'oklch(0.75 0.19 55)',      // fox orange — lifted for dark
  accentBg:   'oklch(0.32 0.08 55)',
  accentOn:   'oklch(0.88 0.14 55)',
  accentBorder: 'oklch(0.45 0.12 55)',
  // Category tones (dark)
  catBeerBg:   'oklch(0.34 0.09 75)',  catBeerFg:   'oklch(0.85 0.14 75)',
  catWineBg:   'oklch(0.32 0.09 15)',  catWineFg:   'oklch(0.82 0.14 15)',
  catSodaBg:   'oklch(0.32 0.08 25)',  catSodaFg:   'oklch(0.82 0.14 25)',
  catWaterBg:  'oklch(0.32 0.06 210)', catWaterFg:  'oklch(0.82 0.11 210)',
  catCoffeeBg: 'oklch(0.30 0.05 55)',  catCoffeeFg: 'oklch(0.78 0.09 55)',
  header:     'oklch(0.15 0.02 250)',     // deep header
  headerFg:   'oklch(0.96 0.005 250)',
  fab:        'oklch(0.68 0.18 221)',
  fabShadow:  '0 6px 18px oklch(0.68 0.18 221 / 0.35), 0 2px 4px oklch(0.68 0.18 221 / 0.25)',
} : {
  bg:         '#F4F6FB',                  // very light cool gray
  surface:    '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border:     '#ECEFF5',
  borderMid:  '#E2E8F0',
  text:       '#0B1220',
  textSec:    '#5B6678',
  textMuted:  '#94A3B8',
  primary:    `oklch(0.55 0.21 ${hue})`,  // deeper, richer than default
  primaryFg:  '#FFFFFF',
  primaryPale:`oklch(0.97 0.03 ${hue})`,
  primaryBorder: `oklch(0.88 0.06 ${hue})`,
  primaryOn:  `oklch(0.40 0.20 ${hue})`,
  success:    '#059669',
  successBg:  '#ECFDF5',
  warning:    '#B45309',
  warningBg:  '#FFFBEB',
  warningBorder: '#FDE68A',
  danger:     '#DC2626',
  dangerBg:   '#FEF2F2',
  gold:       '#D97706',
  silver:     '#64748B',
  bronze:     '#B45309',
  accent:     '#EA580C',                  // fox orange
  accentBg:   '#FFF4ED',
  accentOn:   '#9A3412',
  accentBorder: '#FED7AA',
  // Category tones (light) — muted pastels, icon in deeper tone
  catBeerBg:   'oklch(0.93 0.07 75)',  catBeerFg:   'oklch(0.48 0.13 75)',
  catWineBg:   'oklch(0.93 0.06 15)',  catWineFg:   'oklch(0.45 0.14 15)',
  catSodaBg:   'oklch(0.93 0.06 25)',  catSodaFg:   'oklch(0.52 0.16 25)',
  catWaterBg:  'oklch(0.94 0.04 210)', catWaterFg:  'oklch(0.50 0.12 210)',
  catCoffeeBg: 'oklch(0.92 0.04 55)',  catCoffeeFg: 'oklch(0.42 0.07 55)',
  header:     'oklch(0.30 0.14 260)',     // richer header than flat navy
  headerFg:   '#FFFFFF',
  fab:        `oklch(0.55 0.21 ${hue})`,
  fabShadow:  `0 8px 20px oklch(0.55 0.21 ${hue} / 0.32), 0 2px 6px oklch(0.55 0.21 ${hue} / 0.22)`,
};

// ─── Inline Phosphor-ish glyphs ──────────────────────────────
const Icon = ({ d, size = 20, color = 'currentColor', weight = 1.8, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || 'none'}
       stroke={fill ? 'none' : color} strokeWidth={weight}
       strokeLinecap="round" strokeLinejoin="round" style={{ color, flexShrink: 0 }}>
    {d}
  </svg>
);
const I = {
  house: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>,
  receipt: <path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2zM8 8h8M8 12h8M8 16h5"/>,
  trophy: <g><path d="M7 4h10v4a5 5 0 0 1-10 0zM7 6H4a2 2 0 0 0 2 4M17 6h3a2 2 0 0 1-2 4M10 14h4v3h-4zM8 20h8"/></g>,
  user: <g><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></g>,
  plus: <path d="M12 5v14M5 12h14"/>,
  bell: <path d="M6 8a6 6 0 0 1 12 0v5l2 3H4l2-3zM10 19a2 2 0 0 0 4 0"/>,
  beer: <g><path d="M6 8h8v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM14 10h2a3 3 0 0 1 0 6h-2M8 12v5M11 12v5"/></g>,
  cola: <g><path d="M7 4h10l-1 16a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2zM7 9h10M9 14c2-1 4 1 6 0"/></g>,
  coffee: <g><path d="M4 8h12v6a5 5 0 0 1-10 0zM16 10h2a3 3 0 0 1 0 6h-2M4 20h14"/></g>,
  wine: <g><path d="M8 3h8l-1 7a3 3 0 0 1-6 0zM12 13v7M8 20h8"/></g>,
  shot: <path d="M7 4h10l-1 16a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2zM7 10h10"/>,
  water: <path d="M12 3s-6 7-6 12a6 6 0 0 0 12 0c0-5-6-12-6-12z"/>,
  check: <path d="M5 12l5 5L20 7"/>,
  clock: <g><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g>,
  warning: <path d="M12 3 2 21h20zM12 10v5M12 18v.5"/>,
  euro: <path d="M18 6a7 7 0 0 0-11 5h8M15 18a7 7 0 0 1-8-5h8M5 10h2M5 13h2"/>,
  x: <path d="M6 6l12 12M18 6 6 18"/>,
  minus: <path d="M5 12h14"/>,
  cart: <path d="M3 5h2l2 11h12l2-8H7M9 20a1 1 0 1 0 2 0 1 1 0 0 0-2 0zM17 20a1 1 0 1 0 2 0 1 1 0 0 0-2 0z"/>,
  signout: <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M16 8l4 4-4 4M10 12h10"/>,
  sun: <g><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1"/></g>,
  moon: <path d="M21 13a8 8 0 0 1-11-11 8 8 0 1 0 11 11z"/>,
  monitor: <path d="M3 5h18v12H3zM8 21h8M12 17v4"/>,
  users: <g><circle cx="9" cy="8" r="3"/><path d="M3 20c.5-3 2.5-5 6-5s5.5 2 6 5M16 11a3 3 0 0 0 0-6M21 20c-.3-2-1.5-3.5-3.5-4.3"/></g>,
  gear: <g><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></g>,
  download: <path d="M12 4v12M6 11l6 6 6-6M4 20h16"/>,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6"/>,
  medal: <g><circle cx="12" cy="14" r="6"/><path d="M8 3h8l-2 5h-4zM10 14l1.5 1.5L15 12"/></g>,
  crown: <path d="M3 8l4 4 5-7 5 7 4-4v10H3zM3 20h18"/>,
  sparkle: <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>,
};

// ─── Primitives ──────────────────────────────────────────────
const Phone = ({ dark, hue, children, label }) => {
  const c = palette(dark, hue);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {label && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, paddingBottom: 10,
          fontSize: 12, fontWeight: 600, color: 'rgba(40,30,20,0.7)',
          letterSpacing: 0.2, textTransform: 'uppercase',
        }}>{label}</div>
      )}
      <div style={{
        width: 390, height: 844, borderRadius: 52,
        background: '#0b0b0f', padding: 11,
        boxShadow: '0 30px 60px rgba(0,0,0,0.22), 0 8px 18px rgba(0,0,0,0.12), inset 0 0 0 2px rgba(255,255,255,0.06)',
      }}>
        <div className={dark ? 'dark' : ''} style={{
          width: '100%', height: '100%', borderRadius: 42,
          background: c.bg, color: c.text, overflow: 'hidden',
          fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
          position: 'relative', display: 'flex', flexDirection: 'column',
        }}>
          <StatusBar dark={dark} c={c} />
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {children(c)}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBar = ({ dark, c }) => (
  <div style={{
    height: 44, padding: '0 28px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: c.headerFg,
    background: c.header, flexShrink: 0,
  }}>
    <span style={{ letterSpacing: -0.2 }}>20:47</span>
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      <svg width="16" height="10" viewBox="0 0 16 10" fill={c.headerFg}><path d="M1 7h2v2H1zM5 5h2v4H5zM9 3h2v6H9zM13 1h2v8h-2z"/></svg>
      <svg width="14" height="10" viewBox="0 0 14 10" fill={c.headerFg}><path d="M7 2a7 7 0 0 1 5 2l-1 1a5 5 0 0 0-8 0L2 4a7 7 0 0 1 5-2zm0 3a3 3 0 0 1 2 1l-1 1a1.5 1.5 0 0 0-2 0l-1-1a3 3 0 0 1 2-1zm0 3 1 1-1 1-1-1z"/></svg>
      <svg width="24" height="11" viewBox="0 0 24 11" fill="none" stroke={c.headerFg} strokeWidth="1">
        <rect x="0.5" y="0.5" width="20" height="10" rx="2.5"/>
        <rect x="2" y="2" width="16" height="7" rx="1.2" fill={c.headerFg}/>
        <rect x="21" y="3.5" width="2" height="4" rx="1" fill={c.headerFg}/>
      </svg>
    </div>
  </div>
);

const BottomNav = ({ c, active }) => {
  const items = [
    { k: 'home', i: I.house, label: 'Home' },
    { k: 'tx', i: I.receipt, label: 'Transacties' },
    { k: 'fab', i: null, label: '' },
    { k: 'board', i: I.trophy, label: 'Top' },
    { k: 'me', i: I.user, label: 'Profiel' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 88,
      background: c.surface, borderTop: `1px solid ${c.border}`,
      display: 'flex', alignItems: 'flex-start', paddingTop: 8,
    }}>
      {items.map(it => {
        if (it.k === 'fab') return (
          <div key="fab" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <button style={{
              width: 56, height: 56, borderRadius: 28, marginTop: -22,
              background: c.fab, boxShadow: c.fabShadow, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
            }}><Icon d={I.plus} size={24} weight={2.4}/></button>
          </div>
        );
        const isActive = it.k === active;
        return (
          <button key={it.k} style={{
            flex: 1, background: 'none', border: 'none', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 0',
            color: isActive ? c.primary : c.textMuted,
          }}>
            <Icon d={it.i} size={22} weight={isActive ? 2.2 : 1.8}/>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.1 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const Card = ({ c, children, style, muted }) => (
  <div style={{
    background: muted ? c.surfaceAlt : c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 16,
    ...style,
  }}>{children}</div>
);

const IconChip = ({ c, icon, tone = 'primary', size = 40 }) => {
  const bg = tone === 'primary' ? c.primaryPale
           : tone === 'warning' ? c.warningBg
           : tone === 'success' ? c.successBg
           : tone === 'danger'  ? c.dangerBg
           : tone === 'beer'    ? c.catBeerBg
           : tone === 'wine'    ? c.catWineBg
           : tone === 'soda'    ? c.catSodaBg
           : tone === 'water'   ? c.catWaterBg
           : tone === 'coffee'  ? c.catCoffeeBg
           : c.surfaceAlt;
  const fg = tone === 'primary' ? c.primary
           : tone === 'warning' ? c.warning
           : tone === 'success' ? c.success
           : tone === 'danger'  ? c.danger
           : tone === 'beer'    ? c.catBeerFg
           : tone === 'wine'    ? c.catWineFg
           : tone === 'soda'    ? c.catSodaFg
           : tone === 'water'   ? c.catWaterFg
           : tone === 'coffee'  ? c.catCoffeeFg
           : c.textSec;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.32,
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon d={icon} size={Math.round(size * 0.5)} color={fg} weight={1.8}/>
    </div>
  );
};

// ─── Screen: Home ────────────────────────────────────────────
const Home = (c) => {
  const items = [
    { n: 'Cola', p: 1.50, i: I.cola, cat: 'soda' },
    { n: 'Fanta', p: 1.50, i: I.cola, cat: 'soda' },
    { n: 'Water', p: 1.00, i: I.water, cat: 'water' },
    { n: 'Koffie', p: 1.20, i: I.coffee, cat: 'coffee' },
  ];
  const alco = [
    { n: 'Pintje', p: 2.00, i: I.beer, cat: 'beer' },
    { n: 'Duvel', p: 3.00, i: I.beer, cat: 'beer' },
    { n: 'Wijn', p: 3.50, i: I.wine, cat: 'wine' },
    { n: 'Shotje', p: 2.50, i: I.shot, cat: 'beer' },
  ];
  return <>
    {/* Header */}
    <div style={{ background: c.header, padding: '14px 20px 32px', color: c.headerFg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 23, overflow: 'hidden',
            background: '#fff', flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.25)',
          }}>
            <img src="assets/fox.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 22%' }}/>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, opacity: 0.7, margin: 0 }}>Hoi Jens</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '1px 0 0', letterSpacing: -0.4 }}>Dorst?</h1>
          </div>
        </div>
        <button style={{
          width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.12)',
          border: 'none', color: c.headerFg, position: 'relative',
        }}>
          <Icon d={I.bell} size={20} weight={1.8}/>
          <div style={{ position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, background: c.gold, border: `2px solid ${c.header}`}}/>
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, fontWeight: 600 }}>
        <div style={{
          background: 'rgba(255,255,255,0.14)', padding: '5px 10px', borderRadius: 99,
          display: 'flex', alignItems: 'center', gap: 6, letterSpacing: 0.2,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: 'oklch(0.80 0.15 150)'}}/>
          RAKWI
        </div>
        <span style={{ opacity: 0.65 }}>Zomerkamp 2026 · actief</span>
      </div>
    </div>

    {/* Balance card floating over header */}
    <div style={{ margin: '-22px 20px 0', zIndex: 2, position: 'relative' }}>
      <Card c={c} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <IconChip c={c} icon={I.euro} size={44}/>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, letterSpacing: 0.8, margin: 0, textTransform: 'uppercase' }}>Deze periode</p>
          <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: '2px 0 0', color: c.text, fontVariantNumeric: 'tabular-nums' }}>€ 18,50</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, letterSpacing: 0.8, margin: 0, textTransform: 'uppercase' }}>Rang</p>
          <p style={{ fontSize: 22, fontWeight: 800, margin: '2px 0 0', color: c.primary, letterSpacing: -0.5 }}>#4</p>
        </div>
      </Card>
    </div>

    {/* Body */}
    <div style={{ flex: 1, overflow: 'auto', padding: '22px 20px 120px' }}>
      <Section c={c} title="Frisdrank" count={items.length}>
        <Grid items={items} c={c}/>
      </Section>
      <div style={{ height: 20 }}/>
      <Section c={c} title="Alcohol" count={alco.length}>
        <Grid items={alco} c={c}/>
      </Section>
    </div>

    <BottomNav c={c} active="home"/>
  </>;
};

const Section = ({ c, title, count, children }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
      <h2 style={{ fontSize: 11, fontWeight: 800, color: c.textMuted, letterSpacing: 1.2, margin: 0, textTransform: 'uppercase' }}>{title}</h2>
      <span style={{ fontSize: 11, fontWeight: 600, color: c.textMuted }}>{count} items</span>
    </div>
    {children}
  </div>
);

const Grid = ({ c, items }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
    {items.map((it, idx) => (
      <button key={idx} style={{
        background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16,
        padding: 14, textAlign: 'left', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <IconChip c={c} icon={it.i} size={38} tone={it.cat || 'primary'}/>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: c.text, letterSpacing: -0.1 }}>{it.n}</p>
          <p style={{ fontSize: 17, fontWeight: 800, margin: '2px 0 0', color: c.primary, letterSpacing: -0.3, fontVariantNumeric: 'tabular-nums' }}>
            € {it.p.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </button>
    ))}
  </div>
);

// ─── Screen: Transactions ────────────────────────────────────
const Transactions = (c) => {
  const groups = [
    { date: 'Vandaag', items: [
      { n: 'Pintje', q: 2, t: 4.00, when: '20:32', i: I.beer, cat: 'beer' },
      { n: 'Cola', q: 1, t: 1.50, when: '19:12', i: I.cola, cat: 'soda' },
    ]},
    { date: 'Gisteren', items: [
      { n: 'Duvel', q: 1, t: 3.00, when: '23:41', i: I.beer, cat: 'beer' },
      { n: 'Pintje', q: 3, t: 6.00, when: '22:08', i: I.beer, cat: 'beer' },
      { n: 'Water', q: 1, t: 1.00, when: '21:55', i: I.water, cat: 'water' },
    ]},
    { date: 'Zaterdag 11 april', items: [
      { n: 'Shotje', q: 2, t: 5.00, when: '01:22', i: I.shot, cat: 'beer' },
    ]},
  ];
  return <>
    <SimpleHeader c={c} title="Transacties" sub="Zomerkamp 2026"/>

    {/* Total card */}
    <div style={{ padding: '16px 20px 0' }}>
      <div style={{
        background: c.primary, borderRadius: 20, padding: '18px 20px',
        color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: 70, background: 'rgba(255,255,255,0.08)'}}/>
        <div style={{ position: 'absolute', right: 30, bottom: -20, width: 80, height: 80, borderRadius: 40, background: 'rgba(255,255,255,0.06)'}}/>
        <img src="assets/fox.png" alt="" style={{ position: 'absolute', right: -20, bottom: -28, width: 150, height: 150, opacity: 0.95, pointerEvents: 'none', transform: 'rotate(8deg)' }}/>
        <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.75, margin: 0, letterSpacing: 0.6, textTransform: 'uppercase', position: 'relative' }}>Totaal verbruikt</p>
        <p style={{ fontSize: 40, fontWeight: 800, margin: '4px 0 10px', letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }}>€ 18,50</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)',
                      padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: '#fff'}}/>
          Nog te betalen
        </div>
      </div>
    </div>

    {/* List */}
    <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 120px' }}>
      {groups.map((g, gi) => (
        <div key={gi} style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: c.textMuted, letterSpacing: 1.2, margin: '0 0 10px 2px', textTransform: 'uppercase' }}>{g.date}</p>
          <Card c={c} style={{ overflow: 'hidden' }}>
            {g.items.map((it, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px',
                borderTop: i === 0 ? 'none' : `1px solid ${c.border}`,
              }}>
                <IconChip c={c} icon={it.i} size={36} tone={it.cat || 'primary'}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: c.text }}>{it.n}</p>
                  <p style={{ fontSize: 12, fontWeight: 500, margin: '2px 0 0', color: c.textMuted }}>
                    {it.q}× · {it.when}
                  </p>
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, margin: 0, color: c.text, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.2 }}>
                  −€{it.t.toFixed(2).replace('.', ',')}
                </p>
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>

    <BottomNav c={c} active="tx"/>
  </>;
};

const SimpleHeader = ({ c, title, sub, action }) => (
  <div style={{ background: c.surface, borderBottom: `1px solid ${c.border}`, padding: '14px 20px 16px',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: c.text, letterSpacing: -0.5 }}>{title}</h1>
      {sub && <p style={{ fontSize: 12, fontWeight: 500, margin: '2px 0 0', color: c.textMuted }}>{sub}</p>}
    </div>
    {action}
  </div>
);

// ─── Screen: Leaderboard ─────────────────────────────────────
const Leaderboard = (c) => {
  const entries = [
    { r: 1, n: 'Lotte De Smet',   t: 42.50, me: false },
    { r: 2, n: 'Pieter Janssens', t: 38.00, me: false },
    { r: 3, n: 'Emma Vercauteren',t: 31.50, me: false },
    { r: 4, n: 'Jens Peeters',    t: 18.50, me: true  },
    { r: 5, n: 'Sofie Claes',     t: 14.00, me: false },
    { r: 6, n: 'Tom Van Acker',   t: 9.50,  me: false },
  ];
  return <>
    <SimpleHeader c={c} title="Leaderboard" sub="Rakwi · Zomerkamp 2026"/>

    {/* Podium */}
    <div style={{ padding: '22px 20px 12px' }}>
      <Card c={c} style={{ padding: '22px 16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, height: 180 }}>
          {/* 2nd */}
          <Pillar c={c} rank={2} name="Pieter" total={38.00} height={100}/>
          {/* 1st */}
          <Pillar c={c} rank={1} name="Lotte" total={42.50} height={140}/>
          {/* 3rd */}
          <Pillar c={c} rank={3} name="Emma" total={31.50} height={74}/>
        </div>
      </Card>
    </div>

    {/* List */}
    <div style={{ flex: 1, overflow: 'auto', padding: '4px 20px 120px' }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: c.textMuted, letterSpacing: 1.2, margin: '8px 2px 10px', textTransform: 'uppercase' }}>Volledige ranking</p>
      <Card c={c} style={{ overflow: 'hidden' }}>
        {entries.map((e, i) => (
          <Row key={i} c={c} e={e} first={i === 0}/>
        ))}
      </Card>
    </div>

    <BottomNav c={c} active="board"/>
  </>;
};

const Pillar = ({ c, rank, name, total, height }) => {
  const tone = rank === 1 ? c.accent : rank === 2 ? c.silver : c.bronze;
  const toneSoft = `color-mix(in oklch, ${tone} 60%, transparent)`;
  const toneGlow = `color-mix(in oklch, ${tone} 35%, transparent)`;
  const icon = rank === 1 ? I.crown : I.medal;
  return (
    <div style={{ width: 86, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 44, height: 44, borderRadius: 22, background: tone,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: rank === 1 ? `0 6px 14px ${toneGlow}` : 'none' }}>
        <Icon d={icon} size={22} color="#fff" weight={2}/>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: c.text, margin: 0, letterSpacing: -0.1 }}>{name}</p>
      <p style={{ fontSize: 13, fontWeight: 800, color: c.primary, margin: 0, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.2 }}>
        € {total.toFixed(2).replace('.', ',')}
      </p>
      <div style={{
        width: '100%', height, background: `linear-gradient(180deg, ${tone} 0%, ${toneSoft} 100%)`,
        borderRadius: '10px 10px 4px 4px', display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', paddingTop: 10, color: '#fff', fontWeight: 800, fontSize: 22,
        letterSpacing: -0.5,
      }}>{rank}</div>
    </div>
  );
};

const Row = ({ c, e, first }) => {
  const isPodium = e.r <= 3;
  const tone = e.r === 1 ? c.accent : e.r === 2 ? c.silver : e.r === 3 ? c.bronze : null;
  const bg = e.me ? c.primaryPale : 'transparent';
  const nameColor = e.me ? c.primaryOn : c.text;
  const amountColor = e.me ? c.primaryOn : c.text;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px',
      borderTop: first ? 'none' : `1px solid ${c.border}`,
      background: bg,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 15,
        background: tone || c.surfaceAlt, color: isPodium ? '#fff' : c.textSec,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800, letterSpacing: -0.2,
      }}>{e.r}</div>
      <p style={{ flex: 1, fontSize: 14, fontWeight: 700, margin: 0, color: nameColor, minWidth: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {e.n}{e.me && <span style={{ fontWeight: 600, opacity: 0.7, marginLeft: 6 }}>(jij)</span>}
      </p>
      <p style={{ fontSize: 14, fontWeight: 800, margin: 0, color: amountColor, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.2 }}>
        € {e.t.toFixed(2).replace('.', ',')}
      </p>
    </div>
  );
};

// ─── Screen: Profile ─────────────────────────────────────────
const Profile = (c) => {
  return <>
    <SimpleHeader c={c} title="Profiel"/>

    <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 120px' }}>
      {/* Identity */}
      <Card c={c} style={{ padding: 18, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 62, height: 62, borderRadius: 31, overflow: 'hidden',
          background: c.accentBg,
          border: `2px solid ${c.accentBorder}`,
          flexShrink: 0,
        }}>
          <img src="assets/fox.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%' }}/>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 800, margin: 0, color: c.text, letterSpacing: -0.3 }}>Jens Peeters</p>
          <p style={{ fontSize: 13, fontWeight: 500, margin: '2px 0 8px', color: c.textMuted }}>jens.peeters@chiro.be</p>
          <div style={{ display: 'flex', gap: 6 }}>
            <Badge c={c} tone="primary">Lid</Badge>
            <Badge c={c}>Rakwi</Badge>
          </div>
        </div>
      </Card>

      {/* Open payment — warning emphasis */}
      <div style={{
        background: c.warningBg, border: `1px solid ${c.warningBorder}`,
        borderRadius: 16, padding: 16, marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <IconChip c={c} icon={I.warning} tone="warning" size={32}/>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: c.text, margin: 0, letterSpacing: -0.2 }}>Nog te betalen</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: c.text, margin: 0 }}>Paaskamp 2026</p>
            <p style={{ fontSize: 12, fontWeight: 500, color: c.textSec, margin: '2px 0 0' }}>Afgesloten 10 april</p>
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color: c.warning, margin: 0, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5 }}>
            € 24,50
          </p>
        </div>
        <button style={{
          width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none',
          background: c.primary, color: c.primaryFg, fontSize: 14, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer',
        }}>
          <Icon d={I.check} size={16} weight={2.4}/>
          Ik heb betaald
        </button>
      </div>

      {/* Settings group */}
      <p style={{ fontSize: 11, fontWeight: 800, color: c.textMuted, letterSpacing: 1.2, margin: '4px 2px 10px', textTransform: 'uppercase' }}>Weergave</p>
      <Card c={c} style={{ padding: 14, marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: c.textSec, margin: '0 0 10px 2px' }}>Thema</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, background: c.surfaceAlt, padding: 4, borderRadius: 12 }}>
          {[
            { k: 'light', label: 'Licht', i: I.sun, active: !c.bg.startsWith('oklch(0.18') },
            { k: 'dark',  label: 'Donker', i: I.moon, active: c.bg.startsWith('oklch(0.18') },
            { k: 'system',label: 'Auto', i: I.monitor, active: false },
          ].map(opt => (
            <button key={opt.k} style={{
              padding: '10px 6px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: opt.active ? c.surface : 'transparent',
              color: opt.active ? c.primary : c.textSec,
              fontSize: 12, fontWeight: 700,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              boxShadow: opt.active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}>
              <Icon d={opt.i} size={15} weight={2}/>
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <p style={{ fontSize: 11, fontWeight: 800, color: c.textMuted, letterSpacing: 1.2, margin: '4px 2px 10px', textTransform: 'uppercase' }}>Account</p>
      <Card c={c} style={{ overflow: 'hidden', marginBottom: 14 }}>
        <Row2 c={c} icon={I.bell} tone="success" label="Meldingen" sub="Ingeschakeld" trailing={<Toggle on c={c}/>}/>
        <Row2 c={c} icon={I.download} label="Installeer app" sub="Voeg toe aan startscherm"/>
        <Row2 c={c} icon={I.users} label="Mijn groep" sub="Rakwi"/>
      </Card>

      <button style={{
        width: '100%', padding: '14px 16px', borderRadius: 14,
        background: c.surface, border: `1px solid ${c.border}`,
        color: c.danger, fontSize: 14, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        cursor: 'pointer',
      }}>
        <Icon d={I.signout} size={18} weight={2}/>
        Uitloggen
      </button>
    </div>

    <BottomNav c={c} active="me"/>
  </>;
};

const Badge = ({ c, children, tone }) => (
  <span style={{
    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
    background: tone === 'primary' ? c.primaryPale : c.surfaceAlt,
    color:      tone === 'primary' ? c.primaryOn   : c.textSec,
    border: `1px solid ${tone === 'primary' ? c.primaryBorder : c.border}`,
    letterSpacing: 0.2,
  }}>{children}</span>
);

const Row2 = ({ c, icon, tone, label, sub, trailing, first }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px',
                borderTop: first ? 'none' : `1px solid ${c.border}` }}>
    <IconChip c={c} icon={icon} tone={tone || 'neutral'} size={36}/>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: c.text }}>{label}</p>
      {sub && <p style={{ fontSize: 12, fontWeight: 500, margin: '2px 0 0', color: c.textMuted }}>{sub}</p>}
    </div>
    {trailing}
  </div>
);

const Toggle = ({ on, c }) => (
  <div style={{
    width: 40, height: 24, borderRadius: 12, background: on ? c.success : c.borderMid,
    padding: 2, display: 'flex', alignItems: 'center',
    justifyContent: on ? 'flex-end' : 'flex-start', transition: 'all 0.15s',
  }}>
    <div style={{ width: 20, height: 20, borderRadius: 10, background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}/>
  </div>
);

// ─── Screen: Buy modal (inset on its own "phone") ─────────────
const BuyModalScreen = (c) => <>
  {/* Dim prior home below */}
  <div style={{ flex: 1, background: c.bg, position: 'relative' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }}/>
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: c.surface, borderRadius: '28px 28px 0 0',
      padding: '12px 20px 24px',
    }}>
      <div style={{ width: 44, height: 4, borderRadius: 2, background: c.borderMid, margin: '0 auto 18px'}}/>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <IconChip c={c} icon={I.beer} size={48} tone="beer"/>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, margin: 0, letterSpacing: 1, textTransform: 'uppercase' }}>Alcohol</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: c.text, margin: '2px 0 2px', letterSpacing: -0.5 }}>Pintje</h2>
            <p style={{ fontSize: 13, fontWeight: 500, color: c.textSec, margin: 0 }}>€ 2,00 per stuk</p>
          </div>
        </div>
        <button style={{ width: 34, height: 34, borderRadius: 10, background: c.surfaceAlt,
                         border: `1px solid ${c.border}`, color: c.textSec }}>
          <Icon d={I.x} size={16} weight={2.2}/>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '6px 0 18px' }}>
        <button style={{ width: 52, height: 52, borderRadius: 16, background: c.surfaceAlt,
                         border: `1px solid ${c.borderMid}`, color: c.text }}>
          <Icon d={I.minus} size={22} weight={2.2}/>
        </button>
        <p style={{ fontSize: 56, fontWeight: 800, color: c.text, margin: 0, letterSpacing: -2,
                    fontVariantNumeric: 'tabular-nums', minWidth: 60, textAlign: 'center' }}>3</p>
        <button style={{ width: 52, height: 52, borderRadius: 16, background: c.primaryPale,
                         border: `1px solid ${c.primaryBorder}`, color: c.primaryOn }}>
          <Icon d={I.plus} size={22} weight={2.2}/>
        </button>
      </div>

      <div style={{
        background: c.surfaceAlt, border: `1px solid ${c.border}`, borderRadius: 14,
        padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: c.textSec }}>Totaal</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: c.text, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>€ 6,00</span>
      </div>

      <button style={{
        width: '100%', padding: '14px 16px', borderRadius: 14, border: 'none',
        background: c.primary, color: c.primaryFg, fontSize: 15, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        boxShadow: c.fabShadow,
      }}>
        <Icon d={I.cart} size={18} weight={2}/>
        Kopen voor € 6,00
      </button>
    </div>
  </div>
</>;

Object.assign(window, { Phone, Home, Transactions, Leaderboard, Profile, BuyModalScreen, T });
