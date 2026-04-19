// Dranklijst — Auth screens design handoff
// Login · Register · JoinGroup (browse + code + success)
// Same pattern as screens.jsx — each exported fn takes palette(c) and returns JSX.

// ─── Shared tiny SVG helper ──────────────────────────────────
function AuthSvg({ d, size = 16, color = 'currentColor', w = 2, style: s = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block', ...s }}>
      <path d={d} />
    </svg>
  )
}

const AP = {
  email:       "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm18 2l-10 7L2 6",
  lock:        "M6 10V7a6 6 0 0 1 12 0v3M4 10h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z",
  user:        "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  users:       "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  hash:        "M4 9h16M4 15h16M10 3L8 21M16 3l-2 18",
  arrowRight:  "M5 12h14M12 5l7 7-7 7",
  checkFill:   "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3",
  clock:       "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  planeTilt:   "M22 2L11 13M22 2l-7 20-4-9-9-4z",
  checkCircle: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
};

// ─── Reusable primitives ────────────────────────────────────

function AuthSplash({ c }) {
  return (
    <div style={{
      background: c.header, flexShrink: 0, height: 198,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position:'absolute', right:-60, top:-60, width:220, height:220, borderRadius:110, background:'rgba(255,255,255,0.05)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', left:-30, bottom:-40, width:150, height:150, borderRadius:75, background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
      <div style={{
        width:64, height:64, borderRadius:32, overflow:'hidden', flexShrink:0,
        background: c.accentBg, border:`2.5px solid ${c.accentBorder}`,
        marginBottom:10, position:'relative', zIndex:1,
      }}>
        <img src="fox.png" alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 22%' }} />
      </div>
      <h1 style={{ color:c.headerFg, fontSize:22, fontWeight:800, letterSpacing:-0.5, margin:0, position:'relative', zIndex:1 }}>Dranklijst</h1>
      <p style={{ color:`${c.headerFg}88`, fontSize:12, fontWeight:500, margin:'4px 0 0', position:'relative', zIndex:1 }}>Chiro Melle</p>
    </div>
  )
}

function FormSheet({ c, children }) {
  return (
    <div style={{
      flex:1, background:c.surface, borderRadius:'24px 24px 0 0',
      marginTop:-18, padding:'24px 20px 28px',
      overflowY:'auto', display:'flex', flexDirection:'column',
    }}>
      {children}
    </div>
  )
}

function FieldLabel({ c, children }) {
  return (
    <label style={{ display:'block', fontSize:12, fontWeight:700, color:c.textSec, letterSpacing:0.2, marginBottom:6 }}>
      {children}
    </label>
  )
}

function FormField({ c, type, placeholder, iconPath }) {
  return (
    <div style={{ position:'relative' }}>
      <AuthSvg d={iconPath} size={15} color={c.textMuted} s={{
        position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none',
      }}/>
      <input readOnly type={type} placeholder={placeholder} style={{
        width:'100%', boxSizing:'border-box',
        background:c.surfaceAlt, border:`1.5px solid ${c.borderMid}`,
        borderRadius:14, padding:'12px 14px 12px 42px',
        fontSize:14, fontWeight:500, color:c.textMuted,
        outline:'none', fontFamily:'inherit', WebkitAppearance:'none',
      }}/>
    </div>
  )
}

function PrimaryBtn({ c, children, style: extra = {} }) {
  return (
    <button style={{
      width:'100%', background:c.primary, color:'#fff',
      fontSize:14, fontWeight:700, padding:'14px', borderRadius:14,
      border:'none', cursor:'pointer', fontFamily:'inherit',
      boxShadow:c.fabShadow,
      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      ...extra,
    }}>
      {children}
    </button>
  )
}

function GoogleBtn({ c, label }) {
  return (
    <button style={{
      width:'100%', background:c.surface, border:`1.5px solid ${c.borderMid}`,
      borderRadius:14, padding:'12px',
      display:'flex', alignItems:'center', justifyContent:'center', gap:10,
      fontSize:14, fontWeight:600, color:c.text, cursor:'pointer', fontFamily:'inherit',
    }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
      </svg>
      {label}
    </button>
  )
}

function OrDivider({ c }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, margin:'16px 0' }}>
      <div style={{ flex:1, height:1, background:c.borderMid }}/>
      <span style={{ fontSize:11, fontWeight:700, color:c.textMuted, letterSpacing:0.6 }}>OF</span>
      <div style={{ flex:1, height:1, background:c.borderMid }}/>
    </div>
  )
}

