'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/stores/auth'
import { useSession } from '@/stores/session'
import { startSyncDriver } from '@/lib/sync/driver'
import { fetchGroupProducts, fetchActivePeriod } from '@/lib/products/fetch'
import type { Database } from '@/types/supabase'

type UserProfile = Database['public']['Tables']['users']['Row']

const AUTH_ROUTES = ['/login', '/aanmelden', '/auth']
const ONBOARDING_ROUTES = ['/pin-instellen', '/groep-kiezen']

function getTargetRoute(profile: UserProfile, pathname: string): string | null {
  if (!profile.pin_hash) return '/pin-instellen'
  if (!profile.group_id || profile.membership_status !== 'active') return '/groep-kiezen'

  // Volledig onboarded — stuur weg van auth/onboarding routes
  const isIdleRoute = [...AUTH_ROUTES, ...ONBOARDING_ROUTES].some((r) =>
    pathname.startsWith(r)
  )
  if (isIdleRoute) return '/registreer'

  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { setUser, setProfile } = useAuth()
  const { setGroupProducts, setActivePeriod, setLoading, reset } = useSession()

  useEffect(() => {
    const supabase = createClient()

    async function handleSignIn(userId: string) {
      const { data: profile } = await supabase
        .from('users')
        .select('id, display_name, role, group_id, membership_status, pin_hash, biometric_enabled, joined_group_at, created_at, updated_at')
        .eq('id', userId)
        .single()

      if (!profile) return

      setProfile(profile)

      const target = getTargetRoute(profile, pathname)
      if (target) {
        router.replace(target)
      }

      if (profile.group_id && profile.membership_status === 'active') {
        setLoading(true)
        try {
          const [products, period] = await Promise.all([
            fetchGroupProducts(profile.group_id),
            fetchActivePeriod(profile.group_id),
          ])
          setGroupProducts(products)
          setActivePeriod(period)
        } catch {
          // sync indicator toont status
        } finally {
          setLoading(false)
        }
      }

      startSyncDriver()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await handleSignIn(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          reset()

          if (!AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
            router.replace('/login')
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}
