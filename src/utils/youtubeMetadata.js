/**
 * Utility to fetch playlist metadata using official YouTube Data API v3.
 * Supports pagination via nextPageToken and caches metadata in-memory per session.
 */

const metadataCache = new Map();

export async function fetchPlaylistMetadata(playlistId) {
  if (!playlistId) return {};

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey || apiKey === 'PASTE_MY_API_KEY_HERE') {
    console.warn('[YouTube Data API] Missing or unconfigured VITE_YOUTUBE_API_KEY in .env.local');
    return {};
  }

  if (metadataCache.has(playlistId)) {
    console.log('[YouTube Data API] Returning cached metadata for playlist:', playlistId);
    return metadataCache.get(playlistId);
  }

  const lookupMap = {};
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
        if (!videoId) return;

        const title = snippet.title || 'अज्ञात गीत';
        // Channel/Artist name from API snippet
        const artist = snippet.videoOwnerChannelTitle || snippet.channelTitle || 'YouTube';

        lookupMap[videoId] = {
          id: videoId,
          title: title,
          artist: artist,
          youtubeId: videoId,
          playlistIndex: snippet.position ?? 0
        };
      });

      pageToken = data.nextPageToken || '';
    } while (pageToken);

    console.log(`[YouTube Data API] Successfully fetched ${Object.keys(lookupMap).length} playlist items for ${playlistId}`);
    metadataCache.set(playlistId, lookupMap);
    return lookupMap;
  } catch (err) {
    console.error('[YouTube Data API] Exception during metadata fetch:', err);
    return lookupMap;
  }
}

const singleVideoCache = new Map();

export async function fetchSingleVideoMetadata(videoId) {
  if (!videoId) return null;
  if (singleVideoCache.has(videoId)) {
    return singleVideoCache.get(videoId);
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      const meta = {
        id: videoId,
        title: data.title || 'अज्ञात गीत',
        artist: data.author_name || 'YouTube',
        youtubeId: videoId
      };
      singleVideoCache.set(videoId, meta);
      return meta;
    }
  } catch (err) {
    console.warn('[YouTube oEmbed] Fallback fetch error for videoId:', videoId, err);
  }
  return null;
}
