---
last_mapped_commit: 279a460591d904101322971c5df9feb03cae6178
last_mapped_at: 2026-11-13
---
<!-- refreshed: 2026-11-13 -->
# Architecture

**Analysis Date:** 2026-11-13

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│  Static shell  `index.html` (inline pre-paint script, poster, #root) │
│  Prerendered HTML per route via `scripts/prerender.js` into dist/    │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ loads `src/main.jsx`
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Bootstrap  `src/main.jsx`  → preloadRouteFor() → createRoot         │
│  BrowserRouter wraps <App/>                                          │
└───────────────────────────────┬──────────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Shell  `src/App.jsx`  (state owner: entry gate, playlist, player,   │
│         menus, about modal) + global chrome (header, MusicPlayer)    │
│                                                                      │
│   <ExperienceLayer>  fixed 3D backdrop  `components/Experience/`     │
│   <Routes> inside <Suspense>                                         │
│     /            → HomePageView   (entry bundle)                     │
│     /playlists   → PlaylistsPage  (lazy chunk)                       │
│     /playlists/:id → PlaylistDetailPage (lazy chunk)                 │
│     *            → NotFoundPage   (lazy chunk)                       │
└───────────────┬───────────────────────────────┬──────────────────────┘
                ▼                               ▼
┌──────────────────────────────┐   ┌──────────────────────────────────┐
│ Data & services              │   │ External                         │
│ `src/data/playlists.js`      │   │ YouTube IFrame API + Data v3     │
│ `src/hooks/useYouTubePlayer` │   │ Supabase RPC (`VisitorCounter`)  │
│ `src/utils/youtubeMetadata`  │   │ Static `/models`, `/backgrounds` │
│ `src/lib/supabase.js`        │   └──────────────────────────────────┘
└──────────────────────────────┘
```

## Pattern Overview

**Overall:** Single-page React 19 app (Vite build), client-side routing with `react-router-dom`, prerendered static HTML for SEO, and a lazy-loaded WebGL layer. No backend of its own; third-party services are called from the browser.

**Key Characteristics:**
- Flat, state-in-root architecture: almost all application state lives in `src/App.jsx` and is passed down as props. No Redux/Zustand/Context store is in use.
- Code splitting is deliberate and performance-driven: the home page is in the entry bundle, while `/playlists*` and 404 pages are lazy chunks, and Three.js/GSAP is only reached through `components/Experience/ExperienceLayer.jsx` → `ExperienceCanvas` (`React.lazy`).
- Route chunks are preloaded before first render via `src/utils/routePages.js` (`lazyRoute`, `preloadRouteFor`) so prerendered HTML is swapped without a blank gap.
- Progressive enhancement: the 3D scene is a layer over a poster image and real HTML text. `ExperienceLayer` picks a device tier (`deviceTier.js`) and can fall back to `static` (poster only) on low FPS, WebGL error, or `prefers-reduced-motion`.
- Single persistent WebGL context: the Experience canvas stays mounted across routes and is "parked" on inner pages.

## Layers

**Bootstrap / Entry:**
- Purpose: Mount React, pick the route chunk, and wrap with the router.
- Location: `src/main.jsx`, `index.html`
- Contains: `createRoot`, `BrowserRouter`, StrictMode, route preload.
- Depends on: `src/App.jsx`, `src/utils/routePages.js`, `src/index.css`.
- Used by: Vite entry (`vite.config.js`).

**Application Shell:**
- Purpose: Global state, entry gate, playlist selection, audio/YouTube control, header, about modal, mobile menu, routing table.
- Location: `src/App.jsx` (approx. 800 lines), `src/App.css`
- Contains: `useState` for `hasEntered`, `entryPhase` (`idle → playing → revealing → fading → done`), `currentPlaylistId`, `currentSongIndex`, `dynamicPlaylists`, `showAbout`, `isMobileMenuOpen`; `useEffect` blocks for scroll, metadata, preloading.
- Depends on: `src/data/playlists.js`, `src/hooks/useYouTubePlayer.js`, `src/components/*`, `src/utils/youtubeMetadata.js`.
- Used by: `src/main.jsx`.

**Pages (route components):**
- Purpose: One component per route.
- Location: `src/components/HomePageView.jsx` (home, eager), `src/pages/PlaylistsPage.jsx`, `src/pages/PlaylistDetailPage.jsx`, `src/pages/NotFoundPage.jsx` (lazy).
- Contains: Route content composed from feature components.
- Depends on: Shell-owned props; `VinylHero`, `ThekaCounter`, `MusicalTimeMachine`.
- Used by: `Routes` in `src/App.jsx`.

**Feature Components:**
- Purpose: Self-contained UI features.
- Location: `src/components/` (`MusicPlayer.jsx`, `MoodSelector.jsx`, `PlaylistsModal.jsx`, `YouTubePlayer.jsx`, `VisitorCounter.jsx`), `src/components/ThekaCounter/`, `src/components/MusicalTimeMachine/`, `src/components/VinylHero/`.
- Contains: UI plus local state; some use `React.memo`.
- Depends on: Props from the shell; `src/utils/thekaAudio.js` for synthesized sound effects; `src/data/playlists.js`.
- Used by: Pages and shell.

**3D Experience Layer:**
- Purpose: Fixed full-viewport Three.js scene behind all content, scroll-driven camera and cassette/vinyl choreography.
- Location: `src/components/Experience/`
- Contains: `ExperienceLayer.jsx` (lazy gate, tier detection, degrade handling), `ExperienceCanvas.jsx` (R3F `<Canvas>`, default export, lazy-loaded), `StudioRoom.jsx`, `StudioEnvironment.jsx`, `VinylRig.jsx`, `Cassettes.jsx`, `DustField.jsx`, `CameraRig.jsx`, `scrollTimeline.js` (GSAP ScrollTrigger), `sceneConfig.js` (layout/pose constants), `deviceTier.js`.
- Depends on: `@react-three/fiber`, `@react-three/drei`, `three`, `gsap`; static assets under `public/models/`.
- Used by: `src/App.jsx` (rendered once, `isHome`/`isCovered`/`isPlaying`/`activePlaylistId` props).

**Data / Hooks / Utilities:**
- Purpose: Static content, third-party integration, and helpers.
- Location: `src/data/playlists.js`, `src/hooks/useYouTubePlayer.js`, `src/utils/` (`youtubeMetadata.js`, `thekaAudio.js`, `routePages.js`), `src/lib/supabase.js`.
- Depends on: Browser APIs, YouTube IFrame API, YouTube Data API v3, Supabase JS client.
- Used by: Shell, pages, `VisitorCounter`.

## Data Flow

### Primary Request Path (first visit to `/`)

1. `index.html` inline script reads the sessionStorage entry flag before first paint and shows the poster (`public/backgrounds/shopkeeper-entry-poster.webp`) (`index.html`).
2. `src/main.jsx` calls `preloadRouteFor('/')` (resolves immediately) and `createRoot().render(<App/>)` inside `BrowserRouter`.
3. `src/App.jsx` initialises `hasEntered` from `hasPlayedEntryThisSession()` (sessionStorage) and `window.location.pathname`. Unless the user already entered this session, the entry gate shows.
4. User presses the CTA in `src/components/VinylHero/VinylHero.jsx` → `handleStartEntryTransition` sets `entryPhase='playing'` and plays `/shopkeeper-entry-720.mp4`.
5. `ExperienceLayer` schedules `ExperienceCanvas` after idle callback (`requestIdleCallback`, 1200 ms timeout); the lazy chunk loads Three.js and builds the scene.
6. Scene reports `onReady` → `setIsExperienceReady(true)` → poster fades out (`is-faded-out`).

### Playback Path (music)

1. Playlist and song state lives in `src/App.jsx` (`currentPlaylistId`, `currentSongIndex`), seeded from `PLAYLISTS` in `src/data/playlists.js`.
2. `useYouTubePlayer` (`src/hooks/useYouTubePlayer.js`) injects `https://www.youtube.com/iframe_api` once (module-level `apiLoadingPromise`), creates a player bound to the off-screen `YouTubePlayer` container, and exposes play/pause/seek/volume.
3. `onSongEnd` advances `currentSongIndex` in the shell; `MusicPlayer` (`src/components/MusicPlayer.jsx`) renders controls from props.
4. Playlist titles/durations are enriched via `fetchPlaylistMetadata` (`src/utils/youtubeMetadata.js`), merged into `dynamicPlaylists` state.

### Route Transition Path (`/` → `/playlists/:id`)

1. `Link`/`navigate` changes the URL; `Routes` in `App.jsx` selects a `RoutePage` wrapper from `src/utils/routePages.js`.
2. If the chunk is already loaded (`preloadPlaylistRoutes()` runs in the background), it renders synchronously; otherwise `React.lazy` suspends to `route-loading-fallback`.
3. Experience layer stays mounted but parked (`isHome=false`).

### Visitor Counter Path

1. `src/components/VisitorCounter.jsx` (lazy) calls `supabase.rpc('register_site_visit')` via `src/lib/supabase.js`. If env vars are missing, `supabase` is `null` and the call is skipped.

**State Management:**
- Local UI state via `useState`/`useRef`; cross-component state lifted to `src/App.jsx`.
- Persistence: `sessionStorage` key for entry gate (`ENTRY_SESSION_KEY` in `src/App.jsx`).
- Scroll-driven 3D state uses GSAP ScrollTrigger and refs (`rigRef`, `signalRef`, `pointerRef`) rather than React state, to avoid re-renders per frame.

## Key Abstractions

**Playlist record:**
- Purpose: Describes a themed playlist and its songs.
- Examples: `src/data/playlists.js` (`PLAYLISTS`, `DEFAULT_PLAYLIST_ID = '90s'`, `getPlaylistById`).
- Pattern: Plain JS data module; the same module is imported by `scripts/prerender.js` at build time.

**Lazy route (`lazyRoute`):**
- Purpose: A component that can be preloaded and rendered synchronously once loaded.
- Examples: `src/utils/routePages.js`.
- Pattern: Module-level cache of the loader promise; `RoutePage.preload` exported for prefetch.

**Experience tier:**
- Purpose: Select quality of 3D rendering or static fallback.
- Examples: `src/components/Experience/deviceTier.js` (`TIER_CONFIG`, `detectTier`), applied as `data-kkt-tier` on `<html>`.
- Pattern: Config table keyed by tier name; degrade by setting tier to `static`.

**Scene layout / poses:**
- Purpose: Camera and object positions per viewport aspect and scroll stage.
- Examples: `src/components/Experience/sceneConfig.js` (`LAYOUTS`, `getLayoutName`, `INITIAL_CAMERA`, `TAPE_PLAYLISTS`), `src/components/Experience/scrollTimeline.js` (`createScrollTimeline`).
- Pattern: Declarative config consumed by imperative GSAP timelines reading real DOM positions (`pageTop`).

**Synth audio:**
- Purpose: Web Audio sound effects with no external assets.
- Examples: `src/utils/thekaAudio.js` (`playCorkPop`).
- Pattern: Lazily created singleton `AudioContext`.

## Entry Points

**Browser entry:**
- Location: `src/main.jsx` (bundled from `index.html`).
- Triggers: Page load of any route.
- Responsibilities: Route chunk preload, React root, router.

**Build-time prerender:**
- Location: `scripts/prerender.js` (run by `npm run build` after `vite build`).
- Triggers: `npm run build`.
- Responsibilities: Writes route-specific static HTML (metadata, JSON-LD, semantic markup) into `dist/` using `src/data/playlists.js` and the built `dist/index.html`.

**Dev server:**
- Location: `vite.config.js`; `npm run dev`.

**Static 404 / preview:** `npm run preview` serves `dist/`.

## Architectural Constraints

- **Threading:** Single-threaded browser main thread. Three.js renders in R3F's `requestAnimationFrame` loop (`src/components/Experience/ExperienceCanvas.jsx`); no workers.
- **Global state:** Module-level singletons: `apiLoadingPromise` in `src/hooks/useYouTubePlayer.js`; `audioCtx` in `src/utils/thekaAudio.js`; `metadata` cache in `src/utils/youtubeMetadata.js`; `lazyRoute` caches in `src/utils/routePages.js`; `supabase` client in `src/lib/supabase.js`; `window.onYouTubeIframeAPIReady` global hook.
- **Single WebGL context:** `ExperienceLayer` must stay mounted to avoid creating a second context. Do not render another `<Canvas>` on the site.
- **Circular imports:** None detected among the core modules.
- **Build-time coupling:** `scripts/prerender.js` imports `src/data/playlists.js` directly, so that file must stay free of browser-only APIs.
- **Hero markup in entry bundle:** `src/components/VinylHero/VinylHero.jsx` is part of the home bundle and must not import Three.js.
- **Env-driven integrations:** `VITE_*` variables are read at build time (`src/lib/supabase.js`, `src/utils/youtubeMetadata.js`).

## Anti-Patterns

### Orphaned 3D components

**What happens:** `src/components/VinylHero/VinylHeroCanvas.jsx` and `src/components/VinylHero/VinylScene.jsx` are not imported by any module. `src/components/ThekaCounter/BottleAndGlassScene.jsx` and `src/components/ThekaCounter/VintageRadio.jsx` are also unreferenced (the recent commit removed the bottle and radio sections from the page).
**Why it's wrong:** Dead modules still get linted, reviewed, and mislead readers about which 3D path is live. The live 3D path is `ExperienceLayer` → `ExperienceCanvas`.
**Do this instead:** Build new 3D work inside `src/components/Experience/`. Delete or move orphaned modules rather than wiring them in parallel.

### Prop drilling from the shell

**What happens:** `src/App.jsx` passes playlist, song, playback, and handler props through `Routes` into `HomePageView`, `PlaylistsPage`, `PlaylistDetailPage`, and `MusicPlayer`.
**Why it's wrong:** Every new page or control adds another prop path through the 800-line shell and causes re-renders across the tree.
**Do this instead:** For new cross-cutting state, add a focused context or hook beside the feature (for example next to `src/hooks/useYouTubePlayer.js`) and keep the shell for routing and layout.

## Error Handling

**Strategy:** Boundaries around optional, heavy UI; graceful degradation to poster or text-only.

**Patterns:**
- `VinylHeroErrorBoundary` (`src/components/VinylHero/VinylHeroErrorBoundary.jsx`) wraps the 3D layer in `ExperienceLayer` and renders `VinylHeroFallback` on error, calling `onLost`.
- `ExperienceCanvas` calls `onDegrade` when frame rate is too low, which sets the tier to `static`.
- Network and API failures are caught with `try/catch` and `.catch(() => {})` in `src/utils/youtubeMetadata.js`, `src/components/VisitorCounter.jsx`, and `src/utils/routePages.js` (failed chunk preload is forgotten so `React.lazy` can retry).
- Audio failures are swallowed in `src/utils/thekaAudio.js`.

## Cross-Cutting Concerns

**Logging:** `console.log`/`console.warn` with bracketed prefixes (e.g. `[YouTube API]`, `[Experience]`) in `src/hooks/useYouTubePlayer.js` and `src/components/Experience/ExperienceLayer.jsx`. No logger library.
**Validation:** Minimal; input is trusted static data plus YouTube API responses.
**Authentication:** None for end users. Supabase uses the publishable key only (`src/lib/supabase.js`).
**Styling:** Global CSS (`src/index.css`, `src/App.css`) plus per-component CSS co-located with components (`src/components/VinylHero/VinylHero.css`, `src/components/Experience/Experience.css`, `src/components/MusicalTimeMachine/MusicalTimeMachine.css`).
**Motion:** `framer-motion` for UI transitions; GSAP for scroll-driven 3D.

---

*Architecture analysis: 2026-11-13*
