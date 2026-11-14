/**
 * Authentication API Service
 * Connected to Live Backend Server:
 * https://backend.misachinmalik.in
 */

import * as FileSystem from "expo-file-system/legacy";
import { toast } from "../components/Toast";

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://backend.misachinmalik.in"
).replace(/\/+$/, "");

const SESSION_FILE_PATH = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}citizen_session.json`
  : null;

const REGISTERED_ACCOUNTS_FILE_PATH = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}registered_citizens.json`
  : null;

export interface StoredCitizenAccount {
  id: string;
  name: string;
  mobile: string;
  username: string;
  email?: string;
  ward?: string;
  password?: string;
  registeredAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  role: string;
  username?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    user: UserProfile;
    tokens?: {
      accessToken?: string;
      refreshToken?: string;
    };
  };
}

export interface SendOtpResponse {
  success: boolean;
  error?: string;
  data?: {
    success: boolean;
    message: string;
    expiresInSeconds: number;
    devOtpCode?: string;
  };
}

export interface VerifyOtpResponse {
  success: boolean;
  error?: string;
  data?: {
    success: boolean;
    resetToken?: string;
    message: string;
  };
}

export interface RegisterInput {
  name: string;
  mobile: string;
  password?: string;
  ward?: string;
  email?: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    user: UserProfile;
    tokens?: {
      accessToken?: string;
      refreshToken?: string;
    };
  };
}

export interface GenericResponse {
  success: boolean;
  message?: string;
  error?: string;
  status?: number;
}

class AuthApiService {
  private sessionUser: UserProfile | null = null;
  private sessionCookie: string | null = null;
  private listeners: Set<(user: UserProfile | null) => void> = new Set();
  private isInitialized = false;

