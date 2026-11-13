---
last_mapped_commit: 279a460591d904101322971c5df9feb03cae6178
last_mapped_at: 2026-11-13
---
# Codebase Concerns

**Analysis Date:** 2026-11-13

## Tech Debt

**Dead components (never imported):**
- Issue: Several component files have no importer anywhere in `src/`, `index.html`, or `scripts/`. They are leftovers from earlier layouts.
- Files: `src/components/PlaylistsModal.jsx`, `src/components/ThekaCounter/BottleAndGlassScene.jsx`, `src/components/ThekaCounter/VintageRadio.jsx`, `src/components/VinylHero/VinylHeroCanvas.jsx`, `src/components/VinylHero/VinylScene.jsx` (only imported by the dead `VinylHeroCanvas.jsx`).
- Impact: Dead code is read and maintained by every future change. `VinylScene.jsx` also keeps `vinyl-record-opt.glb` alive in the codebase even though nothing loads it at runtime.
- Fix approach: Confirm with a repo-wide search, then delete. Remove the `VinylHeroCanvas` / `VinylScene` pair together with the `public/models/vinyl-record-opt.glb` reference.

**Two parallel 3D systems:**
- Issue: The homepage hero uses `src/components/VinylHero/VinylHero.jsx` (2D/CSS wrapper plus posters), while the 3D experience is `src/components/Experience/` (`ExperienceLayer.jsx`, `ExperienceCanvas.jsx`, `StudioRoom.jsx`, `VinylRig.jsx`, `Cassettes.jsx`, `DustField.jsx`, `CameraRig.jsx`, `StudioEnvironment.jsx`, `scrollTimeline.js`, `deviceTier.js`, `sceneConfig.js`). The older `VinylHero/VinylHeroCanvas.jsx` path is dead, but its error boundary and fallback (`VinylHeroErrorBoundary.jsx`, `VinylHeroFallback.jsx`) are still shared by `ExperienceLayer.jsx` and `HomePageView.jsx`.
- Impact: Two naming schemes for the same feature. Edits to hero behavior are easy to make in the wrong place.
- Fix approach: Rename the shared error boundary and fallback into a neutral folder (e.g., `src/components/Experience/`), then remove the old `VinylHero` 3D code.

**Monolithic `App.jsx`:**
- Issue: `src/App.jsx` is 932 lines. It holds routing (lines ~747-795), YouTube/playlist state, metadata fetching, entry video logic, mood selection, and most top-level UI state, with about 31 hook calls.
- Files: `src/App.jsx`
- Impact: Hard to reason about renders. Any state change re-renders the whole tree, including the 3D layer's parent.
- Fix approach: Extract the entry-video flow, playlist state, and route layout into hooks/components. Keep `App.jsx` as a composition root.

**Oversized stylesheet:**
- Issue: `src/App.css` is over 5,300 lines and holds global styles for every page. There are 24 `@media` blocks in this one file alone. Class names are shared across unrelated sections (`editorial-*` is used by the homepage, playlists, 404, and the time machine).
- Files: `src/App.css`, `src/index.css`, `src/components/MusicalTimeMachine/MusicalTimeMachine.css`, `src/components/VinylHero/VinylHero.css`, `src/components/Experience/Experience.css`
- Impact: A rule change for one section (e.g., `.editorial-container`) silently affects others. Mobile overrides are scattered across the file, so regressions are easy to miss.
- Fix approach: Split CSS per feature folder, and scope shared `editorial-*` rules to one base file.

**Debug logging in production paths:**
- Issue: About 25 `console.log` calls run in the YouTube player hook on every state change and load, and `App.jsx` logs playlist fetches.
- Files: `src/hooks/useYouTubePlayer.js` (lines ~19-361), `src/App.jsx` (lines ~187, 199, 230, 375, 386, 399)
- Impact: Noisy console in production, and small per-event cost during playback.
- Fix approach: Route logs through a `debug` helper gated on `import.meta.env.DEV`, or remove them.

