/**
 * Citizen Issues API & Service
 * Connected to Live Backend Server:
 * https://election.crm.inficomaiacademy.com
 *
 * Handles:
 * - Real-time issue submission to live database with status 'pending'
 * - Image-to-Base64/URL encoding for photo evidence
 * - Targeted user push notification tokens (FCM / Expo)
 * - Citizen's personal "My Issues"
 * - Live 4-step status tracking timeline and officer remarks
 * - Admin status updates
 */
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { API_BASE_URL } from "./authApi";

export { API_BASE_URL };

export const CANDIDATE_ID =
  process.env.EXPO_PUBLIC_CANDIDATE_ID || "sachin-malik";

export type IssueStatus = "pending" | "forwarded" | "in_progress" | "resolved" | "rejected";

export type IssueCategory =
  | "roads"
  | "water"
  | "electricity"
  | "cleanliness"
  | "drain"
  | "health"
  | "education"
  | "lights"
  | "environment"
  | "public"
  | "other";

export interface IssueTimelineEvent {
  stage: 1 | 2 | 3 | 4; // 1: नोंदवली, 2: पाठवली, 3: प्रगतीपथावर, 4: पूर्ण
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  officerRemark?: string;
}

export interface AssignedOfficer {
  name: string;
  designation: string;
  phone: string;
  department: string;
}

export interface IssueItem {
  id: string;
  trackingId: string; // e.g. "ISS-2026-00125"
  candidateId?: string;
  userId?: string;
  userName: string;
  userMobile: string;
  userEmail?: string;
  category: IssueCategory;
  categoryName: string;
  title: string;
  description: string;
  location: string;
  googleMapsUrl?: string;
  ward: string;
  date: string;
  createdAt?: string;
  status: IssueStatus;
  statusText: string;
  statusColor?: string;
  statusBg?: string;
  image: any;
  images: any[];
  department?: string;
  assignedOfficer?: AssignedOfficer;
  estimatedResolutionDate?: string;
  timeline: IssueTimelineEvent[];
  adminRemarks: string[];
  isMyIssue?: boolean;
  fcmToken?: string;
  expoToken?: string;
}

export interface CreateIssueInput {
  title: string;
  description: string;
  category: IssueCategory;
  location: string;
  googleMapsUrl?: string;
  ward?: string;
  userId?: string;
  userName?: string;
  userMobile?: string;
  userEmail?: string;
  fcmToken?: string | null;
  expoToken?: string | null;
  images?: any[];
}

export const DEFAULT_ISSUES: IssueItem[] = [];

