import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import type { ContentProps as VaulContentProps, DialogProps as VaulDrawerProps } from 'vaul'
import { cn } from '@/lib/utils'

type DrawerDirection = VaulDrawerProps['direction']

const DrawerContext = React.createContext<{ direction: DrawerDirection }>({
  direction: 'bottom',
})

type DrawerProps = VaulDrawerProps & {
  shouldScaleBackground?: boolean
}

function DrawerRoot({
  RootComponent,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  shouldScaleBackground = false,
  direction = 'bottom',
  disablePreventScroll = false,
  noBodyStyles = true,
  repositionInputs = true,
  fixed = direction === 'bottom',
  ...props
}: DrawerProps & { RootComponent: typeof DrawerPrimitive.Root }) {
  const shouldManageDocumentScroll = RootComponent === DrawerPrimitive.Root
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }, [isControlled, onOpenChange])

  React.useEffect(() => {
    if (!shouldManageDocumentScroll) return
    if (!open || typeof document === 'undefined') return

    const html = document.documentElement
    const body = document.body
    const computedBodyStyle = window.getComputedStyle(body)

    const previousHtmlOverflow = html.style.overflow
    const previousHtmlOverscroll = html.style.overscrollBehavior
    const previousBodyOverflow = body.style.overflow
    const previousBodyOverscroll = body.style.overscrollBehavior
    const previousBodyPaddingTop = body.style.paddingTop
    const previousBodyPaddingBottom = body.style.paddingBottom

    html.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    body.style.paddingTop = computedBodyStyle.paddingTop
    body.style.paddingBottom = computedBodyStyle.paddingBottom

    return () => {
      html.style.overflow = previousHtmlOverflow
      html.style.overscrollBehavior = previousHtmlOverscroll
      body.style.overflow = previousBodyOverflow
      body.style.overscrollBehavior = previousBodyOverscroll
      body.style.paddingTop = previousBodyPaddingTop
      body.style.paddingBottom = previousBodyPaddingBottom
    }
  }, [open, shouldManageDocumentScroll])

  return (
    <DrawerContext.Provider value={{ direction }}>
      <RootComponent
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={handleOpenChange}
        shouldScaleBackground={shouldScaleBackground}
        direction={direction}
        disablePreventScroll={disablePreventScroll}
        noBodyStyles={noBodyStyles}
        repositionInputs={repositionInputs}
        fixed={fixed}
        {...props}
      />
    </DrawerContext.Provider>
  )
}

function Drawer(props: DrawerProps) {
  return <DrawerRoot RootComponent={DrawerPrimitive.Root} {...props} />
}
Drawer.displayName = 'Drawer'

function DrawerNested(props: DrawerProps) {
  return <DrawerRoot RootComponent={DrawerPrimitive.NestedRoot} {...props} />
}
DrawerNested.displayName = 'DrawerNested'

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-[rgba(11,18,32,0.44)] backdrop-blur-sm',
      className,
    )}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

type DrawerContentProps = VaulContentProps & {
  hideHandle?: boolean
}

const DIRECTION_CLASSES: Record<NonNullable<DrawerDirection>, string> = {
  bottom: 'inset-x-0 bottom-0 mt-24 max-h-[var(--drawer-max-height)] rounded-t-[28px] border-b-0',
  top: 'inset-x-0 top-0 mb-24 max-h-[var(--drawer-max-height)] rounded-b-[28px] border-t-0',
  left: 'inset-y-0 left-0 h-full w-[min(92vw,420px)] rounded-r-[28px] border-l-0',
  right: 'inset-y-0 right-0 h-full w-[min(92vw,420px)] rounded-l-[28px] border-r-0',
}

const HANDLE_DIRECTION_CLASSES: Record<'bottom' | 'top', string> = {
  bottom: 'pt-3 pb-1',
  top: 'pb-3 pt-1',
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  DrawerContentProps
>(({ className, children, hideHandle = false, style, ...props }, ref) => {
  const { direction } = React.useContext(DrawerContext)
  const resolvedDirection = direction ?? 'bottom'
  const safeAreaBackground = 'var(--drawer-safe-area-bg, var(--drawer-content-bg, var(--color-surface)))'

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          'fixed z-50 flex flex-col overflow-hidden border border-[var(--color-border)] shadow-none outline-none',
          DIRECTION_CLASSES[resolvedDirection],
          className,
        )}
        style={{
          background: 'var(--drawer-content-bg, var(--color-surface))',
          paddingTop: resolvedDirection === 'top' ? 'env(safe-area-inset-top, 0px)' : undefined,
          ...style,
        }}
        {...props}
      >
        {!hideHandle && (resolvedDirection === 'bottom' || resolvedDirection === 'top') && (
          <div className={cn('shrink-0 flex justify-center', HANDLE_DIRECTION_CLASSES[resolvedDirection])}>
            <DrawerPrimitive.Handle
              className="h-1 w-10 rounded-full bg-[var(--color-drawer-handle)]"
            />
          </div>
        )}
        {children}
        {resolvedDirection === 'bottom' && (
          <div
            aria-hidden="true"
            className="shrink-0"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              background: safeAreaBackground,
            }}
          />
        )}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
})
DrawerContent.displayName = DrawerPrimitive.Content.displayName

function DrawerHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('shrink-0 px-5 pt-2 pb-4', className)} {...props} />
}

function DrawerFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('shrink-0 px-5 py-4', className)} {...props} />
}

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn('text-[17px] font-extrabold tracking-[-0.3px]', className)}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn('mt-0.5 text-[12px] font-medium', className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerNested,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
}