**Unused dependency and dev tooling:**
- Issue: `@21st-dev/cli` (devDependency, `"21st"` script in `package.json`, and the `.21st/` directory) is not imported by anything in `src/` or `scripts/`. `sharp` is a devDependency, but no file in `src/` or `scripts/prerender.js` imports it; it is probably used only by the scripts under `development-assets/`. Verify before removing.
- Files: `package.json`, `.21st/`, `development-assets/vinyl-record/optimize_vinyl_webp.mjs`, `development-assets/studio-scene/make_cassette_labels.mjs`
- Impact: Extra install weight and an extra API key surface (`API_KEY_21ST` in `.env.example`).
- Fix approach: Remove `@21st-dev/cli` and the `21st` script if not used. Move `sharp` only if the dev-asset scripts need it.

## Unused Assets

**Unreferenced model:**
- Files: `public/models/vinyl-record.glb` (13 MB, the largest file in the repo)
- Issue: Nothing references this path. The app loads `vinyl-record-web.glb` (`src/components/Experience/VinylRig.jsx`) and `vinyl-record-opt.glb` (dead `VinylScene.jsx`).
- Impact: 13 MB shipped in `dist/` and the deploy artifact for no use.
- Fix approach: Delete it. Keep the source in `development-assets/` if needed.

**Unreferenced video:**
- Files: `public/shopkeeper-entry.mp4` (4.6 MB)
- Issue: `src/App.jsx` line 18 uses only `ENTRY_VIDEO_SRC = '/shopkeeper-entry-720.mp4'` (1.5 MB).
- Impact: 4.6 MB of unused deploy weight.
- Fix approach: Delete the full-size MP4 unless a desktop-only source is planned.

**Unreferenced posters:**
- Files: `public/backgrounds/vinyl-hero-poster.webp` (92 KB), `public/backgrounds/vinyl-hero-poster-mobile.webp` (48 KB)
- Issue: No references in `src/`, `index.html`, or `scripts/`. The homepage preloads `vinyl-hero-3d*.webp` instead.
- Fix approach: Delete, or wire them in as the `poster` for the 3D canvas if the old fallback path is still needed.

**Unreferenced hero model:**
- Files: `public/models/vinyl-record-opt.glb` (3.8 MB)
- Issue: Only loaded by dead `VinylScene.jsx`.
- Fix approach: Delete with `VinylScene.jsx`.

**Development assets committed to the working tree:**
- Files: `development-assets/` (about 36 MB: `vinyl_record.blend`, `vinyl_record.blend1`, `studio_scene.blend`, `studio_scene.blend1`, PNG textures and previews, a `__pycache__/` directory with a `.pyc` file)
- Issue: `git status` shows `development-assets/studio-scene/` and `development-assets/vinyl-record/optimize_vinyl_webp.mjs` as untracked. `.gitignore` does not exclude them, and the `.blend1` / `__pycache__` files are backups and bytecode.
- Impact: The next commit would add about 36 MB of binary sources to the git history.
- Fix approach: Add `development-assets/**/__pycache__/`, `*.blend1`, and a decision on large `.blend` / texture files (Git LFS or external storage) to `.gitignore`.

**Local scratch directory:**
- Files: `scratch/` (SEO check JSON, test HTML, screenshot reports under `scratch/p1-report/` and `scratch/p2-report/`)
- Issue: `scratch/` is listed in `.gitignore`, so it stays local. It is not used by the build. Its screenshot reports are not referenced by any doc.
- Fix approach: Keep it ignored. Delete it when the reports are no longer needed.

**Working-tree churn:**
- Issue: `git status` shows 13 modified tracked files and about 15 untracked source/asset paths, including all of `src/components/Experience/`, `src/components/MusicalTimeMachine/`, `src/components/VinylHero/VinylHero.jsx`, `src/utils/routePages.js`, and the new `public/models/*.glb` files. The latest commits are "Bug fixs" and "3D changes in UI".
- Impact: The committed state does not match the running app. A clean checkout would not build or render the 3D experience, because `src/utils/routePages.js` and `src/components/Experience/` are not committed.
- Fix approach: Commit the new source and assets, then verify with a clean clone and `npm run build`.

