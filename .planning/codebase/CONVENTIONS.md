---
last_mapped_commit: 279a460591d904101322971c5df9feb03cae6178
last_mapped_at: 2026-11-13
---
# Coding Conventions

**Analysis Date:** 2026-11-13

## Naming Patterns

**Files:**
- React components: PascalCase `.jsx`, one component per file. Examples: `src/components/MusicPlayer.jsx`, `src/components/ThekaCounter/ThekaCounter.jsx`, `src/pages/PlaylistsPage.jsx`.
- Hooks: `use` prefix, camelCase `.js`. Example: `src/hooks/useYouTubePlayer.js`.
- Utilities and data modules: camelCase `.js`. Examples: `src/utils/thekaAudio.js`, `src/utils/youtubeMetadata.js`, `src/utils/routePages.js`, `src/data/playlists.js`, `src/components/Experience/sceneConfig.js`.
- Component folders group related parts: `src/components/VinylHero/` (`VinylHero.jsx`, `VinylHeroCanvas.jsx`, `VinylHeroErrorBoundary.jsx`, `VinylHeroFallback.jsx`, `VinylScene.jsx`, `VinylHero.css`). Put a feature's CSS next to its component (`src/components/Experience/Experience.css`).
- Module-level config files: camelCase, e.g. `src/components/MusicalTimeMachine/timeMachineMoods.js`.
- Import entry files with `.jsx` extension in the import path where Vite needs it: `src/main.jsx` imports `'./App.jsx'`. Other imports omit the extension (`'./components/VisitorCounter'`). Both styles are present; follow the nearest sibling file.

**Functions and components:**
- Components: PascalCase named function declarations, e.g. `export const MusicPlayer = React.memo(function MusicPlayer(...) {...})` in `src/components/MusicPlayer.jsx`, or `export function VinylHero(...)`.
- Helper functions: camelCase, often module-private (not exported). Examples in `src/components/MusicPlayer.jsx`: `formatTime`; in `src/App.jsx`: `hasPlayedEntryThisSession`, `markEntryPlayed`, `getIdleVideoPreload`.
- Event handlers: `handle` prefix inside components (`handleSeekChange`, `handleToggleMute`, `handleOpenReceipt`, `handleCloseReceipt`, `handleFlameChange` in `src/components/ThekaCounter/ThekaCounter.jsx`). Props that are callbacks use `on` prefix (`onNext`, `onPrevious`, `onRetry`, `onError`, `onReady`, `onDegrade`, `onSongEnd`).
- Boolean state and props use `is`/`has` prefixes: `isPlaying`, `isReady`, `isMuted`, `hasEntered`, `isScrolled`, `isLoadingMetadata`.

**Variables and constants:**
- Local variables and state: camelCase.
- Module-level constants: SCREAMING_SNAKE_CASE. Examples: `ENTRY_VIDEO_SRC`, `ENTRY_SESSION_KEY`, `ENTRY_STALL_TIMEOUT_MS` in `src/App.jsx`; `DEFAULT_PLAYLIST_ID`, `PLAYLISTS` in `src/data/playlists.js`; `SITE_CONFIG` in `src/App.jsx`.
- Object-literal config grouping: `const SITE_CONFIG = { INSTAGRAM_URL: '...', ... }` (uppercase keys).
- Unit suffixes on time-related constants: `_MS`, `_SECONDS` style is used for durations.

**Data identifiers:**
- Playlist and song IDs are hand-authored strings with a scheme: `'90s'` for playlist IDs; `'song-90s-001'` for song IDs (`src/data/playlists.js`). Follow this pattern when adding entries.

**CSS classes:**
- Plain kebab-case, no BEM. Examples: `cinematic-player-wrapper`, `is-scrolled-docked`, `video-entry-overlay`, `cinematic-entry-video`, `video-skip-btn`, `theka-counter-section`, `lantern-ambient-medium`.
- State modifiers use `is-` prefix (`is-fading`, `is-scrolled-docked`), set by React `className` template strings.
- Data attributes carry global state: `document.documentElement.setAttribute('data-lantern-level', level)` in `src/components/ThekaCounter/ThekaCounter.jsx`.
- Use the existing class names in `src/App.css`, `src/index.css`, and component `.css` files. Do not introduce CSS modules or Tailwind; none is configured.

