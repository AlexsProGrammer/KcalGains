import { useEffect, useState } from 'react'
import { getStorageEstimate, requestStoragePersistence } from '@/db/persistence'

export type StoragePersistenceState = {
  isPersisted: boolean | null
  quotaUsageBytes: number | null
  quotaTotalBytes: number | null
}

export function useStoragePersistence(): StoragePersistenceState {
  const [state, setState] = useState<StoragePersistenceState>({
    isPersisted: null,
    quotaUsageBytes: null,
    quotaTotalBytes: null,
  })

  useEffect(() => {
    let isActive = true

    async function initializePersistence() {
      const [isPersisted, estimate] = await Promise.all([
        requestStoragePersistence(),
        getStorageEstimate(),
      ])

      if (isActive) {
        setState({
          isPersisted,
          quotaUsageBytes: estimate?.usageBytes ?? null,
          quotaTotalBytes: estimate?.quotaBytes ?? null,
        })
      }
    }

    void initializePersistence()

    return () => {
      isActive = false
    }
  }, [])

  return state
}
