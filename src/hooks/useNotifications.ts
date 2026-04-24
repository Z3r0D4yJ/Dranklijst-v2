import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export interface AppNotification {
  id: string
  user_id: string
  title: string
  body: string
  url: string
  is_read: boolean
  created_at: string
}

export function useNotifications() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications', profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []) as AppNotification[]
    },
  })

  const unreadCount = (query.data ?? []).filter(n => !n.is_read).length

  async function markAllRead() {
    if (!profile || unreadCount === 0) return
    const unreadIds = (query.data ?? []).filter(n => !n.is_read).map(n => n.id)
    const snapshot = queryClient.getQueryData<AppNotification[]>(['notifications', profile.id])
    queryClient.setQueryData<AppNotification[]>(['notifications', profile.id], old =>
      (old ?? []).map(n => ({ ...n, is_read: true }))
    )
    const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    if (error) {
      queryClient.setQueryData(['notifications', profile.id], snapshot)
    }
  }

  async function markRead(id: string) {
    if (!profile) return
    const snapshot = queryClient.getQueryData<AppNotification[]>(['notifications', profile.id])
    queryClient.setQueryData<AppNotification[]>(['notifications', profile.id], old =>
      (old ?? []).map(n => n.id === id ? { ...n, is_read: true } : n)
    )
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (error) {
      queryClient.setQueryData(['notifications', profile.id], snapshot)
    }
  }

  return { ...query, unreadCount, markAllRead, markRead }
}
