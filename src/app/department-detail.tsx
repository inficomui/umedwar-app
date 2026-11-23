import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { Department } from "../types/citizenServices.types";
import { citizenServicesApi } from "../services/citizenServicesApi";

export default function DepartmentDetailScreen() {
  const { idOrCode } = useLocalSearchParams<{ idOrCode?: string }>();
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (idOrCode) {
      citizenServicesApi
        .getDepartmentDetails(idOrCode)
        .then((data) => {
          if (data) setDepartment(data);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [idOrCode]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#E05300" />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/citizen-departments"))}
          activeOpacity={0.85}
        >
          <Icon source="arrow-left" size={22} color="#E05300" />
        </TouchableOpacity>
        <Text style={styles.headerMainTitle} numberOfLines={1}>
          विभाग सेवा व माहिती
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>विभाग तपशील लोड होत आहे...</Text>
        </View>
      ) : !department ? (
        <View style={styles.center}>
          <Icon source="alert-circle-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>विभाग माहिती उपलब्ध नाही.</Text>
          <TouchableOpacity
            style={styles.emptyBackBtn}
            onPress={() => router.replace("/citizen-departments")}
          >
            <Text style={styles.emptyBackBtnText}>सर्व विभाग पहा</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Main Department Card */}
          <View style={styles.deptCard}>
            <View style={styles.deptBadgeRow}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>🏛️ {department.code || "GOVT"}</Text>
              </View>
              {department.emergency_contact ? (
                <View style={styles.emergencyBadge}>
                  <Text style={styles.emergencyBadgeText}>
                    🚨 हेल्पलाईन: {department.emergency_contact}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.deptTitle}>{department.name}</Text>
            {department.description ? (
              <Text style={styles.deptDesc}>{department.description}</Text>
            ) : null}

            {department.responsible_office_name ? (
              <View style={styles.infoRow}>
                <Icon source="office-building" size={16} color="#64748B" />
                <Text style={styles.infoText}>कार्यालय: {department.responsible_office_name}</Text>
              </View>
            ) : null}

            {department.office_address ? (
              <View style={styles.infoRow}>
                <Icon source="map-marker" size={16} color="#64748B" />
                <Text style={styles.infoText}>{department.office_address}</Text>
              </View>
            ) : null}

            {department.contact_number ? (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => Linking.openURL(`tel:${department.contact_number}`)}
              >
                <Icon source="phone" size={16} color="#0284C7" />
                <Text style={[styles.infoText, { color: "#0284C7", fontWeight: "700" }]}>
                  {department.contact_number}
                </Text>
              </TouchableOpacity>
            ) : null}

            {department.official_portal_url ? (
              <TouchableOpacity
                style={styles.portalBtn}
                onPress={() => Linking.openURL(department.official_portal_url!)}
              >
                <Icon source="open-in-new" size={16} color="#0369A1" />
                <Text style={styles.portalBtnText}>अधिकृत शासकीय पोर्टलवर जा</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* New Submission CTA Button */}
          <TouchableOpacity
            style={styles.newSubmissionCTA}
            activeOpacity={0.88}
            onPress={() =>
              router.push({
                pathname: "/new-citizen-submission",
                params: {
                  departmentId: String(department.id),
                  departmentName: department.name,
                },
              })
            }
          >
            <View style={styles.ctaIconWrap}>
              <Icon source="pencil-plus-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaTitle}>या विभागासाठी नवीन तक्रार / अर्ज नोंदवा</Text>
              <Text style={styles.ctaSubtitle}>२४ तासांच्या आत पहिला प्रगती अद्यतन मिळवा</Text>
            </View>
            <Icon source="chevron-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Services List Section */}
          <View style={styles.servicesSection}>
            <Text style={styles.servicesHeading}>
              📑 अधिकृत सेवा व दाखले ({department.services ? department.services.length : 0})
            </Text>

            {(!department.services || department.services.length === 0) ? (
              <View style={styles.emptyServicesBox}>
                <Text style={styles.emptyServicesText}>
                  या विभागासाठी उपलब्ध सेवांची माहिती लवकरच अद्ययावत केली जाईल. आपण थेट तक्रार किंवा अर्ज नोंदवू शकता.
                </Text>
              </View>
            ) : (
              department.services.map((srv, idx) => (
                <View key={srv.id || idx} style={styles.serviceItemCard}>
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceName}>{srv.name}</Text>
                    {srv.estimated_processing_days ? (
                      <View style={styles.daysBadge}>
                        <Text style={styles.daysBadgeText}>
                          ⏱️ {srv.estimated_processing_days} दिवस
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {srv.short_description ? (
                    <Text style={styles.serviceDesc}>{srv.short_description}</Text>
                  ) : null}

                  {srv.required_documents && srv.required_documents.length > 0 ? (
                    <View style={styles.docsWrap}>
                      <Text style={styles.docsTitle}>आवश्यक कागदपत्रे:</Text>
                      {srv.required_documents.map((doc, dIdx) => (
                        <Text key={dIdx} style={styles.docItem}>
                          • {doc}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={styles.serviceApplyBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/new-citizen-submission",
                        params: {
                          departmentId: String(department.id),
                          departmentName: department.name,
                          serviceId: String(srv.id),
                          subject: srv.name,
                        },
                      })
                    }
                  >
                    <Text style={styles.serviceApplyBtnText}>हा अर्ज / तक्रार दाखल करा ➔</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
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
  headerMainTitle: { fontSize: 16, fontWeight: "900", color: "#1E293B" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingText: { marginTop: 10, color: "#64748B", fontSize: 13, fontWeight: "600" },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151", marginTop: 12 },
  emptyBackBtn: {
    backgroundColor: "#EA580C",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 16,
  },
  emptyBackBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  deptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  deptBadgeRow: { flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  codeBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeBadgeText: { fontSize: 11, fontWeight: "800", color: "#475569" },
  emergencyBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  emergencyBadgeText: { fontSize: 11, fontWeight: "800", color: "#DC2626" },
  deptTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A", marginBottom: 6 },
  deptDesc: { fontSize: 12.5, color: "#475569", lineHeight: 18, marginBottom: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  infoText: { fontSize: 12, color: "#334155", flex: 1 },
  portalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E0F2FE",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  portalBtnText: { fontSize: 11.5, fontWeight: "700", color: "#0369A1" },
  newSubmissionCTA: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EA580C",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  ctaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaTitle: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "800" },
  ctaSubtitle: { color: "#FFEDD5", fontSize: 11, marginTop: 1 },
  servicesSection: { marginTop: 4 },
  servicesHeading: { fontSize: 15, fontWeight: "800", color: "#1E293B", marginBottom: 12 },
  emptyServicesBox: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyServicesText: { fontSize: 12, color: "#64748B", lineHeight: 18 },
  serviceItemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  serviceName: { fontSize: 14, fontWeight: "800", color: "#0F172A", flex: 1, marginRight: 8 },
  daysBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  daysBadgeText: { fontSize: 10.5, fontWeight: "700", color: "#92400E" },
  serviceDesc: { fontSize: 11.5, color: "#64748B", lineHeight: 16, marginTop: 2, marginBottom: 8 },
  docsWrap: { backgroundColor: "#F8FAFC", padding: 8, borderRadius: 8, marginBottom: 10 },
  docsTitle: { fontSize: 11, fontWeight: "700", color: "#475569", marginBottom: 4 },
  docItem: { fontSize: 11, color: "#334155", lineHeight: 16 },
  serviceApplyBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#FFF7ED",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  serviceApplyBtnText: { fontSize: 11.5, fontWeight: "800", color: "#C2410C" },
});
