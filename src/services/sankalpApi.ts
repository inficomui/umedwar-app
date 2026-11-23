import { API_BASE_URL } from "./authApi";

export interface SankalpCardItem {
  id: number | string;
  title: string;
  slug: string;
  icon_image?: string;
  short_description?: string;
  button_text?: string;
  display_order?: number;
}

export interface SankalpDetailItem extends SankalpCardItem {
  content: string; // Rich document HTML formatted in Word-style editor
  content_format?: "html" | "json";
  display_order?: number;
  status?: "active" | "inactive" | "draft";
  created_at?: string;
  updated_at?: string;
}

export class SankalpService {
  /**
   * Fetch active Sankalp cards for mobile home screen and slider.
   * Endpoint: GET /api/v1/sankalp
   */
  static async getSankalpCards(): Promise<SankalpCardItem[]> {
    try {
      const url = `${API_BASE_URL}/api/v1/sankalp`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return [];
      const json = await response.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data as SankalpCardItem[];
      }
      return [];
    } catch (err) {
      console.warn("Could not fetch sankalp cards from API:", err);
      return [];
    }
  }

  /**
   * Fetch full rich document details of a specific Sankalp by slug or ID.
   * Endpoint: GET /api/v1/sankalp/:slugOrId
   */
  static async getSankalpDetail(
    slugOrId: string | number
  ): Promise<SankalpDetailItem | null> {
    try {
      if (!slugOrId) return null;
      const cleanParam = encodeURIComponent(String(slugOrId).trim());
      const url = `${API_BASE_URL}/api/v1/sankalp/${cleanParam}`;

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
        return json.data as SankalpDetailItem;
      }
      return null;
    } catch (err) {
      console.warn(`Could not fetch sankalp detail for '${slugOrId}':`, err);
      return null;
    }
  }
}

export const sankalpApi = SankalpService;
