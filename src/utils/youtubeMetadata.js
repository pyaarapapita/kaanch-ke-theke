/**
 * Utility to fetch playlist metadata using official YouTube Data API v3.
 * Supports pagination via nextPageToken and caches metadata in-memory per session.
 */

import { PLAYLISTS } from '../data/playlists';

const metadataCache = new Map();

// Lookup for curated title/artist metadata
const curatedSongLookup = new Map();
PLAYLISTS.forEach((pl) => {
  (pl.songs || []).forEach((s) => {
    if (s.youtubeId) {
      curatedSongLookup.set(s.youtubeId, s);
    }
  });
});

function cleanSongTitle(rawTitle) {
  if (!rawTitle) return 'अज्ञात गीत';
  let t = rawTitle;
  // If title has '|', clean up channel promotional suffixes
  if (t.includes('|')) {
    const parts = t.split('|').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1 && /^(superhit|hit|best|evergreen|classic)\b/i.test(parts[0])) {
      t = parts[1];
    } else if (parts.length > 0) {
      t = parts[0];
    }
  }
  // Remove hashtags
  t = t.replace(/#[\w\u0900-\u097F_-]+/g, '').trim();
  // Remove (Official Video), [HD], etc.
  t = t.replace(/\s*[([](Official Video|Audio|Full Song|HD|4K|Lyrical|Video|Lyrical Video)[)\]]/gi, '').trim();
  return t || rawTitle;
}

export async function fetchPlaylistMetadata(playlistId, forceRefresh = false) {
  if (!playlistId) return { items: [], lookupMap: {} };

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey || apiKey === 'PASTE_MY_API_KEY_HERE') {
    console.warn('[YouTube Data API] Missing or unconfigured VITE_YOUTUBE_API_KEY in .env.local');
    return { items: [], lookupMap: {} };
  }

  if (forceRefresh) {
    metadataCache.delete(playlistId);
  } else if (metadataCache.has(playlistId)) {
    console.log('[YouTube Data API] Returning cached metadata for playlist:', playlistId);
    return metadataCache.get(playlistId);
  }

  const lookupMap = {};
  const itemsList = [];
  let pageToken = '';

  try {
    do {
      const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      url.searchParams.set('part', 'snippet,contentDetails');
      url.searchParams.set('playlistId', playlistId);
      url.searchParams.set('maxResults', '50');
      url.searchParams.set('key', apiKey);
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        console.error(`[YouTube Data API] Request failed with status ${response.status}`);
        break;
      }

      const data = await response.json();
      const items = data.items || [];

      items.forEach((item) => {
        const snippet = item.snippet || {};
        const videoId = snippet.resourceId?.videoId || item.contentDetails?.videoId;
        if (!videoId || snippet.title === 'Private video' || snippet.title === 'Deleted video') return;

        const curated = curatedSongLookup.get(videoId);
        const title = curated?.title || cleanSongTitle(snippet.title);
        let artist = curated?.artist || snippet.videoOwnerChannelTitle || snippet.channelTitle || 'YouTube';
        artist = artist.replace(/\s*-\s*Topic$/, '').trim();

        const songObj = {
          id: curated?.id || `yt-${videoId}`,
          title: title,
          artist: artist,
          youtubeId: videoId,
          playlistIndex: snippet.position ?? itemsList.length
        };

        lookupMap[videoId] = songObj;
        itemsList.push(songObj);
      });

      pageToken = data.nextPageToken || '';
    } while (pageToken);

    console.log(`[YouTube Data API] Successfully fetched ${itemsList.length} playlist items for ${playlistId}`);
    const result = { items: itemsList, lookupMap };
    metadataCache.set(playlistId, result);
    return result;
  } catch (err) {
    console.error('[YouTube Data API] Exception during metadata fetch:', err);
    return { items: itemsList, lookupMap };
  }
}
