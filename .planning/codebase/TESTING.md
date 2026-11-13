---
last_mapped_commit: 279a460591d904101322971c5df9feb03cae6178
last_mapped_at: 2026-11-13
---
# Testing Patterns

**Analysis Date:** 2026-11-13

## Test Framework

**Runner:**
- Not detected. No test runner is in `package.json` (no `vitest`, `jest`, `mocha`, or `@testing-library/*` dependency).
- No test config files exist: no `vitest.config.*`, `jest.config.*`, or `playwright.config.*` at the repo root.
- Config: none.

**Assertion Library:**
- Not detected.

**Linting (the only automated check):**
- ESLint 10 flat config: `eslint.config.js`. Run with `npm run lint`.
- Build verification: `npm run build` (`vite build && node scripts/prerender.js`). This is a smoke check, not a test.

**Run Commands:**
```bash
npm run lint           # Run ESLint over the repo (only automated check)
npm run build          # Vite build + prerender script (fails on build errors)
npm run dev            # Local dev server for manual verification
npm run preview        # Serve the production build for manual verification
```
- No command for unit tests, watch mode, or coverage exists.

## Test File Organization

**Location:**
- No test files exist in `src/`, `scripts/`, or the repo root. A search for `*.test.*`, `*.spec.*`, and `__tests__/` returned no matches.
- Ad hoc verification scripts live in `scratch/` (not part of the build or lint targets):
  - `scratch/verify_seo_prerender.py`: SEO and prerender output check.
  - `scratch/seo_verification_results.json`: saved output from that check.
  - `scratch/make_frame_0.py`, `scratch/update_index.py`: one-off asset and HTML helpers.
  - `scratch/test_frame_0.html`, `scratch/test_no_js.html`: manual HTML checks (no-JavaScript rendering).
  - `scratch/p1-report/`, `scratch/p2-report/`: earlier manual report output.
- Do not treat `scratch/` as a test suite. Its files are not wired to any script.

**Naming:**
- Not applicable. If tests are added, use `*.test.jsx` / `*.test.js` co-located with the source, matching the naming pattern in `src/`.

**Structure:**
```
src/
  components/
    MusicPlayer.jsx          # no sibling test file today
  hooks/
    useYouTubePlayer.js      # no sibling test file today
scratch/                     # ad hoc verification only, not a test suite
```

## Test Structure

**Suite Organization:**
- Not applicable. No suites exist.

**Patterns:**
- Not applicable. When adding the first tests, establish the pattern in one file and keep it consistent.

## Mocking

**Framework:** Not applicable. No mocking library is installed.

**Patterns (to follow when mocking is introduced):**
- External browser APIs are accessed through guarded globals, which makes them straightforward to stub:
  - `window.YT` and `window.onYouTubeIframeAPIReady` (YouTube iframe API) in `src/hooks/useYouTubePlayer.js`.
  - `window.AudioContext` / `window.webkitAudioContext` in `src/utils/thekaAudio.js`.
  - `window.sessionStorage` (wrapped in `try/catch`) in `src/App.jsx`.
  - `navigator.connection` in `src/App.jsx` (`getIdleVideoPreload`).
- Environment: stub `import.meta.env.VITE_*` values rather than reading `.env.local`.
- Network: `src/utils/youtubeMetadata.js` calls the YouTube Data API using `VITE_YOUTUBE_API_KEY`; stub `fetch` in tests.
- Supabase: `src/lib/supabase.js` may export `null`. Tests must cover both the `null` path and the configured path.

**What to Mock:**
- Browser media and audio APIs (Web Audio, YouTube iframe API, `HTMLMediaElement`).
- Network calls (`fetch` to YouTube Data API and Supabase).
- Storage (`sessionStorage`, `localStorage`).
- Three.js / React Three Fiber canvas components in unit tests (`src/components/VinylHero/`, `src/components/Experience/`). Prefer rendering the fallback path (`VinylHeroFallback`) in tests over a real WebGL context.

**What NOT to Mock:**
- Pure data modules (`src/data/playlists.js`) and pure helpers (`formatTime` in `src/components/MusicPlayer.jsx` if extracted; `src/utils/routePages.js` lazy-loading logic if tested with real promises).
- React rendering itself in component tests.

## Fixtures and Factories

**Test Data:**
- No fixture or factory files exist.
- Real sample data lives in `src/data/playlists.js`: playlist objects with `id`, `name`, `description`, `background`, `youtubePlaylistId`, and `songs` (each song with `id`, `title`, `artist`, `youtubeId`). Reuse these shapes for fixtures; do not hard-code new YouTube IDs.

**Location:**
- If fixtures are added, place them under `src/__fixtures__/` or next to the test file. Do not place them in `public/`.

## Coverage

**Requirements:** None enforced. No coverage tool is configured and no threshold exists.

**View Coverage:**
```bash
Not available. No coverage tool is installed.
```

## Test Types

**Unit Tests:**
- None exist. Highest-value first targets, based on pure logic:
  - `formatTime` in `src/components/MusicPlayer.jsx` (edge cases: `NaN`, `0`, values over 60 seconds).
  - `getIdleVideoPreload` in `src/App.jsx` (connection-type branches).
  - `src/data/playlists.js` integrity (unique IDs, each song has a `youtubeId`).
  - `src/utils/youtubeMetadata.js` parsing.

**Integration Tests:**
- None exist. Candidate: the entry-gate flow in `src/App.jsx` (session key set, skip button, stall timeout) and playlist routing in `src/utils/routePages.js`.

**E2E Tests:**
- Not used. No Playwright or Cypress config exists.
- Manual verification is the current practice: `npm run dev` and inspect in browser. For the prerendered pages, run `npm run build` and check output (`scratch/verify_seo_prerender.py` is the existing ad hoc check).

## Common Patterns

**Async Testing:**
- Not applicable. No async tests exist. When added, use `await` on the promise returned by `loadYouTubeIframeApi` (`src/hooks/useYouTubePlayer.js`) after stubbing `window.YT`.

**Error Testing:**
- Not applicable. Existing error paths to cover when tests are added:
  - `VinylHeroErrorBoundary` renders `VinylHeroFallback` after a thrown child error (`src/components/VinylHero/VinylHeroErrorBoundary.jsx`).
  - `supabase` is `null` when env vars are missing (`src/lib/supabase.js`).
  - `lazyRoute` clears its cached promise on load failure so the next render retries (`src/utils/routePages.js`).

## Recommended Setup (if tests are introduced)

- Add `vitest` with `jsdom` and `@testing-library/react`. Vitest shares the existing `vite.config.js`, so no second bundler config is needed.
- Add a `"test": "vitest run"` script to `package.json`. Keep `npm run lint` and `npm run build` as the CI gates until tests exist.
- Co-locate `*.test.jsx` next to sources. Exclude `scratch/`, `dist/`, and `development-assets/` from test discovery.
- Mock `three`, `@react-three/fiber`, and `@react-three/drei` in jsdom because WebGL is unavailable there.

---

*Testing analysis: 2026-11-13*
