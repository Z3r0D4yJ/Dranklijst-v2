// Animated Home demo — showcases the motion vocabulary for Dranklijst.
// Calm, purposeful, never in the way. All animations <600ms except idle wiggle.
// Exposes: <AnimatedHomeDemo dark={bool} hue={221} />

const { useState, useEffect, useRef } = React;

// ─── Shared animation keyframes (injected once) ──────────────
(function injectAnimStyles() {
  if (document.getElementById('dranklijst-anim-styles')) return;
  const style = document.createElement('style');
  style.id = 'dranklijst-anim-styles';
  style.textContent = `
    @keyframes dl-shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
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
      60%  { transform: translate(-50%, 4px);  opacity: 1; }
      100% { transform: translate(-50%, 0);    opacity: 1; }
    }
    @keyframes dl-check-draw {
      0%   { stroke-dashoffset: 22; }
      100% { stroke-dashoffset: 0;  }
    }
    @keyframes dl-pulse {
      0%, 100% { opacity: 0.5; }
      50%      { opacity: 1; }
    }
    .dl-skel {
      background: linear-gradient(90deg,
        var(--skel-base) 0%,
        var(--skel-hl) 50%,
        var(--skel-base) 100%);
      background-size: 200% 100%;
      animation: dl-shimmer 1.6s linear infinite;
      border-radius: 8px;
    }
  `;
  document.head.appendChild(style);
})();

// ─── Count-up number hook ────────────────────────────────────
function useCountUp(target, duration = 550) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  const raf = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const base = from.current;
    const delta = target - base;
    if (delta === 0) return;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out-cubic
      setV(base + delta * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return v;
}

// ─── Skeleton-loading version of Home ────────────────────────
const HomeSkeleton = (c) => {
  const skelBase = c.surfaceAlt;
  const skelHl = c.border;
  const vars = { '--skel-base': skelBase, '--skel-hl': skelHl };
  return <>
    <div style={{ background: c.header, padding: '14px 20px 32px', color: c.headerFg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 23, overflow: 'hidden',
            background: '#fff', border: '2px solid rgba(255,255,255,0.25)',
            animation: 'dl-wiggle 2.6s ease-in-out infinite',
          }}>
            <img src="assets/fox.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 22%' }}/>
          </div>
          <div>
            <div className="dl-skel" style={{ ...vars, width: 70, height: 10, marginBottom: 8, background: 'rgba(255,255,255,0.15)' }}/>
            <div className="dl-skel" style={{ ...vars, width: 110, height: 18, background: 'rgba(255,255,255,0.22)' }}/>
          </div>
        </div>
        <div className="dl-skel" style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.15)' }}/>
      </div>
      <div className="dl-skel" style={{ width: 140, height: 22, borderRadius: 99, background: 'rgba(255,255,255,0.15)' }}/>
    </div>

    <div style={{ margin: '-22px 20px 0', zIndex: 2, position: 'relative' }}>
      <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: 16,
                    display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="dl-skel" style={{ ...vars, width: 44, height: 44, borderRadius: 14 }}/>
        <div style={{ flex: 1 }}>
          <div className="dl-skel" style={{ ...vars, width: 90, height: 9, marginBottom: 8 }}/>
          <div className="dl-skel" style={{ ...vars, width: 74, height: 20 }}/>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="dl-skel" style={{ ...vars, width: 38, height: 9, marginBottom: 8, marginLeft: 'auto' }}/>
          <div className="dl-skel" style={{ ...vars, width: 44, height: 20, marginLeft: 'auto' }}/>
        </div>
      </div>
    </div>

    <div style={{ flex: 1, padding: '22px 20px 120px' }}>
      <div className="dl-skel" style={{ ...vars, width: 90, height: 11, marginBottom: 12 }}/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: 14 }}>
            <div className="dl-skel" style={{ ...vars, width: 38, height: 38, borderRadius: 12, marginBottom: 12 }}/>
            <div className="dl-skel" style={{ ...vars, width: '60%', height: 11, marginBottom: 8 }}/>
            <div className="dl-skel" style={{ ...vars, width: '40%', height: 16 }}/>
          </div>
        ))}
      </div>
    </div>
  </>;
};

