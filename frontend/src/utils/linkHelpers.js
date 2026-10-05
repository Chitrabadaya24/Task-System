export function normalizeUrl(url) {
  const u = (url || '').trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  return `https://${u}`
}

export function getLinkHref(link) {
  if (link?.url?.trim()) return normalizeUrl(link.url)
  const text = (link?.text || '').trim()
  if (/^https?:\/\//i.test(text) || /^[\w-]+\.[\w.-]+/.test(text)) return normalizeUrl(text)
  return null
}

export function getLinkDomain(url) {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
