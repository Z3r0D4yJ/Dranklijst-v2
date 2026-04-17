import { createClient } from '@/lib/supabase/client'

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function setPin(pin: string) {
  if (!/^\d{4}$/.test(pin)) throw new Error('PIN moet 4 cijfers zijn')

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Niet ingelogd')

  const hash = await hashPin(pin)
  const { error } = await supabase
    .from('users')
    .update({ pin_hash: hash })
    .eq('id', user.id)

  if (error) throw error
}

export async function verifyPin(pin: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('users')
    .select('pin_hash')
    .eq('id', user.id)
    .single()

  if (!data?.pin_hash) return false
  const hash = await hashPin(pin)
  return hash === data.pin_hash
}
