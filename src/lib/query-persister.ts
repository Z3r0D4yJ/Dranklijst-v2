import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { kvDel, kvGet, kvSet } from './db'

const idbStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const value = await kvGet(key)
    return (value as string | undefined) ?? null
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await kvSet(key, value)
  },
  removeItem: async (key: string): Promise<void> => {
    await kvDel(key)
  },
}

export const queryPersister = createAsyncStoragePersister({
  storage: idbStorage,
  key: 'dranklijst-query-cache',
  throttleTime: 1000,
})
