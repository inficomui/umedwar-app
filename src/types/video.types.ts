export type VideoCategory =
  | 'all'
  | 'speeches'
  | 'development'
  | 'rallies'
  | 'interviews'
  | 'other';

export interface VideoItem {
  id: number | string;
  category: VideoCategory | string;
  categoryName?: string;
  category_name?: string;
  title: string;
  description?: string;
  date?: string;
  views?: string;
  viewsCount?: number | string;
  views_count?: number | string;
  duration?: string;
  thumbnailUrl: string;
  thumbnail_url?: string;
  videoUrl: string;
  video_url?: string;
  publishedAt?: string | null;
  published_at?: string | null;
  sortOrder?: number;
  sort_order?: number;
  isActive?: boolean;
  is_active?: boolean;
}

export interface VideoApiResponse {
  success: boolean;
  message: string;
  data: VideoItem[];
  timestamp?: string;
}

export interface VideoQueryParams {
  category?: string;
  search?: string;
  activeOnly?: boolean | string;
  limit?: number;
}
