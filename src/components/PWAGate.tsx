import { useState, useEffect, type ReactNode } from 'react'
import { Export, DownloadSimple, Plus } from '@phosphor-icons/react'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { ActionPillButton } from './ui/action-button'

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function GateScreen({ canInstall, install }: { canInstall: boolean; install: () => void }) {
  const ios = isIOS()

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: 'var(--color-primary)' }}
    >
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4 relative overflow-hidden">
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 320, height: 320, background: 'rgba(255,255,255,0.06)', top: -80, right: -100 }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 200, height: 200, background: 'rgba(255,255,255,0.04)', bottom: 20, left: -60 }}
        />
        <p className="text-white text-[36px] font-extrabold tracking-[-1px] mb-2 relative z-10">
          Dranklijst
        </p>
        <p className="text-[14px] font-medium relative z-10 mb-8" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Chiro Kapelmuur
        </p>
        <img
          src="/fox.png"
          alt=""
          className="relative z-10"
          style={{ width: 190, height: 190, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))' }}
        />
      </div>

      {/* Install card */}
      <div
        className="rounded-t-[28px] px-5 pt-6 pb-10"
        style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}
      >
        <p className="text-[20px] font-extrabold tracking-[-0.4px] m-0" style={{ color: 'var(--color-text-primary)' }}>
          Installeer de app
        </p>
        <p className="text-[13px] leading-[1.6] mt-1 mb-5 m-0" style={{ color: 'var(--color-text-muted)' }}>
          Voeg Dranklijst toe aan je beginscherm voor de beste ervaring.
        </p>

        {canInstall && (
          <ActionPillButton
            variant="accent"
            size="md"
            className="w-full"
            onClick={install}
          >
            <DownloadSimple size={16} weight="bold" />
            App installeren
          </ActionPillButton>
        )}

        {!canInstall && ios && (
          <div className="space-y-3">
            {[
              { icon: <Export size={17} weight="bold" />, label: 'Tik op het deel-icoon onderaan Safari' },
              { icon: <Plus size={17} weight="bold" />, label: 'Kies "Zet op beginscherm"' },
              { icon: <DownloadSimple size={17} weight="bold" />, label: 'Tik op "Voeg toe" en open de app' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: 'var(--color-primary-pale)', color: 'var(--color-primary)' }}
                >
                  {step.icon}
                </div>
                <p className="text-[13px] font-medium m-0" style={{ color: 'var(--color-text-primary)' }}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {!canInstall && !ios && (
          <p className="text-[13px] leading-[1.6] m-0" style={{ color: 'var(--color-text-muted)' }}>
            Open deze pagina in <strong style={{ color: 'var(--color-text-primary)' }}>Safari</strong> (iPhone/iPad) of{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>Chrome</strong> (Android) om de app te kunnen installeren.
          </p>
        )}
      </div>
    </div>
  )
}

export function PWAGate({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const { canInstall, install } = usePWAInstall()

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator &&
        (window.navigator as { standalone?: boolean }).standalone === true)
    setIsStandalone(standalone)
    setIsReady(true)
  }, [])

  if (!isReady) {
    return <div className="fixed inset-0" style={{ background: 'var(--color-primary)' }} />
  }

  if (isStandalone) return <>{children}</>

  return <GateScreen canInstall={canInstall} install={install} />
}
