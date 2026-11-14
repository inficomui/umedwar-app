import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";

import { appConfigApi, EventItem } from "../services/appConfigApi";

export default function EventsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const res = await appConfigApi.getEvents();
      if (res && Array.isArray(res)) {
        setEvents(res);
      }
    } catch (e) {
      console.log("Error loading events:", e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents();
  }, [loadEvents]);

  const eventsList = useMemo(() => {
    if (!Array.isArray(events)) return [];
    return activeTab === "upcoming"
      ? events.filter((e) => e.isUpcoming !== false)
      : events.filter((e) => e.isUpcoming === false);
  }, [events, activeTab]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#E05300" />

      {/* Top Saffron Header */}
      <View style={styles.topHeader}>
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

        <Text style={styles.headerTitle}>कार्यक्रम</Text>

        <View style={styles.logoEmblemContainer}>
          <Image
            source={require("../../assets/images/shivsena_logo.png")}
            style={styles.logoEmblemImg}
            contentFit="cover"
          />
        </View>
      </View>

      {/* Segmented Control Bar */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "upcoming" && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab("upcoming")}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "upcoming" && styles.tabBtnTextActive,
              ]}
            >
              आगामी कार्यक्रम
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "past" && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab("past")}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "past" && styles.tabBtnTextActive,
              ]}
            >
              भूतकाळातील कार्यक्रम
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Events List */}
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
        {eventsList.length === 0 ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40, paddingHorizontal: 20 }}>
            <Icon source="calendar-blank-outline" size={48} color="#D1D5DB" />
            <Text style={{ marginTop: 12, fontSize: 15, fontWeight: "700", color: "#6B7280", textAlign: "center" }}>
              सध्या कोणतेही {activeTab === "upcoming" ? "आगामी" : "भूतकाळातील"} कार्यक्रम उपलब्ध नाहीत.
            </Text>
          </View>
        ) : (
          eventsList.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.eventCard}
              onPress={() =>
                router.push({
                  pathname: "/event-detail",
                  params: { id: item.id, title: item.title },
                })
              }
              activeOpacity={0.88}
            >
              {/* Left Big Date Block */}
              <View style={styles.dateBlock}>
                <Text style={styles.dayText}>{item.day || "१"}</Text>
                <Text style={styles.monthText}>{item.month || "महिना"}</Text>
              </View>

              {/* Thumbnail Image */}
              <Image
                source={item.image || require("../../assets/images/event_thumb_1.jpg")}
                style={styles.eventThumb}
                contentFit="cover"
              />

              {/* Right Details Column */}
              <View style={styles.detailsCol}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {item.title}
                </Text>

                <View style={styles.metaRow}>
                  <Icon source="map-marker" size={13} color="#6B7280" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Icon source="clock-outline" size={13} color="#6B7280" />
                  <Text style={styles.metaText}>{item.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  logoEmblemContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#FBBF24",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmblemImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },

  // Segmented Tabs
  tabBarWrapper: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: "#EA580C",
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1.5,
  },
  dateBlock: {
    width: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    paddingRight: 8,
    marginRight: 8,
  },
  dayText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1F2937",
    lineHeight: 26,
  },
  monthText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EA580C",
  },
  eventThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  detailsCol: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  metaText: {
    fontSize: 11.5,
    color: "#6B7280",
    marginLeft: 4,
    fontWeight: "500",
  },

  // View All Button
  viewAllBtn: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: "#EA580C",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllBtnText: {
    color: "#EA580C",
    fontSize: 14.5,
    fontWeight: "800",
  },
});
