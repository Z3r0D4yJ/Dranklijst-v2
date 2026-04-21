import { useRef } from 'react'

interface UseSwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }: UseSwipeOptions) {
  const startX = useRef(0)
  const startY = useRef(0)
  const active = useRef(false)

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    active.current = true
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!active.current) return
    const dx = Math.abs(e.touches[0].clientX - startX.current)
    const dy = Math.abs(e.touches[0].clientY - startY.current)
    if (dy > dx * 1.2) active.current = false
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!active.current) return
    active.current = false
    const dx = e.changedTouches[0].clientX - startX.current
    if (Math.abs(dx) < threshold) return
    if (dx < 0) onSwipeLeft?.()
    else onSwipeRight?.()
  }

  return { onTouchStart, onTouchMove, onTouchEnd }
}