// ─── Animated, interactive Home ──────────────────────────────
const AnimatedHome = (c) => {
  const [count, setCount] = useState(0);        // count of items bought in this session
  const [bubbleBursts, setBubbleBursts] = useState([]); // {id, x, y}
  const [toast, setToast] = useState(null);     // {id, name}
  const [pressedKey, setPressedKey] = useState(null);
  const toastTimer = useRef(0);

  const baseSpend = 18.50;
  const targetSpend = baseSpend + count * 2.00;  // pretend every item is 2€
  const animatedSpend = useCountUp(targetSpend, 550);

  const items = [
    { k: 'pintje', n: 'Pintje', p: 2.00, i: I.beer, cat: 'beer' },
    { k: 'duvel',  n: 'Duvel',  p: 3.00, i: I.beer, cat: 'beer' },
    { k: 'wijn',   n: 'Wijn',   p: 3.50, i: I.wine, cat: 'wine' },
    { k: 'shot',   n: 'Shotje', p: 2.50, i: I.shot, cat: 'beer' },
  ];
  const frisdrank = [
    { k: 'cola',   n: 'Cola',   p: 1.50, i: I.cola, cat: 'soda' },
    { k: 'fanta',  n: 'Fanta',  p: 1.50, i: I.cola, cat: 'soda' },
    { k: 'water',  n: 'Water',  p: 1.00, i: I.water,cat: 'water' },
    { k: 'koffie', n: 'Koffie', p: 1.20, i: I.coffee,cat: 'coffee' },
  ];

  function handleBuy(item, ev) {
    // Bubble burst from tap point
    const rect = ev.currentTarget.getBoundingClientRect();
    const parentRect = ev.currentTarget.closest('[data-phone-frame]').getBoundingClientRect();
    const x = rect.left - parentRect.left + rect.width / 2;
    const y = rect.top  - parentRect.top  + 22;
    const id = Math.random().toString(36).slice(2);
    setBubbleBursts(b => [...b, { id, x, y }]);
    setTimeout(() => setBubbleBursts(b => b.filter(x => x.id !== id)), 700);

    setCount(c => c + 1);
    setPressedKey(item.k);
    setTimeout(() => setPressedKey(null), 180);

    // Toast
    clearTimeout(toastTimer.current);
    const tid = Math.random();
    setToast({ id: tid, name: item.n });
    toastTimer.current = setTimeout(() => {
      setToast(t => (t && t.id === tid ? null : t));
    }, 2200);
  }

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
          <div style={{ position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, background: c.accent, border: `2px solid ${c.header}`}}/>
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

    {/* Balance card with count-up */}
    <div style={{ margin: '-22px 20px 0', zIndex: 2, position: 'relative' }}>
      <Card c={c} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14,
                           transition: 'box-shadow 400ms, border-color 400ms',
                           borderColor: count > 0 ? c.primaryBorder : c.border }}>
        <IconChip c={c} icon={I.euro} size={44}/>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, letterSpacing: 0.8, margin: 0, textTransform: 'uppercase' }}>Deze periode</p>
          <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: '2px 0 0', color: c.text, fontVariantNumeric: 'tabular-nums' }}>
            € {animatedSpend.toFixed(2).replace('.', ',')}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, letterSpacing: 0.8, margin: 0, textTransform: 'uppercase' }}>Rang</p>
          <p style={{ fontSize: 22, fontWeight: 800, margin: '2px 0 0', color: c.primary, letterSpacing: -0.5 }}>#4</p>
        </div>
      </Card>
    </div>

    {/* Body with tappable items */}
    <div style={{ flex: 1, overflow: 'auto', padding: '22px 20px 120px' }}>
      <AnimGrid title="Frisdrank" items={frisdrank} c={c} onBuy={handleBuy} pressedKey={pressedKey}/>
      <div style={{ height: 20 }}/>
      <AnimGrid title="Alcohol"   items={items}    c={c} onBuy={handleBuy} pressedKey={pressedKey}/>
    </div>

    {/* Bubble layer (absolutely positioned inside phone frame) */}
    {bubbleBursts.map(b => (
      <BubbleBurst key={b.id} x={b.x} y={b.y} color={c.accent}/>
    ))}

    {/* Success toast */}
    {toast && <SuccessToast key={toast.id} name={toast.name} c={c}/>}

    <BottomNav c={c} active="home"/>
  </>;
};

