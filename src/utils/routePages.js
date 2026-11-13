import { createElement, lazy } from 'react'

/**
 * A route component that can be fetched before React renders it.
 * Once its chunk is loaded it renders directly, so it never suspends. That lets a
 * prerendered page stay on screen until the real page can replace it in one commit.
 */
function lazyRoute(loader) {
  let LoadedPage = null
  let pending = null

  const load = () => {
    if (!pending) {
      pending = loader()
        .then((module) => {
          LoadedPage = module.default
          return module
        })
        .catch((error) => {
          // Forget the failure so React.lazy can retry the import when it renders.
          pending = null
          throw error
        })
    }
    return pending
  }

  const LazyPage = lazy(load)

  function RoutePage(props) {
    return createElement(LoadedPage || LazyPage, props)
  }
  RoutePage.preload = load

  return RoutePage
}

export const PlaylistsPage = lazyRoute(() => import('../pages/PlaylistsPage'))
export const PlaylistDetailPage = lazyRoute(() => import('../pages/PlaylistDetailPage'))
export const NotFoundPage = lazyRoute(() => import('../pages/NotFoundPage'))

/** Loads the chunk the current URL needs. The homepage is part of the entry bundle. */
export function preloadRouteFor(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return Promise.resolve()
  if (path === '/playlists') return PlaylistsPage.preload()
  if (path.startsWith('/playlists/')) return PlaylistDetailPage.preload()
  return NotFoundPage.preload()
}

/** Loads the playlist pages in the background so in-app navigation has no gap. */
export function preloadPlaylistRoutes() {
  return Promise.all([PlaylistsPage.preload(), PlaylistDetailPage.preload()])
}
