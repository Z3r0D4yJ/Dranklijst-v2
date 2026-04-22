import { useRef } from 'react'

interface UseSwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  ignoreSelector?: string
}

const AXIS_LOCK_DISTANCE = 14
const AXIS_LOCK_RATIO = 1.25
const FLICK_DISTANCE = 44
const FLICK_VELOCITY = 0.35

function supportsTouchSwipe() {
  if (typeof window === 'undefined') return false

  const coarsePointer =
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(any-pointer: coarse)').matches

  return coarsePointer || navigator.maxTouchPoints > 0
}

function isHorizontallyScrollable(element: HTMLElement) {
  const style = window.getComputedStyle(element)
  const overflowX = style.overflowX

  if (overflowX !== 'auto' && overflowX !== 'scroll') {
    return false
  }

  return element.scrollWidth > element.clientWidth + 1
}

function shouldIgnoreSwipeStart(
  target: EventTarget | null,
  boundary: HTMLElement,
  ignoreSelector: string,
) {
  if (!(target instanceof HTMLElement)) return false

  if (target.closest(ignoreSelector)) {
    return true
  }

  let current: HTMLElement | null = target

  while (current && current !== boundary) {
    if (isHorizontallyScrollable(current)) {
      return true
    }
    current = current.parentElement
  }

  return false
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 72,
  ignoreSelector = '[data-swipe-ignore]',
}: UseSwipeOptions) {
  const startX = useRef(0)
  const startY = useRef(0)
  const lastX = useRef(0)
  const lastY = useRef(0)
  const startTime = useRef(0)
  const active = useRef(false)
  const horizontalLocked = useRef(false)

  const reset = () => {
    active.current = false
    horizontalLocked.current = false
    startX.current = 0
    startY.current = 0
    lastX.current = 0
    lastY.current = 0
    startTime.current = 0
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (!supportsTouchSwipe() || e.touches.length !== 1) {
      reset()
      return
    }

    if (shouldIgnoreSwipeStart(e.target, e.currentTarget as HTMLElement, ignoreSelector)) {
      reset()
      return
    }

    const touch = e.touches[0]
    startX.current = touch.clientX
    startY.current = touch.clientY
    lastX.current = touch.clientX
    lastY.current = touch.clientY
    startTime.current = e.timeStamp
    active.current = true
    horizontalLocked.current = false
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!active.current) return

    if (e.touches.length !== 1) {
      reset()
      return
    }

    const touch = e.touches[0]
    const dx = touch.clientX - startX.current
    const dy = touch.clientY - startY.current

    lastX.current = touch.clientX
    lastY.current = touch.clientY

    if (!horizontalLocked.current) {
      if (Math.abs(dx) < AXIS_LOCK_DISTANCE) {
        return
      }

      if (Math.abs(dx) > Math.abs(dy) * AXIS_LOCK_RATIO) {
        horizontalLocked.current = true
      } else {
        reset()
        return
      }
    }

    if (e.cancelable) {
      e.preventDefault()
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!active.current) {
      reset()
      return
    }

    const changedTouch = e.changedTouches[0]
    if (changedTouch) {
      lastX.current = changedTouch.clientX
      lastY.current = changedTouch.clientY
    }

    const dx = lastX.current - startX.current
    const elapsed = Math.max(e.timeStamp - startTime.current, 1)
    const velocityX = Math.abs(dx) / elapsed
    const hasDistance = Math.abs(dx) >= threshold
    const hasFlick = Math.abs(dx) >= FLICK_DISTANCE && velocityX >= FLICK_VELOCITY

    if (!horizontalLocked.current || (!hasDistance && !hasFlick)) {
      reset()
      return
    }

    reset()

    if (dx < 0) onSwipeLeft?.()
    else onSwipeRight?.()
  }

  const onTouchCancel = () => {
    reset()
  }

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel }
}
