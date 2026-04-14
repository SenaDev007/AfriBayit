type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const cacheStore = new Map<string, CacheEntry<unknown>>()

export function getCache<T>(key: string): T | null {
  const entry = cacheStore.get(key)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    cacheStore.delete(key)
    return null
  }
  return entry.value as T
}

export function setCache<T>(key: string, value: T, ttlMs: number) {
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  })
}
