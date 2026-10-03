import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { CampaignProvider } from "../context/CampaignContext";
import { ToastProvider } from "../components/Toast";
import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from "../services/notificationPushService";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    registerForPushNotificationsAsync();
    const cleanup = setupNotificationListeners(router);

    return () => {
      cleanup();
    };
  }, [router]);
  return (
    <ToastProvider>
      <CampaignProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "default",
            contentStyle: { backgroundColor: "#F8F7F4" },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
              animation: "fade",
              contentStyle: { backgroundColor: "#EA580C" },
            }}
          />
          <Stack.Screen
            name="home"
            options={{ headerShown: false, animation: "none" }}
          />
          <Stack.Screen
            name="about"
            options={{ headerShown: false, animation: "none" }}
          />
          <Stack.Screen
            name="news"
            options={{ headerShown: false, animation: "none" }}
          />
          <Stack.Screen name="news-detail" options={{ headerShown: false }} />
          <Stack.Screen
            name="gallery"
            options={{ headerShown: false, animation: "none" }}
          />
          <Stack.Screen
            name="contact"
            options={{ headerShown: false, animation: "none" }}
          />
          <Stack.Screen name="issues" options={{ headerShown: false }} />
          <Stack.Screen name="issue-detail" options={{ headerShown: false }} />
          <Stack.Screen name="report-issue" options={{ headerShown: false }} />
          <Stack.Screen name="my-issues" options={{ headerShown: false }} />
          <Stack.Screen name="issue-map" options={{ headerShown: false }} />
          <Stack.Screen name="events" options={{ headerShown: false }} />
          <Stack.Screen name="event-detail" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="notification-detail" options={{ headerShown: false }} />
          <Stack.Screen name="videos" options={{ headerShown: false }} />
          <Stack.Screen name="documents" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="app-about" options={{ headerShown: false }} />
          <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        </Stack>
      </CampaignProvider>
    </ToastProvider>
  );
}
