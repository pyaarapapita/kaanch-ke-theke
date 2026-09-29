/**
 * Utility to fetch playlist metadata using official YouTube Data API v3.
 * Supports pagination via nextPageToken and caches metadata in-memory per session.
 */

const metadataCache = new Map();

export async function fetchPlaylistMetadata(playlistId) {
  if (!playlistId) return { items: [], lookupMap: {} };

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey || apiKey === 'PASTE_MY_API_KEY_HERE') {
    console.warn('[YouTube Data API] Missing or unconfigured VITE_YOUTUBE_API_KEY in .env.local');
    return { items: [], lookupMap: {} };
  }

  if (metadataCache.has(playlistId)) {
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

        const title = snippet.title || 'अज्ञात गीत';
        let artist = snippet.videoOwnerChannelTitle || snippet.channelTitle || 'YouTube';
        artist = artist.replace(/\s*-\s*Topic$/, '').trim();

        const songObj = {
          id: videoId,
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
