import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";

import { NotificationMediaRenderer, NotificationItem } from "../components/NotificationMediaRenderer";
import { useCampaign } from "../context/CampaignContext";
import { triggerLocalNotification, getCachedPushTokens } from "../services/notificationPushService";

const NOTIFICATIONS_DATA: NotificationItem[] = [
  {
    id: "notif-1",
    category: "issues",
    icon: "check-circle",
    iconColor: "#16A34A",
    iconBg: "#DCFCE7",
    title: "आपली समस्या निकाली",
    description: "आपण नोंदवलेली “रस्त्याची दुरुस्ती” समस्या यशस्वीरीत्या पूर्ण झाली आहे.",
    timeAgo: "10 मिनिटांपूर्वी",
    indicatorDot: "#16A34A",
    targetRoute: "/notification-detail",
  },
  {
    id: "notif-2",
    category: "events",
    icon: "calendar",
    iconColor: "#EA580C",
    iconBg: "#FFEDD5",
    title: "जिल्हा जनसंवाद सभा",
    description: "25 सप्टेंबर 2026 रोजी औरंगाबाद येथे जिल्हा जनसंवाद सभा आयोजित केली आहे.",
    timeAgo: "1 तासापूर्वी",
    indicatorDot: "#DC2626",
    targetRoute: "/event-detail",
  },
  {
    id: "notif-3",
    category: "issues",
    icon: "road-variant",
    iconColor: "#2563EB",
    iconBg: "#DBEAFE",
    title: "समस्या अपडेट",
    description: "आपली “पाणीपुरवठा” समस्या आता प्रगतीपथावर आहे.",
    timeAgo: "3 तासांपूर्वी",
    indicatorDot: "#2563EB",
    targetRoute: "/issue-detail",
  },
  {
    id: "notif-4",
    category: "news",
    icon: "bullhorn",
    iconColor: "#9333EA",
    iconBg: "#F3E8FF",
    title: "महत्त्वाची घोषणा",
    description: "नवीन पाणी योजना लवकरच सुरू होणार आहे. अधिक माहितीसाठी येथे क्लिक करा.",
    timeAgo: "1 दिवसापूर्वी",
    targetRoute: "/notification-detail",
  },
  {
    id: "notif-5",
    category: "other",
    icon: "file-document",
    iconColor: "#DC2626",
    iconBg: "#FEE2E2",
    title: "नवीन दस्तऐवज उपलब्ध",
    description: "“स्वच्छ औरंगाबाद अभियान” संबंधित पीडीएफ दस्तऐवज आता उपलब्ध आहे.",
    timeAgo: "2 दिवसांपूर्वी",
    targetRoute: "/documents",
  },
  {
    id: "notif-6",
    category: "news",
    icon: "play-circle",
    iconColor: "#DC2626",
    iconBg: "#FEE2E2",
    title: "नवीन व्हिडिओ",
    description: "जनतेसाठी विकासकामांची माहिती - आमचा नवीन व्हिडिओ पहा.",
    timeAgo: "3 दिवसांपूर्वी",
    targetRoute: "/videos",
  },
  {
    id: "notif-7",
    category: "other",
    icon: "bell",
    iconColor: "#D97706",
    iconBg: "#FEF3C7",
    title: "प्रणाली देखभाल",
    description: "उद्या सकाळी 2 ते 4 या वेळेत ॲपची सेवा तात्पुरती बंद राहील.",
    timeAgo: "4 दिवसांपूर्वी",
  },
  {
    id: "notif-8",
    category: "events",
    icon: "leaf",
    iconColor: "#16A34A",
    iconBg: "#DCFCE7",
    title: "स्वच्छता अभियान",
    description: "2 ऑक्टोबर रोजी विशेष स्वच्छता अभियान राबविण्यात येणार आहे. सहभागी व्हा.",
    timeAgo: "5 दिवसांपूर्वी",
    targetRoute: "/events",
  },
];

