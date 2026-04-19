// Dranklijst — Leiding screens design handoff
// GroupManagement: uitnodigingslink · aanvragen · leden

function LSvg({ d, size = 16, color = 'currentColor', w = 2, style: s = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink:0, display:'block', ...s }}>
      <path d={d}/>
    </svg>
  )
}

const LP = {
  refresh:  "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15",
  copy:     "M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866m-6 .17h8c1.105 0 2 .91 2 2.035v10.857C20 21.09 19.105 22 18 22h-8c-1.105 0-2-.911-2-2.036V9.107c0-1.124.895-2.036 2-2.036z",
  users:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  check:    "M20 6L9 17l-5-5",
  xmark:    "M18 6L6 18M6 6l12 12",
  trash:    "M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
  userLine: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  receipt:  "M5 3h14v18l-3-2-3 2-3-2-3 2-2-2zM8 8h8M8 12h8M8 16h5",
  clock:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
};

function LSectionLabel({ c, children, count }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
      <p style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:1.2, color:c.textMuted, margin:0 }}>{children}</p>
      {count != null && (
        <span style={{ fontSize:11, fontWeight:800, color:count > 0 ? '#fff' : c.textMuted, background:count > 0 ? c.primary : c.surfaceAlt, borderRadius:99, padding:'1px 6px', lineHeight:'16px' }}>{count}</span>
      )}
    </div>
  )
}

