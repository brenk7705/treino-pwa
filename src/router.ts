import { useSyncExternalStore } from 'react'

function getHash() {
  return window.location.hash.replace(/^#\/?/, '')
}

export function useRoute(): string[] {
  const h = useSyncExternalStore(
    (cb) => {
      window.addEventListener('hashchange', cb)
      return () => window.removeEventListener('hashchange', cb)
    },
    getHash,
  )
  return h.split('/').filter(Boolean).map(decodeURIComponent)
}

export function go(path: string) {
  window.location.hash = '#/' + path.replace(/^\//, '')
}

export function back(fallback = '') {
  if (window.history.length > 1) window.history.back()
  else go(fallback)
}
