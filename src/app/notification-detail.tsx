import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  Share,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Icon } from "react-native-paper";
import { NotificationMediaRenderer } from "../components/NotificationMediaRenderer";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COMPARISON_HEIGHT = Math.round((SCREEN_WIDTH - 32) * (155 / 385));

export default function NotificationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    message?: string;
    mediaUrl?: string;
    mediaType?: string;
    category?: string;
    time?: string;
  }>();

  const title = params.title || "आपली समस्या निकाली";
  const message =
    params.message ||
    "आपण नोंदवलेली “रस्त्याची दुरुस्ती” समस्या यशस्वीरीत्या पूर्ण झाली आहे.";
  const mediaUrl = params.mediaUrl || "";
  const mediaType = (params.mediaType || "none").toLowerCase();
  const category = params.category || "other";
  const time = params.time || "20 सप्टेंबर 2026, 04:15 PM";
  const hasCustomMedia = Boolean(mediaUrl && mediaType !== "none");

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/notifications");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${title}: ${message} - शिवसेना (शिंदे गट)`,
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#E05300" />

      {/* Top Saffron Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.85}
        >
          <Icon source="arrow-left" size={22} color="#E05300" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>सूचना तपशील</Text>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Icon source="share-variant" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Scrollable Content */}
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
        {/* Status Header Banner Card */}
        <View style={styles.statusHeaderCard}>
          <View style={[styles.statusIconCircle, category === "news" && { backgroundColor: "#9333EA" }]}>
            <Icon
              source={
                category === "news"
                  ? "bullhorn"
                  : category === "events"
                  ? "calendar"
                  : "check"
              }
              size={24}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.statusTextCol}>
            <Text style={styles.statusHeadline}>{title}</Text>
            <Text style={styles.statusSubheadline}>{message}</Text>

            <View style={styles.statusTimeRow}>
              <Icon source="clock-outline" size={14} color="#6B7280" />
              <Text style={styles.statusTimeText}>{time}</Text>
            </View>
          </View>
        </View>

        {/* Media Player / Viewer Component */}
        {hasCustomMedia ? (
          <View style={styles.mediaContainerCard}>
            <NotificationMediaRenderer
              item={{
                id: params.id || "detail-item",
                title,
                message,
                mediaType,
                mediaUrl,
              }}
            />
          </View>
        ) : (
          /* Default Before & After Comparison Photo Card */
          <View style={styles.comparisonCard}>
            <Image
              source={require("../../assets/images/notif_comparison_full.jpg")}
              style={styles.comparisonImage}
              contentFit="cover"
            />
          </View>
        )}

        {/* SECTION: समस्या तपशील */}
        <View style={styles.detailsCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBadge}>
              <Icon source="file-document-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>समस्या तपशील</Text>
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>समस्या क्रमांक</Text>
              <Text style={styles.tableValue}>ISS-2026-00125</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>प्रकार</Text>
              <Text style={styles.tableValue}>रस्ता / वाहतूक</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>ठिकाण</Text>
              <Text style={styles.tableValue}>गजानन नगर, औरंगाबाद</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>नोंदवली</Text>
              <Text style={styles.tableValue}>12 सप्टेंबर 2026, 10:30 AM</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.tableLabel}>निकाली</Text>
              <Text style={[styles.tableValue, { color: "#16A34A", fontWeight: "800" }]}>
                20 सप्टेंबर 2026, 04:15 PM
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION: अधिक माहिती */}
        <View style={styles.infoCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBadge, { backgroundColor: "#EA580C" }]}>
              <Icon source="information-variant" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>अधिक माहिती</Text>
          </View>

          <Text style={styles.infoNarrative}>
            आपल्या भागातील रस्त्याची दुरुस्ती कार्यवाही पूर्ण करण्यात आली आहे. आपल्या सहकार्याबद्दल धन्यवाद. आपल्या परिसरातील इतर समस्याही नोंदवा व विकासात सहभागी व्हा.
          </Text>
        </View>

        {/* Slogan Quote Box */}
        <View style={styles.quoteBox}>
          <View style={styles.quoteHeaderRow}>
            <Text style={styles.giantQuoteMark}>“</Text>
            <Text style={styles.quoteHeadline}>“आपला विश्वास, आमचे कर्तव्य !”</Text>
          </View>
          <Text style={styles.partyAuthor}>– शिवसेना (शिंदे गट)</Text>

          <View style={styles.brushSwoosh} />
        </View>

        {/* Action Button: नकाशावर पहा */}
        <TouchableOpacity
          style={styles.viewOnMapBtn}
          onPress={() => router.push("/issue-map")}
          activeOpacity={0.88}
        >
          <Icon source="map-marker" size={20} color="#FFFFFF" />
          <Text style={styles.viewOnMapBtnText}>नकाशावर पहा</Text>
        </TouchableOpacity>
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
  shareButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },

  // Status Banner Card
  statusHeaderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
  },
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  statusTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  statusHeadline: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 3,
  },
  statusSubheadline: {
    fontSize: 12.5,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 6,
  },
  statusTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusTimeText: {
    fontSize: 11.5,
    color: "#6B7280",
    fontWeight: "500",
  },

  mediaContainerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  // Comparison Photo Card
  comparisonCard: {
    width: "100%",
    height: COMPARISON_HEIGHT,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  comparisonImage: {
    width: "100%",
    height: "100%",
  },

  // Details Card
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F2937",
  },
  tableContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tableLabel: {
    fontSize: 12.5,
    color: "#6B7280",
    fontWeight: "600",
  },
  tableValue: {
    fontSize: 12.5,
    color: "#1F2937",
    fontWeight: "700",
  },

  // Info Card
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
  },
  infoNarrative: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
  },

  // Slogan Quote Box
  quoteBox: {
    backgroundColor: "#FFF7ED",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFEDD5",
    alignItems: "center",
  },
  quoteHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  giantQuoteMark: {
    fontSize: 26,
    color: "#EA580C",
    fontWeight: "900",
    marginRight: 6,
    lineHeight: 28,
  },
  quoteHeadline: {
    fontSize: 15,
    fontWeight: "900",
    color: "#EA580C",
  },
  partyAuthor: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
    marginTop: 4,
  },
  brushSwoosh: {
    width: 90,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#EA580C",
    marginTop: 8,
  },

  // View On Map Button
  viewOnMapBtn: {
    backgroundColor: "#EA580C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 4,
  },
  viewOnMapBtnText: {
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "800",
  },
});
