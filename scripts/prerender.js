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

  // Semantic content inside #root
  const semanticContent = `
  <div id="root">
    <div class="page-content-wrapper" style="max-width:960px;margin:2rem auto;padding:0 1.5rem;font-family:sans-serif;">
      <nav aria-label="Breadcrumb">
        <a href="/">मुख्य पृष्ठ (Home)</a> / <span>प्लेलिस्ट्स (Playlists)</span>
      </nav>
      <header style="margin:2rem 0;">
        <h1>चुनिंदा रेट्रो बॉलीवुड प्लेलिस्ट्स (Curated Hindi Playlists)</h1>
        <p>हर शाम का एक अलग रंग और हर याद का अपना एक नग़मा होता है। नीचे काँच के ठेके की सभी चुनिंदा प्लेलिस्ट्स दी गई हैं। अपनी पसंद का मूड चुनें और महफ़िल का हिस्सा बनें।</p>
      </header>
      <main>
        <div style="display:grid;gap:1.5rem;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));">
          ${PLAYLISTS.map((pl) => `
            <article style="border:1px solid #d4af7a33;padding:1.5rem;border-radius:8px;">
              <h2><a href="/playlists/${pl.id}" style="color:#f5deb3;text-decoration:none;">${escapeHtml(pl.name)}</a></h2>
              <p>${escapeHtml(pl.description)}</p>
              <p><strong>${pl.isUpcoming ? 'शीघ्र उपलब्ध • Upcoming' : `${pl.songs?.length || 0} चुनिंदा गीत`}</strong></p>
              <p><a href="/playlists/${pl.id}" style="color:#d4af37;">विवरण व ट्रैकलिस्ट देखें →</a></p>
            </article>
          `).join('')}
        </div>
      </main>
      <footer style="margin-top:3rem;border-top:1px dashed #d4af7a33;padding-top:1.5rem;">
        <p><a href="/">← मुख्य पृष्ठ पर वापस जाएं (Back to Home)</a></p>
      </footer>
    </div>
  </div>`;

  html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, semanticContent);

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

    // Semantic content inside #root
    const trackRows = (pl.songs || []).map((s, idx) => `
      <tr style="border-bottom:1px solid #d4af7a22;">
        <td style="padding:0.75rem 0.5rem;">${idx + 1}</td>
        <td style="padding:0.75rem 0.5rem;font-weight:600;">${escapeHtml(s.title)}</td>
        <td style="padding:0.75rem 0.5rem;color:#ccc;">${escapeHtml(s.artist)}</td>
      </tr>
    `).join('');

    const semanticContent = `
    <div id="root">
      <div class="page-content-wrapper" style="max-width:960px;margin:2rem auto;padding:0 1.5rem;font-family:sans-serif;">
        <nav aria-label="Breadcrumb">
          <a href="/">मुख्य पृष्ठ (Home)</a> / <a href="/playlists">प्लेलिस्ट्स (Playlists)</a> / <span>${escapeHtml(pl.name)}</span>
        </nav>
        <header style="margin:2rem 0;">
          <h1>${escapeHtml(pl.name)}</h1>
          <p>${escapeHtml(pl.description)}</p>
          <p><strong>${pl.isUpcoming ? 'शीघ्र उपलब्ध • Upcoming' : `${pl.songs?.length || 0} चुनिंदा गीत`}</strong></p>
        </header>
        <main>
          ${pl.songs && pl.songs.length > 0 ? `
            <section aria-label="ट्रैकलिस्ट">
              <h2>प्लेलिस्ट के गीत (Tracklist)</h2>
              <table style="width:100%;border-collapse:collapse;margin-top:1rem;text-align:left;">
                <thead>
                  <tr style="border-bottom:2px solid #d4af7a55;">
                    <th style="padding:0.5rem;">#</th>
                    <th style="padding:0.5rem;">गीत का नाम (Track)</th>
                    <th style="padding:0.5rem;">गायक / कलाकार (Artist)</th>
                  </tr>
                </thead>
                <tbody>
                  ${trackRows}
                </tbody>
              </table>
            </section>
          ` : `
            <div style="padding:2rem 0;">
              <p>यह प्लेलिस्ट जल्द ही नई धुनों और गीतों के साथ सजाई जाएगी।</p>
            </div>
          `}
        </main>
        <footer style="margin-top:3rem;border-top:1px dashed #d4af7a33;padding-top:1.5rem;display:flex;gap:1.5rem;">
          <a href="/playlists">← सभी प्लेलिस्ट्स देखें (All Playlists)</a>
          <a href="/">मुख्य पृष्ठ पर जाएं (Home)</a>
        </footer>
      </div>
    </div>`;

    html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, semanticContent);

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

  const semanticContent = `
  <div id="root">
    <div style="max-width:700px;margin:4rem auto;padding:0 1.5rem;text-align:center;font-family:sans-serif;">
      <h1>शायद रास्ता भटक गए हैं आप... (404)</h1>
      <p>"रास्ता भटकना भी महफ़िल की एक ख़ूबसूरती है जनाब, मगर सुकून भरी धुनें आपको मुख्य पृष्ठ पर ही मिलेंगी।"</p>
      <p><a href="/" style="display:inline-block;padding:0.75rem 1.5rem;background:#d4af37;color:#120c0a;text-decoration:none;border-radius:6px;font-weight:600;">← मुख्य पृष्ठ पर वापस जाएं (Home)</a></p>
      <p><a href="/playlists" style="color:#d4af37;">सभी प्लेलिस्ट्स देखें (Playlists) →</a></p>
    </div>
  </div>`;

  html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, semanticContent);
  fs.writeFileSync(path.join(DIST_DIR, '404.html'), html, 'utf8');
  console.log('[Prerender] Generated dist/404.html');
}

console.log('[Prerender] Starting SSG generation for public routes...');
prerenderPlaylistsPage();
prerenderPlaylistDetailPages();
prerender404Page();
console.log('[Prerender] Completed successfully! All public routes have static HTML with full SEO & GEO metadata.');
