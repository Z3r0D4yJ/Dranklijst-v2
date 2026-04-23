import { User } from '@phosphor-icons/react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

interface UserAvatarProps {
  avatarUrl?: string | null
  size: number
  bg?: string
  border?: string
  iconColor?: string
}

export const SURFACE_USER_AVATAR_STYLE = {
  bg: 'var(--color-surface-alt)',
  border: '1.5px solid var(--color-border)',
  iconColor: 'var(--color-text-secondary)',
} as const

export const HEADER_USER_AVATAR_STYLE = {
  bg: 'var(--color-header-avatar-bg)',
  border: '1.5px solid var(--color-header-avatar-border)',
  iconColor: 'var(--color-header-avatar-icon)',
} as const

export function UserAvatar({ avatarUrl, size, bg, border, iconColor }: UserAvatarProps) {
  return (
    <Avatar
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        border: border ?? '1.5px solid var(--color-accent-border)',
      }}
    >
      <AvatarImage src={avatarUrl ?? undefined} alt="" />
      <AvatarFallback
        style={{
          background: bg ?? 'var(--color-accent-bg)',
        }}
      >
        <User size={Math.round(size * 0.42)} color={iconColor ?? 'var(--color-accent)'} weight="bold" />
      </AvatarFallback>
    </Avatar>
  )
}
