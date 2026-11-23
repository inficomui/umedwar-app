import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Linking,
  Share,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { Submission } from "../types/citizenServices.types";
import { citizenServicesApi } from "../services/citizenServicesApi";

export default function SubmissionTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ referenceNumber?: string }>();

  const [inputRefNumber, setInputRefNumber] = useState(params.referenceNumber || "");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [followUpMsg, setFollowUpMsg] = useState("");
  const [postingFollowUp, setPostingFollowUp] = useState(false);

  useEffect(() => {
    if (params.referenceNumber && params.referenceNumber.trim()) {
      fetchStatus(params.referenceNumber.trim());
    }
  }, [params.referenceNumber]);

  const fetchStatus = async (refNo: string) => {
    if (!refNo.trim()) {
      Alert.alert("संदर्भ क्रमांक आवश्यक", "कृपया आपला तक्रार संदर्भ क्रमांक प्रविष्ट करा.");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const data = await citizenServicesApi.getSubmissionTracking(refNo.trim());
      setSubmission(data);
    } catch (err: any) {
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRef = async (refNo: string) => {
    try {
      await Share.share({
        message: `माझे सचिन मलिक नागरिक कक्ष - तक्रार संदर्भ क्रमांक: ${refNo}`,
      });
    } catch {
      Alert.alert("संदर्भ क्रमांक", refNo);
    }
  };

  const handleDial = (num: string) => {
    Linking.openURL(`tel:${num}`).catch(() => {
      Alert.alert("त्रुटी", "कॉल सुरू करता आला नाही.");
    });
  };

  const handlePostFollowUp = async () => {
    if (!submission || !followUpMsg.trim()) {
      Alert.alert("संदेश आवश्यक", "कृपया आपला पाठपुरावा संदेश किंवा विचारणा लिहा.");
      return;
    }

    try {
      setPostingFollowUp(true);
      const res = await citizenServicesApi.postFollowUp(submission.id, followUpMsg.trim());
      if (res.success) {
        Alert.alert("यशस्वी", res.message || "आपला संदेश नोंदवला गेला आहे.");
        setFollowUpMsg("");
        // Reload details to show updated timeline
        if (submission.reference_number) {
          fetchStatus(submission.reference_number);
        }
      } else {
        Alert.alert("त्रुटी", res.message || "संदेश पाठवण्यात त्रुटी आली.");
      }
    } catch (err: any) {
      Alert.alert("त्रुटी", err.message || "सर्व्हरशी संपर्क होऊ शकला नाही.");
    } finally {
      setPostingFollowUp(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return { label: "निवारण झाले (RESOLVED)", bg: "#DCFCE7", text: "#166534" };
      case "in_progress":
      case "processing":
        return { label: "प्रगतीपथावर (IN PROGRESS)", bg: "#DBEAFE", text: "#1E40AF" };
      case "escalated":
        return { label: "वरिष्ठ स्तरावर वर्ग (ESCALATED)", bg: "#FEE2E2", text: "#991B1B" };
      case "rejected":
        return { label: "नाकारले (REJECTED)", bg: "#F1F5F9", text: "#475569" };
      case "received":
      default:
        return { label: "प्राप्त (RECEIVED)", bg: "#FFEDD5", text: "#9A3412" };
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
          <Text style={styles.headerMainTitle}>तक्रार स्थिती ट्रॅकिंग</Text>
          <Text style={styles.headerSubTitle}>२४-तास SLA संनियंत्रण कक्ष</Text>
        </View>
        <TouchableOpacity
          style={styles.headerRightBtn}
          onPress={() => router.push("/my-citizen-submissions")}
          activeOpacity={0.8}
        >
          <Icon source="format-list-bulleted" size={20} color="#EA580C" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Search Input Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchLabel}>संदर्भ क्रमांक प्रविष्ट करा</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="उदा. CIT-2026-1001"
              placeholderTextColor="#94A3B8"
              value={inputRefNumber}
              onChangeText={setInputRefNumber}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={() => fetchStatus(inputRefNumber)}
              activeOpacity={0.85}
            >
              <Icon source="magnify" size={20} color="#FFFFFF" />
              <Text style={styles.searchBtnText}>शोधा</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#EA580C" />
            <Text style={styles.loadingText}>तक्रारीची सद्यस्थिती तपासत आहे...</Text>
          </View>
        )}

        {!loading && searched && !submission && (
          <View style={styles.notFoundCard}>
            <Icon source="alert-circle-outline" size={44} color="#DC2626" />
            <Text style={styles.notFoundTitle}>अर्ज / तक्रार आढळली नाही</Text>
            <Text style={styles.notFoundSubtitle}>
              कृपया आपला संदर्भ क्रमांक बरोबर असल्याची खात्री करा किंवा नवीन तक्रार नोंदवा.
            </Text>
            <TouchableOpacity
              style={styles.newGrievanceBtn}
              onPress={() => router.push("/new-citizen-submission")}
              activeOpacity={0.85}
            >
              <Icon source="plus-circle" size={18} color="#FFFFFF" />
              <Text style={styles.newGrievanceBtnText}>नवीन तक्रार नोंदवा</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && submission && (
          <>
            {/* Top Reference Card */}
            <View style={styles.topCard}>
              <View style={styles.refRow}>
                <View>
                  <Text style={styles.refHeading}>तक्रार संदर्भ क्रमांक</Text>
                  <Text style={styles.refNumber}>{submission.reference_number}</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => handleCopyRef(submission.reference_number)}
                  activeOpacity={0.7}
                >
                  <Icon source="content-copy" size={16} color="#EA580C" />
                  <Text style={styles.copyBtnText}>कॉपी</Text>
                </TouchableOpacity>
              </View>

              {/* Status and 24-hr SLA pills */}
              <View style={styles.badgeRow}>
                {(() => {
                  const b = getStatusBadge(submission.status);
                  return (
                    <View style={[styles.statusPill, { backgroundColor: b.bg }]}>
                      <Text style={[styles.statusText, { color: b.text }]}>{b.label}</Text>
                    </View>
                  );
                })()}

                <View
                  style={[
                    styles.slaPill,
                    submission.sla_status === "met" ? styles.slaMet : styles.slaPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.slaPillText,
                      submission.sla_status === "met"
                        ? styles.slaMetText
                        : styles.slaPendingText,
                    ]}
                  >
                    {submission.sla_status === "met"
                      ? "✓ २४-तास SLA पूर्ण"
                      : "⏳ २४-तास SLA संनियंत्रण सुरू"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Application Details */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>📋 अर्जाचा तपशील</Text>

              {submission.department && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>संबंधित विभाग:</Text>
                  <Text style={styles.detailValueBold}>{submission.department.name}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>विषय:</Text>
                <Text style={styles.detailValueBold}>{submission.subject}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>गाव / परिसर:</Text>
                <Text style={styles.detailValue}>
                  {submission.village}
                  {submission.taluka ? `, ता. ${submission.taluka}` : ""}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>दाखल दिनांक:</Text>
                <Text style={styles.detailValue}>
                  {new Date(submission.created_at).toLocaleDateString("mr-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>

              <View style={styles.descDivider} />
              <Text style={styles.descHeading}>तक्रारीचे सविस्तर वर्णन:</Text>
              <Text style={styles.detailDesc}>{submission.description}</Text>
            </View>

            {/* Assigned Officer Card if available */}
            {submission.assignedOfficer && (
              <View style={styles.officerBox}>
                <View style={styles.officerHeader}>
                  <Icon source="badge-account" size={22} color="#EA580C" />
                  <Text style={styles.officerTitle}>👤 जबाबदार नियुक्त अधिकारी</Text>
                </View>
                <Text style={styles.officerName}>{submission.assignedOfficer.name}</Text>
                <Text style={styles.officerSub}>{submission.assignedOfficer.designation}</Text>
                {(submission.assignedOfficer.phone || submission.assignedOfficer.contact_number) && (
                  <TouchableOpacity
                    style={styles.officerPhoneRow}
                    onPress={() => handleDial((submission.assignedOfficer?.phone || submission.assignedOfficer?.contact_number)!)}
                    activeOpacity={0.8}
                  >
                    <Icon source="phone" size={16} color="#059669" />
                    <Text style={styles.officerPhoneText}>
                      थेट संपर्क: {submission.assignedOfficer.phone || submission.assignedOfficer.contact_number}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Actions Timeline */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>📜 अखंड प्रगती इतिहास (Timeline)</Text>
              {submission.actions && submission.actions.length > 0 ? (
                submission.actions.map((act, idx) => (
                  <View key={act.id || idx} style={styles.timelineItem}>
                    <View style={styles.timelineDotWrap}>
                      <View style={styles.timelineDot} />
                      {idx < (submission.actions?.length || 0) - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.actionDesc}>{act.description}</Text>
                      <Text style={styles.actionDate}>
                        {new Date(act.created_at).toLocaleString("mr-IN")}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTimeline}>
                  <Text style={styles.emptyTimelineText}>
                    अर्ज नोंदणीकृत झाला आहे. २४ तासांच्या आत अधिकारी स्तरावर पुढील कारवाई नोंदवली जाईल.
                  </Text>
                </View>
              )}
            </View>

            {/* Follow-up Inquiry Box */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>💬 पाठपुरावा संदेश / विचारणा</Text>
              <Text style={styles.followUpHint}>
                आपल्या तक्रारीविषयी अधिक माहिती किंवा विचारणा थेट जनसंपर्क कार्यालयास कळवा:
              </Text>
              <TextInput
                style={styles.followUpInput}
                placeholder="आपली अधिक माहिती किंवा विचारणा येथे लिहा..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={followUpMsg}
                onChangeText={setFollowUpMsg}
              />
              <TouchableOpacity
                style={[
                  styles.followUpBtn,
                  postingFollowUp && styles.followUpBtnDisabled,
                ]}
                onPress={handlePostFollowUp}
                disabled={postingFollowUp}
                activeOpacity={0.85}
              >
                {postingFollowUp ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon source="send" size={16} color="#FFFFFF" />
                    <Text style={styles.followUpBtnText}>संदेश पाठवा</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerRightBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  searchBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  searchLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.2,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EA580C",
    paddingHorizontal: 16,
    borderRadius: 12,
    minHeight: 48,
    gap: 6,
  },
  searchBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  notFoundCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginTop: 10,
  },
  notFoundTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#991B1B",
    marginTop: 10,
    marginBottom: 6,
  },
  notFoundSubtitle: {
    fontSize: 12.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },
  newGrievanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EA580C",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    gap: 8,
  },
  newGrievanceBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  topCard: {
    backgroundColor: "#FFF7ED",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FDBA74",
    marginBottom: 14,
  },
  refRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  refHeading: {
    fontSize: 11.5,
    color: "#9A3412",
    fontWeight: "700",
  },
  refNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: "#C2410C",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FDBA74",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  copyBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#EA580C",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  slaPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  slaMet: {
    backgroundColor: "#DCFCE7",
  },
  slaPending: {
    backgroundColor: "#FEF3C7",
  },
  slaPillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  slaMetText: {
    color: "#166534",
  },
  slaPendingText: {
    color: "#92400E",
  },
  sectionBox: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    width: 105,
    fontSize: 12.5,
    color: "#64748B",
    fontWeight: "600",
  },
  detailValue: {
    flex: 1,
    fontSize: 12.5,
    color: "#1E293B",
  },
  detailValueBold: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "700",
  },
  descDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  descHeading: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 4,
  },
  detailDesc: {
    fontSize: 13,
    color: "#1E293B",
    lineHeight: 20,
  },
  officerBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  officerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  officerTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#166534",
  },
  officerName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  officerSub: {
    fontSize: 12,
    color: "#15803D",
    marginTop: 2,
    fontWeight: "600",
  },
  officerPhoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  officerPhoneText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#059669",
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 14,
  },
  timelineDotWrap: {
    width: 20,
    alignItems: "center",
    marginRight: 10,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EA580C",
    marginTop: 3,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#FED7AA",
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  actionDesc: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 18,
  },
  actionDate: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 3,
  },
  emptyTimeline: {
    paddingVertical: 10,
  },
  emptyTimelineText: {
    fontSize: 12.5,
    color: "#64748B",
    lineHeight: 18,
    fontStyle: "italic",
  },
  followUpHint: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
  },
  followUpInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.2,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13.5,
    color: "#0F172A",
    textAlignVertical: "top",
    minHeight: 85,
    marginBottom: 12,
  },
  followUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
    alignSelf: "flex-end",
    paddingHorizontal: 18,
  },
  followUpBtnDisabled: {
    opacity: 0.6,
  },
  followUpBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