const USER_ISSUES_FILE = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}user_created_issues.json`
  : null;
const USER_ISSUES_STORAGE_KEY = "user_created_issues_data";

async function loadSavedUserIssues(): Promise<IssueItem[]> {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(USER_ISSUES_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
      return [];
    }
    if (USER_ISSUES_FILE) {
      const info = await FileSystem.getInfoAsync(USER_ISSUES_FILE);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(USER_ISSUES_FILE);
        return JSON.parse(content);
      }
    }
  } catch (err) {
    console.warn("Could not load saved user issues:", err);
  }
  return [];
}

async function saveUserIssues(issues: IssueItem[]): Promise<void> {
  try {
    const userOnly = issues.filter(
      (i) => i.isMyIssue && (Boolean(i.userId) || String(i.id).startsWith("iss-") || String(i.id).startsWith("user-iss-"))
    );
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(USER_ISSUES_STORAGE_KEY, JSON.stringify(userOnly));
      }
      return;
    }
    if (USER_ISSUES_FILE) {
      await FileSystem.writeAsStringAsync(USER_ISSUES_FILE, JSON.stringify(userOnly));
    }
  } catch (err) {
    console.warn("Could not save user issues:", err);
  }
}

/**
 * Safely converts a local file/content URI to a Base64 data URL
 * so that web admin panels and the backend database receive actual image data.
 */
export async function convertUriToBase64(uri: string): Promise<string> {
  if (!uri || typeof uri !== "string") return "";
  if (uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("data:")) {
    return uri;
  }
  try {
    if (Platform.OS !== "web") {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      let mime = "image/jpeg";
      if (uri.toLowerCase().endsWith(".png")) mime = "image/png";
      else if (uri.toLowerCase().endsWith(".webp")) mime = "image/webp";
      return `data:${mime};base64,${base64}`;
    }
  } catch (err) {
    console.warn("Image Base64 conversion warning:", err);
  }
  return uri;
}

export function getStatusDetails(status: IssueStatus): {
  statusText: string;
  statusColor: string;
  statusBg: string;
} {
  switch (status) {
    case "forwarded":
      return { statusText: "अधिकाऱ्यांकडे पाठवली", statusColor: "#2563EB", statusBg: "#DBEAFE" };
    case "in_progress":
      return { statusText: "काम प्रगतीपथावर", statusColor: "#EA580C", statusBg: "#FFEDD5" };
    case "resolved":
      return { statusText: "निकाली", statusColor: "#16A34A", statusBg: "#DCFCE7" };
    case "rejected":
      return { statusText: "नाकारली", statusColor: "#DC2626", statusBg: "#FEE2E2" };
    case "pending":
    default:
      return { statusText: "प्रलंबित", statusColor: "#DC2626", statusBg: "#FEE2E2" };
  }
}

export const CATEGORY_LABELS: Record<string, string> = {
  roads: "रस्ते",
  water: "पाणीपुरवठा",
  electricity: "वीज",
  lights: "पथदिवे",
  cleanliness: "स्वच्छता",
  drain: "गटार / नाले",
  health: "आरोग्य",
  education: "शिक्षण",
  environment: "पर्यावरण",
  public: "सार्वजनिक सुविधा",
  transit: "रस्ते",
  other: "इतर",
};

/**
 * Normalizes raw server issue response into a robust, type-safe IssueItem
 */
export function normalizeIssue(raw: any, isUserOwner = false): IssueItem {
  if (!raw) {
    throw new Error("Invalid issue data");
  }

  const id = String(raw.id || raw._id || `iss-${Date.now()}`);
  const trackingId = String(raw.trackingId || raw.tracking_id || raw.ticketNo || `ISS-2026-${Math.floor(10000 + Math.random() * 90000)}`);
  const status: IssueStatus = (
    raw.status === "forwarded" ||
    raw.status === "in_progress" ||
    raw.status === "resolved" ||
    raw.status === "rejected" ||
    raw.status === "pending"
  )
    ? raw.status
    : "pending";

  const { statusText, statusColor, statusBg } = getStatusDetails(status);

  const category = (raw.category || "roads") as IssueCategory;
  const categoryName = raw.categoryName || raw.category_name || raw.categoryLabel || raw.category_label || CATEGORY_LABELS[category] || "रस्ते";

  const rawImages = Array.isArray(raw.images) && raw.images.length > 0
    ? raw.images
    : raw.image
      ? [raw.image]
      : [];

  const processedImages = rawImages.map((img: any) => {
    if (typeof img === "string") return img;
    if (img && typeof img === "object" && img.url) return img.url;
    if (img && typeof img === "object" && img.uri) return img.uri;
    return img;
  });

  const defaultImg = require("../../assets/images/issue_pothole.png");
  const mainImage = processedImages.length > 0 ? processedImages[0] : defaultImg;

  // Build timeline
  let timeline: IssueTimelineEvent[] = [];
  if (Array.isArray(raw.timeline) && raw.timeline.length > 0) {
    timeline = raw.timeline.map((evt: any, idx: number) => ({
      stage: (evt.stage || idx + 1) as 1 | 2 | 3 | 4,
      title: evt.title || "",
      description: evt.description || "",
      timestamp: evt.timestamp || "अपडेट",
      completed: Boolean(evt.completed),
      officerRemark: evt.officerRemark || evt.officer_remark,
    }));
  } else {
    // Default 4-stage timeline
    timeline = [
      {
        stage: 1,
        title: "समस्या नोंदवली गेली",
        description: "नागरिकाने मोबाईल ॲपद्वारे तक्रार फोटोसह यशस्वीरीत्या नोंदवली.",
        timestamp: raw.date || raw.createdAt ? new Date(raw.createdAt || Date.now()).toLocaleDateString("mr-IN") : "नोंदवली",
        completed: true,
      },
      {
        stage: 2,
        title: "संबंधित अधिकाऱ्यांकडे पाठवली",
        description: "आमदार कार्यालयातून प्रशासनाकडे कार्यवाहीसाठी वर्ग केली जाईल.",
        timestamp: status !== "pending" ? "पाठवली" : "प्रतीक्षेत",
        completed: status === "forwarded" || status === "in_progress" || status === "resolved",
      },
      {
        stage: 3,
        title: "काम प्रगतीपथावर",
        description: "प्रत्यक्ष जागेची पाहणी व काम सुरू केले आहे.",
        timestamp: status === "in_progress" || status === "resolved" ? "सुरू" : "प्रतीक्षेत",
        completed: status === "in_progress" || status === "resolved",
      },
      {
        stage: 4,
        title: "काम पूर्ण / निकाली",
        description: "समस्या सोडवून तक्रार निकाली काढली.",
        timestamp: status === "resolved" ? "पूर्ण" : "प्रतीक्षेत",
        completed: status === "resolved",
      },
    ];
  }

  const adminRemarks: string[] = Array.isArray(raw.adminRemarks)
    ? raw.adminRemarks
    : Array.isArray(raw.admin_remarks)
      ? raw.admin_remarks
      : raw.remark
        ? [raw.remark]
        : ["नागरिकाने नव्याने समस्या दाखल केली आहे. लवकरच दखल घेतली जाईल."];

  return {
    id,
    trackingId,
    candidateId: raw.candidateId || raw.candidate_id || CANDIDATE_ID,
    userId: raw.userId || raw.user_id || raw.reportedBy?.userId,
    userName: raw.userName || raw.user_name || raw.citizenName || raw.citizen_name || raw.name || raw.reportedBy?.userName || "नागरिक",
    userMobile: raw.userMobile || raw.user_mobile || raw.citizenMobile || raw.citizen_mobile || raw.phone || raw.mobile || raw.reportedBy?.userMobile || "",
    userEmail: raw.userEmail || raw.email || raw.reportedBy?.userEmail,
    category,
    categoryName,
    title: raw.title || "नागरी समस्या",
    description: raw.description || "",
    location: raw.location || "कोपरगाव",
    googleMapsUrl: raw.googleMapsUrl || raw.google_maps_url,
    ward: raw.ward || "प्रभाग क्र. १२",
    date: raw.date || (raw.createdAt ? new Date(raw.createdAt).toLocaleDateString("mr-IN") : "आजच नोंदवली"),
    createdAt: raw.createdAt || raw.created_at,
    status,
    statusText,
    statusColor,
    statusBg,
    image: mainImage,
    images: processedImages.length > 0 ? processedImages : [defaultImg],
    department: raw.department || "स्थानिक प्रशासन व मनपा",
    assignedOfficer: raw.assignedOfficer || raw.assigned_officer,
    timeline,
    adminRemarks,
    isMyIssue: isUserOwner || Boolean(raw.isMyIssue),
    fcmToken: raw.fcmToken || raw.fcm_token,
    expoToken: raw.expoToken || raw.expo_token,
  };
}

class IssuesApiService {
  private localIssues: IssueItem[] = [...DEFAULT_ISSUES];
  private loadedPersisted = false;

  private async ensurePersistedLoaded() {
    if (this.loadedPersisted) return;
    this.loadedPersisted = true;
    const saved = await loadSavedUserIssues();
    if (saved && saved.length > 0) {
      const existingIds = new Set(this.localIssues.map((i) => String(i.id)));
      const newItems = saved.filter((i) => !existingIds.has(String(i.id)));
      this.localIssues = [...newItems, ...this.localIssues];
    }
  }

  /**
   * Fetch all public issues for constituency
   * Endpoint: GET /api/v1/issues?candidateId=sachin-malik
   */
  async getPublicIssues(): Promise<{ success: boolean; data: IssueItem[] }> {
    await this.ensurePersistedLoaded();
    try {
      const url = `${API_BASE_URL}/api/v1/issues?candidateId=${CANDIDATE_ID}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const json = await res.json();
        const serverList = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
            ? json.data
            : Array.isArray(json.issues)
              ? json.issues
              : null;

        if (serverList) {
          const serverIssues = serverList.map((item: any) => normalizeIssue(item));
          const serverIds = new Set(serverIssues.map((i: IssueItem) => String(i.id)));
          const userLocalIssues = this.localIssues.filter(
            (i) => i.isMyIssue && !serverIds.has(String(i.id))
          );
          return { success: true, data: [...userLocalIssues, ...serverIssues] };
        }
      }
    } catch (err) {
      console.warn("[IssuesApi] Error fetching public issues from server:", err);
    }
    return { success: true, data: this.localIssues };
  }

  /**
   * Fetch specific citizen's issues
   * Endpoint: GET /api/v1/issues/my?userId=...&mobile=...&candidateId=sachin-malik
   */
  async getMyIssues(userId?: string, mobile?: string): Promise<{ success: boolean; data: IssueItem[] }> {
    await this.ensurePersistedLoaded();
    const cleanPhone = mobile ? mobile.replace(/\D/g, "").slice(-10) : "";

    try {
      const q = new URLSearchParams();
      q.append("candidateId", CANDIDATE_ID);
      if (userId) q.append("userId", userId);
      if (cleanPhone) q.append("mobile", cleanPhone);

      const url = `${API_BASE_URL}/api/v1/issues/my?${q.toString()}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
            ? json.data
            : Array.isArray(json.issues)
              ? json.issues
              : null;

        if (list && list.length > 0) {
          const mapped = list.map((item: any) => normalizeIssue(item, true));
          return { success: true, data: mapped };
        }
      }
    } catch (err) {
      console.warn("[IssuesApi] Could not fetch my issues from /api/v1/issues/my:", err);
    }

    // Fallback filter from public issues and local cache
    const my = this.localIssues.filter((i) => {
      if (userId && i.userId && i.userId === userId) return true;
      if (cleanPhone && i.userMobile && i.userMobile.replace(/\D/g, "").slice(-10) === cleanPhone) return true;
      return false;
    });

    return { success: true, data: my };
  }

  /**
   * Fetch single issue details by ID or Tracking ID
   * Endpoint: GET /api/v1/issues/:id
   */
  async getIssueById(id: string): Promise<{ success: boolean; data: IssueItem | null }> {
    try {
      const url = `${API_BASE_URL}/api/v1/issues/${encodeURIComponent(id)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const json = await res.json();
        const item = json.data || json.issue || json;
        if (item && (item.id || item._id || item.trackingId || item.tracking_id)) {
          return { success: true, data: normalizeIssue(item) };
        }
      }
    } catch {
      // fallback to memory
    }

    const found = this.localIssues.find((i) => i.id === id || i.trackingId === id) || null;
    return { success: true, data: found };
  }

  /**
   * Create an issue on the live backend server in 'pending' status.
   * Converts photos to Base64 data URLs for seamless web admin & database storage.
   * Attaches citizen's FCM push token so admin updates trigger notifications.
   * Endpoint: POST /api/v1/issues
   */
  async createIssue(payload: CreateIssueInput): Promise<{ success: boolean; data: IssueItem }> {
    const trackingCode = `ISS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const catLabel = CATEGORY_LABELS[payload.category] || "रस्ते";

    // 1. Convert photo assets/uris to usable Base64 data URLs
    const finalImages: string[] = [];
    if (payload.images && Array.isArray(payload.images)) {
      for (const img of payload.images) {
        if (typeof img === "string") {
          const encoded = await convertUriToBase64(img);
          if (encoded) finalImages.push(encoded);
        } else if (img && typeof img === "object" && img.uri) {
          const encoded = await convertUriToBase64(img.uri);
          if (encoded) finalImages.push(encoded);
        }
      }
    }

    const cleanMobile = (payload.userMobile || "").replace(/\D/g, "").slice(-10);
    const citizenName = payload.userName?.trim() || "नागरिक";

    const serverPayload = {
      candidateId: CANDIDATE_ID,
      candidate_id: CANDIDATE_ID,
      title: payload.title.trim(),
      description: payload.description.trim(),
      category: payload.category,
      categoryName: catLabel,
      category_name: catLabel,
      categoryLabel: catLabel,
      category_label: catLabel,
      location: payload.location.trim(),
      ward: payload.ward?.trim() || "कोपरगाव",
      googleMapsUrl: payload.googleMapsUrl?.trim() || "",
      google_maps_url: payload.googleMapsUrl?.trim() || "",
      userName: citizenName,
      user_name: citizenName,
      citizenName: citizenName,
      citizen_name: citizenName,
      name: citizenName,
      userMobile: cleanMobile,
      user_mobile: cleanMobile,
      citizenMobile: cleanMobile,
      citizen_mobile: cleanMobile,
      phone: cleanMobile,
      mobile: cleanMobile,
      userEmail: payload.userEmail || "",
      email: payload.userEmail || "",
      userId: payload.userId,
      user_id: payload.userId,
      trackingId: trackingCode,
      tracking_id: trackingCode,
      status: "pending",
      images: finalImages,
      image: finalImages[0] || "",
      fcmToken: payload.fcmToken || "",
      fcm_token: payload.fcmToken || "",
      expoToken: payload.expoToken || "",
      expo_token: payload.expoToken || "",
      deviceToken: payload.fcmToken || payload.expoToken || "",
      reportedBy: {
        userId: payload.userId,
        userName: citizenName,
        userMobile: cleanMobile,
        userEmail: payload.userEmail,
        fcmToken: payload.fcmToken,
        expoToken: payload.expoToken,
      },
    };

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/v1/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(serverPayload),
      });
    } catch (err: any) {
      console.warn("[IssuesApi] Network failure creating issue:", err?.message);
      throw new Error("सर्व्हरशी संपर्क होऊ शकला नाही. कृपया आपले इंटरनेट कनेक्शन तपासा.");
    }

    if (!response.ok) {
      let serverErrorMsg = `सर्व्हर त्रुटी (HTTP ${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson && (errJson.message || errJson.error)) {
          serverErrorMsg = errJson.message || errJson.error;
        }
      } catch {
        const text = await response.text().catch(() => "");
        if (text) serverErrorMsg = text;
      }
      console.warn(`[IssuesApi] POST /api/v1/issues returned ${response.status}:`, serverErrorMsg);
      throw new Error(serverErrorMsg);
    }

    const json = await response.json().catch(() => null);
    const returnedData = json?.data || json?.issue || json || {};

    const createdIssue: IssueItem = normalizeIssue(
      {
        ...serverPayload,
        ...returnedData,
        id: returnedData.id || returnedData._id || `iss-${Date.now()}`,
        trackingId: returnedData.trackingId || returnedData.tracking_id || trackingCode,
        status: "pending",
      },
      true
    );

    this.localIssues.unshift(createdIssue);
    await saveUserIssues(this.localIssues);

    return { success: true, data: createdIssue };
  }

  /**
   * Update Issue Status (e.g. from Admin Panel or testing)
   * Endpoint: PUT /api/v1/issues/:id/status
   */
  async updateIssueStatus(
    id: string,
    status: IssueStatus,
    remark?: string,
    department?: string,
    officer?: AssignedOfficer
  ): Promise<{ success: boolean; data: IssueItem | null }> {
    const itemIndex = this.localIssues.findIndex((i) => i.id === id || i.trackingId === id);
    let current = itemIndex >= 0 ? this.localIssues[itemIndex] : null;

    if (!current) {
      const fetched = await this.getIssueById(id);
      if (fetched.data) {
        current = fetched.data;
      }
    }

    if (!current) {
      return { success: false, data: null };
    }

    const { statusText, statusColor, statusBg } = getStatusDetails(status);

    const updatedTimeline = current.timeline.map((evt) => {
      if (status === "pending") {
        return { ...evt, completed: evt.stage === 1 };
      } else if (status === "forwarded") {
        return { ...evt, completed: evt.stage <= 2 };
      } else if (status === "in_progress") {
        return { ...evt, completed: evt.stage <= 3 };
      } else if (status === "resolved") {
        return { ...evt, completed: true };
      }
      return evt;
    });

    const remarksList = remark ? [remark, ...(current.adminRemarks || [])] : current.adminRemarks;

    const updatedItem: IssueItem = {
      ...current,
      status,
      statusText,
      statusColor,
      statusBg,
      department: department || current.department,
      assignedOfficer: officer || current.assignedOfficer,
      timeline: updatedTimeline,
      adminRemarks: remarksList,
    };

    if (itemIndex >= 0) {
      this.localIssues[itemIndex] = updatedItem;
      await saveUserIssues(this.localIssues);
    }

    try {
      await fetch(`${API_BASE_URL}/api/v1/issues/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          remark,
          department,
          officer,
          candidateId: CANDIDATE_ID,
        }),
      });
    } catch {
      // offline fallback
    }

    return { success: true, data: updatedItem };
  }
}

export const issuesApi = new IssuesApiService();
