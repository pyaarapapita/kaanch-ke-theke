---
last_mapped_commit: 279a460591d904101322971c5df9feb03cae6178
last_mapped_at: 2026-11-13
---
# External Integrations

**Analysis Date:** 2026-11-13

## APIs & External Services

**Media playback - YouTube IFrame Player API:**
- Used for all music playback
- Loader: injects `https://www.youtube.com/iframe_api` script (id `youtube-iframe-api`) in `src/hooks/useYouTubePlayer.js`
- Player component: `src/components/YouTubePlayer.jsx`; global state wiring in `src/App.jsx`
- Auth: none (public embed)
- Playback targets: per-song `youtubeId` and per-playlist `youtubePlaylistId` from `src/data/playlists.js`

**Metadata - YouTube Data API v3:**
- Endpoint: `https://www.googleapis.com/youtube/v3/playlistItems` (called in `src/utils/youtubeMetadata.js`, `fetchPlaylistMetadata`)
- SDK/Client: none; plain `fetch` with paginated `pageToken` loop
- Auth: API key via `VITE_YOUTUBE_API_KEY` query parameter (client-side, so the key is public in the bundle)
- Results cached in memory per playlist id; `forceRefresh` bypasses cache
- If the key is missing or equals `PASTE_MY_API_KEY_HERE`, the function returns empty results and logs a warning

**Fonts - Google Fonts:**
- Loaded in `index.html` via `fonts.googleapis.com` and `fonts.gstatic.com` (preconnect plus CSS2 request)
- Families: Cinzel, Noto Serif Devanagari, Rozha One
- Auth: none

**Support / donations - Buy Me a Coffee (outbound links only):**
- `https://buymeacoffee.com/kaanchketheke` in `src/App.jsx`, `src/components/HomePageView.jsx`, `index.html`, `scripts/prerender.js`
- No SDK; anchor links opening in a new tab

**Social - Instagram (outbound links only):**
- `https://www.instagram.com/ironically_anujj` in `src/App.jsx`, `src/components/HomePageView.jsx`, and `sameAs` in JSON-LD in `index.html`

**3D assets - local, not remote:**
- GLB models served from `public/models/` through `useGLTF` (`src/components/Experience/*.jsx`, `src/components/VinylHero/VinylScene.jsx`)
- `@react-three/drei` `Environment` in `src/components/Experience/ExperienceCanvas.jsx` and `StudioEnvironment.jsx`. Confirm whether it fetches a remote HDRI preset at runtime; the code references presets, not an explicit URL.

**Component registry - 21st.dev:**
- CLI `@21st-dev/cli` (devDependency, script `npm run 21st`)
- MCP server definition `.vscode/mcp.json` points to `https://21st.dev/api/mcp`, auth via `x-api-key` prompt input
- Not used by the production bundle

**Developer tooling - Claude / MCP:**
- None in the application runtime

## Data Storage

**Databases:**
- Supabase (Postgres via hosted Supabase project)
  - Connection: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (fallback `VITE_SUPABASE_ANON_KEY`), read in `src/lib/supabase.js`
  - Client: `@supabase/supabase-js` `^2.116.0`, exported as `supabase` (or `null` when unconfigured)
  - Only usage: `supabase.rpc('register_site_visit', { p_visitor_id })` in `src/components/VisitorCounter.jsx`
  - No `.from()` table queries, no auth calls, no realtime subscriptions found in `src/`
  - Schema, RPC definition and migrations are not in this repository

**File Storage:**
- Local filesystem only (static assets under `public/`). No Supabase Storage, S3, or other bucket usage detected.

**Caching:**
- Browser only: `sessionStorage` key `kkt-entry-played` (`src/App.jsx`, `index.html`) for intro sequence; `localStorage` key `kaanch-ke-theke-visitor-id` (`src/components/VisitorCounter.jsx`) for anonymous visitor UUID
- In-memory metadata cache in `src/utils/youtubeMetadata.js`
- No server-side cache

## Authentication & Identity

**Auth Provider:**
- None. The site has no user accounts or login.
- Visitor identity: anonymous random UUID generated with `crypto.randomUUID()` (fallback to a pseudo-random UUID) and stored in `localStorage`; sent to Supabase RPC as `p_visitor_id`.

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Bugsnag, or similar)

**Analytics:**
- None detected (no GA, Plausible, Clarity, Hotjar snippets found in `index.html` or `src/`)
- Visitor count is self-hosted through the Supabase RPC above

**Logs:**
- `console.log` / `console.warn` in client code, e.g. `[YouTube Player]` logs in `src/hooks/useYouTubePlayer.js` and `[YouTube Data API]` warnings in `src/utils/youtubeMetadata.js`
- Build logs from `scripts/prerender.js`

## CI/CD & Deployment

**Hosting:**
- Target: Cloudflare Pages (inferred from `https://kaanch-ke-theke.pages.dev` used throughout and `_headers`/`_redirects` format). No `wrangler.toml` or Pages config in repo.

**CI Pipeline:**
- None detected. No `.github/` directory and no other CI config files.

## Search & SEO Integrations

- `public/sitemap.xml` and `public/robots.txt` served as static files (`public/_redirects` passes them through)
- `public/googled5015db35329c116.html` - Google Search Console verification file
- `scripts/prerender.js` writes per-route static HTML with canonical, OpenGraph, Twitter and JSON-LD for crawlers (Googlebot, Bingbot, OAI-SearchBot per its header comment)
- `scratch/seo_verification_results.json` records prior SEO checks against the `pages.dev` domain (non-production artifact)

## Environment Configuration

**Required env vars (names only):**
- `VITE_SUPABASE_URL` - Supabase project URL (visitor counter)
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable key (or `VITE_SUPABASE_ANON_KEY`)
- `VITE_YOUTUBE_API_KEY` - YouTube Data API v3 key (playlist metadata)

**Optional env vars:**
- `API_KEY_21ST` or `TWENTYFIRST_TOKEN` - 21st.dev CLI/MCP, needed only for CI or scripts

**Secrets location:**
- `.env.local` (git-ignored) for local development. Values are not documented here.
- `.env.example` is the committed template. It currently contains a populated `API_KEY_21ST` value that should be replaced with a placeholder and the key rotated.
- Vite inlines `VITE_*` values into the public bundle, so none of these should be treated as secret.

## Webhooks & Callbacks

**Incoming:**
- None. No server endpoints or webhook handlers in the repository.

**Outgoing:**
- None. No server-side HTTP calls. Client-side requests only: YouTube IFrame API, YouTube Data API `playlistItems`, Supabase RPC `register_site_visit`, Google Fonts.

---

*Integration audit: 2026-11-13*
