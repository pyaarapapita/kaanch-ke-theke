---
last_mapped_commit: 279a460591d904101322971c5df9feb03cae6178
last_mapped_at: 2026-11-13
---
# Codebase Structure

**Analysis Date:** 2026-11-13

## Directory Layout

```
kaanch-ke-theke/
├── src/                        # Application source (React 19 + Vite)
│   ├── main.jsx                # Browser entry: route preload + createRoot
│   ├── App.jsx                 # Shell: global state, routes, chrome
│   ├── App.css / index.css     # Global styles
│   ├── components/             # UI features and 3D layer
│   │   ├── Experience/         # Persistent Three.js/GSAP backdrop (lazy)
│   │   ├── VinylHero/          # Home hero text/poster + legacy 3D (see notes)
│   │   ├── ThekaCounter/       # Counter, lantern, receipt modal (+ unused scenes)
│   │   ├── MusicalTimeMachine/ # Mood/time-travel section on home
│   │   └── *.jsx               # Shared features (player, moods, modals, counter)
│   ├── pages/                  # Route-level components (lazy chunks)
│   ├── hooks/                  # Custom React hooks
│   ├── data/                   # Static content (playlists)
│   ├── lib/                    # Third-party client setup (Supabase)
│   ├── utils/                  # Helpers, route preload, audio, metadata
│   └── assets/                 # Empty (no bundled imports)
├── public/                     # Served as-is (copied to dist/)
│   ├── backgrounds/            # Posters, background images (webp/png)
│   ├── models/                 # Draco/GLB 3D models for Experience layer
│   ├── *.mp4                   # Shopkeeper entry video
│   ├── _headers, _redirects    # Static host config (Cloudflare Pages style)
│   ├── sitemap.xml, robots.txt, manifest.json
│   └── favicon.*
├── scripts/
│   └── prerender.js            # Post-build static HTML generator
├── development-assets/         # Source art for 3D (not served)
│   ├── studio-scene/           # .blend, Python/MJS generators, textures
│   └── vinyl-record/           # Texture optimisation script, textures
├── scratch/                    # Local experiments and reports (gitignored)
├── dist/                       # Build output (generated, gitignored)
├── .planning/                  # GSD planning docs (this folder)
├── .vscode/mcp.json            # Editor MCP config
├── .21st/                      # Design notes (DESIGN.md, design.json)
├── index.html                  # Vite HTML entry + inline pre-paint script
├── vite.config.js
├── eslint.config.js
├── package.json / package-lock.json
└── .env.example                # Required VITE_* variable names
```

## Directory Purposes

**`src/components/Experience/`:**
- Purpose: Everything for the fixed 3D backdrop.
- Contains: `ExperienceLayer.jsx` (lazy gate, `React.memo`), `ExperienceCanvas.jsx` (default export, R3F `<Canvas>`), scene parts (`StudioRoom.jsx`, `StudioEnvironment.jsx`, `VinylRig.jsx`, `Cassettes.jsx`, `DustField.jsx`, `CameraRig.jsx`), config (`sceneConfig.js`, `deviceTier.js`), animation (`scrollTimeline.js`), styles (`Experience.css`).
- Key files: `src/components/Experience/ExperienceLayer.jsx`, `src/components/Experience/ExperienceCanvas.jsx`, `src/components/Experience/sceneConfig.js`, `src/components/Experience/scrollTimeline.js`.

**`src/components/VinylHero/`:**
- Purpose: Home hero text panel, poster, CTA, and error fallback. Part of the entry bundle.
- Contains: `VinylHero.jsx` (live), `VinylHero.css` (live), `VinylHeroErrorBoundary.jsx` (live), `VinylHeroFallback.jsx` (live), `VinylHeroCanvas.jsx` and `VinylScene.jsx` (not imported; see Notes).
- Key files: `src/components/VinylHero/VinylHero.jsx`, `src/components/VinylHero/VinylHeroErrorBoundary.jsx`.

**`src/components/ThekaCounter/`:**
- Purpose: Home "counter" section: lantern, receipt modal, counter scene.
- Contains: `ThekaCounter.jsx` (imported by `HomePageView.jsx`), `ThekaLantern.jsx`, `HandwrittenReceiptModal.jsx` (both imported by `ThekaCounter.jsx`), `BottleAndGlassScene.jsx` and `VintageRadio.jsx` (not imported).

