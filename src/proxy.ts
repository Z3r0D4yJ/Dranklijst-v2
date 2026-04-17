import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_ROUTES = ['/login', '/aanmelden', '/auth']
const ONBOARDING_ROUTES = ['/pin-instellen', '/groep-kiezen']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  const isOnboarding = ONBOARDING_ROUTES.some((r) => pathname.startsWith(r))
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/api')

  if (!user && !isPublic && !isStatic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isPublic && !pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/registreer', request.url))
  }

  // Onboarding routes zijn toegankelijk voor ingelogde users zonder verdere checks
  void isOnboarding

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
