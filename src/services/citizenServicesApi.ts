import { API_BASE_URL } from "./authApi";
import {
  Department,
  Submission,
  CreateSubmissionInput,
} from "../types/citizenServices.types";

export class CitizenServicesApiService {
  /**
   * Fetch catalog of all 26 official government departments
   * Endpoint: GET /api/v1/citizen-services/departments
   */
  static async getDepartments(): Promise<Department[]> {
    try {
      const url = `${API_BASE_URL}/api/v1/citizen-services/departments`;
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
        return json.data as Department[];
      }
      return [];
    } catch (err) {
      console.warn("Error fetching citizen departments:", err);
      return [];
    }
  }

  /**
   * Fetch specific department details & its official services list
   * Endpoint: GET /api/v1/citizen-services/departments/:idOrCode
   */
  static async getDepartmentDetails(
    idOrCode: string | number
  ): Promise<Department | null> {
    try {
      if (!idOrCode) return null;
      const cleanParam = encodeURIComponent(String(idOrCode).trim());
      const url = `${API_BASE_URL}/api/v1/citizen-services/departments/${cleanParam}`;

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
        return json.data as Department;
      }
      return null;
    } catch (err) {
      console.warn(`Error fetching department detail for ${idOrCode}:`, err);
      return null;
    }
  }

  /**
   * Submit new citizen grievance or service application
   * Endpoint: POST /api/v1/citizen-services/submissions
   */
  static async createSubmission(
    input: CreateSubmissionInput,
    authToken?: string
  ): Promise<{ success: boolean; message?: string; data?: Submission }> {
    try {
      const url = `${API_BASE_URL}/api/v1/citizen-services/submissions`;
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(input),
      });

      const json = await response.json();
      if (response.ok && json && json.success) {
        return {
          success: true,
          message: json.message || "आपली तक्रार यशस्वीरीत्या नोंदविण्यात आली आहे.",
          data: json.data as Submission,
        };
      }

      return {
        success: false,
        message: json?.message || "तक्रार नोंदवण्यात त्रुटी आली. कृपया पुन्हा प्रयत्न करा.",
      };
    } catch (err: any) {
      console.warn("Error submitting grievance:", err);
      return {
        success: false,
        message: err?.message || "सर्व्हरशी संपर्क होऊ शकला नाही.",
      };
    }
  }

  /**
   * Track grievance status, assigned officer, 24-hr SLA, and actions timeline by Reference Number
   * Endpoint: GET /api/v1/citizen-services/submissions/:referenceNumber
   */
  static async getSubmissionTracking(
    referenceNumber: string
  ): Promise<Submission | null> {
    try {
      if (!referenceNumber) return null;
      const cleanRef = encodeURIComponent(referenceNumber.trim());
      const url = `${API_BASE_URL}/api/v1/citizen-services/submissions/${cleanRef}`;

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
        return json.data as Submission;
      }
      return null;
    } catch (err) {
      console.warn(`Error tracking submission ${referenceNumber}:`, err);
      return null;
    }
  }

  /**
   * Get all submissions registered by a citizen's mobile number
   * Endpoint: GET /api/v1/citizen-services/my-submissions?mobile=...
   */
  static async getMySubmissions(mobile: string): Promise<Submission[]> {
    try {
      if (!mobile) return [];
      const cleanPhone = encodeURIComponent(mobile.trim().replace(/\D/g, "").slice(-10));
      const url = `${API_BASE_URL}/api/v1/citizen-services/my-submissions?mobile=${cleanPhone}`;

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
        return json.data as Submission[];
      }
      return [];
    } catch (err) {
      console.warn("Error fetching citizen submissions:", err);
      return [];
    }
  }

  /**
   * Add a citizen follow-up message to an existing submission
   * Endpoint: POST /api/v1/citizen-services/submissions/:id/follow-up
   */
  static async postFollowUp(
    submissionId: number | string,
    message: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const url = `${API_BASE_URL}/api/v1/citizen-services/submissions/${submissionId}/follow-up`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message.trim() }),
      });

      const json = await response.json();
      return {
        success: Boolean(json?.success),
        message: json?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "फॉलो-अप पाठवण्यात त्रुटी आली.",
      };
    }
  }
}

export const citizenServicesApi = CitizenServicesApiService;
