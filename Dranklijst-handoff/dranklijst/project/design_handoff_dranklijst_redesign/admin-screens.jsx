// Dranklijst — Admin screens design handoff
// Dashboard · Transacties · Groepen · Periodes · Financieel · Consumpties · Gebruikers

// ─── Shared mini-SVG ────────────────────────────────────────
function ASvg({ d, size = 16, color = 'currentColor', w = 2, style: s = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink:0, display:'block', ...s }}>
      <path d={d}/>
    </svg>
  )
}

const AP2 = {
  calendar:   "M3 4h18v18H3zM3 10h18M8 2v4M16 2v4",
  chartBar:   "M12 20V10M6 20V16M18 20V4",
  receipt:    "M5 3h14v18l-3-2-3 2-3-2-3 2-2-2zM8 8h8M8 12h8M8 16h5",
  euro:       "M18 6a7 7 0 0 0-11 5h8M15 18a7 7 0 0 1-8-5h8M5 10h2M5 13h2",
  trendUp:    "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  users:      "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  user:       "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  rows:       "M4 6h16M4 12h16M4 18h16",
  package:    "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
  play:       "M5 3l14 9-14 9V3z",
  stop:       "M6 6h12v12H6z",
  plus:       "M12 5v14M5 12h14",
  pencil:     "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  eye:        "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  eyeSlash:   "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22",
  search:     "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
  caretDown:  "M6 9l6 6 6-6",
  check:      "M20 6L9 17l-5-5",
  checkCircle:"M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  clock:      "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  trash:      "M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
  export:     "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  house:      "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  trophy:     "M7 4h10v4a5 5 0 0 1-10 0zM12 12v5M8 20h8M5 8H3a2 2 0 0 0 2 4M19 8h2a2 2 0 0 1-2 4",
};

// ─── Shared admin primitives ────────────────────────────────

function AChip({ bg, fg, d, size = 32 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.31, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <ASvg d={d} size={size*0.48} color={fg} w={2.2}/>
    </div>
  )
}

function ASectionLabel({ c, children }) {
  return <p style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:1.2, color:c.textMuted, margin:'0 0 8px 2px' }}>{children}</p>
}

function ACard({ c, children, style: extra = {} }) {
  return (
    <div style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:14, ...extra }}>
      {children}
    </div>
  )
}

