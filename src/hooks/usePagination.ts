import { useState, useMemo, useEffect } from 'react'

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

  useEffect(() => { setPage(1) }, [items.length])

  return { slice, page: safePage, totalPages, onPage }
}