## 3D and Performance

**Large GLB and texture payloads:**
- Files: `public/models/vinyl-record-web.glb` (976 KB, loaded), `public/models/studio-room.glb` (348 KB), `public/models/cassettes.glb` (132 KB), plus the unreferenced files above.
- Issue: The eager loader in `src/components/Experience/ExperienceCanvas.jsx` (lines ~165-172) calls `useGLTF.preload` for the vinyl, room, and cassette models. All three download on entry to the Experience layer, even on mid-tier devices.
- Impact: Extra load time before the first 3D frame, and large GPU memory use for mid-tier devices.
- Fix approach: Gate `useGLTF.preload` for the cassette model on the `high` tier from `src/components/Experience/deviceTier.js`. Compress textures in `development-assets/*/textures` (several are 4-8 MB PNGs) to KTX2/WebP before export.

**Frame-rate fallback is coarse:**
- Issue: `PerformanceGovernor` in `src/components/Experience/ExperienceCanvas.jsx` (lines ~56-80) lowers DPR by 0.25 steps down to 1, then calls `onDegrade`. `src/components/Experience/ExperienceLayer.jsx` (line ~56) falls back to the poster on low frame rate. There is no recovery path if the frame rate later improves.
- Impact: One slow stretch on a phone permanently disables the 3D scene for the session.
- Fix approach: Add hysteresis: re-enable after sustained recovery, and make the threshold configurable in `src/components/Experience/sceneConfig.js`.

**Full-viewport WebGL with no pause:**
- Issue: `src/components/VinylHero/VinylHeroCanvas.jsx` (dead, but a template for the other canvases) and `src/components/Experience/ExperienceCanvas.jsx` run `useFrame` loops. Their visibility is handled by GSAP `ScrollTrigger` in `src/components/Experience/scrollTimeline.js`, but no `frameloop="demand"` or pause-on-hidden logic was found for the Experience canvas.
- Impact: The GPU keeps rendering while the user is on the playlist or 404 routes if the canvas stays mounted.
- Fix approach: Verify that the Experience canvas unmounts or stops on non-home routes. Use `frameloop="demand"` where possible.

**Resize rebuilds on every resize event:**
- Issue: `src/components/Experience/scrollTimeline.js` line 130 registers `window.addEventListener('resize', scheduleRebuild)`. The function is debounced in name only, and each rebuild recreates ScrollTrigger instances.
- Impact: Jank on mobile when the address bar shows and hides.
- Fix approach: Ignore height-only changes below a threshold, and use `ScrollTrigger.refresh()` instead of rebuilding.

**Device tier uses viewport width:**
- Issue: `src/components/Experience/deviceTier.js` line 24 treats `window.innerWidth <= 900` as mid-tier, regardless of GPU capability.
- Impact: A large tablet in landscape gets the high tier, and a small desktop window gets the mid tier.
- Fix approach: Combine with `navigator.hardwareConcurrency` and a short WebGL capability probe.

## Responsive and Mobile Layout

**`100vh` for full-screen sections:**
- Files: `src/App.css` (lines ~6, 19, 21, 32, 156, 469), `src/index.css` (line ~99)
- Issue: `100vh` on mobile includes the area behind the browser address bar. Content behind the bar is cut off.
- Impact: Bottom content (player controls, footer) is hidden on mobile Safari and Chrome.
- Fix approach: Use `100dvh` with a `100vh` fallback, or `100svh` for the fixed hero height.

**Hard-coded viewport math:**
- Files: `src/App.css` line ~4963 (`min-height: calc(100vh - 180px)`)
- Issue: The 180 px offset assumes a fixed header height. The header changes height on compact viewports.
- Fix approach: Use a CSS variable for header height, set from a `ResizeObserver` on the header.

