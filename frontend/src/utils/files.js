/** Base origin for uploaded files (strip trailing /api). */
export function apiOrigin() {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  return base.replace(/\/api\/?$/, '') || 'http://localhost:5000'
}

export function fileUrl(pathOrUrl) {
  if (!pathOrUrl) return ''
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${apiOrigin()}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
