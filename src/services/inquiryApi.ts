/**
 * Citizen Inquiries & Contact Form API Service
 * Live Backend Server: https://election.crm.inficomaiacademy.com
 *
 * Handles:
 * - Real-time inquiry submissions from the Contact screen to the live database
 * - Capturing citizen push tokens (FCM & Expo) for in-app messaging
 * - Seamless integration with Admin panel for WhatsApp & App push replies
 */

import { API_BASE_URL, CANDIDATE_ID } from "./issuesApi";
import { getCachedPushTokens } from "./notificationPushService";

export interface CreateInquiryInput {
  name: string;
  mobile: string;
  email?: string;
  subject?: string;
  message: string;
  userId?: string | number;
  fcmToken?: string;
  expoToken?: string;
}

export interface InquiryItem {
  id: string | number;
  candidateId?: string;
  userId?: string | number;
  name: string;
  mobile: string;
  email?: string;
  subject?: string;
  message: string;
  status: "pending" | "in_progress" | "replied" | "closed";
  fcmToken?: string;
  expoToken?: string;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
}

class InquiryApiService {
  /**
   * Submit a new contact inquiry to the backend
   * Endpoint: POST /api/v1/inquiries
   */
  async submitInquiry(
    input: CreateInquiryInput
  ): Promise<{ success: boolean; message: string; data?: InquiryItem }> {
    try {
      // Automatically attach cached push tokens for in-app admin messaging
      const cachedTokens = await getCachedPushTokens();
      const fcmToken = input.fcmToken || cachedTokens.fcmToken;
      const expoToken = input.expoToken || cachedTokens.expoToken;

      const payload = {
        candidateId: CANDIDATE_ID,
        candidate_id: CANDIDATE_ID,
        userId: input.userId || undefined,
        user_id: input.userId || undefined,
        name: input.name.trim(),
        mobile: input.mobile.trim(),
        email: input.email ? input.email.trim() : null,
        subject: input.subject || "General Contact Inquiry",
        message: input.message.trim(),
        fcmToken: fcmToken || null,
        fcm_token: fcmToken || null,
        expoToken: expoToken || null,
        expo_token: expoToken || null,
        status: "pending",
        source: "mobile_app",
      };

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      const url = `${API_BASE_URL}/api/v1/inquiries`;

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let json: any = null;
      try {
        json = JSON.parse(responseText);
      } catch {
        // Not JSON
      }

      if (response.ok) {
        return {
          success: true,
          message:
            json?.message ||
            "आपला संदेश यशस्वीरीत्या कार्यालयाकडे नोंदवला गेला आहे.",
          data: json?.data || (payload as any),
        };
      }

      // If backend returns specific error message
      const errorMsg =
        json?.message ||
        json?.error ||
        `सर्व्हर एरर (${response.status}). कृपया पुन्हा प्रयत्न करा.`;

      return {
        success: false,
        message: errorMsg,
      };
    } catch (error: any) {
      console.warn("[InquiryApi] Network request failed:", error?.message || error);
      return {
        success: false,
        message:
          "इंटरनेट कनेक्टिव्हिटी तपासा किंवा काही वेळाने पुन्हा प्रयत्न करा.",
      };
    }
  }
}

export const inquiryApi = new InquiryApiService();
