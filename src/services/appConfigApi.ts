/**
 * App Configuration API Service
 * Fetches dynamic campaign configuration, splash screen assets,
 * carousel banners, and resolutions from the Election CRM Backend.
 */

import { API_BASE_URL } from "./authApi";
import { CarouselBanner, ResolutionItem } from "../context/CampaignContext";

export interface JourneyMilestone {
  id: string;
  year: string;
  title: string;
  subtitle: string;
  description: string;
  tag?: string;
}

export interface SocialWorkItem {
  id: string;
  title: string;
  category: string;
  description: string;
  impactCount: string;
  iconName: string;
}

export interface AboutCandidateData {
  heroBannerUrl?: string;
  heroBannerImage?: string;
  bannerUrl?: string;
  biography: string;
  politicalEntryYear: string;
  missionStatement: string;
  roleDescription: string;
  quoteText: string;
  quoteAuthor: string;
  milestones: JourneyMilestone[];
  socialWorks: SocialWorkItem[];
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
    whatsapp: string;
  };
}

export interface NewsArticleItem {
  id: string | number;
  category: "all" | "politics" | "development" | "outreach" | "events" | string;
  categoryName?: string;
  date?: string;
  readTime?: string;
  location?: string;
  title: string;
  subtitle?: string;
  summary?: string;
  description?: string;
  highlights?: string[];
  fullContent?: string[] | string;
  content?: string;
  quote?: {
    text: string;
    author: string;
  };
  image?: any;
  imageUrl?: string;
  image_url?: string;
  isFeatured?: boolean;
  isBreaking?: boolean;
  is_breaking?: boolean;
  publishedAt?: string;
  published_at?: string;
  tag?: string;
  slug?: string | null;
  sourceName?: string;
  sourceUrl?: string;
}

export interface NotificationItem {
  id: string | number;
  category?: "issues" | "events" | "news" | "other" | string;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  title: string;
  message?: string;
  description?: string;
  timeAgo?: string;
  indicatorDot?: string;
  targetRoute?: string;
  type?: "custom" | string;
  mediaType?: "none" | "image" | "video" | "audio" | "pdf" | string;
  media_type?: string;
  mediaUrl?: string;
  media_url?: string;
  fileName?: string;
  file_name?: string;
  fileSize?: number;
  file_size?: number;
  duration?: number;
  priority?: string;
  audience?: string;
  sentAt?: string;
  sent_at?: string;
  createdAt?: string;
  created_at?: string;
  isRead?: boolean;
}

export interface GalleryItem {
  id: string | number;
  category: "all" | "events" | "dialogue" | "meetings" | "media" | "other" | string;
  title: string;
  date?: string;
  photoCount?: number;
  image?: any;
  imageUrl?: string;
  image_url?: string;
  description?: string;
  sortOrder?: number;
  sort_order?: number;
  isActive?: boolean;
  is_active?: boolean;
}

export interface DynamicAppConfigResponse {
  success: boolean;
  message?: string;
  data?: {
    config: {
      candidateHonorific: string;
      candidateName: string;
      candidateEnglishName: string;
      candidateDesignation: string;
      candidateConstituency: string;
      candidateWard?: string;
      candidatePhotoUrl?: string;
      candidateSlogan: string;
      candidateAppeal: string;
      candidateTagline: string;
      candidateBiography?: string;
      candidateVision?: string[];
      aboutHeroBannerUrl?: string;
      aboutBannerUrl?: string;

      leaderPrefix: string;
      leaderName: string;
      leaderEnglishName: string;
      leaderTitle: string;
      leaderPhotoUrl?: string;

      partyName: string;
      partyShortName: string;
      partyFaction: string;
      partyTagline: string;
      partySymbolName: string;
      partySymbolIcon: string;
      partyLogoUrl?: string;

      quoteCardText: string;
      quoteCardIcon: string;
      quoteCardActionUrl: string;

      officeName: string;
      officeAddress: string;
      city: string;
      pincode: string;
      helpline1: string;
      helpline2?: string;
      email: string;
      whatsapp: string;
      officeTimings: string;
      website?: string;

      splashDurationMs: number;
      carouselIntervalMs: number;
    };
    banners: CarouselBanner[];
    resolutions: ResolutionItem[];
    about?: AboutCandidateData;
    news?: NewsArticleItem[];
    notifications?: NotificationItem[];
    gallery?: GalleryItem[];
  };
}

class AppConfigApiService {
  /**
   * Fetch the dynamic application configuration from backend
   * Endpoint: GET /api/v1/app-config
   */
  async getAppConfig(): Promise<DynamicAppConfigResponse | null> {
    try {
      const url = `${API_BASE_URL}/api/v1/app-config`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const json = await response.json();
      if (json && json.success && json.data) {
        return json as DynamicAppConfigResponse;
      }
      return null;
    } catch {
      // Network error or server not ready - fallback will handle this smoothly
      return null;
    }
  }

  /**
   * Fetch News Articles independently if required
   * Endpoint: GET /api/v1/news
   */
  async getNewsArticles(): Promise<NewsArticleItem[] | null> {
    try {
      const url = `${API_BASE_URL}/api/v1/news`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return null;
      const json = await response.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data.map((item: any) => {
          const rawImg = item.imageUrl || item.image_url || item.image;
          return {
            ...item,
            image: typeof rawImg === "string" ? { uri: rawImg } : rawImg,
          };
        }) as NewsArticleItem[];
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch About candidate details independently
   * Endpoint: GET /api/v1/about
   */
  async getAboutDetails(): Promise<AboutCandidateData | null> {
    try {
      const url = `${API_BASE_URL}/api/v1/about`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return null;
      const json = await response.json();
      if (json && json.success && json.data) {
        return json.data as AboutCandidateData;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch Notifications list
   * Endpoint: GET /api/v1/notifications
   */
  async getNotifications(): Promise<NotificationItem[] | null> {
    try {
      const url = `${API_BASE_URL}/api/v1/notifications`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return null;
      const json = await response.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data as NotificationItem[];
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch Gallery items independently if required
   * Endpoint: GET /api/v1/gallery
   */
  async getGallery(): Promise<GalleryItem[] | null> {
    try {
      const url = `${API_BASE_URL}/api/v1/gallery`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return null;
      const json = await response.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data.map((item: any) => {
          const rawImg = item.imageUrl || item.image_url || item.image;
          return {
            ...item,
            image: typeof rawImg === "string" ? { uri: rawImg } : rawImg,
          };
        }) as GalleryItem[];
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const appConfigApi = new AppConfigApiService();