// Admin tab bar + page shell
function AdminShell({ c, tab, children }) {
  const tabs = [
    { key:'Dashboard',   d:AP2.chartBar  },
    { key:'Transacties', d:AP2.receipt   },
    { key:'Groepen',     d:AP2.rows      },
    { key:'Periodes',    d:AP2.calendar  },
    { key:'Financieel',  d:AP2.euro      },
    { key:'Consumpties', d:AP2.package   },
    { key:'Gebruikers',  d:AP2.users     },
  ]
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:c.bg, position:'relative' }}>
      {/* Header + tabs */}
      <div style={{ background:c.surface, borderBottom:`1px solid ${c.border}`, padding:'14px 20px 0', flexShrink:0 }}>
        <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5, color:c.text, margin:'0 0 12px' }}>Beheer</h1>
        <div style={{ display:'flex', gap:16, overflowX:'auto', scrollbarWidth:'none' }}>
          {tabs.map(t => {
            const active = t.key === tab
            return (
              <button key={t.key} style={{
                padding:'0 0 11px', fontSize:13, fontWeight: active ? 700 : 600,
                color: active ? c.primary : c.textMuted,
                background:'none', border:'none', cursor:'pointer', fontFamily:'inherit',
                borderBottom:`2px solid ${active ? c.primary : 'transparent'}`,
                whiteSpace:'nowrap', flexShrink:0,
                display:'flex', alignItems:'center', gap:5,
                transition:'color 150ms',
              }}>
                <ASvg d={t.d} size={13} color={active ? c.primary : c.textMuted}/>
                {t.key}
              </button>
            )
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 20px 100px' }}>
        {children}
      </div>

      {/* Bottom nav stub */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:68, background:c.surface, borderTop:`1px solid ${c.border}`, display:'flex', alignItems:'center', justifyContent:'space-around', padding:'0 8px', flexShrink:0 }}>
        {[AP2.house, AP2.receipt, AP2.plus, AP2.trophy, AP2.user].map((d, i) => (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            {i === 2 ? (
              <div style={{ width:48, height:48, borderRadius:24, background:c.primary, display:'flex', alignItems:'center', justifyContent:'center', marginTop:-20, boxShadow:c.fabShadow }}>
                <ASvg d={d} size={20} color="#fff" w={2.5}/>
              </div>
            ) : (
              <>
                <ASvg d={d} size={20} color={c.textMuted}/>
                <span style={{ fontSize:10, fontWeight:600, color:c.textMuted }}>{['Home','Trans.','','Top','Profiel'][i]}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 1. Dashboard ────────────────────────────────────────────
function AdminDashboard(c) {
  const stats = [
    { label:'Omzet',       value:'€247,80', bg:c.successBg,   fg:c.success, d:AP2.euro      },
    { label:'Transacties', value:'184',     bg:c.primaryPale, fg:c.primary, d:AP2.receipt   },
    { label:'Leden',       value:'36',      bg:c.accentBg,    fg:c.accent,  d:AP2.users     },
    { label:'Top groep',   value:'Giraf',   bg:`color-mix(in oklch, ${c.gold} 14%, transparent)`, fg:c.gold, d:AP2.trendUp },
  ]
  const bars = [
    { name:'Giraf',  pct:94 },
    { name:'Leeuw',  pct:75 },
    { name:'Zebra',  pct:65 },
    { name:'Tijger', pct:42 },
  ]

  return (
    <AdminShell c={c} tab="Dashboard">
      {/* Period picker */}
      <ACard c={c} style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <div style={{ width:30, height:30, borderRadius:9, background:c.successBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <ASvg d={AP2.calendar} size={14} color={c.success}/>
        </div>
        <span style={{ flex:1, fontSize:13, fontWeight:700, color:c.text }}>Zomerkamp 2025</span>
        <span style={{ fontSize:11, fontWeight:700, color:c.success, background:c.successBg, borderRadius:99, padding:'2px 8px' }}>Actief</span>
        <ASvg d={AP2.caretDown} size={14} color={c.textMuted}/>
      </ACard>

      {/* Stat tiles */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
        {stats.map((s, i) => (
          <ACard key={i} c={c} style={{ padding:14 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <p style={{ fontSize:11, fontWeight:700, color:c.textMuted, margin:0, textTransform:'uppercase', letterSpacing:0.8 }}>{s.label}</p>
              <div style={{ width:28, height:28, borderRadius:8, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <ASvg d={s.d} size={13} color={s.fg}/>
              </div>
            </div>
            <p style={{ fontSize:s.label === 'Top groep' ? 16 : 22, fontWeight:800, letterSpacing:-0.5, color:s.fg, margin:0, fontVariantNumeric:'tabular-nums' }}>{s.value}</p>
          </ACard>
        ))}
      </div>

      {/* Bar chart */}
      <ASectionLabel c={c}>Omzet per groep</ASectionLabel>
      <ACard c={c} style={{ padding:'14px 14px 12px' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {bars.map((b, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ width:44, fontSize:12, fontWeight:600, color:c.textSec, textAlign:'right', flexShrink:0 }}>{b.name}</span>
              <div style={{ flex:1, height:24, background:c.surfaceAlt, borderRadius:6, overflow:'hidden' }}>
                <div style={{ width:`${b.pct}%`, height:'100%', background:`linear-gradient(90deg, ${c.primary}, color-mix(in oklch, ${c.primary} 80%, transparent))`, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:8 }}>
                  <span style={{ fontSize:11, fontWeight:800, color:'#fff', fontVariantNumeric:'tabular-nums' }}>€{Math.round(b.pct*0.9)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ACard>
    </AdminShell>
  )
}

// ─── 2. AllTransactions ──────────────────────────────────────
function AdminAllTransactions(c) {
  const txs = [
    { name:'Thomas De Backer',   group:'Giraf', item:'Jupiler',   qty:2, price:3.60, time:'14:32', chipBg:c.catBeerBg,  chipFg:c.catBeerFg  },
    { name:'Julie Vandenberghe', group:'Leeuw', item:'Cola Zero', qty:1, price:1.80, time:'14:18', chipBg:c.catSodaBg,  chipFg:c.catSodaFg  },
    { name:'Noah Stevens',       group:'Giraf', item:'Jupiler',   qty:3, price:5.40, time:'13:55', chipBg:c.catBeerBg,  chipFg:c.catBeerFg  },
    { name:'Emma Claeys',        group:'Zebra', item:'Spa blauw', qty:1, price:1.00, time:'13:40', chipBg:c.catWaterBg, chipFg:c.catWaterFg },
  ]
  const total = txs.reduce((s, t) => s + t.price, 0)

  return (
    <AdminShell c={c} tab="Transacties">
      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        {['Alle periodes', 'Alle groepen'].map((lbl, i) => (
          <ACard key={i} c={c} style={{ flex:1, padding:'10px 12px', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ flex:1, fontSize:12, fontWeight:600, color:c.textSec, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lbl}</span>
            <ASvg d={AP2.caretDown} size={12} color={c.textMuted}/>
          </ACard>
        ))}
      </div>

      {/* Summary */}
      <ACard c={c} style={{ padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <AChip bg={c.primaryPale} fg={c.primary} d={AP2.receipt} size={30}/>
          <span style={{ fontSize:14, fontWeight:700, color:c.text }}>184 transacties</span>
        </div>
        <span style={{ fontSize:18, fontWeight:800, color:c.text, fontVariantNumeric:'tabular-nums' }}>€{total.toFixed(2).replace('.',',')}</span>
      </ACard>

      <ASectionLabel c={c}>Vandaag</ASectionLabel>
      <ACard c={c} style={{ overflow:'hidden' }}>
        {txs.map((tx, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderTop: i===0 ? 'none' : `1px solid ${c.border}` }}>
            <div style={{ width:34, height:34, borderRadius:11, background:tx.chipBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <ASvg d={AP2.receipt} size={15} color={tx.chipFg}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:700, color:c.text, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.name}</p>
              <p style={{ fontSize:11, color:c.textMuted, margin:'2px 0 0' }}>{tx.group} · {tx.item} ×{tx.qty} · {tx.time}</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              <span style={{ fontSize:14, fontWeight:800, color:c.text, fontVariantNumeric:'tabular-nums' }}>€{tx.price.toFixed(2).replace('.',',')}</span>
              <button style={{ width:30, height:30, background:c.dangerBg, borderRadius:8, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <ASvg d={AP2.trash} size={13} color={c.danger}/>
              </button>
            </div>
          </div>
        ))}
      </ACard>
    </AdminShell>
  )
}

// ─── 3. Groups ───────────────────────────────────────────────
function AdminGroupsInner({ c }) {
  const [openIdx, setOpenIdx] = React.useState(0)
  const groups = [
    { name:'Giraf',  count:12, total:84.20, members:['Sophie M. (Leiding)','Thomas D.B.','Julie V.','Noah S.','Amber D.'] },
    { name:'Leeuw',  count:9,  total:67.50, members:['Pieter C. (Leiding)','Stien H.','Lars V.'] },
    { name:'Zebra',  count:8,  total:58.30, members:['Emma K. (Leiding)','Sander B.','Lotte N.'] },
    { name:'Tijger', count:7,  total:37.80, members:['Noor J. (Leiding)','Finn D.'] },
  ]

  return (
    <AdminShell c={c} tab="Groepen">
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {groups.map((g, i) => (
          <ACard key={i} c={c} style={{ overflow:'hidden' }}>
            <button onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
              style={{ width:'100%', padding:'12px 14px', display:'flex', alignItems:'center', gap:12, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
              <AChip bg={c.primaryPale} fg={c.primary} d={AP2.users} size={36}/>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14, fontWeight:700, color:c.text, margin:0 }}>{g.name}</p>
                <p style={{ fontSize:12, color:c.textMuted, margin:'2px 0 0' }}>{g.count} leden</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, fontWeight:700, color:c.success, background:c.successBg, borderRadius:8, padding:'3px 8px', fontVariantNumeric:'tabular-nums' }}>€{g.total.toFixed(0)}</span>
                <div style={{ transform: openIdx === i ? 'rotate(180deg)' : 'none', transition:'transform 200ms' }}>
                  <ASvg d={AP2.caretDown} size={13} color={c.textMuted}/>
                </div>
              </div>
            </button>
            {openIdx === i && (
              <div style={{ borderTop:`1px solid ${c.border}` }}>
                {g.members.map((m, j) => (
                  <div key={j} style={{ display:'flex', alignItems:'center', padding:'10px 14px', borderTop: j===0 ? 'none' : `1px solid ${c.border}` }}>
                    <div style={{ width:28, height:28, borderRadius:14, background:c.surfaceAlt, display:'flex', alignItems:'center', justifyContent:'center', marginRight:10, flexShrink:0 }}>
                      <ASvg d={AP2.user} size={13} color={c.textMuted}/>
                    </div>
                    <p style={{ flex:1, fontSize:13, fontWeight:600, color:c.text, margin:0 }}>{m}</p>
                  </div>
                ))}
              </div>
            )}
          </ACard>
        ))}
      </div>
    </AdminShell>
  )
}
function AdminGroups(c) { return <AdminGroupsInner c={c}/> }

// ─── 4. Periods ──────────────────────────────────────────────
function AdminPeriods(c) {
  const periods = [
    { name:'Zomerkamp 2025',  active:true,  users:36, total:247.80, from:'12 jul' },
    { name:'Paaskamp 2025',   active:false, users:29, total:183.60, from:'14 apr', to:'20 apr' },
    { name:'Winterkamp 2024', active:false, users:31, total:195.20, from:'26 dec', to:'2 jan' },
  ]
  return (
    <AdminShell c={c} tab="Periodes">
      <button style={{
        width:'100%', background:c.primary, color:'#fff', fontSize:14, fontWeight:700,
        padding:'13px', borderRadius:14, border:'none', cursor:'pointer', fontFamily:'inherit',
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        boxShadow:c.fabShadow, marginBottom:14,
      }}>
        <ASvg d={AP2.plus} size={16} color="#fff" w={2.5}/> Nieuwe periode starten
      </button>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {periods.map((p, i) => (
          <ACard key={i} c={c} style={{ padding:14, position:'relative', overflow:'hidden', borderColor: p.active ? c.primaryBorder : c.border }}>
            {p.active && <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:c.primary }}/>}
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, paddingLeft: p.active ? 8 : 0 }}>
              <div style={{ width:34, height:34, borderRadius:10, background: p.active ? c.primaryPale : c.surfaceAlt, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <ASvg d={AP2.calendar} size={16} color={p.active ? c.primary : c.textMuted}/>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14, fontWeight:700, color:c.text, margin:'0 0 2px' }}>{p.name}</p>
                <p style={{ fontSize:12, color:c.textMuted, margin:0 }}>{p.from}{p.to ? ` → ${p.to}` : ' · Actief'}</p>
              </div>
              {p.active ? (
                <button style={{ display:'flex', alignItems:'center', gap:5, background:c.dangerBg, color:c.danger, fontSize:12, fontWeight:700, padding:'6px 10px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
                  <ASvg d={AP2.stop} size={12} color={c.danger}/> Afsluiten
                </button>
              ) : (
                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:700, color:c.success, flexShrink:0 }}>
                  <ASvg d={AP2.check} size={13} color={c.success} w={2.5}/> Gesloten
                </span>
              )}
            </div>
            <div style={{ display:'flex', gap:16, marginTop:12, paddingTop:10, borderTop:`1px solid ${c.border}`, paddingLeft: p.active ? 8 : 0 }}>
              {[{d:AP2.users,val:`${p.users} leden`},{d:AP2.euro,val:`€${p.total.toFixed(2)} totaal`}].map((stat,j) => (
                <div key={j} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:22, height:22, borderRadius:6, background:c.primaryPale, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <ASvg d={stat.d} size={11} color={c.primary}/>
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, color:c.text, fontVariantNumeric:'tabular-nums' }}>{stat.val}</span>
                </div>
              ))}
            </div>
          </ACard>
        ))}
      </div>
    </AdminShell>
  )
}

// ─── 5. Finance ──────────────────────────────────────────────
function AdminFinance(c) {
  const payments = [
    { name:'Thomas De Backer',    due:15.60, status:'pending' },
    { name:'Julie Vandenberghe',  due: 9.20, status:'paid'    },
    { name:'Emma Claeys',         due:11.40, status:'unpaid'  },
    { name:'Noah Stevens',        due:18.80, status:'paid'    },
    { name:'Liam Janssen',        due: 7.60, status:'pending' },
  ]
  const paidTotal  = payments.filter(p => p.status === 'paid').reduce((s,p) => s+p.due, 0)
  const totalAll   = payments.reduce((s,p) => s+p.due, 0)
  const paidPct    = Math.round((paidTotal / totalAll) * 100)
  const statusCfg  = {
    unpaid:  { label:'Te betalen',  bg:c.surfaceAlt, text:c.textMuted },
    pending: { label:'Betaald (?)', bg:c.warningBg,  text:c.warning   },
    paid:    { label:'Bevestigd',   bg:c.successBg,  text:c.success   },
  }

  return (
    <AdminShell c={c} tab="Financieel">
      {/* Period selector */}
      <ACard c={c} style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <ASvg d={AP2.calendar} size={14} color={c.textMuted}/>
        <span style={{ flex:1, fontSize:13, fontWeight:600, color:c.text }}>Zomerkamp 2025</span>
        <ASvg d={AP2.caretDown} size={13} color={c.textMuted}/>
      </ACard>

      {/* Totals */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <ACard c={c} style={{ padding:12 }}>
          <p style={{ fontSize:11, fontWeight:700, color:c.textMuted, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:0.8 }}>Openstaand</p>
          <p style={{ fontSize:20, fontWeight:800, color:c.danger, margin:0, fontVariantNumeric:'tabular-nums' }}>€{(totalAll-paidTotal).toFixed(2)}</p>
        </ACard>
        <ACard c={c} style={{ padding:12 }}>
          <p style={{ fontSize:11, fontWeight:700, color:c.textMuted, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:0.8 }}>Ontvangen</p>
          <p style={{ fontSize:20, fontWeight:800, color:c.success, margin:0, fontVariantNumeric:'tabular-nums' }}>€{paidTotal.toFixed(2)}</p>
        </ACard>
      </div>

      {/* Progress */}
      <ACard c={c} style={{ padding:'10px 14px', marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:12, fontWeight:600, color:c.textSec }}>Betaald</span>
          <span style={{ fontSize:12, fontWeight:800, color:c.success }}>{paidPct}%</span>
        </div>
        <div style={{ height:8, background:c.surfaceAlt, borderRadius:99, overflow:'hidden' }}>
          <div style={{ width:`${paidPct}%`, height:'100%', background:c.success, borderRadius:99, transition:'width 600ms' }}/>
        </div>
      </ACard>

      {/* Export */}
      <button style={{ width:'100%', background:c.surface, border:`1px solid ${c.border}`, borderRadius:12, padding:'10px', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontSize:13, fontWeight:700, color:c.textSec, cursor:'pointer', fontFamily:'inherit', marginBottom:14 }}>
        <ASvg d={AP2.export} size={15} color={c.textMuted}/> Exporteer CSV
      </button>

      {/* Payment rows */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {payments.map((p, i) => {
          const cfg = statusCfg[p.status]
          return (
            <ACard key={i} c={c} style={{ padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:17, background:c.primaryPale, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <ASvg d={AP2.user} size={15} color={c.primary}/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:c.text, margin:0 }}>{p.name}</p>
                  <p style={{ fontSize:11, color:c.textMuted, margin:'2px 0 0' }}>Verschuldigd: <strong style={{ color:c.text }}>€{p.due.toFixed(2)}</strong></p>
                </div>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, background:cfg.bg, color:cfg.text, flexShrink:0 }}>{cfg.label}</span>
              </div>
              {p.status === 'pending' && (
                <button style={{ width:'100%', marginTop:10, padding:'9px', borderRadius:10, border:'none', background:c.successBg, color:c.success, fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer', fontFamily:'inherit' }}>
                  <ASvg d={AP2.checkCircle} size={14} color={c.success}/> Betaling bevestigen
                </button>
              )}
            </ACard>
          )
        })}
      </div>
    </AdminShell>
  )
}

// ─── 6. Consumptions ─────────────────────────────────────────
function AdminConsumptions(c) {
  const cats = [
    { label:'Bier / Alcoholisch', items:[
      { name:'Jupiler',          price:1.80, active:true,  bg:c.catBeerBg,   fg:c.catBeerFg   },
      { name:'Tripel Karmeliet', price:2.50, active:true,  bg:c.catBeerBg,   fg:c.catBeerFg   },
      { name:'Grimbergen',       price:2.20, active:false, bg:c.catBeerBg,   fg:c.catBeerFg   },
    ]},
    { label:'Frisdrank / Water', items:[
      { name:'Cola Zero',        price:1.80, active:true,  bg:c.catSodaBg,   fg:c.catSodaFg   },
      { name:'Spa blauw',        price:1.00, active:true,  bg:c.catWaterBg,  fg:c.catWaterFg  },
      { name:'Koffie',           price:1.50, active:true,  bg:c.catCoffeeBg, fg:c.catCoffeeFg },
    ]},
  ]
  return (
    <AdminShell c={c} tab="Consumpties">
      <button style={{ width:'100%', background:c.primary, color:'#fff', fontSize:14, fontWeight:700, padding:'13px', borderRadius:14, border:'none', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:c.fabShadow, marginBottom:14 }}>
        <ASvg d={AP2.plus} size={16} color="#fff" w={2.5}/> Nieuwe consumptie
      </button>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {cats.map((cat, ci) => (
          <section key={ci}>
            <ASectionLabel c={c}>{cat.label}</ASectionLabel>
            <ACard c={c} style={{ overflow:'hidden' }}>
              {cat.items.map((item, ii) => (
                <div key={ii} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderTop: ii===0 ? 'none' : `1px solid ${c.border}`, opacity: item.active ? 1 : 0.45 }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:item.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <ASvg d={AP2.package} size={15} color={item.fg}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:c.text, margin:0 }}>{item.name}</p>
                    <p style={{ fontSize:12, color:c.textMuted, margin:'2px 0 0', fontVariantNumeric:'tabular-nums' }}>€{item.price.toFixed(2)}</p>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button style={{ width:30, height:30, background:c.primaryPale, borderRadius:8, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <ASvg d={AP2.pencil} size={13} color={c.primary}/>
                    </button>
                    <button style={{ width:30, height:30, borderRadius:8, border:'none', cursor:'pointer', background: item.active ? c.successBg : c.surfaceAlt, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <ASvg d={item.active ? AP2.eye : AP2.eyeSlash} size={13} color={item.active ? c.success : c.textMuted}/>
                    </button>
                  </div>
                </div>
              ))}
            </ACard>
          </section>
        ))}
      </div>
    </AdminShell>
  )
}

// ─── 7. Users ────────────────────────────────────────────────
function AdminUsers(c) {
  const roleColors = {
    lid:           { bg:c.surfaceAlt,  text:c.textSec  },
    leiding:       { bg:c.primaryPale, text:c.primary   },
    groepsleiding: { bg:c.successBg,   text:c.success   },
    kas:           { bg:c.warningBg,   text:c.warning   },
    admin:         { bg:c.dangerBg,    text:c.danger    },
  }
  const roleLabel = { lid:'Lid', leiding:'Leiding', groepsleiding:'Groepsleiding', kas:'Kas', admin:'Admin' }
  const users = [
    { name:'Sophie Martens',      group:'Giraf', role:'leiding'       },
    { name:'Thomas De Backer',    group:'Giraf', role:'lid'           },
    { name:'Julie Vandenberghe',  group:'Leeuw', role:'lid'           },
    { name:'Pieter Claeys',       group:'Leeuw', role:'leiding'       },
    { name:'Groepsleiding User',  group:'—',     role:'groepsleiding' },
    { name:'Kas Beheer',          group:'—',     role:'kas'           },
    { name:'Super Admin',         group:'—',     role:'admin'         },
  ]

  return (
    <AdminShell c={c} tab="Gebruikers">
      {/* Search */}
      <div style={{ position:'relative', marginBottom:14 }}>
        <ASvg d={AP2.search} size={15} color={c.textMuted} s={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
        <div style={{ background:c.surface, border:`1.5px solid ${c.borderMid}`, borderRadius:14, padding:'11px 14px 11px 42px', fontSize:13, fontWeight:500, color:c.textMuted }}>
          Zoek gebruiker…
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {users.map((u, i) => {
          const rc = roleColors[u.role] ?? roleColors.lid
          return (
            <ACard key={i} c={c} style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:34, height:34, borderRadius:17, background:c.primaryPale, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <ASvg d={AP2.user} size={15} color={c.primary}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:700, color:c.text, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</p>
                <p style={{ fontSize:11, color:c.textMuted, margin:'2px 0 0' }}>{u.group}</p>
              </div>
              <button style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, padding:'5px 10px', borderRadius:8, background:rc.bg, color:rc.text, border:'none', cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
                {roleLabel[u.role]}
                <ASvg d={AP2.caretDown} size={11} color={rc.text}/>
              </button>
            </ACard>
          )
        })}
      </div>
    </AdminShell>
  )
}

Object.assign(window, { AdminDashboard, AdminAllTransactions, AdminGroups, AdminPeriods, AdminFinance, AdminConsumptions, AdminUsers });
