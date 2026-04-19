import { useState, useMemo } from 'react'

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const slice = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, safePage, pageSize])

  function onPage(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)))
  }

  // Reset to page 1 when items change significantly
  useMemo(() => { setPage(1) }, [items.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return { slice, page: safePage, totalPages, onPage }
}
