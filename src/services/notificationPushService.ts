import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { isRunningInExpoGo } from "expo";
import type * as NotificationsType from "expo-notifications";

const isWeb = Platform.OS === "web";
const isExpoGo = !isWeb && isRunningInExpoGo();
const isNativePushSupported = !isWeb && !isExpoGo;

let Notifications: typeof NotificationsType | null = null;

if (isNativePushSupported) {
  try {
    Notifications = require("expo-notifications");
    // Configure foreground notification behavior
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    console.warn("expo-notifications could not be loaded:", e);
  }
}

/**
 * Configure high-priority notification channels on Android with sound,
 * vibration, and lights so the device rings on incoming notifications.
 */
export async function setupNotificationChannels(): Promise<void> {
  if (!isNativePushSupported || !Notifications) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "सर्व सूचना (General Notifications)",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#EA580C",
      enableVibrate: true,
      showBadge: true,
    });
  }
}

let cachedFcmToken: string | null = null;
let cachedExpoToken: string | null = null;
let pendingNotificationRoute: {
  pathname: string;
  params: Record<string, any>;
} | null = null;

export function setPendingNotificationRoute(
  route: { pathname: string; params: Record<string, any> } | null
) {
  pendingNotificationRoute = route;
}

export function getPendingNotificationRoute() {
  return pendingNotificationRoute;
}

export function clearPendingNotificationRoute() {
  pendingNotificationRoute = null;
}

export function getCachedPushTokens() {
  return {
    fcmToken: cachedFcmToken,
    expoToken: cachedExpoToken,
  };
}

/**
 * Sets up foreground and click listeners for notifications.
 * Safe to call in both Expo Go and development builds.
 */
