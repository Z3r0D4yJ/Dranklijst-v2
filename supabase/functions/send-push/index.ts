import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT     = 'mailto:admin@dranklijst.app'

// ── VAPID / Web Push helpers ──────────────────────────────────────────────────

function base64UrlDecode(str: string): Uint8Array {
  const pad = str.length % 4
  const padded = str + '='.repeat(pad ? 4 - pad : 0)
  const b64 = padded.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

function base64UrlEncode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function buildVapidHeaders(endpoint: string): Promise<Record<string, string>> {
  const url = new URL(endpoint)
  const audience = `${url.protocol}//${url.host}`

  const header = { typ: 'JWT', alg: 'ES256' }
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_SUBJECT,
  }

  const enc   = new TextEncoder()
  const toB64 = (o: unknown) => base64UrlEncode(enc.encode(JSON.stringify(o)).buffer)
  const sigInput = `${toB64(header)}.${toB64(payload)}`

  const privateKeyBytes = base64UrlDecode(VAPID_PRIVATE_KEY)
  const ecKey = await crypto.subtle.importKey(
    'raw', privateKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, []
  ).catch(() =>
    // try pkcs8 fallback
    crypto.subtle.importKey(
      'pkcs8', privateKeyBytes,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false, ['sign']
    )
  ) as CryptoKey

  // Re-import as ECDSA signing key (raw format)
  const signingKey = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  ).catch(() => ecKey)

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    enc.encode(sigInput)
  )

  const token = `${sigInput}.${base64UrlEncode(sig)}`

  return {
    Authorization: `vapid t=${token}, k=${VAPID_PUBLIC_KEY}`,
    'Content-Type': 'application/octet-stream',
    'TTL': '86400',
  }
}

// ── Message encryption (RFC 8291) ─────────────────────────────────────────────

async function encryptPayload(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const enc = new TextEncoder()

  const clientPublicKey  = base64UrlDecode(subscription.p256dh)
  const authSecret       = base64UrlDecode(subscription.auth)

  // Server ephemeral key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  )
  const serverPublicKeyBuf = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey)

  // Import client public key
  const clientKey = await crypto.subtle.importKey(
    'raw', clientPublicKey, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  )

  // ECDH shared secret
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientKey }, serverKeyPair.privateKey, 256
  )

  // PRK_key via HKDF (auth secret extract)
  const prkKeyMat = await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveBits'])
  const keyInfoParts = new Uint8Array([
    ...enc.encode('WebPush: info\0'),
    ...clientPublicKey,
    ...new Uint8Array(serverPublicKeyBuf),
  ])
  const prkKey = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: keyInfoParts },
    prkKeyMat, 256
  )

  const salt = crypto.getRandomValues(new Uint8Array(16))

  const prkMat = await crypto.subtle.importKey('raw', prkKey, 'HKDF', false, ['deriveBits'])
  const cekInfo = enc.encode('Content-Encoding: aes128gcm\0')
  const cekBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: cekInfo }, prkMat, 128
  )
  const nonceInfo = enc.encode('Content-Encoding: nonce\0')
  const nonceBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo }, prkMat, 96
  )

  const cek   = await crypto.subtle.importKey('raw', cekBits, 'AES-GCM', false, ['encrypt'])
  const nonce = new Uint8Array(nonceBits)

  // Pad to rs=4096, add padding delimiter (0x02)
  const rs = 4096
  const data = enc.encode(payload)
  const paddedLen = rs - 16 - 1
  const plaintext = new Uint8Array(paddedLen)
  plaintext.set(data)
  plaintext[data.length] = 0x02

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cek, plaintext)

  return { ciphertext: new Uint8Array(encrypted), salt, serverPublicKey: new Uint8Array(serverPublicKeyBuf) }
}

function buildAes128gcmBody(
  salt: Uint8Array, serverPublicKey: Uint8Array, ciphertext: Uint8Array
): Uint8Array {
  // Header: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const rs = new Uint8Array(4)
  new DataView(rs.buffer).setUint32(0, 4096, false)
  const header = new Uint8Array([...salt, ...rs, 65, ...serverPublicKey])
  const result = new Uint8Array(header.length + ciphertext.length)
  result.set(header)
  result.set(ciphertext, header.length)
  return result
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { user_ids, title, body, url = '/' } = await req.json() as {
    user_ids: string[]
    title: string
    body: string
    url?: string
  }

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, user_id')
    .in('user_id', user_ids)

  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 })

  const payload = JSON.stringify({ title, body, url })
  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      const { ciphertext, salt, serverPublicKey } = await encryptPayload(sub, payload)
      const bodyBytes = buildAes128gcmBody(salt, serverPublicKey, ciphertext)
      const headers = await buildVapidHeaders(sub.endpoint)
      headers['Content-Encoding'] = 'aes128gcm'

      const res = await fetch(sub.endpoint, { method: 'POST', headers, body: bodyBytes })

      // 410 Gone = subscription expired, clean up
      if (res.status === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return new Response(JSON.stringify({ sent, total: subs.length }), { status: 200 })
})