**`src/components/MusicalTimeMachine/`:**
- Purpose: Mood/time-travel section on the home page.
- Contains: `MusicalTimeMachine.jsx`, `MusicalTimeMachine.css`, `timeMachineMoods.js` (mood config).

**`src/components/` (top level):**
- Purpose: Shared feature components used by the shell or pages.
- Contains: `MusicPlayer.jsx` (floating player), `MoodSelector.jsx`, `PlaylistsModal.jsx`, `YouTubePlayer.jsx` (off-screen iframe host), `VisitorCounter.jsx` (Supabase RPC, lazy), `HomePageView.jsx` (home route composition).

**`src/pages/`:**
- Purpose: Route components loaded as separate chunks.
- Contains: `PlaylistsPage.jsx` (`/playlists`), `PlaylistDetailPage.jsx` (`/playlists/:id`), `NotFoundPage.jsx` (`*`).
- Note: Imported only through `src/utils/routePages.js`, never directly from `App.jsx`.

**`src/hooks/`:**
- Purpose: Reusable stateful logic.
- Contains: `useYouTubePlayer.js` (IFrame API lifecycle, playback state, song-end callback).

**`src/data/`:**
- Purpose: Static content.
- Contains: `playlists.js` (`PLAYLISTS`, `DEFAULT_PLAYLIST_ID`, `getPlaylistById`). Imported by both the app and `scripts/prerender.js`.

**`src/lib/`:**
- Purpose: Third-party client construction.
- Contains: `supabase.js` (returns `null` when env vars are absent).

**`src/utils/`:**
- Purpose: Non-React helpers.
- Contains: `routePages.js` (lazy route wrappers, `preloadRouteFor`), `thekaAudio.js` (Web Audio cork pop), `youtubeMetadata.js` (YouTube Data API v3 fetch and in-memory cache), `routePages.js` is also the only module that references `pages/*`.

**`public/`:**
- Purpose: Assets referenced by absolute URL (`/models/...`, `/backgrounds/...`).
- Contains: GLB models (`studio-room.glb`, `cassettes.glb`, `vinyl-record-web.glb`, plus `vinyl-record-opt.glb` and `vinyl-record.glb` alternates), poster webp files, entry video, SEO files.

**`scripts/`:**
- Purpose: Build-time tooling.
- Contains: `prerender.js` only.

**`development-assets/`:**
- Purpose: Authoring sources for 3D and texture work; not part of the runtime bundle.
- Contains: `studio-scene/` (`studio_scene.blend`, `generate_studio_scene.py`, `make_cassette_labels.mjs`, textures), `vinyl-record/` (`optimize_vinyl_webp.mjs`, textures, `textures_opt/`, a `__pycache__/` directory).

**`scratch/`:**
- Purpose: Throwaway verification output (SEO checks, frame captures). Gitignored.

## Key File Locations

**Entry Points:**
- `index.html`: HTML shell, inline pre-paint script, entry poster preload.
- `src/main.jsx`: React root and router.
- `scripts/prerender.js`: static route HTML generation.