const AnimGrid = ({ title, items, c, onBuy, pressedKey }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
      <h2 style={{ fontSize: 11, fontWeight: 800, color: c.textMuted, letterSpacing: 1.2, margin: 0, textTransform: 'uppercase' }}>{title}</h2>
      <span style={{ fontSize: 11, fontWeight: 600, color: c.textMuted }}>{items.length} items</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {items.map(item => {
        const pressed = pressedKey === item.k;
        return (
          <button key={item.k} onClick={(e) => onBuy(item, e)} style={{
            background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16,
            padding: 14, textAlign: 'left', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', gap: 12,
            transform: pressed ? 'scale(0.96)' : 'scale(1)',
            transition: 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1), border-color 200ms',
            borderColor: pressed ? c.primaryBorder : c.border,
          }}>
            <IconChip c={c} icon={item.i} size={38} tone={item.cat || 'primary'}/>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: c.text, letterSpacing: -0.1 }}>{item.n}</p>
              <p style={{ fontSize: 17, fontWeight: 800, margin: '2px 0 0', color: c.primary, letterSpacing: -0.3, fontVariantNumeric: 'tabular-nums' }}>
                € {item.p.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

// ─── Bubble burst — 5 small dots rising from tap point ───────
const BubbleBurst = ({ x, y, color }) => {
  const bubbles = [
    { dx: -14, size: 5,  delay: 0   },
    { dx:  10, size: 7,  delay: 40  },
    { dx:   2, size: 4,  delay: 90  },
    { dx: -22, size: 6,  delay: 130 },
    { dx:  18, size: 5,  delay: 170 },
  ];
  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: 20, pointerEvents: 'none' }}>
      {bubbles.map((b, i) => (
        <div key={i} style={{
          position: 'absolute', left: -b.size/2, top: -b.size/2,
          width: b.size, height: b.size, borderRadius: b.size/2,
          background: color, opacity: 0,
          animation: `dl-bubble-up 640ms cubic-bezier(0.22, 0.61, 0.36, 1) ${b.delay}ms forwards`,
          '--dx': `${b.dx}px`,
        }}/>
      ))}
    </div>
  );
};

// ─── Toast ────────────────────────────────────────────────────
const SuccessToast = ({ name, c }) => (
  <div style={{
    position: 'absolute', top: 64, left: '50%',
    background: c.text, color: c.bg,
    padding: '10px 16px 10px 12px', borderRadius: 99,
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 13, fontWeight: 700, zIndex: 30,
    boxShadow: '0 10px 28px rgba(0,0,0,0.28), 0 3px 8px rgba(0,0,0,0.14)',
    animation: 'dl-toast-in 280ms cubic-bezier(0.2, 0.7, 0.3, 1.2) forwards',
    whiteSpace: 'nowrap',
  }}>
    <div style={{
      width: 22, height: 22, borderRadius: 11, background: c.success,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
           stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5L20 7" strokeDasharray="22"
              style={{ animation: 'dl-check-draw 260ms 100ms ease-out forwards', strokeDashoffset: 22 }}/>
      </svg>
    </div>
    {name} gekocht
  </div>
);

// ─── Demo shell ──────────────────────────────────────────────
const AnimatedHomeDemo = ({ dark, hue, loading }) => {
  const c = palette(dark, hue);
  return (
    <div data-phone-frame style={{ position: 'relative', width: '100%', height: '100%',
                                   display: 'flex', flexDirection: 'column' }}>
      {loading ? HomeSkeleton(c) : AnimatedHome(c)}
    </div>
  );
};

Object.assign(window, { AnimatedHomeDemo, HomeSkeleton, AnimatedHome });
