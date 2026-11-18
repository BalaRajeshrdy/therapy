/**
 * Versioned, fail-safe localStorage helpers.
 * Every key is namespaced and versioned, so a future schema change can bump
 * STORAGE_VERSION without crashing on stale data. If storage is unavailable
 * (private mode, blocked site data) we fall back to in-memory storage.
 */
export const STORAGE_NAMESPACE = 'maple-sprout-demo'
export const STORAGE_VERSION = 1
export const STORAGE_EVENT = 'maple-sprout-storage'

export const storageKey = (name: string) => `${STORAGE_NAMESPACE}:v${STORAGE_VERSION}:${name}`

function probe(): boolean {
  try {
    const k = '__msp_probe__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

const memory = new Map<string, string>()
const canPersist = typeof window !== 'undefined' && probe()

export function readJSON<T>(name: string, fallback: T, validate?: (v: unknown) => boolean): T {
  try {
    const key = storageKey(name)
    const raw = canPersist ? window.localStorage.getItem(key) : memory.get(key) ?? null
    if (raw == null) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (validate && !validate(parsed)) return fallback
    return parsed as T
  } catch {
    return fallback
  }
}

export function writeJSON<T>(name: string, value: T): void {
  const key = storageKey(name)
  const serialized = JSON.stringify(value)
  try {
    if (canPersist) window.localStorage.setItem(key, serialized)
    else memory.set(key, serialized)
  } catch {
    memory.set(key, serialized)
  }
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { name } }))
}

export function removeKey(name: string): void {
  const key = storageKey(name)
  try {
    if (canPersist) window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
  memory.delete(key)
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { name } }))
}

/** Remove keys written by older schema versions. */
export function purgeStaleVersions(): void {
  if (!canPersist) return
  try {
    const prefix = `${STORAGE_NAMESPACE}:v`
    const current = `${STORAGE_NAMESPACE}:v${STORAGE_VERSION}:`
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(prefix) && !key.startsWith(current)) window.localStorage.removeItem(key)
    }
  } catch {
    /* ignore */
  }
}

export const isArray = (v: unknown): v is unknown[] => Array.isArray(v)
