/**
 * New Development Plan & Citizen Services API Service
 * Base URL: https://backend.misachinmalik.in/api/v1/new-development-plan
 * Powers:
 * 1. "माझे प्रमुख संकल्प – माझा विकास आराखडा" (25 cards)
 * 2. "नागरिक सेवा व तक्रार व्यवस्थापन" (26 cards)
 * 3. "शिक्षण, रोजगार, करिअर व संबंधित विभाग" (4 cards)
 * 4. "शासकीय योजना व परवाना संबंधित विभाग" (2 cards)
 * Total: 57 Manageable Cards
 */

export const NEW_DEV_PLAN_BASE_URL =
  "https://backend.misachinmalik.in/api/v1/new-development-plan";

export interface PolicyPoint {
  id: number;
  heading: string;
  description: string;
  display_order: number;
  status?: "active" | "inactive";
}

export interface ActionPlanStep {
  id: number;
  action_heading: string;
  action_description: string;
  step_number: number;
  image_url?: string | null;
  document_url?: string | null;
  display_order: number;
  status?: "active" | "inactive";
}

export interface CardItem {
  id: number;
  section_id: number;
  title: string;
  slug: string;
  short_description?: string | null;
  sankalp_text?: string | null;
  service_details?: string | null;
  required_documents?: string[] | null;
  application_procedure?: string | null;
  contact_info?: {
    officer?: string;
    phone?: string;
    email?: string;
  } | null;
  icon?: string | null;
  image_url?: string | null;
  pdf_document_url?: string | null;
  external_link?: string | null;
  display_order: number;
  is_featured?: boolean;
  status?: "published" | "draft" | "archived";
  section?: {
    id: number;
    section_number: number;
    title: string;
    slug: string;
    icon?: string | null;
  };
  policies?: PolicyPoint[];
  actionPlans?: ActionPlanStep[];
}

export interface SectionItem {
  id: number;
  section_number: number;
  title: string;
  slug: string;
  short_description?: string | null;
  icon?: string | null;
  display_order: number;
  total_cards_count: number;
  initiatives?: CardItem[];
}

export interface ModuleSettings {
  id?: number;
  title: string;
  subtitle: string;
  introduction?: string | null;
  development_role?: string | null;
  development_principles?: string[] | null;
  citizen_participation?: string | null;
  closing_message?: string | null;
  banner_url?: string | null;
}

export interface NewDevelopmentPlanOverview {
  settings: ModuleSettings;
  sections: SectionItem[];
  total_sections_count: number;
  total_published_cards: number;
}

export interface InitiativeDetailResponse {
  initiative: CardItem;
  navigation: {
    previous: { id: number; title: string; slug: string; icon?: string } | null;
    next: { id: number; title: string; slug: string; icon?: string } | null;
  };
}

export class NewDevelopmentPlanService {
  /**
   * Fetch home overview with settings and all 4 sections with their cards
   * Endpoint: GET /api/v1/new-development-plan
   */
  static async getOverview(): Promise<NewDevelopmentPlanOverview | null> {
    try {
      const res = await fetch(`${NEW_DEV_PLAN_BASE_URL}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (json && json.success && json.data) {
        return json.data as NewDevelopmentPlanOverview;
      }
      return null;
    } catch (err) {
      console.warn("[NewDevPlanService] Error fetching overview:", err);
      return null;
    }
  }

  /**
   * Fetch all 4 sections list
   * Endpoint: GET /api/v1/new-development-plan/sections
   */
  static async getSections(): Promise<SectionItem[]> {
    try {
      const res = await fetch(`${NEW_DEV_PLAN_BASE_URL}/sections`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return [];
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data as SectionItem[];
      }
      return [];
    } catch (err) {
      console.warn("[NewDevPlanService] Error fetching sections:", err);
      return [];
    }
  }

  /**
   * Fetch initiatives for a specific section slug
   * Endpoint: GET /api/v1/new-development-plan/sections/:slug/initiatives
   */
  static async getSectionInitiatives(
    slug: string,
    page = 1,
    limit = 30,
    search = ""
  ): Promise<{ items: CardItem[]; total: number; totalPages: number }> {
    try {
      const q = new URLSearchParams();
      q.append("page", String(page));
      q.append("limit", String(limit));
      if (search.trim()) q.append("search", search.trim());

      const res = await fetch(
        `${NEW_DEV_PLAN_BASE_URL}/sections/${slug}/initiatives?${q.toString()}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );
      if (!res.ok) return { items: [], total: 0, totalPages: 0 };
      const json = await res.json();
      if (json && json.success && json.data) {
        return {
          items: json.data.items || json.data.initiatives || [],
          total: json.data.total || 0,
          totalPages: json.data.totalPages || 1,
        };
      }
      return { items: [], total: 0, totalPages: 0 };
    } catch (err) {
      console.warn(`[NewDevPlanService] Error fetching initiatives for ${slug}:`, err);
      return { items: [], total: 0, totalPages: 0 };
    }
  }

  /**
   * Fetch single initiative card details by ID or Slug
   * Endpoint: GET /api/v1/new-development-plan/initiatives/:idOrSlug
   */
  static async getInitiativeDetail(
    idOrSlug: string | number
  ): Promise<InitiativeDetailResponse | null> {
    try {
      if (!idOrSlug) return null;
      const cleanParam = encodeURIComponent(String(idOrSlug).trim());
      const res = await fetch(
        `${NEW_DEV_PLAN_BASE_URL}/initiatives/${cleanParam}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );
      if (!res.ok) return null;
      const json = await res.json();
      if (json && json.success && json.data) {
        return json.data as InitiativeDetailResponse;
      }
      return null;
    } catch (err) {
      console.warn(`[NewDevPlanService] Error fetching initiative detail for ${idOrSlug}:`, err);
      return null;
    }
  }

  /**
   * Fetch related initiatives
   * Endpoint: GET /api/v1/new-development-plan/initiatives/:id/related
   */
  static async getRelatedInitiatives(id: number | string): Promise<CardItem[]> {
    try {
      const res = await fetch(
        `${NEW_DEV_PLAN_BASE_URL}/initiatives/${id}/related`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );
      if (!res.ok) return [];
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data as CardItem[];
      }
      return [];
    } catch (err) {
      console.warn(`[NewDevPlanService] Error fetching related for ${id}:`, err);
      return [];
    }
  }
}
