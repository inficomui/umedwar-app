import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePathname, useRouter, useLocalSearchParams } from "expo-router";
import { Icon } from "react-native-paper";
import { resolveNotificationRoute } from "../services/notificationPushService";

/**
 * Global 404 / Unmatched Route Handler for Expo Router.
 * Automatically intercepts notification clicks or deep links (e.g. /news/4, /notification, /issues/12)
 * and safely redirects users to the correct screen without ever showing a broken 404 error.
 */
export default function NotFoundScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useLocalSearchParams();
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    try {
      const resolved = resolveNotificationRoute(pathname, searchParams);

      // If the route was resolved to a different valid screen, redirect immediately
      if (
        resolved &&
        resolved.pathname &&
        resolved.pathname !== pathname &&
        resolved.pathname !== "/+not-found"
      ) {
        if (resolved.params && Object.keys(resolved.params).length > 0) {
          router.replace({
            pathname: resolved.pathname,
            params: resolved.params,
          } as any);
        } else {
          router.replace(resolved.pathname as any);
        }
        return;
      }

      // If notification-related path was requested, redirect to /notifications
      if (pathname && pathname.toLowerCase().includes("notif")) {
        router.replace("/notifications");
        return;
      }
    } catch {
      // Fallback
    }

    setRedirecting(false);
  }, [pathname, searchParams, router]);

  if (redirecting) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#EA580C" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>पेज उघडत आहे...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#EA580C" />
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Icon source="bell-alert-outline" size={48} color="#EA580C" />
        </View>

        <Text style={styles.title}>सूचना किंवा पेज सापडले नाही</Text>
        <Text style={styles.subtitle}>
          आपण क्लिक केलेली लिंक किंवा सूचना नवीन पानावर हलवली असावी. कृपया खालील पर्यायांपैकी एक निवडा.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.88}
          onPress={() => router.replace("/notifications")}
        >
          <Icon source="bell-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>सर्व सूचना पहा</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => router.replace("/home")}
        >
          <Icon source="home-outline" size={18} color="#EA580C" />
          <Text style={styles.secondaryButtonText}>मुख्य पानावर जा</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 8,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#FFEDD5",
  },
  title: {
    fontSize: 19,
    fontWeight: "900",
    color: "#1C1917",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: "100%",
    gap: 8,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "900",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: "100%",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
  },
  secondaryButtonText: {
    color: "#EA580C",
    fontSize: 14,
    fontWeight: "800",
  },
});
