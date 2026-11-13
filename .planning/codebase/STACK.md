---
last_mapped_commit: 279a460591d904101322971c5df9feb03cae6178
last_mapped_at: 2026-11-13
---
# Technology Stack

**Analysis Date:** 2026-11-13

## Languages

**Primary:**
- JavaScript (ES modules, JSX) - all application code in `src/` (e.g. `src/main.jsx`, `src/App.jsx`, `src/components/**/*.jsx`)

**Secondary:**
- JavaScript (Node ESM) - build/prerender tooling in `scripts/prerender.js`, `development-assets/**/*.mjs`, `vite.config.js`, `eslint.config.js`
- Python - one-off asset/SEO helpers in `scratch/make_frame_0.py`, `scratch/update_index.py`, `scratch/verify_seo_prerender.py` (not part of the build)
- HTML/CSS - `index.html` (contains inline JSON-LD and an inline entry-state script), `src/index.css`, `src/App.css`, `src/components/VinylHero/VinylHero.css`

TypeScript is not used. No `tsconfig.json` present. `@types/react` and `@types/react-dom` are installed only for editor support.

## Runtime

**Environment:**
- Node.js (version not pinned; no `.nvmrc` or `engines` field in `package.json`)
- Browser runtime for the SPA (WebGL required for the Three.js scenes)

**Package Manager:**
- npm
- Lockfile: present - `package-lock.json`

**Module system:** `"type": "module"` in `package.json`; all config and scripts use ESM `import`.

## Frameworks

**Core:**
- React `^19.2.8` (`react`, `react-dom`) - UI rendering; entry at `src/main.jsx`
- React Router DOM `^7.18.4` - client-side routing via `BrowserRouter` in `src/main.jsx`; routes defined in `src/App.jsx` and `src/utils/routePages.js`
- Three.js `^0.186.1` with `@react-three/fiber` `^9.8.2` and `@react-three/drei` `^10.7.9` - 3D vinyl/studio scenes (`src/components/VinylHero/`, `src/components/Experience/`)
- Framer Motion `^13.2.0` - UI animation (`framer-motion`, split into `vendor-framer` chunk)
- GSAP `^3.15.0` - timeline animation (`src/components/Experience/scrollTimeline.js`); bundled in `vendor-three-gsap` chunk

**Testing:**
- Not detected. No test runner, no `*.test.*` or `*.spec.*` files, no test script in `package.json`.

**Build/Dev:**
- Vite `^8.2.2` - dev server and bundler; config `vite.config.js`
- `@vitejs/plugin-react` `^6.1.0` - React Fast Refresh and JSX transform
- Custom `manualChunks` in `vite.config.js` produces `vendor-framer`, `vendor-three-gsap`, `vendor-react` chunks
- ESLint `^10.9.0` with `@eslint/js` `^10.0.1`, `eslint-plugin-react-hooks` `^7.1.1`, `eslint-plugin-react-refresh` `^0.5.4`, `globals` `^17.11.0` - config `eslint.config.js` (run via `npm run lint`)
- `sharp` `^0.35.5` (devDependency) - image processing in `development-assets/vinyl-record/optimize_vinyl_webp.mjs` and `development-assets/studio-scene/make_cassette_labels.mjs`; not used by the app runtime
- `@21st-dev/cli` `^1.18.0` (devDependency) - 21st.dev component CLI; script `npm run 21st`; project metadata in `.21st/design.json`

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` `^2.116.0` - Supabase client; created in `src/lib/supabase.js`, used only for the visitor counter RPC in `src/components/VisitorCounter.jsx`. Client is `null` when env vars are absent, so the app runs without it.
- `three` `^0.186.1` - underlying 3D engine for all WebGL scenes; GLB models loaded via `useGLTF` from `public/models/`
- `@react-three/drei` `^10.7.9` - provides `Environment`, `useGLTF` and helpers used in `src/components/Experience/ExperienceCanvas.jsx` and `src/components/Experience/StudioEnvironment.jsx`
- `react-router-dom` `^7.18.4` - all routing

**Infrastructure:**
- `vite` `^8.2.2` - build output to `dist/`
- `eslint` `^10.9.0` - linting
- `framer-motion` and `gsap` - animation layers for UI and 3D scroll timeline

## Build Pipeline

- `npm run dev` - `vite` dev server
- `npm run build` - `vite build` then `node scripts/prerender.js`
  - `scripts/prerender.js` reads `dist/index.html`, imports `src/data/playlists.js`, and writes static per-route HTML (metadata, OpenGraph, JSON-LD) into `dist/` for crawlers
- `npm run preview` - `vite preview`
- `npm run lint` - `eslint .`

Build output directory: `dist/` (generated; contains `404.html`, `_headers`, `_redirects`, `assets/`, `backgrounds/`, `favicon.*`). Copied from `public/`.

## Static Assets

- Models: `public/models/` - `cassettes.glb`, `studio-room.glb`, `vinyl-record-web.glb`; `VinylScene.jsx` also references `/models/vinyl-record-opt.glb` (verify file exists before relying on it)
- Images: `public/backgrounds/` (webp posters and `theka-bg.png`)
- Video: `public/shopkeeper-entry-720.mp4`, `public/shopkeeper-entry.mp4` (intro sequence, `src/App.jsx`)
- PWA-style manifest: `public/manifest.json` (name, theme colour `#120c0a`, icon `/favicon.png`)

## Configuration

**Environment:**
- Vite exposes variables prefixed `VITE_` through `import.meta.env`. Names used in code:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (or fallback `VITE_SUPABASE_ANON_KEY`) - `src/lib/supabase.js`
  - `VITE_YOUTUBE_API_KEY` - `src/utils/youtubeMetadata.js`
- Template of variable names: `.env.example`
- Local values live in `.env.local` (present; git-ignored). Contents are not recorded in this document.
- No runtime secret management; all `VITE_*` values are inlined into the client bundle at build time.

**Build:**
- `vite.config.js` - React plugin and manual chunk splitting
- `eslint.config.js` - flat ESLint config
- `package.json` - scripts and dependency manifest
- `public/_headers` - Cache-Control and content-type rules for `/sitemap.xml` and `/robots.txt`
- `public/_redirects` - static pass-through for sitemap/robots, SPA fallback `/* /index.html 200`
- `.vscode/mcp.json` - MCP server config for 21st.dev (API key supplied via prompt input)

## Platform Requirements

**Development:**
- Node.js and npm (lockfile present)
- A browser with WebGL support for the 3D sections
- Optional: `.env.local` with the `VITE_*` variables above; app degrades gracefully without them (no visitor counter, no playlist metadata)

**Production:**
- Static hosting. Canonical domain in code is `https://kaanch-ke-theke.pages.dev`, and `_headers`/`_redirects` use the Cloudflare Pages format, so the target is Cloudflare Pages (inferred from the URL and file conventions; no deploy config file in the repo).
- SPA fallback rewrite required (`public/_redirects`).

## Security Notes

- `.env.example` contains a populated `API_KEY_21ST=` value that looks like a real key rather than a placeholder. Treat it as exposed: rotate it and replace the line with a placeholder.
- `VITE_*` variables are public by design in Vite; the YouTube Data API key and Supabase publishable key are visible in the shipped JavaScript. Restrict the YouTube key by HTTP referrer in Google Cloud Console.

---

*Stack analysis: 2026-11-13*