// ─── Login ──────────────────────────────────────────────────
function Login(c) {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:c.header }}>
      <AuthSplash c={c}/>
      <FormSheet c={c}>
        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:-0.4, color:c.text, margin:'0 0 4px' }}>Welkom terug</h2>
          <p style={{ fontSize:13, fontWeight:500, color:c.textMuted, margin:0 }}>Log in op je Dranklijst account</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div>
            <FieldLabel c={c}>E-mailadres</FieldLabel>
            <FormField c={c} type="email" placeholder="naam@voorbeeld.be" iconPath={AP.email}/>
          </div>
          <div>
            <FieldLabel c={c}>Wachtwoord</FieldLabel>
            <FormField c={c} type="password" placeholder="••••••••" iconPath={AP.lock}/>
          </div>
          <PrimaryBtn c={c} style={{ marginTop:4 }}>Inloggen</PrimaryBtn>
        </div>
        <OrDivider c={c}/>
        <GoogleBtn c={c} label="Doorgaan met Google"/>
        <p style={{ textAlign:'center', fontSize:13, color:c.textMuted, fontWeight:500, marginTop:18 }}>
          Nog geen account?{' '}
          <span style={{ color:c.primary, fontWeight:700, cursor:'pointer' }}>Registreer je</span>
        </p>
      </FormSheet>
    </div>
  )
}

// ─── Register ───────────────────────────────────────────────
function Register(c) {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:c.header }}>
      <AuthSplash c={c}/>
      <FormSheet c={c}>
        <div style={{ marginBottom:18 }}>
          <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:-0.4, color:c.text, margin:'0 0 4px' }}>Account aanmaken</h2>
          <p style={{ fontSize:13, fontWeight:500, color:c.textMuted, margin:0 }}>Registreer je voor Dranklijst</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div>
            <FieldLabel c={c}>Volledige naam</FieldLabel>
            <FormField c={c} type="text" placeholder="Jan Janssens" iconPath={AP.user}/>
          </div>
          <div>
            <FieldLabel c={c}>E-mailadres</FieldLabel>
            <FormField c={c} type="email" placeholder="naam@voorbeeld.be" iconPath={AP.email}/>
          </div>
          <div>
            <FieldLabel c={c}>Wachtwoord</FieldLabel>
            <FormField c={c} type="password" placeholder="Minimaal 6 tekens" iconPath={AP.lock}/>
          </div>
          <PrimaryBtn c={c} style={{ marginTop:4 }}>Registreren</PrimaryBtn>
        </div>
        <OrDivider c={c}/>
        <GoogleBtn c={c} label="Registreren met Google"/>
        <p style={{ textAlign:'center', fontSize:13, color:c.textMuted, fontWeight:500, marginTop:16 }}>
          Al een account?{' '}
          <span style={{ color:c.primary, fontWeight:700, cursor:'pointer' }}>Log in</span>
        </p>
      </FormSheet>
    </div>
  )
}