const getNotificationIcon = (item: NotificationItem) => {
  if (item.icon && item.iconColor && item.iconBg) {
    return { icon: item.icon, iconColor: item.iconColor, iconBg: item.iconBg };
  }
  const mediaType = (item.mediaType || item.media_type || "").toLowerCase();
  if (mediaType === "pdf") {
    return { icon: "file-pdf-box", iconColor: "#DC2626", iconBg: "#FEE2E2" };
  }
  if (mediaType === "video") {
    return { icon: "play-circle", iconColor: "#EA580C", iconBg: "#FFEDD5" };
  }
  if (mediaType === "audio") {
    return { icon: "volume-high", iconColor: "#2563EB", iconBg: "#DBEAFE" };
  }
  if (mediaType === "image") {
    return { icon: "image", iconColor: "#9333EA", iconBg: "#F3E8FF" };
  }
  const cat = (item.category || "").toLowerCase();
  if (cat === "issues") return { icon: "check-circle", iconColor: "#16A34A", iconBg: "#DCFCE7" };
  if (cat === "events") return { icon: "calendar", iconColor: "#EA580C", iconBg: "#FFEDD5" };
  if (cat === "news") return { icon: "bullhorn", iconColor: "#9333EA", iconBg: "#F3E8FF" };
  return { icon: "bell", iconColor: "#D97706", iconBg: "#FEF3C7" };
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, refreshAppConfig } = useCampaign();
  const [selectedTab, setSelectedTab] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAppConfig();
    } catch {
      // offline fallback
    } finally {
      setRefreshing(false);
    }
  }, [refreshAppConfig]);

  const sourceNotifications =
    notifications && notifications.length > 0 ? notifications : NOTIFICATIONS_DATA;

  const allCount = sourceNotifications.length;
  const issuesCount = sourceNotifications.filter((i) => i.category === "issues").length;
  const eventsCount = sourceNotifications.filter((i) => i.category === "events").length;
  const newsCount = sourceNotifications.filter((i) => i.category === "news").length;
  const otherCount = sourceNotifications.filter(
    (i) => i.category === "other" || !["issues", "events", "news"].includes(i.category || "")
  ).length;

  const NOTIF_TABS = [
    { id: "all", label: `सर्व (${allCount})` },
    { id: "issues", label: `समस्या (${issuesCount})` },
    { id: "events", label: `कार्यक्रम (${eventsCount})` },
    { id: "news", label: `बातम्या (${newsCount})` },
    { id: "other", label: `इतर (${otherCount})` },
  ];

  const filteredItems = sourceNotifications.filter((item) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "other") {
      return item.category === "other" || !["issues", "events", "news"].includes(item.category || "");
    }
    return item.category === selectedTab;
  });

  const handleTestNotification = async () => {
    try {
      const { fcmToken } = getCachedPushTokens();
      await triggerLocalNotification(
        "चाचणी सूचना (Test Notification)",
        "तुमचा फोन सूचना आणि आवाज वाजवण्यासाठी सज्ज आहे!"
      );
      Alert.alert(
        "FCM Token Status",
        fcmToken
          ? `🔥 FCM Token Available:\n\n${fcmToken}`
          : "⚠️ FCM Token is still generating or permissions are not granted. Please check app notification permissions."
      );
    } catch (e: any) {
      Alert.alert("Notification Error", e?.message || "Could not trigger notification");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#E05300" />

      {/* Top Saffron Header with Subtitle & Official Shiv Sena Logo */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/home");
              }
            }}
            activeOpacity={0.85}
          >
            <Icon source="arrow-left" size={22} color="#E05300" />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerMainTitle}>सूचना</Text>
            <Text style={styles.headerSubtitle}>आपला परिसर, आपली जबाबदारी</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: "#FFFFFF" }]}
            onPress={handleTestNotification}
            activeOpacity={0.85}
          >
            <Icon source="bell-ring" size={20} color="#E05300" />
          </TouchableOpacity>

          <View style={styles.logoEmblemContainer}>
            <Image
              source={require("../../assets/images/shivsena_logo.png")}
              style={styles.logoEmblemImg}
              contentFit="cover"
            />
          </View>
        </View>
      </View>

      {/* Filter Tabs Bar */}
      <View style={styles.filterTabsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsScroll}
        >
          {NOTIF_TABS.map((tab) => {
            const isSelected = selectedTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterTabPill,
                  isSelected && styles.filterTabPillActive,
                ]}
                onPress={() => setSelectedTab(tab.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    isSelected && styles.filterTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#EA580C", "#FF6F00"]}
            tintColor="#EA580C"
          />
        }
      >
        {filteredItems.map((item) => {
          const iconMeta = getNotificationIcon(item);
          const hasMedia = Boolean(
            item.mediaType &&
              item.mediaType !== "none" &&
              (item.mediaUrl || (item as any).media_url)
          );
          const displayDesc = item.description || item.message || "";
          const displayTime = item.timeAgo || item.sentAt || (item as any).created_at || "";

          const cardContent = (
            <>
              {/* Category Icon Box */}
              <View style={[styles.iconBox, { backgroundColor: iconMeta.iconBg }]}>
                <Icon source={iconMeta.icon} size={22} color={iconMeta.iconColor} />
              </View>

              {/* Notification Text Column */}
              <View style={styles.textCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.indicatorDot && (
                    <View
                      style={[
                        styles.indicatorDot,
                        { backgroundColor: item.indicatorDot },
                      ]}
                    />
                  )}
                </View>

                {displayDesc ? (
                  <Text style={styles.itemDesc} numberOfLines={hasMedia ? undefined : 2}>
                    {displayDesc}
                  </Text>
                ) : null}

                {/* Injected Media Component */}
                {hasMedia && <NotificationMediaRenderer item={item} />}

                <Text style={styles.itemTime}>{displayTime}</Text>
              </View>

              {/* Chevron Arrow */}
              <View style={styles.chevronWrap}>
                <Icon source="chevron-right" size={20} color="#9CA3AF" />
              </View>
            </>
          );

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.notificationCard}
              onPress={() => {
                if (
                  item.targetRoute &&
                  item.targetRoute !== "/notifications" &&
                  item.targetRoute !== "/notification-detail"
                ) {
                  router.push(item.targetRoute as any);
                } else {
                  router.push({
                    pathname: "/notification-detail",
                    params: {
                      id: String(item.id),
                      title: item.title,
                      message: item.description || item.message || "",
                      mediaType: item.mediaType || "",
                      mediaUrl: item.mediaUrl || (item as any).media_url || "",
                      category: item.category || "other",
                      time:
                        item.timeAgo ||
                        item.sentAt ||
                        (item as any).created_at ||
                        "आज",
                    },
                  });
                }
              }}
              activeOpacity={0.85}
            >
              {cardContent}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  topHeader: {
    backgroundColor: "#E05300",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleGroup: {
    justifyContent: "center",
  },
  headerMainTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
  },
  headerSubtitle: {
    color: "#FED7AA",
    fontSize: 11.5,
    fontWeight: "600",
  },
  logoEmblemContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#FBBF24",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoEmblemImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  // Filter Tabs
  filterTabsBar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 10,
  },
  filterTabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTabPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  filterTabPillActive: {
    backgroundColor: "#EA580C",
  },
  filterTabText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#4B5563",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },

  // Notification Cards
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 32,
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1.5,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F2937",
    flex: 1,
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 6,
  },
  itemDesc: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 17,
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    marginTop: 4,
  },
  chevronWrap: {
    paddingLeft: 4,
    paddingTop: 2,
  },
});
