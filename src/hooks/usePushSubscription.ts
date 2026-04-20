import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { subscribeToPush, unsubscribeFromPush } from '../lib/push'

export function usePushSubscription() {
  const { user } = useAuth()
  const [subscribed, setSubscribed] = useState(false)
  const [supported, setSupported] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setSupported(false)
      return
    }
    navigator.serviceWorker.ready.then(reg => {
      const hasPush = !!reg.pushManager
      setSupported(hasPush)
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))

      if (hasPush && user && 'Notification' in window && Notification.permission === 'default') {
        subscribeToPush(user.id).then(ok => setSubscribed(ok))
      }
    })
  }, [user])

  async function enable() {
    if (!user) return
    setLoading(true)
    const ok = await subscribeToPush(user.id)
    setSubscribed(ok)
    setLoading(false)
  }

  async function disable() {
    if (!user) return
    setLoading(true)
    await unsubscribeFromPush(user.id)
    setSubscribed(false)
    setLoading(false)
  }

  return { subscribed, supported, loading, enable, disable }
}
