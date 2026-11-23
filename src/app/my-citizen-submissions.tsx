import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { Submission } from "../types/citizenServices.types";
import { citizenServicesApi } from "../services/citizenServicesApi";
import { authApi } from "../services/authApi";

export default function MyCitizenSubmissionsScreen() {
  const router = useRouter();
  const user = authApi.getUser();

  const [mobile, setMobile] = useState(user?.mobile || "");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (user?.mobile) {
      loadSubmissions(user.mobile);
    }
  }, [user?.mobile]);

  const loadSubmissions = async (phone: string) => {
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const data = await citizenServicesApi.getMySubmissions(cleanPhone);
      setSubmissions(data);
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (mobile.trim().length >= 10) {
      setRefreshing(true);
      loadSubmissions(mobile);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return { label: "निवारण झाले", bg: "#DCFCE7", text: "#166534" };
      case "in_progress":
      case "processing":
        return { label: "प्रगतीपथावर", bg: "#DBEAFE", text: "#1E40AF" };
      case "escalated":
        return { label: "वरिष्ठ स्तरावर वर्ग", bg: "#FEE2E2", text: "#991B1B" };
      case "rejected":
        return { label: "नाकारले", bg: "#F1F5F9", text: "#475569" };
      case "received":
      default:
        return { label: "नोंद झाली (प्राप्त)", bg: "#FFEDD5", text: "#9A3412" };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#E05300" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
          activeOpacity={0.85}
        >
          <Icon source="arrow-left" size={22} color="#E05300" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerMainTitle}>माझ्या नोंदवलेल्या तक्रारी</Text>
          <Text style={styles.headerSubTitle}>नागरिक सेवा व तक्रार निवारण कक्ष</Text>
        </View>
        <TouchableOpacity
          style={styles.headerPlusBtn}
          onPress={() => router.push("/new-citizen-submission")}
          activeOpacity={0.8}
        >
          <Icon source="plus" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Mobile search bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.phoneInputRow}>
          <Text style={styles.prefixText}>+91</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="१० अंकी मोबाईल नंबर प्रविष्ट करा"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            maxLength={10}
            value={mobile}
            onChangeText={setMobile}
          />
          <TouchableOpacity
            style={styles.phoneSearchBtn}
            onPress={() => loadSubmissions(mobile)}
            activeOpacity={0.85}
          >
            <Text style={styles.phoneSearchBtnText}>शोधा</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Submissions List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>तक्रारी लोड होत आहेत...</Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={(item) => String(item.id || item.reference_number)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#EA580C"]}
            />
          }
          ListEmptyComponent={
            hasSearched ? (
              <View style={styles.emptyContainer}>
                <Icon source="clipboard-text-outline" size={54} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>कोणतीही तक्रार आढळली नाही</Text>
                <Text style={styles.emptySub}>
                  या मोबाईल नंबरवर अद्याप कोणतीही तक्रार किंवा सेवा अर्ज नोंदवलेला नाही.
                </Text>
                <TouchableOpacity
                  style={styles.newGrievanceBtn}
                  onPress={() => router.push("/new-citizen-submission")}
                  activeOpacity={0.85}
                >
                  <Icon source="plus" size={18} color="#FFFFFF" />
                  <Text style={styles.newGrievanceBtnText}>नवीन तक्रार नोंदवा</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Icon source="magnify" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>आपला मोबाईल नंबर प्रविष्ट करा</Text>
                <Text style={styles.emptySub}>
                  आपल्या मोबाईल नंबरवर नोंदवलेल्या तक्रारींचा अखंड २४-तास इतिहास पाहण्यासाठी वरील रकान्यात मोबाईल नंबर भरा.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            return (
              <TouchableOpacity
                style={styles.submissionCard}
                onPress={() =>
                  router.push({
                    pathname: "/submission-tracking",
                    params: { referenceNumber: item.reference_number },
                  })
                }
                activeOpacity={0.85}
              >
                {/* Header Row */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.refWrap}>
                    <Text style={styles.refLabel}>क्रमांक:</Text>
                    <Text style={styles.refValue}>{item.reference_number}</Text>
                  </View>
                  <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* Department & Subject */}
                {item.department && (
                  <Text style={styles.cardDeptName}>🏛️ {item.department.name}</Text>
                )}
                <Text style={styles.cardSubject} numberOfLines={2}>
                  {item.subject}
                </Text>

                {/* Village and Date */}
                <View style={styles.cardFooterRow}>
                  <Text style={styles.cardVillage}>📍 {item.village}</Text>
                  <Text style={styles.cardDate}>
                    {new Date(item.created_at).toLocaleDateString("mr-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>

                {/* Track Button */}
                <View style={styles.cardActionRow}>
                  <Text style={styles.cardActionText}>तपशील व प्रगती इतिहास पहा ➔</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerMainTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubTitle: {
    fontSize: 11,
    color: "#EA580C",
    fontWeight: "700",
    marginTop: 1,
  },
  headerPlusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EA580C",
    justifyContent: "center",
    alignItems: "center",
  },
  searchBarWrap: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.2,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    marginRight: 6,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
    minHeight: 44,
  },
  phoneSearchBtn: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  phoneSearchBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "800",
  },
  listContent: {
    padding: 16,
    paddingBottom: 60,
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#64748B",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 12,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  newGrievanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EA580C",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    gap: 6,
  },
  newGrievanceBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  submissionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  refWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  refLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  refValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#EA580C",
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: "800",
  },
  cardDeptName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 4,
  },
  cardSubject: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 19,
    marginBottom: 10,
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  cardVillage: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  cardDate: {
    fontSize: 11.5,
    color: "#94A3B8",
  },
  cardActionRow: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#EA580C",
  },
});
