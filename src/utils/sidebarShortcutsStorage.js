const STORAGE_RECENT = 'duizhang.sidebar.recentViews.v1'
const STORAGE_FAVORITES = 'duizhang.sidebar.favorites.v1'
const MAX_RECENT = 5

function safeParseStringArray(raw) {
  try {
    const v = raw ? JSON.parse(raw) : []
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function readRecentViews() {
  return safeParseStringArray(localStorage.getItem(STORAGE_RECENT))
}

export function writeRecentViews(views) {
  const next = views.slice(0, MAX_RECENT)
  localStorage.setItem(STORAGE_RECENT, JSON.stringify(next))
  return next
}

export function readFavoriteViews() {
  return safeParseStringArray(localStorage.getItem(STORAGE_FAVORITES))
}

export function writeFavoriteViews(views) {
  localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(views))
  return views
}

/** 去重并将 view 置于首位，最多 MAX_RECENT 条 */
export function mergeRecentViews(prev, view) {
  const next = [view, ...prev.filter((v) => v !== view)]
  return next.slice(0, MAX_RECENT)
}

export function addFavoriteView(prev, view) {
  if (prev.includes(view)) return prev
  return [...prev, view]
}

export function removeFavoriteView(prev, view) {
  return prev.filter((v) => v !== view)
}
