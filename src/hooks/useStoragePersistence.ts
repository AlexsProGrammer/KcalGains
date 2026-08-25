import { useCallback, useEffect, useState } from 'react'
import { getStorageEstimate, requestStoragePersistence } from '@/db/persistence'

export type StoragePersistenceState = {
  isPersisted: boolean | null
  quotaUsageBytes: number | null
  quotaTotalBytes: number | null
}

export function useStoragePersistence(): StoragePersistenceState & { refresh: () => Promise<void>; requestPermission: () => Promise<boolean> } {
  const [state, setState] = useState<StoragePersistenceState>({
    isPersisted: null,
    quotaUsageBytes: null,
    quotaTotalBytes: null,
  })

  const refresh = useCallback(async () => {
    const [isPersisted, estimate] = await Promise.all([
      requestStoragePersistence(),
      getStorageEstimate(),
    ])

    setState({
      isPersisted,
      quotaUsageBytes: estimate?.usageBytes ?? null,
      quotaTotalBytes: estimate?.quotaBytes ?? null,
    })
  }, [])

  const requestPermission = useCallback(async () => {
    const next = await requestStoragePersistence()
    await refresh()
    return next
  }, [refresh])

  useEffect(() => {
    let active = true

    async function initializePersistence() {
      const [isPersisted, estimate] = await Promise.all([
        requestStoragePersistence(),
        getStorageEstimate(),
      ])

      if (!active) return

      setState({
        isPersisted,
        quotaUsageBytes: estimate?.usageBytes ?? null,
        quotaTotalBytes: estimate?.quotaBytes ?? null,
      })
    }

    void initializePersistence()

    return () => {
      active = false
    }
  }, [])

  return { ...state, refresh, requestPermission }
}