**Fixed-position overlays:**
- Files: `src/App.css` (lines ~28, 232, 831, 1280, 2127, 2837, 4375)
- Issue: Seven `position: fixed` elements, including the music player and nav. They overlap the 3D canvas and the `VinylHero` layers with z-index values that are not documented.
- Impact: Touch targets can be covered by the canvas on small screens. Scrolling can stutter with fixed elements over WebGL.
- Fix approach: Document z-index layers in one place (a `--z-*` token set) and test the mobile player at 390 px width.

**Breakpoint sprawl:**
- Issue: `App.css` (24 `@media`), `MusicalTimeMachine.css` (3), `VinylHero.css` (4), and `Experience.css` (0, uses `html[data-kkt-tier]` selectors instead). Media queries use different breakpoints, and the tier attribute and viewport width can disagree.
- Impact: Some layouts switch at 900 px for the 3D tier but at 768 px for CSS, producing a mismatched mid-size state.
- Fix approach: Define one breakpoint set and share it between CSS and `deviceTier.js`.

**Time-machine disc sizing:**
- Files: `src/components/MusicalTimeMachine/MusicalTimeMachine.css` (lines ~111, 139, 143, 662, 692, 720)
- Issue: The vinyl disc uses fixed pixel sizes in some breakpoints and percentages in others. The spin and settle animations (`is-spinning`, `is-settled`) do not account for `prefers-reduced-motion` in this file.
- Fix approach: Add a reduced-motion block. Use one sizing unit.

## Routing and Prerender

**404 canonical points to a file, not a URL:**
- Files: `scripts/prerender.js` (line ~393)
- Issue: The 404 page sets `<link rel="canonical" href="https://kaanch-ke-theke.pages.dev/404.html" />`. Canonical for a not-found page should not point to itself or to a file path. Search engines may index the 404 file.
- Fix approach: Remove the canonical tag from `prerender404Page`, or set `<meta name="robots" content="noindex">`.

**SPA fallback makes 404.html unreachable:**
- Files: `public/_redirects` (catch-all `/* /index.html 200`), `scripts/prerender.js` (writes `dist/404.html`)
- Issue: Any unknown URL matches the catch-all and returns HTTP 200 with `index.html`. The prerendered `dist/404.html` is never served, so the 404 SEO page and the real 404 status are both unused. This is a soft 404.
- Impact: Search engines index typos as valid pages, and the `NotFoundPage` (`src/pages/NotFoundPage.jsx`) is only reached client-side.
- Fix approach: Add an explicit `/404` rule or move the catch-all so that unknown paths return 404 via a Pages `404.html`. Verify with `curl -I` on a random path after deploy.

**Preload has no timeout:**
- Files: `src/main.jsx` (line ~20), `src/utils/routePages.js` (`preloadRouteFor`)
- Issue: `renderApp` waits for `preloadRouteFor(window.location.pathname)` with no timeout. On a slow network, a prerendered `/playlists` page stays as static HTML indefinitely, and any event handlers in the static markup are dead until hydration.
- Impact: Buttons in the prerendered markup (`share-playlist-btn`, `play-playlist-hero-btn`) do nothing until the chunk loads.
- Fix approach: Race the preload against a short timeout (e.g., 3 s) before `renderApp`, or disable those buttons in the static markup.

**Prerender uses hard-coded domain and copy:**
- Files: `scripts/prerender.js` (line ~18, `SITE_DOMAIN = 'https://kaanch-ke-theke.pages.dev'`), `public/sitemap.xml`, `index.html` (canonical, og:url, og:image, twitter:url)
- Issue: The domain is repeated in several places. Changing hosts (custom domain) requires editing multiple files.
- Fix approach: Read the site origin from one constant or env var, and generate `sitemap.xml` from `src/data/playlists.js` in the build.

