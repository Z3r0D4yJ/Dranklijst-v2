export function haptic(intensity: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: [10, 40, 10],
  }
  navigator.vibrate(patterns[intensity])
}