## Code Style

**Formatting:**
- No Prettier config and no `.editorconfig` in the repo. Formatting is not enforced by tooling.
- Style is mixed across files:
  - Newer and larger view files (`src/App.jsx`, `src/components/HomePageView.jsx`, `src/components/ThekaCounter/ThekaCounter.jsx`, `src/components/PlaylistsModal.jsx`, `src/components/MusicalTimeMachine/MusicalTimeMachine.jsx`, `src/components/VinylHero/VinylHeroErrorBoundary.jsx`) use **no semicolons** and **single quotes** for code, with JSX attributes in double quotes.
  - Older files (`src/components/MusicPlayer.jsx`, `src/utils/youtubeMetadata.js`, `src/hooks/useYouTubePlayer.js`, `src/utils/thekaAudio.js`) use **semicolons**. `src/utils/youtubeMetadata.js` and `src/hooks/useYouTubePlayer.js` use single quotes.
- Rule for new code: match the no-semicolon, single-quote style of the file you edit. For new files, use no semicolons, single quotes, two-space indent, trailing commas in multi-line literals.
- Indentation: 2 spaces. Keep line length reasonable; long class strings are template literals.

**Linting:**
- ESLint flat config at `eslint.config.js` (`npm run lint` runs `eslint .`).
- Extends `@eslint/js` recommended, `eslint-plugin-react-hooks` (flat recommended), and `eslint-plugin-react-refresh` (vite config). Applies to `**/*.{js,jsx}`. `dist` is ignored.
- Globals: browser only.
- Rules that matter in practice: `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`, `react-refresh/only-export-components` (files exporting components should not export non-component values where avoidable).
- Known gap: `.vscode/` is in `.gitignore` but a lint run is not part of the build. `npm run build` does not run lint.

## Import Organization

**Order (observed in `src/App.jsx`, `src/main.jsx`):**
1. React core (`react`, `react-dom/client`)
2. Third-party libraries (`react-router-dom`, `framer-motion`, `@react-three/*`, `three`, `gsap`, `@supabase/supabase-js`)
3. Local data, hooks, and utilities (`./data/playlists`, `./hooks/useYouTubePlayer`, `./utils/routePages`)
4. Local components (`./components/...`)
5. Local CSS last (`import './App.css'`)

Lazy-loaded modules are declared after the static imports, with a comment marking them.

**Path Aliases:**
- None configured. `vite.config.js` has no `resolve.alias`. Use relative paths (`'../../'` style is common in `src/components/Experience/`).

## Error Handling

**Patterns:**
- Browser storage access is wrapped in `try/catch` with a silent fallback. Example: `hasPlayedEntryThisSession` and `markEntryPlayed` in `src/App.jsx` return `false` or do nothing when `sessionStorage` throws. Use `catch {` (optional binding) for these cases; it appears 13 times in `src/`.
- Async work uses `.catch(() => {})` for non-critical side effects, e.g. `audioCtx.resume().catch(() => {})` in `src/utils/thekaAudio.js`.
- Audio and synthesis functions wrap bodies in `try { ... } catch` and return early when the Web Audio context is unavailable (`if (!ctx) return` pattern in `src/utils/thekaAudio.js`).
- React render failures: class-based error boundary. See `src/components/VinylHero/VinylHeroErrorBoundary.jsx`, which uses `static getDerivedStateFromError`, logs in `componentDidCatch`, and renders `VinylHeroFallback`. Use this pattern for any new 3D or WebGL layer. Accept an optional `fallback` prop; `undefined` means use the default fallback, while `null` renders nothing.
- Promise-returning loaders can retry: `src/utils/routePages.js` clears its cached promise on failure so `React.lazy` can retry.
- Missing configuration returns `null` instead of throwing. Example: `src/lib/supabase.js` exports `supabase = null` when `VITE_SUPABASE_URL` or the key is absent. Callers must null-check `supabase`.
- Timeouts guard against stalls: `ENTRY_STALL_TIMEOUT_MS` in `src/App.jsx` gives up on a stalled video.

