import { useEffect, useRef, type ReactNode } from 'react'
import { X } from '@phosphor-icons/react'
import { cn } from '../lib/utils'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer'

function isKeyboardInput(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement && element.matches(
    'input:not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]):not([type="image"]):not([type="submit"]):not([type="reset"]), textarea, [contenteditable="true"]',
  )
}

function isSoftwareKeyboardOpen() {
  if (typeof window === 'undefined' || !window.visualViewport) return false
  return window.innerHeight - window.visualViewport.height > 80
}

interface AdminFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  dismissible?: boolean
  disableClose?: boolean
  contentClassName?: string
  bodyClassName?: string
  footerClassName?: string
  maxHeight?: string
  scrollBody?: boolean
  fixed?: boolean
  repositionInputs?: boolean
}

export function AdminFormDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  dismissible = true,
  disableClose = false,
  contentClassName,
  bodyClassName,
  footerClassName,
  maxHeight = 'var(--drawer-max-height)',
  scrollBody = true,
  fixed,
  repositionInputs,
}: AdminFormDrawerProps) {
  const closeFrameRef = useRef<number | null>(null)
  const restoreFrameRef = useRef<number | null>(null)
  const closeTimerRef = useRef<number | null>(null)
  const viewportListenerRef = useRef<(() => void) | null>(null)
  const initialScrollRef = useRef({ x: 0, y: 0 })

  function restoreInitialScroll() {
    window.scrollTo(initialScrollRef.current.x, initialScrollRef.current.y)
  }

  function clearPendingClose() {
    if (closeFrameRef.current !== null) {
      window.cancelAnimationFrame(closeFrameRef.current)
      closeFrameRef.current = null
    }
    if (restoreFrameRef.current !== null) {
      window.cancelAnimationFrame(restoreFrameRef.current)
      restoreFrameRef.current = null
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    if (viewportListenerRef.current && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', viewportListenerRef.current)
      viewportListenerRef.current = null
    }
  }

  useEffect(() => {
    if (!open || typeof window === 'undefined') return

    initialScrollRef.current = { x: window.scrollX, y: window.scrollY }

    return () => {
      clearPendingClose()
      restoreInitialScroll()
      restoreFrameRef.current = window.requestAnimationFrame(() => {
        restoreInitialScroll()
        restoreFrameRef.current = null
      })
    }
  }, [open])

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen || typeof document === 'undefined') {
      clearPendingClose()
      onOpenChange(nextOpen)
      return
    }

    const activeElement = document.activeElement

    if (!isKeyboardInput(activeElement)) {
      clearPendingClose()
      onOpenChange(false)
      return
    }

    clearPendingClose()

    const viewport = window.visualViewport
    const keyboardWasOpen = isSoftwareKeyboardOpen()
    const finalizeClose = () => {
      restoreInitialScroll()
      closeFrameRef.current = window.requestAnimationFrame(() => {
        restoreInitialScroll()
        closeFrameRef.current = null
        onOpenChange(false)
      })
    }

    activeElement.blur()

    if (!keyboardWasOpen) {
      finalizeClose()
      return
    }

    if (!viewport) {
      finalizeClose()
      return
    }

    const handleViewportResize = () => {
      restoreInitialScroll()
      if (!isSoftwareKeyboardOpen()) {
        clearPendingClose()
        finalizeClose()
      }
    }

    viewportListenerRef.current = handleViewportResize
    viewport.addEventListener('resize', handleViewportResize)

    closeTimerRef.current = window.setTimeout(() => {
      clearPendingClose()
      finalizeClose()
    }, 450)
  }

  if (!open) return null

  return (
    <Drawer
      open
      onOpenChange={handleOpenChange}
      dismissible={dismissible}
      fixed={fixed}
      repositionInputs={repositionInputs}
    >
    <DrawerContent
        className={cn('mx-auto w-full max-w-md rounded-t-[24px] px-0', contentClassName)}
        style={{ background: 'var(--color-surface)', maxHeight }}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
        }}
      >
        <DrawerHeader className="flex items-center justify-between border-b border-[var(--color-border)]">
          <div className="min-w-0">
            <DrawerTitle style={{ color: 'var(--color-text-primary)' }}>{title}</DrawerTitle>
            {description && (
              <DrawerDescription style={{ color: 'var(--color-text-muted)' }}>
                {description}
              </DrawerDescription>
            )}
          </div>
          <DrawerClose asChild>
            <button
              type="button"
              aria-label="Sluiten"
              disabled={disableClose}
              className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
              style={{ background: 'var(--color-surface-alt)' }}
            >
              <X size={16} color="var(--color-text-secondary)" weight="bold" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div
          className={cn(
            'px-5 py-5',
            scrollBody ? 'flex-1 overflow-y-auto min-h-0' : 'shrink-0',
            bodyClassName,
          )}
        >
          {children}
        </div>

        {footer && (
          <DrawerFooter className={cn('border-t border-[var(--color-border)]', footerClassName)}>
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}
