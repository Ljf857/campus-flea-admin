const PREFIX = 'campus_flea_'

export function getToken(): string {
  return localStorage.getItem(PREFIX + 'accessToken') || ''
}

export function setToken(token: string): void {
  localStorage.setItem(PREFIX + 'accessToken', token)
}

export function getRefreshToken(): string {
  return localStorage.getItem(PREFIX + 'refreshToken') || ''
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(PREFIX + 'refreshToken', token)
}

export function clearTokens(): void {
  localStorage.removeItem(PREFIX + 'accessToken')
  localStorage.removeItem(PREFIX + 'refreshToken')
}

export function getStorage<T>(key: string): T | null {
  const raw = localStorage.getItem(PREFIX + key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function setStorage<T>(key: string, value: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export function removeStorage(key: string): void {
  localStorage.removeItem(PREFIX + key)
}
