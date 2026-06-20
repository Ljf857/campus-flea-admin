export function resolveImageUrl(path?: string): string {
  if (!path) return ''
  const base = import.meta.env.VITE_MINIO_URL || '/minio'
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path.replace(/^https?:\/\/localhost:\d+/, base)
  }
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}
