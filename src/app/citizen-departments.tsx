import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { Department } from "../types/citizenServices.types";
import { citizenServicesApi } from "../services/citizenServicesApi";

export default function CitizenDepartmentsScreen() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    citizenServicesApi
      .getDepartments()
      .then((data) => {
        if (data && data.length > 0) setDepartments(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
  );

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
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerMainTitle}>शासकीय विभाग (२६)</Text>
          <Text style={styles.headerSubtitle}>नागरिक सेवा व तक्रार निवारण कक्ष</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push("/new-citizen-submission")}
          activeOpacity={0.85}
        >
          <Icon source="plus-circle" size={22} color="#E05300" />
        </TouchableOpacity>
      </View>

      {/* Emergency Alert Banner */}
      <View style={styles.emergencyBanner}>
        <Icon source="alert-circle" size={16} color="#DC2626" />
        <Text style={styles.emergencyBannerText}>
          तातडीच्या मदतीसाठी थेट पोलीस: ११२ | सायबर: १९३० | महिला: १८१ वर संपर्क साधा.
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Icon source="magnify" size={20} color="#78716C" />
        <TextInput
          style={styles.searchInput}
          placeholder="शासकीय विभाग शोधा (उदा. महसूल, पोलीस, वीज)..."
          placeholderTextColor="#A8A29E"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Icon source="close-circle" size={18} color="#78716C" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>शासकीय विभाग यादी लोड होत आहे...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon source="file-search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>कोणताही विभाग आढळला नाही</Text>
              <Text style={styles.emptySub}>कृपया वेगळा शब्द टाकून शोधा.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.deptCard}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/department-detail",
                  params: { idOrCode: item.code || String(item.id) },
                })
              }
            >
              <View style={styles.deptNumberPill}>
                <Text style={styles.deptNumberText}>#{index + 1}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.deptName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.deptDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.deptMetaRow}>
                  {item.total_services !== undefined && (
                    <Text style={styles.servicesCountBadge}>
                      📑 {item.total_services} अधिकृत सेवा
                    </Text>
                  )}
                  {item.emergency_contact ? (
                    <Text style={styles.emergencyPill}>
                      🚨 हेल्पलाईन: {item.emergency_contact}
                    </Text>
                  ) : null}
                </View>
              </View>

              <Icon source="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleGroup: { flex: 1, alignItems: "center" },
  headerMainTitle: { fontSize: 16, fontWeight: "900", color: "#1E293B" },
  headerSubtitle: { fontSize: 11, color: "#EA580C", fontWeight: "700" },
  newBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
  },
  emergencyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#FEE2E2",
  },
  emergencyBannerText: {
    fontSize: 11,
    color: "#B91C1C",
    fontWeight: "700",
    flex: 1,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#0F172A", paddingVertical: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#64748B", fontSize: 13, fontWeight: "600" },
  deptCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  deptNumberPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  deptNumberText: { fontSize: 12, fontWeight: "800", color: "#EA580C" },
  deptName: { fontSize: 14.5, fontWeight: "800", color: "#0F172A", marginBottom: 3 },
  deptDesc: { fontSize: 11.5, color: "#64748B", lineHeight: 16, marginBottom: 6 },
  deptMetaRow: { flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" },
  servicesCountBadge: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#0369A1",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  emergencyPill: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#DC2626",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
});