export function setupNotificationListeners(router: any): () => void {
  if (!isNativePushSupported || !Notifications) {
    return () => {};
  }

  // Listen for incoming notifications while app is in foreground
  const receivedSubscription =
    Notifications.addNotificationReceivedListener((notification) => {
      console.log("🔔 [Foreground Notification Received]:", {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
      });
    });

  const handleNotificationClick = (
    response: NotificationsType.NotificationResponse
  ) => {
    const data = response.notification.request.content.data || {};
    const content = response.notification.request.content;

    const title = data.title || content.title || "नवीन सूचना";
    const message = data.message || data.body || content.body || "";
    const mediaUrl = data.mediaUrl || "";
    const mediaType = data.mediaType || "none";
    const category = data.category || "other";
    const targetRoute = data.targetRoute;

    console.log("👉 [Notification Panel Clicked]:", {
      title,
      message,
      mediaUrl,
      mediaType,
      targetRoute,
      data,
    });

    const isIssueNotif =
      targetRoute === "/issue-detail" ||
      category === "issues" ||
      Boolean(data.issueId) ||
      Boolean(data.trackingId);

    const resolvedPath: string = isIssueNotif
      ? "/issue-detail"
      : typeof targetRoute === "string" &&
        targetRoute !== "/notifications" &&
        targetRoute !== "/notification-detail"
        ? targetRoute
        : "/notification-detail";

    const nextRoute = {
      pathname: resolvedPath,
      params: {
        id: String(data.issueId || data.id || data.trackingId || data.notificationId || "push-item"),
        title: String(title),
        message: String(message),
        mediaUrl: String(mediaUrl),
        mediaType: String(mediaType),
        category: String(category),
        time: "आत्ताच (Just now)",
      },
    };

    setPendingNotificationRoute(nextRoute);

    setTimeout(() => {
      try {
        router.push(nextRoute as any);
      } catch {
        // splash screen will pick it up
      }
    }, 250);
  };

  // 1. Listen for background & foreground notification clicks
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener(
      handleNotificationClick
    );

  // 2. Check if the app was launched from a notification click (cold start)
  try {
    Notifications.getLastNotificationResponseAsync?.()
      ?.then((response) => {
        if (response) {
          handleNotificationClick(response);
        }
      })
      ?.catch((err) => {
        console.log("Could not check last notification response:", err);
      });
  } catch (err) {
    console.log("getLastNotificationResponseAsync unavailable:", err);
  }

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Request notification permissions, configure channels,
 * fetch FCM registration token, and subscribe to broadcast topics.
 */
export async function registerForPushNotificationsAsync(user?: {
  id?: string;
  mobile?: string;
  name?: string;
}): Promise<{
  fcmToken: string | null;
  expoToken: string | null;
}> {
  try {
    if (isWeb) {
      return { fcmToken: null, expoToken: null };
    }

    if (isExpoGo || !Notifications) {
      console.log(
        "ℹ️ [Push Notifications]: Running inside Expo Go. Remote push notifications are disabled in Expo Go on Android (SDK 53+). Run a development build (npx expo run:android) to test push notifications."
      );
      return { fcmToken: null, expoToken: null };
    }

    await setupNotificationChannels();

    if (!Device.isDevice) {
      console.log("Must use physical device for push notifications");
      return { fcmToken: null, expoToken: null };
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Notification permission was not granted by user.");
      return { fcmToken: null, expoToken: null };
    }

    // 1. Fetch native Firebase FCM Device Token (for direct Firebase Admin SDK dispatch)
    try {
      const deviceTokenResp = await Notifications.getDevicePushTokenAsync();
      cachedFcmToken = deviceTokenResp.data;
      console.log("🔥 [Firebase FCM Token]:", cachedFcmToken);
    } catch (err) {
      console.warn("Could not retrieve native FCM device push token:", err);
    }

    // 2. Fetch Expo Push Token (for Expo Push service dispatch)
    try {
      const projectId =
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;

      const expoTokenResp = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      cachedExpoToken = expoTokenResp.data;
      console.log("📱 [Expo Push Token]:", cachedExpoToken);
    } catch {
      // Optional if not using EAS
    }

    // Unsubscribe from previously subscribed topic to clear stale subscription:
    if (Platform.OS === "android") {
      try {
        await Notifications.unsubscribeFromTopicAsync("all");
        console.log("🔕 Unsubscribed from FCM topic: 'all' (preventing duplicates)");
      } catch {
        // topic may not have been subscribed — safe to ignore
      }
    }

    // 4. Sync device token to backend database with user profile mapping
    const tokenToRegister = cachedFcmToken || cachedExpoToken;
    if (tokenToRegister) {
      try {
        const { API_BASE_URL } = await import("./authApi");
        const cleanPhone = user?.mobile ? user.mobile.replace(/\D/g, "").slice(-10) : undefined;
        fetch(`${API_BASE_URL}/api/v1/notifications/register-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenToRegister,
            fcmToken: cachedFcmToken || undefined,
            fcm_token: cachedFcmToken || undefined,
            expoToken: cachedExpoToken || undefined,
            expo_token: cachedExpoToken || undefined,
            platform: Platform.OS,
            userId: user?.id,
            user_id: user?.id,
            mobile: cleanPhone,
            phone: cleanPhone,
            name: user?.name,
            candidateId: process.env.EXPO_PUBLIC_CANDIDATE_ID || "sachin-malik",
            candidate_id: process.env.EXPO_PUBLIC_CANDIDATE_ID || "sachin-malik",
          }),
        }).then(() => {
          console.log("📡 [Backend Sync]: Device push token registered with user profile on server.");
        }).catch((err) => {
          console.log("Token sync network error:", err);
        });
      } catch {
        // silent fallback
      }
    }
  } catch (error) {
    console.error("Error during push notification setup:", error);
  }

  return {
    fcmToken: cachedFcmToken,
    expoToken: cachedExpoToken,
  };
}

/**
 * Manually trigger an immediate system notification that rings the device,
 * vibrates, and shows in the Android status bar / lock screen.
 */
export async function triggerLocalNotification(
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<string> {
  if (!isNativePushSupported || !Notifications) {
    return "";
  }

  await setupNotificationChannels();

  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      vibrate: [0, 250, 250, 250],
      data,
    },
    trigger: null, // immediate
  });
}