**Static markup duplicated with React:**
- Files: `scripts/prerender.js` (`SHARED_HEADER`, `SHARED_FOOTER`, `SHARED_BACKGROUND` mirror `src/App.jsx` markup)
- Issue: The prerender script copies the header, footer, and background markup by hand, with comments saying they "mirror App.jsx". Any change to the React header or footer must be copied here.
- Impact: Silent drift between the prerendered first paint and the React page, visible as a layout jump during the handoff in `main.jsx`.
- Fix approach: Render the shared chrome with `react-dom/server` in the prerender step, or extract the markup to one template file both sides import.

## Security Considerations

**Client-exposed YouTube API key:**
- Risk: `src/utils/youtubeMetadata.js` (line ~42) reads `VITE_YOUTUBE_API_KEY`. Any `VITE_*` value is inlined into the public JS bundle, so the key is visible to every visitor.
- Files: `src/utils/youtubeMetadata.js`, `.env.example`
- Current mitigation: None found in the repo. The key is not committed (`.env.local` is ignored by `.gitignore`).
- Recommendations: Restrict the key in Google Cloud Console to the YouTube Data API and to the production HTTP referrer. Consider a small serverless proxy (Cloudflare Pages Function) for the `playlistItems` call so the key is never shipped.

**No security headers for app routes:**
- Files: `public/_headers`
- Risk: `_headers` only sets `Content-Type`, `X-Content-Type-Options`, and `Cache-Control` for `/sitemap.xml` and `/robots.txt`. The HTML app has no `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`, or `Strict-Transport-Security` header.
- Current mitigation: Cloudflare Pages provides HTTPS by default.
- Recommendations: Add a `/*` block with `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` (or CSP `frame-ancestors`), and a CSP that allows the YouTube iframe, Google Fonts, Supabase host, and `self`.

**Client-side visitor counter writes:**
- Files: `src/components/VisitorCounter.jsx` (line ~45, `supabase.rpc('register_site_visit', ...)`), `src/lib/supabase.js`
- Risk: The publishable key is used from the browser to call a write RPC. Nothing in the repo rate-limits the call, so a script can inflate the counter. The Supabase function definition is not in the repo, so its validation cannot be verified here.
- Recommendations: Add a per-session guard in `localStorage` or a rate limit in the RPC. Keep the function definition in version control (e.g., `supabase/migrations/`).