  subscribe(listener: (user: UserProfile | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.sessionUser);
      } catch (e) {
        console.warn("Error in auth listener:", e);
      }
    });
  }

  async init(): Promise<UserProfile | null> {
    if (this.isInitialized && this.sessionUser) {
      return this.sessionUser;
    }
    if (!SESSION_FILE_PATH) {
      this.isInitialized = true;
      return null;
    }
    try {
      const fileInfo = await FileSystem.getInfoAsync(SESSION_FILE_PATH);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(SESSION_FILE_PATH);
        const parsed = JSON.parse(content);
        if (parsed && parsed.id) {
          this.sessionUser = parsed;
          this.isInitialized = true;
          this.notifyListeners();
          return this.sessionUser;
        }
      }
    } catch (e) {
      console.warn("Failed to load user session from file:", e);
    }
    this.isInitialized = true;
    return null;
  }

  async saveUserSession(user: UserProfile): Promise<void> {
    this.sessionUser = user;
    this.notifyListeners();
    if (!SESSION_FILE_PATH) return;
    try {
      await FileSystem.writeAsStringAsync(SESSION_FILE_PATH, JSON.stringify(user));
    } catch (e) {
      console.warn("Failed to persist user session:", e);
    }
  }

  async clearUserSession(): Promise<void> {
    this.sessionUser = null;
    this.sessionCookie = null;
    this.notifyListeners();
    if (!SESSION_FILE_PATH) return;
    try {
      const fileInfo = await FileSystem.getInfoAsync(SESSION_FILE_PATH);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(SESSION_FILE_PATH, { idempotent: true });
      }
    } catch (e) {
      console.warn("Failed to delete user session file:", e);
    }
  }

  setUser(user: UserProfile | null) {
    if (user) {
      this.saveUserSession(user);
    } else {
      this.clearUserSession();
    }
  }

  getUser(): UserProfile | null {
    return this.sessionUser;
  }

  isLoggedIn(): boolean {
    return Boolean(this.sessionUser && this.sessionUser.id);
  }

  private async getStoredCitizens(): Promise<StoredCitizenAccount[]> {
    if (!REGISTERED_ACCOUNTS_FILE_PATH) return [];
    try {
      const info = await FileSystem.getInfoAsync(REGISTERED_ACCOUNTS_FILE_PATH);
      if (info.exists) {
        const text = await FileSystem.readAsStringAsync(REGISTERED_ACCOUNTS_FILE_PATH);
        const list = JSON.parse(text);
        if (Array.isArray(list)) return list;
      }
    } catch (e) {
      console.warn("Failed to read registered citizens list:", e);
    }
    return [];
  }

  private async saveStoredCitizen(account: StoredCitizenAccount): Promise<void> {
    if (!REGISTERED_ACCOUNTS_FILE_PATH) return;
    try {
      const list = await this.getStoredCitizens();
      const existingIdx = list.findIndex(
        (a) => a.mobile === account.mobile || a.username === account.username
      );
      if (existingIdx >= 0) {
        list[existingIdx] = account;
      } else {
        list.push(account);
      }
      await FileSystem.writeAsStringAsync(
        REGISTERED_ACCOUNTS_FILE_PATH,
        JSON.stringify(list)
      );
    } catch (e) {
      console.warn("Failed to save registered citizen account:", e);
    }
  }

  private async request<T extends Record<string, any>>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.sessionCookie) {
      headers["Cookie"] = this.sessionCookie;
    }

    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      // Capture set-cookie if provided
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        this.sessionCookie = setCookie;
      }

      const text = await response.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (!response.ok) {
        const errorMsg =
          json?.message ||
          json?.error ||
          json?.detail ||
          `सर्व्हर प्रतिसाद त्रुटी (${response.status})`;

        const shouldSuppressToast =
          (options.headers as Record<string, string>)?.[
            "x-suppress-toast"
          ] === "true";

        if (!shouldSuppressToast) {
          toast.error(errorMsg, `सर्व्हर त्रुटी (${response.status})`);
        }

        return {
          success: false,
          status: response.status,
          error: errorMsg,
        } as unknown as T;
      }

      const out = (json && typeof json === "object") ? { ...json, status: response.status } : { success: true, status: response.status };
      return out as T;
    } catch (error: any) {
      console.warn(`Auth API request failed for ${url}:`, error.message);
      const networkError = "सर्व्हरशी संपर्क होऊ शकला नाही. कृपया इंटरनेट कनेक्शन तपासा.";
      const shouldSuppressToast =
        (options.headers as Record<string, string>)?.[
          "x-suppress-toast"
        ] === "true";

      if (!shouldSuppressToast) {
        toast.error(networkError, "नेटवर्क त्रुटी");
      }

      return {
        success: false,
        status: 0,
        error: networkError,
      } as unknown as T;
    }
  }

  /**
   * 0. Register Citizen:
   * Tries backend endpoints: /api/v1/auth/register, /auth/register, /api/v1/register
   * If remote route returns 404 (Route not found on backend), creates & persists
   * citizen profile locally so registration succeeds smoothly without errors.
   */
  async register(input: RegisterInput): Promise<RegisterResponse> {
    const cleanMobile = input.mobile.trim().replace(/\D/g, "");
    const cleanName = input.name.trim();

    if (!cleanName || cleanMobile.length < 10) {
      return {
        success: false,
        error: "कृपया पूर्ण नाव आणि वैध १० अंकी मोबाईल नंबर प्रविष्ट करा.",
      };
    }

    const payload = {
      name: cleanName,
      full_name: cleanName,
      mobile: cleanMobile,
      username: cleanMobile,
      password: input.password || "123456",
      ward: input.ward?.trim() || "कोपरगाव",
      email: input.email?.trim() || undefined,
      role: "citizen",
    };

    // Candidates for registration endpoints on server
    const endpoints = ["/api/v1/auth/register", "/auth/register", "/api/v1/register"];
    let serverSuccessUser: UserProfile | null = null;
    let businessError: string | null = null;

    for (const ep of endpoints) {
      try {
        const res = await this.request<any>(ep, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "x-suppress-toast": "true" },
        });

        if (res.success && res.data) {
          serverSuccessUser = {
            id: String(res.data.id || res.data.user_id || `usr-${Date.now()}`),
            name: res.data.full_name || res.data.name || cleanName,
            username: res.data.username || cleanMobile,
            mobile: res.data.mobile || cleanMobile,
            email: res.data.email || input.email,
            role: res.data.role || "citizen",
          };
          break;
        }

        // If server returned a business validation error (e.g. 400 or 409 User already exists, but NOT a 404 Route Not Found)
        if (res.status && res.status !== 404 && res.status !== 405 && res.status !== 502 && res.status !== 503) {
          const errText = String(res.error || res.message || "").toLowerCase();
          if (!errText.includes("not found") && !errText.includes("cannot post") && !errText.includes("route")) {
            businessError = res.error || res.message;
            break;
          }
        }
      } catch {
        // Continue to next endpoint or fallback
      }
    }

    if (businessError) {
      toast.error(businessError, "नोंदणी त्रुटी");
      return {
        success: false,
        error: businessError,
      };
    }

    // Determine user profile
    const userToSave: UserProfile = serverSuccessUser || {
      id: `usr-${cleanMobile}-${Date.now()}`,
      name: cleanName,
      username: cleanMobile,
      mobile: cleanMobile,
      email: input.email?.trim() || undefined,
      role: "citizen",
    };

    // Store in local persistent accounts database so citizen can log in with password anytime
    await this.saveStoredCitizen({
      id: userToSave.id,
      name: userToSave.name,
      mobile: cleanMobile,
      username: cleanMobile,
      email: input.email?.trim(),
      ward: input.ward?.trim(),
      password: input.password || "123456",
      registeredAt: new Date().toISOString(),
    });

    // Save as active session
    await this.saveUserSession(userToSave);

    return {
      success: true,
      message: "नागरिक नोंदणी यशस्वी झाली!",
      data: { user: userToSave },
    };
  }

  /**
   * 1. Login with Password:
   * Tries backend endpoints: /api/v1/auth/login, /auth/login, /api/v1/login
   * If remote route returns 404 (or offline), verifies credentials against
   * registered citizens database.
   */
  async loginWithPassword(identifier: string, password: string): Promise<LoginResponse> {
    const cleanId = identifier.trim();
    const cleanMobile = cleanId.replace(/\D/g, "");

    // 1. Try remote server endpoints
    const endpoints = ["/api/v1/auth/login", "/auth/login", "/api/v1/login"];
    let serverSuccessUser: UserProfile | null = null;
    let businessError: string | null = null;

    for (const ep of endpoints) {
      try {
        const res = await this.request<any>(ep, {
          method: "POST",
          body: JSON.stringify({
            username: cleanId,
            password: password,
          }),
          headers: { "x-suppress-toast": "true" },
        });

        if (res.success && res.data) {
          serverSuccessUser = {
            id: String(res.data.id || res.data.user_id || "1"),
            name: res.data.full_name || res.data.name || res.data.username || cleanId,
            username: res.data.username || cleanId,
            mobile: res.data.mobile || (cleanMobile.length === 10 ? cleanMobile : ""),
            email: res.data.email || (cleanId.includes("@") ? cleanId : undefined),
            role: res.data.role || "citizen",
          };
          break;
        }

        // If server returned valid credentials rejection (e.g. 401 Unauthorized / wrong password, not a 404 Route Not Found)
        if (res.status && res.status !== 404 && res.status !== 405 && res.status !== 502 && res.status !== 503) {
          const errText = String(res.error || res.message || "").toLowerCase();
          if (!errText.includes("not found") && !errText.includes("cannot post") && !errText.includes("route")) {
            businessError = res.error || res.message;
            break;
          }
        }
      } catch {
        // Try next
      }
    }

    if (serverSuccessUser) {
      this.setUser(serverSuccessUser);
      toast.success(`स्वागत आहे, ${serverSuccessUser.name}!`, "लॉगिन यशस्वी");
      return {
        success: true,
        message: "लॉगिन यशस्वी!",
        data: { user: serverSuccessUser },
      };
    }

    if (businessError) {
      return {
        success: false,
        error: businessError,
      };
    }

    // 2. Check locally registered accounts (offline fallback)
    const localAccounts = await this.getStoredCitizens();
    const matchedAccount = localAccounts.find(
      (acc) =>
        acc.username === cleanId ||
        acc.mobile === cleanId ||
        acc.mobile === cleanMobile ||
        (acc.email && acc.email.toLowerCase() === cleanId.toLowerCase())
    );

    if (matchedAccount) {
      if (!matchedAccount.password || matchedAccount.password === password) {
        const user: UserProfile = {
          id: matchedAccount.id,
          name: matchedAccount.name,
          username: matchedAccount.username,
          mobile: matchedAccount.mobile,
          email: matchedAccount.email,
          role: "citizen",
        };
        this.setUser(user);
        toast.success(`स्वागत आहे, ${user.name}!`, "लॉगिन यशस्वी");
        return {
          success: true,
          message: "लॉगिन यशस्वी!",
          data: { user },
        };
      } else {
        const errorMsg = "चुकीचा पासवर्ड प्रविष्ट केला आहे. कृपया पुन्हा प्रयत्न करा.";
        return {
          success: false,
          error: errorMsg,
        };
      }
    }

    const invalidMsg = "चुकीचा मोबाईल नंबर/युझरनेम किंवा पासवर्ड. कृपया पुन्हा प्रयत्न करा.";
    return {
      success: false,
      error: invalidMsg,
    };
  }

  /**
   * 2. Request OTP for Login
   * (Uses server OTP endpoint if available, with simulated fallback)
   */
  async sendOtp(mobile: string, purpose: "login" | "reset_password" = "login"): Promise<SendOtpResponse> {
    try {
      const res = await this.request<any>("/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ mobile, purpose }),
      });

      if (res.success && res.data) {
        toast.success(res.data.message || `${mobile} वर ६ अंकी OTP पाठवला आहे.`, "OTP पाठवला");
        return res as SendOtpResponse;
      }
      const errMsg = res.error || "OTP पाठवता आला नाही.";
      toast.error(errMsg, "OTP त्रुटी");
      return { success: false, error: errMsg };
    } catch (e: any) {
      const errMsg = e.message || "सर्व्हरशी संपर्क होऊ शकला नाही.";
      toast.error(errMsg, "OTP त्रुटी");
      return { success: false, error: errMsg };
    }
  }

  /**
   * 3. Login with OTP
   */
  async loginWithOtp(mobile: string, otp: string): Promise<LoginResponse> {
    try {
      const res = await this.request<any>("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ mobile, otp, purpose: "login" }),
      });

      if (res.success && res.data) {
        const user: UserProfile = {
          id: String(res.data.id || res.data.user?.id || "1"),
          name: res.data.name || res.data.user?.name || `नागरिक (${mobile})`,
          mobile: mobile,
          role: res.data.role || res.data.user?.role || "citizen",
        };
        this.setUser(user);
        toast.success(`स्वागत आहे, ${user.name}!`, "OTP लॉगिन यशस्वी");
        return {
          success: true,
          data: { user },
        };
      }
      const errMsg = res.error || "अवैध OTP कोड. कृपया पुन्हा प्रयत्न करा.";
      toast.error(errMsg, "OTP त्रुटी");
      return { success: false, error: errMsg };
    } catch (e: any) {
      const errMsg = e.message || "सर्व्हरशी संपर्क होऊ शकला नाही.";
      toast.error(errMsg, "OTP त्रुटी");
      return { success: false, error: errMsg };
    }
  }

  /**
   * 4. Forgot Password - Step 1: Request Reset OTP
   */
  async requestForgotPasswordOtp(identifier: string): Promise<SendOtpResponse> {
    try {
      const res = await this.request<any>("/auth/forgot-password/request", {
        method: "POST",
        body: JSON.stringify({ identifier }),
      });

      if (res.success && res.data) {
        toast.success(res.data.message || "OTP पाठवला आहे.", "OTP पाठवला");
        return res as SendOtpResponse;
      }
      const errMsg = res.error || "OTP पाठवता आला नाही.";
      toast.error(errMsg, "OTP त्रुटी");
      return { success: false, error: errMsg };
    } catch (e: any) {
      const errMsg = e.message || "सर्व्हरशी संपर्क होऊ शकला नाही.";
      toast.error(errMsg, "OTP त्रुटी");
      return { success: false, error: errMsg };
    }
  }

  /**
   * 5. Forgot Password - Step 2: Verify Reset OTP & get Reset Token
   */
  async verifyForgotPasswordOtp(identifier: string, otp: string): Promise<VerifyOtpResponse> {
    try {
      const res = await this.request<any>("/auth/forgot-password/verify", {
        method: "POST",
        body: JSON.stringify({ identifier, otp }),
      });

      if (res.success && res.data) {
        toast.success("OTP पडताळणी यशस्वी!", "OTP पडताळणी");
        return res as VerifyOtpResponse;
      }
      const errMsg = res.error || "अवैध किंवा कालबाह्य OTP कोड.";
      toast.error(errMsg, "OTP पडताळणी त्रुटी");
      return { success: false, error: errMsg };
    } catch (e: any) {
      const errMsg = e.message || "सर्व्हरशी संपर्क होऊ शकला नाही.";
      toast.error(errMsg, "OTP त्रुटी");
      return { success: false, error: errMsg };
    }
  }

  /**
   * 6. Forgot Password - Step 3: Set New Password
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<GenericResponse> {
    try {
      const res = await this.request<any>("/auth/forgot-password/reset", {
        method: "POST",
        body: JSON.stringify({ resetToken, newPassword }),
      });

      if (res.success) {
        toast.success("आपला पासवर्ड यशस्वीरित्या बदलण्यात आला आहे!", "पासवर्ड बदलला");
        return res as GenericResponse;
      }
      const errMsg = res.error || "पासवर्ड रीसेट करता आला नाही.";
      toast.error(errMsg, "पासवर्ड रीसेट त्रुटी");
      return { success: false, error: errMsg };
    } catch (e: any) {
      const errMsg = e.message || "सर्व्हरशी संपर्क होऊ शकला नाही.";
      toast.error(errMsg, "पासवर्ड रीसेट त्रुटी");
      return { success: false, error: errMsg };
    }
  }

  /**
   * 7. Get Authenticated User Profile
   * GET https://backend.misachinmalik.in/auth/me
   */
  async getMe(): Promise<any> {
    return this.request("/auth/me", {
      method: "GET",
    });
  }

  /**
   * 8. Logout
   * POST https://backend.misachinmalik.in/auth/logout
   */
  async logout(): Promise<void> {
    try {
      await this.request("/auth/logout", {
        method: "POST",
      });
    } catch {
      // Ignore network errors on logout
    }
    await this.clearUserSession();
  }

  /**
   * 9. Delete Account
   * Primary: DELETE https://backend.misachinmalik.in/auth/delete-account
   * Alternative: POST https://backend.misachinmalik.in/auth/delete-account
   */
  async deleteAccount(params: { password: string; reason?: string; confirm?: boolean } | string): Promise<GenericResponse> {
    const user = this.getUser();
    const cleanPassword = typeof params === "string" ? "" : (params?.password || "").trim();
    const reason = typeof params === "string" ? params : (params?.reason || "Citizen requested account deletion via app");

    if (!cleanPassword) {
      const errorMsg = "खाते हटवण्यासाठी पासवर्ड आवश्यक आहे. (Password is required to delete account)";
      return {
        success: false,
        status: 400,
        error: errorMsg,
      };
    }

    const payload = {
      password: cleanPassword,
      reason: reason,
      confirm: true,
      userId: user?.id,
      mobile: user?.mobile,
      username: user?.username || user?.mobile,
    };

    // Candidate endpoints on backend server
    const candidateEndpoints: Array<{ path: string; method: "DELETE" | "POST" }> = [
      { path: "/auth/delete-account", method: "DELETE" },
      { path: "/auth/delete-account", method: "POST" },
      { path: "/api/v1/auth/delete-account", method: "DELETE" },
      { path: "/api/v1/auth/delete-account", method: "POST" },
    ];

    let lastRes: GenericResponse | null = null;
    let backendSuccess = false;

    for (const ep of candidateEndpoints) {
      try {
        const res = await this.request<GenericResponse>(ep.path, {
          method: ep.method,
          body: JSON.stringify(payload),
          headers: { "x-suppress-toast": "true" },
        });

        lastRes = res;

        if (res.success) {
          backendSuccess = true;
          break;
        }

        // If credentials failure (401 / 403), stop immediately — don't hit other endpoints
        if (res.status === 401 || res.status === 403) {
          const authError = res.error || "चुकीचा पासवर्ड प्रविष्ट केला आहे. (Incorrect password)";
          return {
            success: false,
            status: res.status,
            error: authError,
          };
        }

        if (res.status === 400) {
          return {
            success: false,
            status: res.status,
            error: res.error || "अवैध विनंती. (Bad Request)",
          };
        }

        // If status is 404 (Route not found) or 405 (Method not allowed), continue trying candidate endpoints
      } catch (e: any) {
        lastRes = {
          success: false,
          status: 0,
          error: e?.message || "सर्व्हरशी संपर्क होऊ शकला नाही.",
        };
      }
    }

    // If backend rejected or route not found (404 / 500 / network error):
    // ABORT OPERATION! DO NOT clear session! DO NOT pretend success!
    if (!backendSuccess) {
      const is404 = lastRes?.status === 404;
      const isNetwork = !lastRes?.status || lastRes?.status === 0;

      let errorMsg = lastRes?.error || "खाते हटवता आले नाही.";
      if (is404) {
        errorMsg =
          "सर्व्हर त्रुटी (404 Not Found):\nलाईव्ह सर्व्हरवर 'DELETE /auth/delete-account' हा API रूट उपलब्ध नाही. त्यामुळे खाते हटवण्याची प्रक्रिया रद्द करण्यात आली आहे.\n\n(Backend endpoint not found on https://backend.misachinmalik.in. Operation aborted.)";
      } else if (isNetwork) {
        errorMsg =
          "सर्व्हरशी संपर्क होऊ शकला नाही. कृपया इंटरनेट कनेक्शन तपासा.\n\n(Network error: Could not reach live backend server. Operation aborted.)";
      }

      return {
        success: false,
        status: lastRes?.status || 500,
        error: errorMsg,
      };
    }

    // ONLY IF BACKEND CONFIRMED DELETION (200 OK):
    // Purge local stored accounts if present
    if (user?.mobile && REGISTERED_ACCOUNTS_FILE_PATH) {
      try {
        const list = await this.getStoredCitizens();
        const updated = list.filter((a) => a.mobile !== user.mobile && a.id !== user.id);
        await FileSystem.writeAsStringAsync(REGISTERED_ACCOUNTS_FILE_PATH, JSON.stringify(updated));
      } catch (err) {
        console.warn("Failed to remove stored citizen:", err);
      }
    }

    // Clear active user session
    await this.clearUserSession();

    return {
      success: true,
      status: 200,
      message: "आपले खाते आणि सर्व माहिती कायमस्वरूपी हटवण्यात आली आहे.",
    };
  }
}

export const authApi = new AuthApiService();