function GroupManagement(c) {
  const requests = [
    { name:'Emma Peeters',  date:'18 apr' },
    { name:'Liam Claeys',   date:'17 apr' },
  ]
  const members = [
    { name:'Sophie Martens',      role:'Leiding', self:true  },
    { name:'Thomas De Backer',    role:'Lid',     self:false },
    { name:'Julie Vandenberghe',  role:'Lid',     self:false },
    { name:'Noah Stevens',        role:'Lid',     self:false },
    { name:'Amber Desmet',        role:'Lid',     self:false },
  ]

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:c.bg }}>
      {/* Header */}
      <div style={{ background:c.surface, borderBottom:`1px solid ${c.border}`, padding:'14px 20px 16px', flexShrink:0 }}>
        <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5, color:c.text, margin:'0 0 3px' }}>Groepsbeheer</h1>
        <p style={{ fontSize:12, fontWeight:500, color:c.textMuted, margin:0 }}>Giraf · {members.length} leden</p>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px 100px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* ── Uitnodigingslink ── */}
        <section>
          <LSectionLabel c={c}>Uitnodigingslink</LSectionLabel>
          <div style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:16, padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <p style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:1, color:c.textMuted, margin:'0 0 5px' }}>Code</p>
                <p style={{ fontSize:26, fontWeight:800, letterSpacing:'0.28em', color:c.text, margin:0, fontVariantNumeric:'tabular-nums' }}>GR4FX2</p>
              </div>
              <button style={{ width:36, height:36, background:c.surfaceAlt, border:`1px solid ${c.border}`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <LSvg d={LP.refresh} size={15} color={c.textMuted}/>
              </button>
            </div>
            <button style={{
              width:'100%', padding:'10px 0', borderRadius:10, border:'none',
              background:c.primaryPale, color:c.primary,
              fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              display:'flex', alignItems:'center', justifyContent:'center', gap:7,
            }}>
              <LSvg d={LP.copy} size={14} color={c.primary}/>
              Kopieer uitnodigingslink
            </button>
          </div>
        </section>

        {/* ── Aanvragen ── */}
        <section>
          <LSectionLabel c={c} count={requests.length}>Aanvragen</LSectionLabel>
          {requests.length === 0 ? (
            <div style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:14, padding:'18px 16px', textAlign:'center' }}>
              <p style={{ fontSize:13, color:c.textMuted, margin:0 }}>Geen openstaande aanvragen</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {requests.map((r, i) => (
                <div key={i} style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:19, background:c.primaryPale, border:`1.5px solid ${c.primaryBorder}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <LSvg d={LP.userLine} size={17} color={c.primary}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:700, color:c.text, margin:0 }}>{r.name}</p>
                    <p style={{ fontSize:12, color:c.textMuted, margin:'2px 0 0' }}>{r.date}</p>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button style={{ width:36, height:36, background:c.dangerBg, borderRadius:10, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <LSvg d={LP.xmark} size={16} color={c.danger} w={2.5}/>
                    </button>
                    <button style={{ width:36, height:36, background:c.successBg, borderRadius:10, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <LSvg d={LP.check} size={16} color={c.success} w={2.5}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Leden ── */}
        <section>
          <LSectionLabel c={c} count={members.length}>Leden</LSectionLabel>
          <div style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:16, overflow:'hidden' }}>
            {members.map((m, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                borderTop: i === 0 ? 'none' : `1px solid ${c.border}`,
              }}>
                <div style={{
                  width:38, height:38, borderRadius:19, flexShrink:0,
                  background: m.self ? c.accentBg : c.surfaceAlt,
                  border: m.self ? `1.5px solid ${c.accentBorder}` : `1.5px solid ${c.border}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <LSvg d={LP.userLine} size={17} color={m.self ? c.accent : c.textSec}/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:c.text, margin:0 }}>
                    {m.name}
                    {m.self && <span style={{ fontSize:12, color:c.textMuted, fontWeight:500, marginLeft:6 }}>(jij)</span>}
                  </p>
                  <p style={{ fontSize:12, color:c.textMuted, margin:'2px 0 0' }}>{m.role}</p>
                </div>
                {!m.self && (
                  <button style={{ width:32, height:32, background:c.dangerBg, borderRadius:8, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    <LSvg d={LP.trash} size={14} color={c.danger}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

// ─── GroupTransactions (leiding) — compact header variant ───
function GroupTransactionsLeiding(c) {
  const items = [
    { name:'Thomas De Backer', item:'Jupiler',   qty:2, price:3.60, time:'14:32', chipBg:c.catBeerBg,  chipFg:c.catBeerFg  },
    { name:'Julie V.',          item:'Cola Zero', qty:1, price:1.80, time:'14:18', chipBg:c.catSodaBg,  chipFg:c.catSodaFg  },
    { name:'Noah Stevens',      item:'Jupiler',   qty:3, price:5.40, time:'13:55', chipBg:c.catBeerBg,  chipFg:c.catBeerFg  },
    { name:'Amber Desmet',      item:'Spa blauw', qty:1, price:1.00, time:'13:40', chipBg:c.catWaterBg, chipFg:c.catWaterFg },
    { name:'Thomas De Backer',  item:'Jupiler',   qty:1, price:1.80, time:'12:10', chipBg:c.catBeerBg,  chipFg:c.catBeerFg  },
  ]
  const total = items.reduce((s, t) => s + t.price, 0)

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:c.bg }}>
      <div style={{ background:c.surface, borderBottom:`1px solid ${c.border}`, padding:'14px 20px 16px', flexShrink:0 }}>
        <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5, color:c.text, margin:'0 0 3px' }}>Groepstransacties</h1>
        <p style={{ fontSize:12, fontWeight:500, color:c.textMuted, margin:0 }}>Giraf · Zomerkamp 2025</p>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'14px 20px 100px', display:'flex', flexDirection:'column', gap:12 }}>
        {/* Summary */}
        <div style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:10, background:c.primaryPale, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <LSvg d={LP.receipt} size={15} color={c.primary}/>
            </div>
            <span style={{ fontSize:14, fontWeight:700, color:c.text }}>{items.length} transacties</span>
          </div>
          <span style={{ fontSize:18, fontWeight:800, color:c.text, fontVariantNumeric:'tabular-nums' }}>€{total.toFixed(2).replace('.',',')}</span>
        </div>

        {/* Date group */}
        <p style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:1.2, color:c.textMuted, margin:'4px 0 4px 2px' }}>Vandaag</p>
        <div style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:14, overflow:'hidden' }}>
          {items.map((t, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderTop: i===0 ? 'none' : `1px solid ${c.border}` }}>
              <div style={{ width:36, height:36, borderRadius:11, background:t.chipBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <LSvg d={LP.receipt} size={16} color={t.chipFg}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:14, fontWeight:700, color:c.text, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.item}</p>
                <p style={{ fontSize:12, color:c.textMuted, margin:'2px 0 0' }}>{t.name} · {t.qty}× · {t.time}</p>
              </div>
              <p style={{ fontSize:15, fontWeight:800, color:c.text, margin:0, fontVariantNumeric:'tabular-nums', flexShrink:0 }}>−€{t.price.toFixed(2).replace('.',',')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

Object.assign(window, { GroupManagement, GroupTransactionsLeiding });
