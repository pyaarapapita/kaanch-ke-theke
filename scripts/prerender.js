/**
 * scripts/prerender.js
 * Generates static HTML files for all public routes into dist/
 * Ensures search engines (Googlebot, Bingbot, OAI-SearchBot) and AI search agents
 * receive route-specific metadata, OpenGraph tags, JSON-LD, and semantic HTML without requiring JS execution.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { PLAYLISTS } from '../src/data/playlists.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const BASE_HTML_PATH = path.join(DIST_DIR, 'index.html');
const SITE_DOMAIN = 'https://kaanch-ke-theke.pages.dev';

if (!fs.existsSync(BASE_HTML_PATH)) {
  console.error('[Prerender] Error: dist/index.html not found. Run "vite build" first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(BASE_HTML_PATH, 'utf8');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function replaceRootContent(fullHtml, newInnerContent) {
  const rootOpenTag = '<div id="root">';
  const startIndex = fullHtml.indexOf(rootOpenTag);
  if (startIndex === -1) return fullHtml;
  const bodyCloseIndex = fullHtml.indexOf('</body>', startIndex);
  if (bodyCloseIndex === -1) return fullHtml;
  const before = fullHtml.slice(0, startIndex);
  const after = fullHtml.slice(bodyCloseIndex);
  return `${before}<div id="root">\n${newInnerContent}\n  </div>\n${after}`;
}

// 1. Prerender Playlists Overview: /playlists -> dist/playlists/index.html
function prerenderPlaylistsPage() {
  const pageTitle = 'हिंदी म्यूज़िक प्लेलिस्ट्स | Kaanch Ke Theke — Curated Playlists';
  const pageDesc = 'काँच के ठेके की सभी चुनिंदा बॉलीवुड प्लेलिस्ट्स—90s के सदाबहार गाने, ग़ज़लें, दर्द-ए-दिल और रेट्रो हिंदी क्लासिक्स।';
  const pageUrl = `${SITE_DOMAIN}/playlists`;

  let html = baseHtml;

  // Title
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);

  // Description
  html = html.replace(/<meta name="description"[\s\S]*?\/>/i, `<meta name="description" content="${escapeHtml(pageDesc)}" />`);

  // Canonical
  html = html.replace(/<link rel="canonical"[\s\S]*?\/>/i, `<link rel="canonical" href="${pageUrl}" />`);

  // Open Graph & Twitter
  html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${pageUrl}" />`);
  html = html.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`);
  html = html.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${escapeHtml(pageDesc)}" />`);
  html = html.replace(/<meta name="twitter:url" content=".*?" \/>/i, `<meta name="twitter:url" content="${pageUrl}" />`);
  html = html.replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />`);
  html = html.replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${escapeHtml(pageDesc)}" />`);

  // Route-specific JSON-LD
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'मुख्य पृष्ठ (Home)', 'item': `${SITE_DOMAIN}/` },
          { '@type': 'ListItem', 'position': 2, 'name': 'प्लेलिस्ट्स (Playlists)', 'item': pageUrl }
        ]
      },
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#collection`,
        'url': pageUrl,
        'name': pageTitle,
        'description': pageDesc,
        'inLanguage': ['hi', 'en'],
        'mainEntity': {
          '@type': 'ItemList',
          'name': 'काँच के ठेके की सभी प्लेलिस्ट्स (All Playlists)',
          'itemListElement': PLAYLISTS.map((pl, idx) => ({
            '@type': 'ListItem',
            'position': idx + 1,
            'url': `${SITE_DOMAIN}/playlists/${pl.id}`,
            'name': pl.name,
            'description': pl.description
          }))
        }
      }
    ]
  };

  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n  </script>`
  );

  // Styled Semantic content inside #root matching React PlaylistsPage
  const semanticContent = `    <div class="landing-container is-entered">
      <header class="header is-scrolled">
        <a href="/" class="brand brand-btn" aria-label="काँच के ठेके — मुख्य पृष्ठ" style="text-decoration:none;">
          <span class="brand-title-hindi">काँच के ठेके</span>
          <span class="brand-title-english">KAANCH KE THEKE</span>
        </a>
        <nav class="nav-links desktop-nav">
          <a href="/playlists" class="nav-link nav-link-btn is-active" style="text-decoration:none;">प्लेलिस्ट्स</a>
          <a href="/" class="nav-link nav-link-btn" style="text-decoration:none;">मुख्य पृष्ठ</a>
        </nav>
      </header>

      <div class="page-content-wrapper">
        <nav class="breadcrumb-nav" aria-label="Breadcrumb">
          <ol class="breadcrumb-list">
            <li class="breadcrumb-item"><a href="/" class="breadcrumb-link">मुख्य पृष्ठ (Home)</a></li>
            <li class="breadcrumb-separator">/</li>
            <li class="breadcrumb-item active" aria-current="page">प्लेलिस्ट्स (Playlists)</li>
          </ol>
        </nav>

        <section class="editorial-section playlists-overview-page" aria-label="सभी हिंदी म्यूज़िक प्लेलिस्ट्स">
          <div class="editorial-container">
            <div class="editorial-content-panel full-width-panel">
              <div class="editorial-badge-row">
                <span class="editorial-badge">All Playlists</span>
                <span class="editorial-meta">Curated Retro Music</span>
              </div>
              <h1 class="editorial-title page-main-heading">
                चुनिंदा रेट्रो बॉलीवुड प्लेलिस्ट्स (Curated Hindi Playlists)
              </h1>
              <p class="editorial-desc page-intro-desc">
                हर शाम का एक अलग रंग और हर याद का अपना एक नग़मा होता है। नीचे काँच के ठेके की सभी चुनिंदा प्लेलिस्ट्स दी गई हैं। अपनी पसंद का मूड चुनें और महफ़िल का हिस्सा बनें।
              </p>

              <div class="playlists-editorial-grid">
                ${PLAYLISTS.map((pl) => `
                  <div class="playlist-card-item ${pl.isUpcoming ? 'upcoming-card' : ''}">
                    <div class="playlist-card-header">
                      <h2 class="playlist-card-title">
                        <a href="/playlists/${pl.id}" class="playlist-title-link">
                          ${escapeHtml(pl.name)}
                        </a>
                      </h2>
                      ${pl.isUpcoming ? '<span class="upcoming-badge" title="शीघ्र उपलब्ध">शीघ्र उपलब्ध</span>' : ''}
                    </div>
                    <p class="playlist-card-desc">${escapeHtml(pl.description)}</p>
                    <div class="playlist-card-footer-row">
                      <span class="playlist-card-meta">
                        ${pl.isUpcoming ? 'शीघ्र उपलब्ध • Upcoming' : `${pl.songs?.length || 0} चुनिंदा गीत`}
                      </span>
                      <div class="playlist-card-actions">
                        <a href="/playlists/${pl.id}" class="card-action-btn view-btn">
                          विवरण देखें →
                        </a>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>`;

  html = replaceRootContent(html, semanticContent);

  const outDir = path.join(DIST_DIR, 'playlists');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  console.log('[Prerender] Generated dist/playlists/index.html');
}

// 2. Prerender Individual Playlist Pages: /playlists/:id -> dist/playlists/:id/index.html
function prerenderPlaylistDetailPages() {
  for (const pl of PLAYLISTS) {
    const pageTitle = `${pl.name} | Kaanch Ke Theke — Playlist`;
    const pageDesc = `${pl.name} — ${pl.description} काँच के ठेके पर पुराने हिंदी गानों का आनंद लें।`;
    const pageUrl = `${SITE_DOMAIN}/playlists/${pl.id}`;

    let html = baseHtml;

    // Title
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);

    // Description
    html = html.replace(/<meta name="description"[\s\S]*?\/>/i, `<meta name="description" content="${escapeHtml(pageDesc)}" />`);

    // Canonical
    html = html.replace(/<link rel="canonical"[\s\S]*?\/>/i, `<link rel="canonical" href="${pageUrl}" />`);

    // Open Graph & Twitter
    html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${pageUrl}" />`);
    html = html.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`);
    html = html.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${escapeHtml(pageDesc)}" />`);
    html = html.replace(/<meta name="twitter:url" content=".*?" \/>/i, `<meta name="twitter:url" content="${pageUrl}" />`);
    html = html.replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />`);
    html = html.replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${escapeHtml(pageDesc)}" />`);

    // Route-specific JSON-LD
    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'मुख्य पृष्ठ (Home)', 'item': `${SITE_DOMAIN}/` },
            { '@type': 'ListItem', 'position': 2, 'name': 'प्लेलिस्ट्स (Playlists)', 'item': `${SITE_DOMAIN}/playlists` },
            { '@type': 'ListItem', 'position': 3, 'name': pl.name, 'item': pageUrl }
          ]
        },
        {
          '@type': 'MusicPlaylist',
          '@id': `${pageUrl}#playlist`,
          'url': pageUrl,
          'name': pl.name,
          'description': `${pl.name} — ${pl.description}`,
          'inLanguage': ['hi', 'en'],
          'numTracks': pl.songs?.length || 0,
          'track': (pl.songs || []).map((song, i) => ({
            '@type': 'MusicRecording',
            'position': i + 1,
            'name': song.title,
            'byArtist': {
              '@type': 'MusicGroup',
              'name': song.artist
            }
          }))
        }
      ]
    };

    html = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/i,
      `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n  </script>`
    );

    // Styled Semantic content inside #root matching React PlaylistDetailPage
    const trackRows = (pl.songs || []).map((s, idx) => `
      <tr class="song-table-row">
        <td class="col-num">${idx + 1}</td>
        <td class="col-title"><span class="song-title-text">${escapeHtml(s.title)}</span></td>
        <td class="col-artist"><span class="song-artist-text">${escapeHtml(s.artist)}</span></td>
      </tr>
    `).join('');

    const semanticContent = `    <div class="landing-container is-entered">
      <header class="header is-scrolled">
        <a href="/" class="brand brand-btn" aria-label="काँच के ठेके — मुख्य पृष्ठ" style="text-decoration:none;">
          <span class="brand-title-hindi">काँच के ठेके</span>
          <span class="brand-title-english">KAANCH KE THEKE</span>
        </a>
        <nav class="nav-links desktop-nav">
          <a href="/playlists" class="nav-link nav-link-btn" style="text-decoration:none;">सभी प्लेलिस्ट्स</a>
          <a href="/" class="nav-link nav-link-btn" style="text-decoration:none;">मुख्य पृष्ठ</a>
        </nav>
      </header>

      <div class="page-content-wrapper">
        <nav class="breadcrumb-nav" aria-label="Breadcrumb">
          <ol class="breadcrumb-list">
            <li class="breadcrumb-item"><a href="/" class="breadcrumb-link">मुख्य पृष्ठ (Home)</a></li>
            <li class="breadcrumb-separator">/</li>
            <li class="breadcrumb-item"><a href="/playlists" class="breadcrumb-link">प्लेलिस्ट्स (Playlists)</a></li>
            <li class="breadcrumb-separator">/</li>
            <li class="breadcrumb-item active" aria-current="page">${escapeHtml(pl.name)}</li>
          </ol>
        </nav>

        <section class="editorial-section playlist-detail-page" aria-label="${escapeHtml(pl.name)}">
          <div class="editorial-container">
            <div class="editorial-content-panel full-width-panel">
              <div class="editorial-badge-row">
                <span class="editorial-badge">Playlist</span>
                <span class="editorial-meta">${pl.isUpcoming ? 'शीघ्र उपलब्ध' : `${pl.songs?.length || 0} Tracks`}</span>
              </div>
              <h1 class="editorial-title page-main-heading">${escapeHtml(pl.name)}</h1>
              <p class="editorial-desc page-intro-desc">${escapeHtml(pl.description)}</p>

              ${pl.songs && pl.songs.length > 0 ? `
                <div class="songs-list-container">
                  <h2 class="songs-list-heading">प्लेलिस्ट के गीत (Tracklist)</h2>
                  <div class="songs-table-wrapper">
                    <table class="songs-table">
                      <thead>
                        <tr>
                          <th scope="col" class="col-num">#</th>
                          <th scope="col" class="col-title">गीत का नाम (Track Title)</th>
                          <th scope="col" class="col-artist">कलाकार (Artist)</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${trackRows}
                      </tbody>
                    </table>
                  </div>
                </div>
              ` : `
                <div style="padding:2rem 0;color:var(--text-muted);">
                  <p>यह प्लेलिस्ट जल्द ही नई धुनों और गीतों के साथ सजाई जाएगी।</p>
                </div>
              `}

              <div style="margin-top:2.5rem;display:flex;gap:1rem;">
                <a href="/playlists" class="card-action-btn view-btn">← सभी प्लेलिस्ट्स</a>
                <a href="/" class="card-action-btn view-btn">मुख्य पृष्ठ</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>`;

    html = replaceRootContent(html, semanticContent);

    const outDir = path.join(DIST_DIR, 'playlists', pl.id);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
    console.log(`[Prerender] Generated dist/playlists/${pl.id}/index.html`);
  }
}

// 3. Prerender 404 fallback: dist/404.html
function prerender404Page() {
  const pageTitle = 'पृष्ठ नहीं मिला (404) | Kaanch Ke Theke';
  const pageDesc = 'माफ़ करें, आप जिस पृष्ठ की तलाश कर रहे हैं वह काँच के ठेके पर उपलब्ध नहीं है। मुख्य पृष्ठ या प्लेलिस्ट्स पर वापस आएं।';

  let html = baseHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);
  html = html.replace(/<meta name="description"[\s\S]*?\/>/i, `<meta name="description" content="${escapeHtml(pageDesc)}" />`);
  html = html.replace(/<link rel="canonical"[\s\S]*?\/>/i, `<link rel="canonical" href="${SITE_DOMAIN}/404.html" />`);

  const semanticContent = `    <div class="landing-container is-entered">
      <header class="header is-scrolled">
        <a href="/" class="brand brand-btn" aria-label="काँच के ठेके — मुख्य पृष्ठ" style="text-decoration:none;">
          <span class="brand-title-hindi">काँच के ठेके</span>
          <span class="brand-title-english">KAANCH KE THEKE</span>
        </a>
      </header>

      <div class="page-content-wrapper">
        <section class="editorial-section not-found-inline-section" aria-label="पृष्ठ नहीं मिला">
          <div class="editorial-container">
            <div class="editorial-content-panel not-found-content-card">
              <div class="not-found-badge-row">
                <span class="editorial-badge">404</span>
                <span class="editorial-meta">रास्ता भटक गए</span>
              </div>
              <h1 class="editorial-title not-found-title">शायद रास्ता भटक गए हैं आप...</h1>
              <p class="editorial-desc not-found-desc">
                "रास्ता भटकना भी महफ़िल की एक ख़ूबसूरती है जनाब, मगर सुकून भरी धुनें आपको मुख्य पृष्ठ पर ही मिलेंगी।"
              </p>
              <div class="not-found-actions">
                <a href="/" class="not-found-primary-btn" style="text-decoration:none;display:inline-block;">← मुख्य पृष्ठ पर वापस जाएं (Home)</a>
                <a href="/playlists" class="card-action-btn view-btn" style="text-decoration:none;display:inline-block;">सभी प्लेलिस्ट्स देखें (Playlists) →</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>`;

  html = replaceRootContent(html, semanticContent);
  fs.writeFileSync(path.join(DIST_DIR, '404.html'), html, 'utf8');
  console.log('[Prerender] Generated dist/404.html');
}

console.log('[Prerender] Starting SSG generation for public routes...');
prerenderPlaylistsPage();
prerenderPlaylistDetailPages();
prerender404Page();
console.log('[Prerender] Completed successfully! All public routes have static HTML with full SEO & GEO metadata.');