**Secrets handling:**
- Note: `.env.local` exists in the project root. Its contents were not read for this report. `.gitignore` covers `.env.local` and `*.env.local`. `.env.example` lists the variable names (`VITE_YOUTUBE_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `API_KEY_21ST`) and is safe to read.
- Recommendations: Do not put a secret-class key under a `VITE_` prefix. Rotate `API_KEY_21ST` if it was ever placed in a tracked file.

**Third-party embeds and links:**
- Files: `src/hooks/useYouTubePlayer.js` (loads `https://www.youtube.com/iframe_api`), `index.html` (Google Fonts preconnect, `google-site-verification` meta), `src/components/HomePageView.jsx` (external Instagram and buymeacoffee links use `rel="noopener noreferrer"`)
- Risk: Each third-party origin runs with the page's privileges unless a CSP limits it. See the header item above.

## Performance Bottlenecks

**Heavy hero image set:**
- Problem: Homepage preloads four `vinyl-hero-3d*.webp` images with `fetchpriority="high"` (`index.html` lines 46-49), plus `theka-bg.webp`. Only one of the three responsive variants is used on any device.
- Files: `index.html`, `public/backgrounds/vinyl-hero-3d.webp` (44 KB), `vinyl-hero-3d-tablet.webp` (28 KB), `vinyl-hero-3d-phone.webp` (20 KB)
- Cause: The `media` attributes on the preloads are correct, so only one loads. The earlier `theka-bg.webp` preload has no media query and always loads.
- Improvement path: Confirm that `theka-bg.webp` is the LCP image on desktop. If not, remove its high-priority preload.

**Large fallback PNGs shipped alongside WebP:**
- Files: `public/backgrounds/editorial-story.png` (804 KB), `editorial-instagram.png` (784 KB), `theka-bg.png` (752 KB)
- Problem: PNG fallbacks are only used by browsers without WebP support, which is very rare. They add about 2.3 MB to the deploy.
- Improvement path: Keep PNG only for `og:image` (`theka-bg.png` is required by `index.html` lines 59 and 70). Convert the others to a single 1200 px JPEG, or drop them.

**Playlist metadata fetched on the client:**
- Files: `src/utils/youtubeMetadata.js`, `src/App.jsx` (lines ~180-200)
- Problem: Playlist metadata is fetched from the YouTube Data API on each visit, with no visible cache layer in the repo.
- Improvement path: Cache the response in `localStorage` with a TTL, or pre-build the metadata with `scripts/prerender.js` (which already reads `src/data/playlists.js`).

## Fragile Areas

**Experience scroll timeline:**
- Files: `src/components/Experience/scrollTimeline.js`, `src/components/Experience/sceneConfig.js`, `src/components/Experience/ExperienceCanvas.jsx`
- Why fragile: The timeline depends on GSAP ScrollTrigger, a resize listener, and a DPR governor. The three interact through shared module state and DOM attributes (e.g., `data-kkt-tier`). Changing the scroll range or sections without updating `sceneConfig.js` silently desyncs the 3D camera.
- Safe modification: Change `sceneConfig.js` first, then run `scrollTimeline.js` in isolation. Test at 390 px, 820 px, and 1440 px widths.
- Test coverage: No tests exist in the repo.

**Route preload contract:**
- Files: `src/main.jsx`, `src/utils/routePages.js`, `src/App.jsx` (lines ~747-795), `scripts/prerender.js`
- Why fragile: `preloadRouteFor` must mirror the `<Route>` tree in `App.jsx`. A new route added in `App.jsx` but not in `routePages.js` renders correctly but loses the prerender handoff. The path normalization (trailing slash, `/playlists/:id`) is duplicated.
- Safe modification: Add a new route to `routePages.js`, `App.jsx`, and `scripts/prerender.js` in one change. Run `npm run build` and load each prerendered path.

**YouTube player hook:**
- Files: `src/hooks/useYouTubePlayer.js` (426 lines)
- Why fragile: The hook manages a global `window.YT` callback, pending target IDs, and a player ref across React StrictMode double mounts. Its comments describe several race conditions (pending `playSongId` and `playPlaylistId` queued before `onReady`).
- Safe modification: Test with StrictMode on, and with a playlist change during playback.
- Test coverage: None.

**Global state:**
- Files: `src/utils/thekaAudio.js`, `src/hooks/useYouTubePlayer.js`, `src/components/Experience/deviceTier.js` (reads `window` and writes `data-kkt-tier` on `document.documentElement`)
- Why fragile: Module-level singletons and DOM attributes are shared across components and survive HMR.
- Safe modification: Keep new state in React. Document any DOM attributes the CSS reads.

## Scaling Limits

**Static playlist data:**
- Current capacity: All playlists and songs are in `src/data/playlists.js` (136 lines), bundled into the app and into the prerender step.
- Limit: Each new playlist grows the initial JS bundle and the prerender output (one HTML file per playlist).
- Scaling path: Load playlist data from Supabase or a JSON file under `public/` on demand, and keep only the index in the bundle.

**Bundle chunking:**
- Files: `vite.config.js` (`manualChunks`)
- Current state: `vendor-three-gsap` contains three.js, `@react-three/*`, and gsap. It is loaded only by the Experience layer and the dead `VinylHeroCanvas`. Once the dead code is removed, check whether `vendor-three-gsap` is still loaded on the homepage path.
- Limit: Without the check, the homepage may pay for three.js on first paint.
- Scaling path: Confirm with `npx vite build` and inspect the output chunk graph.

## Dependencies at Risk

**`@21st-dev/cli`:**
- Risk: A devDependency tied to an external CLI and API key (`API_KEY_21ST`). Not used by the app code.
- Impact: Extra install surface and a key that must be kept in `.env`.
- Migration plan: Remove if unused. Re-add only when the 21st.dev workflow is needed.

**`three` / `@react-three/fiber` / `@react-three/drei` version pinning:**
- Risk: `three` is pinned to `^0.186.1` while `@react-three/fiber` is `^9.8.2`. The package versions are not checked against each other in the repo, and `drei` helpers (`useGLTF`) have changed APIs across major versions.
- Impact: A minor bump can break `useGLTF.preload` calls in `ExperienceCanvas.jsx` and the GLB loaders in `VinylRig.jsx`, `StudioRoom.jsx`, and `Cassettes.jsx`.
- Migration plan: Pin exact versions in `package.json` for the 3D stack, and add a smoke test that loads each GLB.

**Lockfile and ESLint:**
- Risk: `eslint` `^10.9.0` and `@eslint/js` `^10.0.1` are paired with `eslint-plugin-react-hooks` `^7.1.1` and `eslint-plugin-react-refresh` `^0.5.4`. The plugin and core versions move on different schedules.
- Impact: `npm run lint` may fail or report false positives after an upgrade.
- Migration plan: Run `npm run lint` after each upgrade. Pin plugin versions that are known to work.

## Missing Critical Features

**Test suite:**
- Problem: No test files exist (`*.test.*`, `*.spec.*`). The only automated check is `eslint .` (`package.json` `lint` script) and the prerender script.
- Blocks: Safe refactors of `App.jsx`, the YouTube hook, the 3D tier logic, and the prerender script.

**Error reporting:**
- Problem: No error tracking service is configured. Errors are logged with `console.warn` / `console.error` (e.g., `src/components/VinylHero/VinylHeroErrorBoundary.jsx` line ~15, `src/App.jsx` lines ~386, ~399).
- Blocks: Knowing which 3D or YouTube failures happen in production.

**Accessibility of the 3D experience:**
- Problem: The Experience layer has no `prefers-reduced-motion` handling in `src/components/Experience/` (the time machine CSS is the only place this is checked). Scroll-driven 3D camera moves are not optional.
- Blocks: Compliance with WCAG 2.3.3 for motion-triggered content.

## Test Coverage Gaps

**Prerender output:**
- What's not tested: That `dist/playlists/index.html`, `dist/playlists/<id>/index.html`, and `dist/404.html` exist after `npm run build`, and that their canonical and JSON-LD fields are correct.
- Files: `scripts/prerender.js`
- Risk: The 404 canonical bug and the soft-404 behavior above have shipped unnoticed.
- Priority: High

**Routing handoff:**
- What's not tested: The `preloadRouteFor` path normalization and the fallback when a chunk fails to load.
- Files: `src/utils/routePages.js`, `src/main.jsx`
- Risk: A prerendered page can stay static, or a route can show `NotFoundPage` for a valid path.
- Priority: High

**YouTube player state machine:**
- What's not tested: Playlist switching during playback, the auto-advance on error codes, and StrictMode double mounts.
- Files: `src/hooks/useYouTubePlayer.js`
- Risk: Silent playback stalls.
- Priority: High

**Responsive layout:**
- What's not tested: Mobile 390 px, tablet 820 px, and desktop 1440 px layouts are checked only by manual screenshots in `scratch/p1-report/` and `scratch/p2-report/`, which are not part of the repo.
- Files: `src/App.css`, `src/components/MusicalTimeMachine/MusicalTimeMachine.css`, `src/components/VinylHero/VinylHero.css`
- Risk: Regressions in the mobile player and fixed overlays.
- Priority: Medium

**3D asset loading:**
- What's not tested: That each GLB in `public/models/` loads without error in the Experience layer and the fallback runs when it fails.
- Files: `src/components/Experience/VinylRig.jsx`, `src/components/Experience/StudioRoom.jsx`, `src/components/Experience/Cassettes.jsx`, `src/components/VinylHero/VinylHeroErrorBoundary.jsx`
- Risk: A missing or renamed model shows a blank 3D area.
- Priority: Medium

---

*Concerns audit: 2026-11-13*
