import { BottomNav } from '@/components/ui/bottom-nav'
import { SyncBanner } from '@/components/ui/sync-banner'

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col pb-16">
      <SyncBanner />
      {children}
      <BottomNav />
    </div>
  )
}
