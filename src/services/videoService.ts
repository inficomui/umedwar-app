import * as FileSystem from 'expo-file-system/legacy';
import { VideoItem, VideoApiResponse } from '../types/video.types';
import { API_BASE_URL } from './authApi';

const CACHE_FILE_PATH = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}misachinmalik_videos_cache.json`
  : null;

/**
 * Exact live campaign video items from the backend database
 */
export const DEFAULT_CAMPAIGN_VIDEOS: VideoItem[] = [
  {
    id: '1',
    category: 'speeches',
    categoryName: 'भाषणे व सभा',
    title: 'कोपरगाव विकासासाठी आमची वचनबद्धता',
    description: 'कोपरगाव विधानसभा मतदारसंघातील नागरिकांशी संवाद साधताना विकासाचा संकल्प.',
    date: '12 सप्टेंबर 2026',
    views: '1.2K Views',
    viewsCount: 1200,
    duration: '12:35',
    thumbnailUrl: 'https://election.crm.inficomaiacademy.com/public/uploads/home_hero_banner-1789802262772-63798a5a.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    sortOrder: 0,
    isActive: true,
  },
  {
    id: '2',
    category: 'dialogue',
    categoryName: 'जनसंवाद सभा',
    title: 'जनसंवाद सभा - जनतेचे प्रश्न आणि उत्तरे',
    description: 'पाणी पुरवठा व रस्ते विकास कामांचा आढावा व जनतेशी थेट चर्चा.',
    date: '5 सप्टेंबर 2026',
    views: '2.4K Views',
    viewsCount: 2400,
    duration: '08:45',
    thumbnailUrl: 'https://election.crm.inficomaiacademy.com/public/uploads/banner_rally-1789802283870-d1c91d32.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: '3',
    category: 'events',
    categoryName: 'कार्यक्रम व मेळावे',
    title: 'स्वच्छ आणि सुंदर कोपरगाव अभियान',
    description: 'मतदारसंघात राबविण्यात आलेले स्वच्छता अभियान व वृक्षारोपण कार्यक्रम.',
    date: '28 ऑगस्ट 2026',
    views: '950 Views',
    viewsCount: 950,
    duration: '10:12',
    thumbnailUrl: 'https://election.crm.inficomaiacademy.com/public/uploads/banner_development-1789802308220-7856f197.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    sortOrder: 2,
    isActive: true,
  },
];

/**
 * Normalize raw backend video objects
 */
function normalizeVideoItem(item: any, index: number): VideoItem {
  const rawThumb =
    item.thumbnailUrl ||
    item.thumbnail_url ||
    item.thumbnail ||
    item.image ||
    item.imageUrl ||
    '';

  let resolvedThumb = rawThumb;
  if (typeof rawThumb === 'string' && rawThumb.startsWith('/')) {
    resolvedThumb = `${API_BASE_URL}${rawThumb}`;
  }

  const rawUrl =
    item.videoUrl ||
    item.video_url ||
    item.url ||
    item.link ||
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

  const cat = String(item.category || '').toLowerCase();
  let mappedCat = item.category || 'speeches';
  let mappedCatName = item.categoryName || item.category_name;

  if (cat === 'speeches' || cat.includes('speech') || cat.includes('भाषण')) {
    mappedCat = 'speeches';
    if (!mappedCatName) mappedCatName = 'भाषणे व सभा';
  } else if (cat === 'dialogue' || cat.includes('संवाद')) {
    mappedCat = 'dialogue';
    if (!mappedCatName) mappedCatName = 'जनसंवाद';
  } else if (cat === 'events' || cat.includes('event') || cat.includes('कार्यक्रम') || cat.includes('rall') || cat.includes('मेळावा')) {
    mappedCat = 'events';
    if (!mappedCatName) mappedCatName = 'कार्यक्रम';
  } else if (cat === 'development' || cat.includes('dev') || cat.includes('विकास')) {
    mappedCat = 'development';
    if (!mappedCatName) mappedCatName = 'विकासकामे';
  } else if (cat === 'interviews' || cat.includes('interview') || cat.includes('मुलाखत')) {
    mappedCat = 'interviews';
    if (!mappedCatName) mappedCatName = 'मुलाखती';
  }

  return {
    id: String(item.id || index + 1),
    category: mappedCat,
    categoryName: mappedCatName || 'व्हिडिओ',
    title: item.title || 'व्हिडिओ',
    description: item.description || item.summary || '',
    date: item.date || '२०२६',
    views: item.views || (item.viewsCount ? `${item.viewsCount} Views` : '१K+ Views'),
    viewsCount: item.viewsCount || item.views_count,
    duration: item.duration || '१०:००',
    thumbnailUrl: resolvedThumb || 'https://election.crm.inficomaiacademy.com/public/uploads/home_hero_banner-1789802262772-63798a5a.jpg',
    videoUrl: rawUrl,
    publishedAt: item.publishedAt || item.published_at,
    sortOrder: item.sortOrder ?? item.sort_order ?? index,
    isActive: item.isActive ?? item.is_active ?? true,
  };
}

export const VideoService = {
  /**
   * Fetch videos from network with local offline cache fallback
   */
  async getVideos(category?: string, search?: string): Promise<VideoItem[]> {
    const endpointsToTry = [
      `${API_BASE_URL}/api/v1/videos`,
      'https://backend.misachinmalik.in/api/v1/videos',
      `${API_BASE_URL}/videos`,
    ];

    for (const baseEndpoint of endpointsToTry) {
      try {
        console.log('🎥 [VideoService] Fetching videos from:', baseEndpoint);
        const response = await fetch(baseEndpoint, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        console.log(`🎥 [VideoService] HTTP status: ${response.status} from ${baseEndpoint}`);

        if (response.ok) {
          const json = await response.json();
          console.log('🎥 [VideoService] Full API Response:');
          console.log(JSON.stringify(json, null, 2));

          let rawList: any[] | null = null;

          if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
            rawList = json.data;
          } else if (json && Array.isArray(json.data) && json.data.length > 0) {
            rawList = json.data;
          } else if (Array.isArray(json) && json.length > 0) {
            rawList = json;
          }

          if (rawList && rawList.length > 0) {
            const mapped = rawList.map(normalizeVideoItem);
            console.log(`🎥 [VideoService] Successfully normalized ${mapped.length} videos`);
            // Save to offline cache
            if (CACHE_FILE_PATH) {
              await FileSystem.writeAsStringAsync(
                CACHE_FILE_PATH,
                JSON.stringify(mapped)
              ).catch(() => {});
            }
            return mapped;
          } else {
            console.warn('🎥 [VideoService] Response received but video list is empty');
          }
        } else {
          console.warn(`🎥 [VideoService] Request failed with HTTP status ${response.status}`);
        }
      } catch (e) {
        console.warn(`🎥 [VideoService] Network error fetching from ${baseEndpoint}:`, e);
      }
    }

    // Fallback: check unified app-config feed
    const configEndpoints = [
      `${API_BASE_URL}/api/v1/app-config`,
      'https://backend.misachinmalik.in/api/v1/app-config',
      `${API_BASE_URL}/app-config`,
    ];

    for (const cfgUrl of configEndpoints) {
      try {
        console.log('🎥 [VideoService] Fallback: Fetching from app-config:', cfgUrl);
        const configRes = await fetch(cfgUrl);
        console.log(`🎥 [VideoService] app-config status: ${configRes.status} from ${cfgUrl}`);
        if (configRes.ok) {
          const configJson = await configRes.json();
          console.log('🎥 [VideoService] app-config Response:', JSON.stringify(configJson, null, 2));
          const fallbackVideos =
            configJson?.data?.videos ||
            configJson?.data?.videoGallery ||
            configJson?.videos;

          if (Array.isArray(fallbackVideos) && fallbackVideos.length > 0) {
            const mapped = fallbackVideos.map(normalizeVideoItem);
            console.log(`🎥 [VideoService] Found ${mapped.length} videos in app-config fallback`);
            if (CACHE_FILE_PATH) {
              await FileSystem.writeAsStringAsync(
                CACHE_FILE_PATH,
                JSON.stringify(mapped)
              ).catch(() => {});
            }
            return mapped;
          }
        }
      } catch (e) {
        console.warn(`🎥 [VideoService] Fallback error from ${cfgUrl}:`, e);
      }
    }

    // Try cached videos
    const cached = await this.getCachedVideos();
    if (cached && cached.length > 0) {
      return cached;
    }

    return DEFAULT_CAMPAIGN_VIDEOS;
  },

  /**
   * Read from local cache for instant zero-lag UI startup
   */
  async getCachedVideos(): Promise<VideoItem[]> {
    try {
      if (CACHE_FILE_PATH) {
        const info = await FileSystem.getInfoAsync(CACHE_FILE_PATH);
        if (info.exists) {
          const content = await FileSystem.readAsStringAsync(CACHE_FILE_PATH);
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map(normalizeVideoItem);
          }
        }
      }
    } catch (err) {
      console.warn('[VideoService] Cache read error:', err);
    }
    return DEFAULT_CAMPAIGN_VIDEOS;
  },
};
