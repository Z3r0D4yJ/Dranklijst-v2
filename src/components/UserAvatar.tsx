import { User } from '@phosphor-icons/react'

interface UserAvatarProps {
  avatarUrl?: string | null
  size: number
  bg?: string
  border?: string
  iconColor?: string
}

export function UserAvatar({ avatarUrl, size, bg, border, iconColor }: UserAvatarProps) {
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background: bg ?? 'var(--color-accent-bg)',
        border: border ?? '1.5px solid var(--color-accent-border)',
      }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <User size={Math.round(size * 0.42)} color={iconColor ?? 'var(--color-accent)'} weight="bold" />
      )}
    </div>
  )
}