**Logging:**
- Framework: `console` only. No logger library.
- Prefix logs with a bracketed tag naming the subsystem: `console.log('[YouTube API] ...')` in `src/hooks/useYouTubePlayer.js`; `console.warn('[VinylHero] ...')` in `src/components/VinylHero/VinylHeroErrorBoundary.jsx`. Follow this format.
- Use `console.warn` for recoverable failures and `console.error` only for unexpected ones. About 45 `console.*` calls exist in `src/`; do not add new noisy logs in render paths.

## Comments

**When to Comment:**
- Explain why, not what. Example in `src/App.jsx`: "The inline script in index.html reads this same key before first paint." and "Matches the .is-fading transition in App.css; the extra time is a safety margin."
- Add a comment above each non-obvious constant and above each cross-file coupling (CSS duration matching JS timeout, `index.html` inline script matching a storage key).
- Section headers inside JSX use `{/* Experience Header */}` style comments (`src/components/ThekaCounter/ThekaCounter.jsx`).
- Header comment blocks at the top of audio or feature modules describe purpose (`src/utils/thekaAudio.js`).

**JSDoc/TSDoc:**
- Used sparingly. Example: `/** Plays a resonant cork / bottle cap pop */` in `src/utils/thekaAudio.js`; `/** A route component that can be fetched before React renders it. ... */` in `src/utils/routePages.js`. Use JSDoc for exported utilities with non-obvious behavior. No `@param` tags are required.
- No TypeScript. Do not add `.ts`/`.tsx` files; the project is JavaScript only. PropTypes are not used.

## Function Design

**Size:** Keep components focused. Large view files exist (`src/App.jsx` is ~930 lines; `src/components/HomePageView.jsx` ~480). Prefer extracting a new component into its feature folder rather than growing these files. Small helpers live above the component in the same file.

**Parameters:**
- Components take a single destructured props object with defaults inline: `function MusicPlayer({ hasEntered = false, isScrolled = false, currentSong, ... })` in `src/components/MusicPlayer.jsx`.
- Hooks take an options object with defaults: `useYouTubePlayer({ youtubeId = '', playlistId = '', onSongEnd, onError } = {})` in `src/hooks/useYouTubePlayer.js`.

**Return Values:**
- Hooks return an object of state and actions, not arrays, e.g. `useYouTubePlayer` returns named fields. Follow this for new hooks.
- Memoized components: wrap with `React.memo` for components rendered inside the player or canvas tree (`MusicPlayer`, `ThekaCounter`). Count: about 10 `memo` uses in `src/`.
- Use `useCallback` for handlers passed as props (13 files use it). Use `useRef` for mutable values that should not re-render (`pendingSongIdRef`, `lastPlayedIdRef` in `src/hooks/useYouTubePlayer.js`).

## Module Design

**Exports:**
- Named exports are the default for components and hooks (`export const MusicPlayer`, `export function useYouTubePlayer`, `export const ThekaCounter`).
- Default exports for pages and route-level components: `src/pages/*.jsx`, `src/components/PlaylistsModal.jsx`, `src/components/VisitorCounter.jsx`, `src/App.jsx`. Lazy-loaded modules must have a default export because `lazy(() => import(...))` requires it.
- Export configuration constants by name (`export const DEFAULT_PLAYLIST_ID`, `export const PLAYLISTS` in `src/data/playlists.js`).

**Barrel Files:**
- Not used. Import from the file path directly (`./components/Experience/ExperienceLayer`). Do not add `index.js` barrels.

**React and runtime conventions:**
- Use `lazy` + `Suspense` for heavy or non-critical UI, e.g. `VisitorCounter` in `src/App.jsx`, `ExperienceCanvas` in `src/components/Experience/ExperienceLayer.jsx`.
- Route pages that must prerender use `src/utils/routePages.js` (`lazyRoute`), not raw `React.lazy`.
- Animation uses `framer-motion` (`motion.div` with `variants`, `initial`, `animate`, `transition`). About 10 files import it. Use framer-motion for UI transitions; GSAP and Three are used only in the 3D modules.
- Environment variables are read through `import.meta.env.VITE_*` only. Current keys in code: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_ANON_KEY`, `VITE_YOUTUBE_API_KEY`. Add new keys with the `VITE_` prefix and document them in `.env.example`. Never commit `.env.local` values.
- Browser-only APIs are guarded with `typeof window !== 'undefined'` or `typeof document !== 'undefined'` because `scripts/prerender.js` renders routes in Node.

---

*Convention analysis: 2026-11-13*
