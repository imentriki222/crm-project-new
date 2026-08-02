/** Formatting helpers shared across the app. */

export function initials(firstName = '', lastName = '') {
  return `${(firstName || '?').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase()
}

export function fullName(firstName = '', lastName = '') {
  return `${firstName} ${lastName}`.trim()
}

export function formatMoney(value) {
  const num = Number(value || 0)
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }) + ' DT'
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(iso) {
  if (!iso) return '—'
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 45) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

/** Format a stage key into a human label. */
export function stageLabel(stage) {
  return (stage || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Human label for automation trigger events. */
export function triggerLabel(event) {
  const labels = {
    'lead.created': 'Lead created',
    'lead.score_updated': 'Score updated',
    'lead.status_updated': 'Status changed',
  }
  return labels[event] || stageLabel(event)
}
