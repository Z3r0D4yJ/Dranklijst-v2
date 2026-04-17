'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PlusCircle, User, Trophy, List } from '@phosphor-icons/react'

const TABS = [
  { href: '/registreer', label: 'Registreer', Icon: PlusCircle },
  { href: '/mij',        label: 'Mij',        Icon: User },
  { href: '/ranking',    label: 'Ranking',    Icon: Trophy },
  { href: '/meer',       label: 'Meer',       Icon: List },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-100 bg-white/95 backdrop-blur-sm">
      <div className="grid h-16 grid-cols-4">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand" />
              )}
              <Icon
                size={22}
                weight={active ? 'fill' : 'regular'}
                className={`transition-colors ${active ? 'text-brand' : 'text-zinc-400'}`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${active ? 'text-brand' : 'text-zinc-400'}`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
