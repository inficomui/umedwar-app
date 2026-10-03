import React, { useState, useCallback } from "react";
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
import { useCampaign, IssueItem } from "../context/CampaignContext";

export default function MyIssuesScreen() {
  const router = useRouter();
  const { myIssues, refreshIssues, currentUser, isLoggedIn } = useCampaign();

  const [selectedTab, setSelectedTab] = useState<"all" | "pending" | "in_progress" | "resolved">("all");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshIssues();
    } finally {
      setRefreshing(false);
    }
  }, [refreshIssues]);

  const allCount = isLoggedIn ? myIssues.length : 0;
  const pendingCount = isLoggedIn ? myIssues.filter((item) => item.status === "pending").length : 0;
  const inProgressCount = isLoggedIn ? myIssues.filter(
    (item) => item.status === "in_progress" || item.status === "forwarded"
  ).length : 0;
  const resolvedCount = isLoggedIn ? myIssues.filter((item) => item.status === "resolved").length : 0;

  const filteredIssues = !isLoggedIn
    ? []
    : myIssues.filter((item) => {
        if (selectedTab === "all") return true;
        if (selectedTab === "in_progress") return item.status === "in_progress" || item.status === "forwarded";
        return item.status === selectedTab;
      });

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
        <Text style={styles.headerTitle}>माझ्या नोंदविलेल्या समस्या</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Filter Tabs Row */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <TouchableOpacity
            style={[styles.tabPill, selectedTab === "all" && styles.tabPillActive]}
            onPress={() => setSelectedTab("all")}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, selectedTab === "all" && styles.tabTextActive]}>
              सर्व ({allCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, selectedTab === "pending" && styles.tabPillActive]}
            onPress={() => setSelectedTab("pending")}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, selectedTab === "pending" && styles.tabTextActive]}>
              प्रलंबित ({pendingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, selectedTab === "in_progress" && styles.tabPillActive]}
            onPress={() => setSelectedTab("in_progress")}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, selectedTab === "in_progress" && styles.tabTextActive]}>
              प्रगतीत ({inProgressCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, selectedTab === "resolved" && styles.tabPillActive]}
            onPress={() => setSelectedTab("resolved")}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, selectedTab === "resolved" && styles.tabTextActive]}>
              निकाली ({resolvedCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Issues List */}
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
        {/* Citizen Profile Bar if logged in */}
        {isLoggedIn && currentUser && (
          <View style={styles.citizenProfileBar}>
            <View style={styles.citizenProfileLeft}>
              <View style={styles.citizenAvatarWrap}>
                <Icon source="account-check" size={18} color="#15803D" />
              </View>
              <View>
                <Text style={styles.citizenProfileTitle}>
                  {currentUser.name}
                </Text>
                <Text style={styles.citizenProfileSub}>
                  {currentUser.mobile ? `मोबाईल: ${currentUser.mobile}` : "सत्यापित नागरिक"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.newReportMiniBtn}
              onPress={() => router.push("/report-issue")}
              activeOpacity={0.85}
            >
              <Icon source="plus" size={15} color="#FFFFFF" />
              <Text style={styles.newReportMiniBtnText}>नवीन तक्रार</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoggedIn ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon source="account-lock-outline" size={40} color="#EA580C" />
            </View>
            <Text style={styles.emptyStateTitle}>लॉगिन आवश्यक आहे</Text>
            <Text style={styles.emptyStateSubtitle}>
              आपण नोंदवलेल्या समस्या, आमदार कार्यालयाचा शेरा व थेट प्रगती पाहण्यासाठी कृपया प्रथम लॉगिन करा.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => router.push("/login?returnTo=/my-issues")}
                activeOpacity={0.88}
              >
                <Icon source="login" size={18} color="#FFFFFF" />
                <Text style={styles.emptyActionBtnText}>लॉगिन करा (Login)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.emptyRegisterBtn}
                onPress={() => router.push("/register?returnTo=/my-issues")}
                activeOpacity={0.88}
              >
                <Icon source="account-plus" size={18} color="#EA580C" />
                <Text style={styles.emptyRegisterBtnText}>नोंदणी करा (Register)</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : myIssues.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon source="clipboard-text-search-outline" size={40} color="#EA580C" />
            </View>
            <Text style={styles.emptyStateTitle}>तुम्ही अद्याप कोणतीही समस्या नोंदवलेली नाही</Text>
            <Text style={styles.emptyStateSubtitle}>
              आपण मोबाईल ॲपवरून अद्याप कोणतीही समस्या नोंदवलेली नाही. आपल्या परिसरातील रस्ते, पाणी, वीज किंवा इतर नागरी समस्यांची तक्रार नोंदवा आणि थेट प्रगती ट्रॅक करा.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => router.push("/report-issue")}
              activeOpacity={0.88}
            >
              <Icon source="plus-circle" size={18} color="#FFFFFF" />
              <Text style={styles.emptyActionBtnText}>नवीन समस्या नोंदवा (Report Issue)</Text>
            </TouchableOpacity>
          </View>
        ) : filteredIssues.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon source="filter-remove-outline" size={40} color="#EA580C" />
            </View>
            <Text style={styles.emptyStateTitle}>या टॅबमध्ये कोणतीही समस्या नाही</Text>
            <Text style={styles.emptyStateSubtitle}>
              निवडलेल्या टॅबमध्ये सध्या कोणतीही तक्रार आढळली नाही.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => setSelectedTab("all")}
              activeOpacity={0.88}
            >
              <Icon source="format-list-bulleted" size={18} color="#FFFFFF" />
              <Text style={styles.emptyActionBtnText}>सर्व समस्या पहा (View All)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredIssues.map((issue) => (
            <TouchableOpacity
              key={issue.id}
              style={styles.issueCard}
              onPress={() =>
                router.push({
                  pathname: "/issue-detail",
                  params: { id: issue.id, title: issue.title },
                })
              }
              activeOpacity={0.85}
            >
              <Image
                source={issue.image || require("../../assets/images/issue_pothole.png")}
                style={styles.issueThumb}
                contentFit="cover"
              />

              <View style={styles.issueInfoCol}>
                {issue.trackingId && (
                  <View style={styles.trackingPill}>
                    <Text style={styles.trackingPillText}>#{issue.trackingId}</Text>
                  </View>
                )}

                <Text style={styles.issueTitle} numberOfLines={1}>
                  {issue.title}
                </Text>

                <View style={styles.metaRow}>
                  <Icon source="map-marker" size={13} color="#78716C" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {issue.location}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Icon source="calendar" size={13} color="#78716C" />
                  <Text style={styles.metaText}>{issue.date}</Text>
                </View>

                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: issue.statusBg || "#FFEDD5" }]}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: issue.statusColor || "#EA580C" },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: issue.statusColor || "#EA580C" },
                    ]}
                  >
                    {issue.statusText}
                  </Text>
                </View>
              </View>

              <View style={styles.chevronCol}>
                <Icon source="chevron-right" size={22} color="#EA580C" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Floating/Fixed Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.newIssueBtn}
          onPress={() => router.push("/report-issue")}
          activeOpacity={0.88}
        >
          <Icon source="plus-circle" size={20} color="#FFFFFF" />
          <Text style={styles.newIssueBtnText}>नवीन समस्या नोंदवा</Text>
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
  headerPlaceholder: {
    width: 38,
  },

  // Tabs
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 10,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  tabPillActive: {
    backgroundColor: "#EA580C",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },

  // List
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  issueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
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
  issueThumb: {
    width: 78,
    height: 78,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  issueInfoCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  issueTitle: {
    fontSize: 15,
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
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    marginTop: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  chevronCol: {
    marginLeft: 8,
  },

  // Bottom Button
  bottomBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  newIssueBtn: {
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
  },
  newIssueBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  trackingPill: {
    alignSelf: "flex-start",
    backgroundColor: "#FFEDD5",
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginBottom: 3,
  },
  trackingPillText: {
    color: "#EA580C",
    fontSize: 10.5,
    fontWeight: "800",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 6,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 12.5,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EA580C",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  emptyActionBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
  },
  emptyRegisterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "#EA580C",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyRegisterBtnText: {
    color: "#EA580C",
    fontSize: 13.5,
    fontWeight: "800",
  },
  citizenProfileBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  citizenProfileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  citizenAvatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  citizenProfileTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },
  citizenProfileSub: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "600",
    marginTop: 1,
  },
  newReportMiniBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EA580C",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  newReportMiniBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
});
