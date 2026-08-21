export type StorageEstimate = {
  usageBytes: number
  quotaBytes: number
}

function getStorageManager(): StorageManager | undefined {
  return typeof navigator !== 'undefined' ? navigator.storage : undefined
}

export async function requestStoragePersistence(): Promise<boolean> {
  const storage = getStorageManager()

  if (!storage?.persisted) {
    return false
  }

  if (await storage.persisted()) {
    return true
  }

  return storage.persist ? storage.persist() : false
}

export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  const storage = getStorageManager()

  if (!storage?.estimate) {
    return null
  }

  const estimate = await storage.estimate()

  return {
    usageBytes: estimate.usage ?? 0,
    quotaBytes: estimate.quota ?? 0,
  }
}
