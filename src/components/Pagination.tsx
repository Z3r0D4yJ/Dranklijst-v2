import { CaretLeft, CaretRight } from '@phosphor-icons/react'

interface Props {
  page: number
  totalPages: number
  onPage: (p: number) => void
}

export function Pagination({ page, totalPages, onPage }: Props) {
  if (totalPages <= 1) return null

  const pages: (number | '…')[] = []
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
  }

  const btn = (content: React.ReactNode, target: number, disabled: boolean, active = false) => (
    <button
      key={String(target) + String(active)}
      onClick={() => !disabled && onPage(target)}
      disabled={disabled}
      className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[13px] font-bold transition-colors disabled:opacity-30"
      style={{
        background: active ? 'var(--color-primary)' : 'var(--color-surface-alt)',
        color: active ? 'white' : 'var(--color-text-secondary)',
        border: 'none',
        fontFamily: 'inherit',
        flexShrink: 0,
      }}
    >
      {content}
    </button>
  )

  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      {btn(<CaretLeft size={13} weight="bold" />, page - 1, page === 1)}
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`ellipsis-${i}`} className="w-8 text-center text-[13px]" style={{ color: 'var(--color-text-muted)' }}>…</span>
          : btn(p, p, false, p === page)
      )}
      {btn(<CaretRight size={13} weight="bold" />, page + 1, page === totalPages)}
    </div>
  )
}
