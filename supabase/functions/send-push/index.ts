import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT     = 'mailto:jaspervanzeir1@gmail.com'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Encoding helpers ──────────────────────────────────────────────────────────

function b64uDecode(str: string): Uint8Array {
  const pad = str.length % 4
  const b64 = (str + '='.repeat(pad ? 4 - pad : 0)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

function b64uEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// ── VAPID JWT signing ─────────────────────────────────────────────────────────

async function buildVapidHeaders(endpoint: string): Promise<Record<string, string>> {
  const audience = (() => { const u = new URL(endpoint); return `${u.protocol}//${u.host}` })()
  const enc = new TextEncoder()

  const header  = { typ: 'JWT', alg: 'ES256' }
  const payload = { aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: VAPID_SUBJECT }
  const toB64   = (o: unknown) => b64uEncode(enc.encode(JSON.stringify(o)))
  const sigInput = `${toB64(header)}.${toB64(payload)}`

  // Raw format only works for PUBLIC EC keys in Web Crypto.
  // Private keys must be imported as JWK, combining the private scalar (d)
  // with the x/y components extracted from the uncompressed public key.
  const privBytes = b64uDecode(VAPID_PRIVATE_KEY)
  const pubBytes  = b64uDecode(VAPID_PUBLIC_KEY)   // 0x04 || x(32) || y(32)

  const jwk = {
    kty: 'EC', crv: 'P-256',
    d: b64uEncode(privBytes),
    x: b64uEncode(pubBytes.slice(1, 33)),
    y: b64uEncode(pubBytes.slice(33, 65)),
  }

  const signingKey = await crypto.subtle.importKey(
    'jwk', jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )

  const sig   = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signingKey, enc.encode(sigInput))
  const token = `${sigInput}.${b64uEncode(new Uint8Array(sig))}`

  return {
    Authorization: `vapid t=${token}, k=${VAPID_PUBLIC_KEY}`,
    TTL: '86400',
  }
}

// ── RFC 8291 aes128gcm payload encryption ────────────────────────────────────

async function encryptPayload(
  sub: { p256dh: string; auth: string },
  payload: string,
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const enc = new TextEncoder()
  const clientPub  = b64uDecode(sub.p256dh)
  const authSecret = b64uDecode(sub.auth)

  const serverPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const serverPubBuf = await crypto.subtle.exportKey('raw', serverPair.publicKey)

  const clientKey  = await crypto.subtle.importKey('raw', clientPub, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const sharedBits = await crypto.subtle.deriveBits({ name: 'ECDH', public: clientKey }, serverPair.privateKey, 256)

  const prkMat  = await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveBits'])
  const keyInfo = new Uint8Array([...enc.encode('WebPush: info\0'), ...clientPub, ...new Uint8Array(serverPubBuf)])
  const prk     = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: keyInfo }, prkMat, 256)

  const salt   = crypto.getRandomValues(new Uint8Array(16))
  const prkMat2 = await crypto.subtle.importKey('raw', prk, 'HKDF', false, ['deriveBits'])
  const cekBits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('Content-Encoding: aes128gcm\0') }, prkMat2, 128)
  const nonceBits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('Content-Encoding: nonce\0') }, prkMat2, 96)

  const cek   = await crypto.subtle.importKey('raw', cekBits, 'AES-GCM', false, ['encrypt'])
  const nonce = new Uint8Array(nonceBits)

  const data      = enc.encode(payload)
  const plaintext = new Uint8Array(4096 - 16 - 1)
  plaintext.set(data)
  plaintext[data.length] = 0x02

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cek, plaintext)
  return { ciphertext: new Uint8Array(encrypted), salt, serverPublicKey: new Uint8Array(serverPubBuf) }
}

function buildBody(salt: Uint8Array, serverPublicKey: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  const rs = new Uint8Array(4)
  new DataView(rs.buffer).setUint32(0, 4096, false)
  const header = new Uint8Array([...salt, ...rs, 65, ...serverPublicKey])
  const out = new Uint8Array(header.length + ciphertext.length)
  out.set(header)
  out.set(ciphertext, header.length)
  return out
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { user_ids, title, body, url = '/' } = await req.json() as {
      user_ids: string[]; title: string; body: string; url?: string
    }

    const { data: subs } = await sb
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .in('user_id', user_ids)

    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    const payload = JSON.stringify({ title, body, url })
    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        const { ciphertext, salt, serverPublicKey } = await encryptPayload(sub, payload)
        const bodyBytes = buildBody(salt, serverPublicKey, ciphertext)
        const headers   = await buildVapidHeaders(sub.endpoint)
        headers['Content-Encoding'] = 'aes128gcm'
        headers['Content-Type']     = 'application/octet-stream'

        const res = await fetch(sub.endpoint, { method: 'POST', headers, body: bodyBytes })

        if (res.status === 410 || res.status === 404) {
          await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          throw new Error(`Subscription expired (${res.status})`)
        }
        if (!res.ok) {
          throw new Error(`Push service error: ${res.status} ${await res.text()}`)
        }
      })
    )

    const sent   = results.filter(r => r.status === 'fulfilled').length
    const errors = (results.filter(r => r.status === 'rejected') as PromiseRejectedResult[]).map(r => r.reason?.message)
    if (errors.length) console.error('Push errors:', errors)

    return new Response(
      JSON.stringify({ sent, total: subs.length, errors }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-push fatal:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  }
})
