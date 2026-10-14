const mediaPrefix = '/api/content-media'
const backend = new URL(process.env.VUE_APP_SERVER_URL, window.location.origin)
const allowedHosts = new Set([backend.hostname, 'localhost', '127.0.0.1', window.location.hostname])

export function mediaUrl(value) {
  if (!value || value.startsWith(mediaPrefix + '/')) return value || ''
  try {
    const url = new URL(value, window.location.origin)
    if (allowedHosts.has(url.hostname) && /^\/static\/(uploadFiles|uploadImages|defaultImage)\//.test(url.pathname)) {
      return mediaPrefix + url.pathname + url.search
    }
    return value
  } catch (_) {
    return value
  }
}

export function mediaHtml(html) {
  const template = document.createElement('template')
  template.innerHTML = html || ''
  template.content.querySelectorAll('[src]').forEach(node => {
    node.setAttribute('src', mediaUrl(node.getAttribute('src')))
  })
  return template.innerHTML
}

export function normalizeMediaResponse(value) {
  if (Array.isArray(value)) return value.map(normalizeMediaResponse)
  if (value && typeof value === 'object') {
    Object.keys(value).forEach(key => { value[key] = normalizeMediaResponse(value[key]) })
    return value
  }
  if (typeof value !== 'string') return value
  if (value === backend.origin) return mediaPrefix
  if (value.includes('<') && value.includes('src=')) return mediaHtml(value)
  // Keep relative database filenames intact so saving a cover remains compatible.
  return /^https?:\/\//.test(value) ? mediaUrl(value) : value
}