**Configuration:**
- `vite.config.js`: Vite and React plugin config.
- `eslint.config.js`: ESLint flat config.
- `package.json`: scripts (`dev`, `build`, `lint`, `preview`) and dependencies.
- `.env.example`: names of required `VITE_YOUTUBE_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, plus optional 21st.dev key. Real `.env.local` exists locally and must not be read into docs.
- `public/_headers`, `public/_redirects`: host routing and headers.

**Core Logic:**
- `src/App.jsx`: shell state, routing table, entry gate.
- `src/components/HomePageView.jsx`: home page composition.
- `src/components/Experience/ExperienceCanvas.jsx`: 3D scene composition.
- `src/hooks/useYouTubePlayer.js`: audio playback engine.

**Testing:**
- No test files or test config are present. No `*.test.*` or `*.spec.*` files exist outside `node_modules`.

## Naming Conventions

**Files:**
- React components: PascalCase `.jsx`, one exported component per file, e.g. `src/components/MusicPlayer.jsx`, `src/components/VinylHero/VinylHeroErrorBoundary.jsx`.
- Non-component modules: camelCase `.js`, e.g. `src/utils/thekaAudio.js`, `src/components/Experience/sceneConfig.js`, `src/hooks/useYouTubePlayer.js`.
- Hooks: `use` prefix, `src/hooks/`.
- Stylesheets: co-located, same base name as the component: `VinylHero.css` beside `VinylHero.jsx`.
- Build scripts: `snake_case.py` or lower camelCase `.mjs` in `development-assets/` (e.g. `optimize_vinyl_webp.mjs`) and `camelCase` `scripts/prerender.js`.

**Directories:**
- Feature folders: PascalCase for component groups (`VinylHero/`, `ThekaCounter/`, `MusicalTimeMachine/`, `Experience/`).
- Plain folders: lowercase (`pages/`, `hooks/`, `utils/`, `lib/`, `data/`).

**Exports:**
- Named exports for components (`export function VinylHero`, `export const ThekaCounter = React.memo(...)`).
- Default export only for `ExperienceCanvas` (required by `lazy`) and for route page modules (`src/pages/*`).

**Asset URLs:**
- Reference public assets with absolute paths starting `/` (for example `/models/studio-room.glb`, `/backgrounds/vinyl-hero-3d.webp`). Constants are exported from the module that owns them (`ROOM_PATH` in `StudioRoom.jsx`, `CASSETTES_PATH` in `Cassettes.jsx`, `MODEL_PATH` in `VinylRig.jsx`).

## Where to Add New Code

**New route/page:**
- Page component: `src/pages/<Name>Page.jsx` (default export).
- Lazy wrapper: add `export const <Name>Page = lazyRoute(() => import('../pages/<Name>Page'))` in `src/utils/routePages.js` and a branch in `preloadRouteFor`.
- Route entry: add `<Route>` in `src/App.jsx` before the `path="*"` catch-all.

**New home-page section:**
- Component: `src/components/<Feature>/<Feature>.jsx` with co-located `<Feature>.css`.
- Compose in: `src/components/HomePageView.jsx`.

**New shared UI component:**
- Implementation: `src/components/<Name>.jsx`. Put it in a feature folder if it has more than one file.

**New 3D element:**
- Implementation: `src/components/Experience/<Name>.jsx`. Wire it into `ExperienceCanvas.jsx`. Put positions and tuning in `sceneConfig.js`, and any scroll stages in `scrollTimeline.js`.
- Assets: place optimised `.glb` in `public/models/`, source files in `development-assets/`.
- Must not create a second `<Canvas>` (see ARCHITECTURE.md constraints).

**New hook:**
- Implementation: `src/hooks/use<Name>.js`.

**New utility:**
- Shared helper: `src/utils/<name>.js`. Keep it free of React imports if `scripts/prerender.js` may import it.

**New static content:**
- Playlists and song data: `src/data/playlists.js`.

**New third-party client:**
- Client setup: `src/lib/<service>.js`, returning `null` when its `VITE_*` variables are missing (follow `src/lib/supabase.js`).

**Tests:**
- No convention exists yet. If added, co-locate as `<Name>.test.jsx` beside the source file, or place in a root `__tests__/` directory.

## Special Directories

**`dist/`:**
- Purpose: Vite build output plus prerendered route HTML.
- Generated: Yes (`npm run build`).
- Committed: No (`.gitignore`).

**`node_modules/`:**
- Generated: Yes. Committed: No.

**`scratch/`:**
- Purpose: Local verification scripts and reports.
- Generated: Yes. Committed: No (`.gitignore`).

**`development-assets/`:**
- Purpose: Authoring sources (`.blend`, textures, generators).
- Generated: Partly (`textures_opt/`, `__pycache__/`).
- Committed: Yes (source-controlled, untracked files pending in current git status: `development-assets/studio-scene/`, `development-assets/vinyl-record/optimize_vinyl_webp.mjs`).

**`.planning/`:**
- Purpose: GSD planning and codebase analysis docs.
- Generated: Yes (by GSD commands).
- Committed: Per project policy.

**`.env.local`:**
- Purpose: Local `VITE_*` secrets. Gitignored via `*.env.local`. Never copy values into docs or commits.

## Notes on Current State

- Many files in `src/` are modified or untracked in the working tree (see git status at session start). Folders `src/components/Experience/` and `src/components/MusicalTimeMachine/` and file `src/utils/routePages.js` are untracked, so the committed history does not yet reflect the current layout.
- Unused modules: `src/components/VinylHero/VinylHeroCanvas.jsx`, `src/components/VinylHero/VinylScene.jsx`, `src/components/ThekaCounter/BottleAndGlassScene.jsx`, `src/components/ThekaCounter/VintageRadio.jsx`. Confirm before deleting.
- `src/assets/` is empty.

---

*Structure analysis: 2026-11-13*