// ─── JoinGroup — Browse ─────────────────────────────────────
function JoinGroupBrowse(c) {
  const groups = [
    { name:'Giraf',  desc:'2e Melle — Giraf',  status:'join'    },
    { name:'Leeuw',  desc:'3e Melle — Leeuw',  status:'pending' },
    { name:'Zebra',  desc:'1e Melle — Zebra',  status:'member'  },
    { name:'Tijger', desc:'4e Melle — Tijger', status:'join'    },
  ]
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:c.bg }}>
      <div style={{ background:c.surface, borderBottom:`1px solid ${c.border}`, padding:'14px 20px 16px', flexShrink:0 }}>
        <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5, color:c.text, margin:'0 0 3px' }}>Groep joinen</h1>
        <p style={{ fontSize:12, fontWeight:500, color:c.textMuted, margin:0 }}>Kies een groep of gebruik een uitnodigingscode</p>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'14px 20px', display:'flex', flexDirection:'column', gap:8 }}>
        {groups.map((g, i) => (
          <div key={i} style={{
            background:c.surface, border:`1px solid ${c.border}`, borderRadius:16,
            padding:'12px 14px', display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{ width:36, height:36, borderRadius:11, background:c.primaryPale, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <AuthSvg d={AP.users} size={16} color={c.primary} w={2}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:14, fontWeight:700, color:c.text, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.name}</p>
              <p style={{ fontSize:12, color:c.textMuted, margin:'2px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.desc}</p>
            </div>
            {g.status === 'member' && (
              <span style={{ fontSize:12, fontWeight:700, color:c.success, display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                <AuthSvg d={AP.checkCircle} size={13} color={c.success} w={2}/> Lid
              </span>
            )}
            {g.status === 'pending' && (
              <span style={{ fontSize:12, fontWeight:600, color:c.textMuted, display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                <AuthSvg d={AP.clock} size={13} color={c.textMuted} w={2}/> Aangevraagd
              </span>
            )}
            {g.status === 'join' && (
              <button style={{ fontSize:12, fontWeight:700, color:'#fff', background:c.primary, border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                <AuthSvg d={AP.planeTilt} size={12} color="#fff" w={2.2}/> Aanvragen
              </button>
            )}
          </div>
        ))}
        <button style={{ width:'100%', padding:'12px', textAlign:'center', fontSize:13, color:c.textMuted, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
          Uitnodigingscode invoeren
        </button>
        <button style={{ width:'100%', padding:'10px', textAlign:'center', fontSize:13, color:c.textMuted, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
          Overslaan voor nu
        </button>
      </div>
    </div>
  )
}

// ─── JoinGroup — Code ───────────────────────────────────────
function JoinGroupCode(c) {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:c.bg }}>
      <div style={{ background:c.surface, borderBottom:`1px solid ${c.border}`, padding:'14px 20px 16px', flexShrink:0 }}>
        <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5, color:c.text, margin:'0 0 3px' }}>Uitnodigingscode</h1>
        <p style={{ fontSize:12, fontWeight:500, color:c.textMuted, margin:0 }}>Voer de 6-tekens code in</p>
      </div>
      <div style={{ flex:1, padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 }}>
        <button style={{ color:c.primary, fontWeight:700, fontSize:13, background:'none', border:'none', cursor:'pointer', textAlign:'left', padding:0, fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
          <AuthSvg d="M19 12H5M12 19l-7-7 7-7" size={14} color={c.primary}/> Terug naar groepen
        </button>

        <div style={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:16, padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <div style={{ width:32, height:32, borderRadius:10, background:c.primaryPale, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <AuthSvg d={AP.hash} size={14} color={c.primary}/>
            </div>
            <p style={{ fontSize:14, fontWeight:700, color:c.text, margin:0 }}>Uitnodigingscode</p>
          </div>
          {/* Big code display */}
          <div style={{ textAlign:'center', padding:'12px 0 8px' }}>
            <span style={{ fontSize:30, fontWeight:800, letterSpacing:'0.3em', color:c.text, fontFamily:'inherit', fontVariantNumeric:'tabular-nums' }}>
              AB●123
            </span>
          </div>
          <div style={{ height:2, background:c.borderMid, borderRadius:1 }}/>
          <p style={{ fontSize:11, color:c.textMuted, textAlign:'center', margin:'8px 0 0' }}>6 tekens — letters en cijfers</p>
        </div>

        <PrimaryBtn c={c}>
          Deelnemen
          <AuthSvg d={AP.arrowRight} size={16} color="#fff" w={2.5}/>
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ─── JoinGroup — Success ────────────────────────────────────
function JoinGroupSuccess(c) {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:c.bg, padding:'0 28px' }}>
      <div style={{ width:72, height:72, borderRadius:36, background:c.successBg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
        <AuthSvg d={AP.checkCircle} size={36} color={c.success} w={2}/>
      </div>
      <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.4, color:c.text, margin:'0 0 8px', textAlign:'center' }}>Welkom bij Giraf!</h2>
      <p style={{ fontSize:13, fontWeight:500, color:c.textSec, margin:'0 0 28px', textAlign:'center', lineHeight:1.5 }}>Je bent succesvol toegevoegd aan de groep.</p>
      <PrimaryBtn c={c}>
        Naar de app <AuthSvg d={AP.arrowRight} size={16} color="#fff" w={2.5}/>
      </PrimaryBtn>
    </div>
  )
}

Object.assign(window, { Login, Register, JoinGroupBrowse, JoinGroupCode, JoinGroupSuccess });
