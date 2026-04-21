import type { Role } from './database.types'
import type { BadgeProps } from '../components/ui/badge'

type BadgeVariant = NonNullable<BadgeProps['variant']>

export const ROLE_BADGE_VARIANT: Record<Role, BadgeVariant> = {
  lid:          'secondary',
  leiding:      'primary',
  kas:          'warning',
  groepsleiding:'success',
}
