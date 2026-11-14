// src/utils/videoUtils.ts

export interface ParsedVideo {
  type: 'youtube' | 'direct' | 'unsupported';
  youtubeVideoId?: string;
  embedUrl?: string;
  streamUrl: string;
}

export function parseVideoUrl(url: string): ParsedVideo {
  if (!url || typeof url !== 'string') {
    return { type: 'unsupported', streamUrl: '' };
  }

  const cleanUrl = url.trim();

  // 1. YouTube standard watch (youtube.com/watch?v=ID)
  const standardMatch = cleanUrl.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (standardMatch && standardMatch[1]) {
    return {
      type: 'youtube',
      youtubeVideoId: standardMatch[1],
      embedUrl: `https://www.youtube.com/embed/${standardMatch[1]}?autoplay=1&rel=0`,
      streamUrl: cleanUrl,
    };
  }

  // 2. YouTube Shortened (youtu.be/ID)
  const shortMatch = cleanUrl.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) {
    return {
      type: 'youtube',
      youtubeVideoId: shortMatch[1],
      embedUrl: `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&rel=0`,
      streamUrl: cleanUrl,
    };
  }

  // 3. YouTube Shorts (youtube.com/shorts/ID)
  const shortsMatch = cleanUrl.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) {
    return {
      type: 'youtube',
      youtubeVideoId: shortsMatch[1],
      embedUrl: `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&rel=0`,
      streamUrl: cleanUrl,
    };
  }

  // 4. YouTube Embed directly
  const embedMatch = cleanUrl.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) {
    return {
      type: 'youtube',
      youtubeVideoId: embedMatch[1],
      embedUrl: cleanUrl,
      streamUrl: cleanUrl,
    };
  }

  // 5. Direct MP4 / M3U8 / WebM files
  if (/\.(mp4|m3u8|webm|mov)(\?.*)?$/i.test(cleanUrl) || cleanUrl.includes('/uploads/')) {
    return {
      type: 'direct',
      streamUrl: cleanUrl,
    };
  }

  return {
    type: 'direct',
    streamUrl: cleanUrl,
  };
}
