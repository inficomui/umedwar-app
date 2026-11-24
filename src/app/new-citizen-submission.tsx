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
  Modal,
  FlatList,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { Department } from "../types/citizenServices.types";
import { citizenServicesApi } from "../services/citizenServicesApi";
import { issuesApi, IssueCategory } from "../services/issuesApi";
import { authApi } from "../services/authApi";
import { getCachedPushTokens } from "../services/notificationPushService";

function mapDepartmentToIssueCategory(deptName: string): IssueCategory {
  const s = (deptName || "").toLowerCase();
  if (s.includes("पाणी") || s.includes("जल") || s.includes("water")) return "water";
  if (s.includes("वीज") || s.includes("महावितरण") || s.includes("विद्युत") || s.includes("electric")) return "electricity";
  if (s.includes("रस्ते") || s.includes("बांधकाम") || s.includes("पीडब्ल्यूडी") || s.includes("pwd") || s.includes("road")) return "roads";
  if (s.includes("स्वच्छता") || s.includes("कचरा") || s.includes("नगरपरिषद") || s.includes("clean")) return "cleanliness";
  if (s.includes("गटार") || s.includes("नाले") || s.includes("drain")) return "drain";
  if (s.includes("आरोग्य") || s.includes("रुग्णालय") || s.includes("दवाखाना") || s.includes("health")) return "health";
  if (s.includes("शिक्षण") || s.includes("शाळा") || s.includes("college") || s.includes("education")) return "education";
  if (s.includes("दिवे") || s.includes("पथदिवे") || s.includes("light")) return "lights";
  if (s.includes("पर्यावरण") || s.includes("वन") || s.includes("forest") || s.includes("environment")) return "environment";
  return "public";
}

export default function NewCitizenSubmissionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    departmentId?: string;
    serviceId?: string;
    subject?: string;
  }>();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(
    params.departmentId ? Number(params.departmentId) : null
  );
  const [submissionType, setSubmissionType] = useState<"complaint" | "request">("complaint");
  const [citizenName, setCitizenName] = useState("");
  const [citizenMobile, setCitizenMobile] = useState("");
  const [village, setVillage] = useState("कोपरगाव");
  const [subject, setSubject] = useState(params.subject || "");
  const [description, setDescription] = useState("");
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [deptSearch, setDeptSearch] = useState("");

  useEffect(() => {
    const currentUser = authApi.getUser();
    if (currentUser) {
      if (currentUser.name) setCitizenName(currentUser.name);
      if (currentUser.mobile) setCitizenMobile(currentUser.mobile);
    }

    citizenServicesApi
      .getDepartments()
      .then((data) => {
        if (data && data.length > 0) {
          setDepartments(data);
          if (!selectedDeptId) {
            setSelectedDeptId(data[0].id);
          }
        }
      })
      .finally(() => setLoadingDepts(false));
  }, []);

  const selectedDept = departments.find((d) => d.id === selectedDeptId);

  const isPolice =
    selectedDept?.code?.toLowerCase().includes("police") ||
    selectedDept?.emergency_contact === "112" ||
    selectedDept?.name?.includes("पोलीस");

  const isCyber =
    selectedDept?.code?.toLowerCase().includes("cyber") ||
    selectedDept?.emergency_contact === "1930";

  const handleDial = (num: string) => {
    Linking.openURL(`tel:${num}`).catch(() => {
      Alert.alert("त्रुटी", "कॉल सुरू करता आला नाही.");
    });
  };

  const handleSubmit = async () => {
    if (!selectedDeptId) {
      Alert.alert("विभाग निवडा", "कृपया संबंधित शासकीय विभाग निवडा.");
      return;
    }
    if (!citizenName.trim()) {
      Alert.alert("नाव आवश्यक", "कृपया आपले पूर्ण नाव प्रविष्ट करा.");
      return;
    }
    const cleanMobile = citizenMobile.trim().replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      Alert.alert("अवैध मोबाईल", "कृपया १० अंकी वैध मोबाईल नंबर प्रविष्ट करा.");
      return;
    }
    if (!village.trim()) {
      Alert.alert("गाव/शहर आवश्यक", "कृपया गावाचे किंवा प्रभागाचे नाव लिहा.");
      return;
    }
    if (!subject.trim()) {
      Alert.alert("विषय आवश्यक", "कृपया तक्रार किंवा अर्जाचा विषय लिहा.");
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      Alert.alert("सविस्तर माहिती आवश्यक", "कृपया तक्रारीचे सविस्तर वर्णन लिहा.");
      return;
    }

    try {
      setSubmitting(true);
      const currentUser = authApi.getUser();
      const deptObj = departments.find((d) => d.id === selectedDeptId);
      const deptName = deptObj ? deptObj.name : "शासकीय विभाग";

      // Attach push notification device tokens for real-time tracking updates
      const cachedTokens = await getCachedPushTokens();
      const deviceToken = cachedTokens?.fcmToken || cachedTokens?.expoToken || undefined;

      // 1. Primary Submission: Citizen Services 26-Department Grievance System
      const res = await citizenServicesApi.createSubmission({
        department_id: selectedDeptId,
        service_id: params.serviceId ? Number(params.serviceId) : undefined,
        submission_type: submissionType,
        citizen_name: citizenName.trim(),
        citizen_mobile: cleanMobile,
        village: village.trim(),
        subject: subject.trim(),
        description: description.trim(),
        device_token: deviceToken,
      });

      const refNo = res?.data?.reference_number || `CSK-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      // 2. Dual-Sync to Main Issues API (/api/v1/issues) so the Admin Panel's main Complaints Table receives it immediately
      let issueSyncSuccess = false;
      try {
        await issuesApi.createIssue({
          title: `[${deptName}] ${subject.trim()}`,
          description: `${description.trim()}\n\n🏛️ संबंधित विभाग: ${deptName}\n📍 गाव/वार्ड: ${village.trim()}\n📋 संदर्भ क्रमांक: ${refNo}\n📌 प्रकार: ${submissionType === "complaint" ? "तक्रार निवारण" : "सेवा अर्ज"}`,
          category: mapDepartmentToIssueCategory(deptName),
          location: village.trim(),
          ward: village.trim(),
          userName: citizenName.trim(),
          userMobile: cleanMobile,
          userId: currentUser?.id ? String(currentUser.id) : undefined,
          userEmail: currentUser?.email,
          fcmToken: cachedTokens?.fcmToken || undefined,
          expoToken: cachedTokens?.expoToken || undefined,
        });
        issueSyncSuccess = true;
      } catch (syncErr) {
        console.warn("[NewCitizenSubmission] Dual-sync to issuesApi warning:", syncErr);
      }

      if (res.success || issueSyncSuccess) {
        Alert.alert(
          "✅ तक्रार यशस्वीरित्या नोंदवली!",
          `आपला संदर्भ क्रमांक:\n${refNo}\n\nमा. श्री. सचिन मलिक जनसंपर्क कार्यालयामार्फत २४ तासांच्या आत आपल्या अर्जाचा पहिला प्रगती अद्यतन दिला जाईल.`,
          [
            {
              text: "स्थिती ट्रॅक करा",
              onPress: () => {
                router.replace({
                  pathname: "/submission-tracking",
                  params: { referenceNumber: refNo },
                });
              },
            },
            {
              text: "मुख्य पान",
              onPress: () => router.replace("/home"),
            },
          ]
        );
      } else {
        Alert.alert("त्रुटी", res.message || "तक्रार नोंदवण्यात त्रुटी आली.");
      }
    } catch (err: any) {
      Alert.alert("सर्व्हर त्रुटी", err.message || "सर्व्हरशी संपर्क होऊ शकला नाही.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase())
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
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerMainTitle}>तक्रार / मागणी अर्ज नोंदणी</Text>
          <Text style={styles.headerSubTitle}>नागरिक सेवा व तक्रार व्यवस्थापन कक्ष</Text>
        </View>
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
        {/* 24-Hour SLA Guarantee Notice */}
        <View style={styles.noticeBox}>
          <View style={styles.noticeIconWrap}>
            <Icon source="clock-fast" size={22} color="#EA580C" />
          </View>
          <View style={styles.noticeTextWrap}>
            <Text style={styles.noticeTitle}>⏱️ २४-तास संनियंत्रण कक्ष हमी</Text>
            <Text style={styles.noticeText}>
              मा. श्री. सचिन मलिक जनसंपर्क कार्यालयामार्फत आपल्या तक्रारीचा संबंधित २६ शासकीय विभागांशी समन्वय साधून २४ तासांत थेट पाठपुरावा केला जातो.
            </Text>
          </View>
        </View>

        {/* Emergency Alert Banner if Police or Cyber */}
        {isPolice && (
          <View style={styles.emergencyBox}>
            <View style={styles.emergencyHeaderRow}>
              <Icon source="alert-octagon" size={22} color="#DC2626" />
              <Text style={styles.emergencyTitle}>🚨 तातडीची पोलीस मदत?</Text>
            </View>
            <Text style={styles.emergencyText}>
              तातडीच्या, गंभीर किंवा जीवघेण्या आपत्कालीन परिस्थितीत तात्काळ डायल ११२ वर थेट संपर्क साधावा.
            </Text>
            <TouchableOpacity
              style={styles.emergencyCallBtn}
              activeOpacity={0.85}
              onPress={() => handleDial("112")}
            >
              <Icon source="phone-in-talk" size={16} color="#FFFFFF" />
              <Text style={styles.emergencyCallBtnText}>डायल ११२ (तातडीचा कॉल)</Text>
            </TouchableOpacity>
          </View>
        )}

        {isCyber && (
          <View style={styles.emergencyBox}>
            <View style={styles.emergencyHeaderRow}>
              <Icon source="shield-alert" size={22} color="#DC2626" />
              <Text style={styles.emergencyTitle}>🚨 सायबर आर्थिक फसवणूक?</Text>
            </View>
            <Text style={styles.emergencyText}>
              ऑनलाइन बँक फसवणूक झाल्यास त्वरित राष्ट्रीय हेल्पलाईन १९३० वर संपर्क साधा.
            </Text>
            <TouchableOpacity
              style={styles.emergencyCallBtn}
              activeOpacity={0.85}
              onPress={() => handleDial("1930")}
            >
              <Icon source="phone-in-talk" size={16} color="#FFFFFF" />
              <Text style={styles.emergencyCallBtnText}>डायल १९३० (सायबर हेल्पलाईन)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submission Type Switcher */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>अर्जाचा प्रकार निवडा *</Text>
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                submissionType === "complaint" && styles.typeBtnActive,
              ]}
              onPress={() => setSubmissionType("complaint")}
              activeOpacity={0.85}
            >
              <Icon
                source="alert-circle-outline"
                size={18}
                color={submissionType === "complaint" ? "#FFFFFF" : "#64748B"}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  submissionType === "complaint" && styles.typeBtnTextActive,
                ]}
              >
                तक्रार (Grievance)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                submissionType === "request" && styles.typeBtnActive,
              ]}
              onPress={() => setSubmissionType("request")}
              activeOpacity={0.85}
            >
              <Icon
                source="file-document-edit-outline"
                size={18}
                color={submissionType === "request" ? "#FFFFFF" : "#64748B"}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  submissionType === "request" && styles.typeBtnTextActive,
                ]}
              >
                मागणी / सेवा अर्ज (Request)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Department Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>शासकीय विभाग निवडा (२६ विभाग) *</Text>
          <TouchableOpacity
            style={styles.deptSelectButton}
            onPress={() => setShowDeptPicker(true)}
            activeOpacity={0.85}
          >
            <View style={styles.deptSelectLeft}>
              <Icon source="office-building" size={20} color="#EA580C" />
              <Text
                style={selectedDept ? styles.deptSelectText : styles.deptSelectPlaceholder}
                numberOfLines={1}
              >
                {selectedDept ? selectedDept.name : "विभाग निवडण्यासाठी येथे टॅप करा"}
              </Text>
            </View>
            <Icon source="chevron-down" size={22} color="#64748B" />
          </TouchableOpacity>
          {(selectedDept?.official_contact || selectedDept?.contact_number) && (
            <Text style={styles.deptContactHint}>
              📞 संपर्क / हेल्पलाईन: {selectedDept.official_contact || selectedDept.contact_number}
            </Text>
          )}
        </View>

        {/* Citizen Full Name */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>आपले पूर्ण नाव</Text>
          <TextInput
            style={styles.input}
            placeholder="उदा. रमेश मारुती शिंदे"
            placeholderTextColor="#94A3B8"
            value={citizenName}
            onChangeText={setCitizenName}
          />
        </View>

        {/* Mobile Number */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>मोबाईल नंबर (१० अंकी) *</Text>
          <View style={styles.mobileInputWrap}>
            <Text style={styles.prefixText}>+91</Text>
            <TextInput
              style={styles.mobileInput}
              placeholder="9876543210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
              value={citizenMobile}
              onChangeText={setCitizenMobile}
            />
          </View>
          <Text style={styles.fieldHint}>
            या क्रमांकावर SMS व WhatsApp द्वारे २४ तासांत प्रगती अद्यतन पाठवले जाईल.
          </Text>
        </View>

        {/* Village / Ward */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>गाव / प्रभाग / परिसर *</Text>
          <TextInput
            style={styles.input}
            placeholder="उदा. कोपरगाव, शिर्डी, येवला..."
            placeholderTextColor="#94A3B8"
            value={village}
            onChangeText={setVillage}
          />
        </View>

        {/* Subject */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>विषय / समस्येचे संक्षिप्त नाव *</Text>
          <TextInput
            style={styles.input}
            placeholder="उदा. वीज पुरवठा खंडित, रस्ता दुरुस्ती, रेशन कार्ड..."
            placeholderTextColor="#94A3B8"
            value={subject}
            onChangeText={setSubject}
          />
        </View>

        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>सविस्तर तक्रार / मागणीचे वर्णन *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="आपली समस्या किंवा कामाचे स्वरूप सविस्तर नमूद करा..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon source="send" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>तक्रार नोंदवा (२४-तास SLA सुरू करा)</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>

      {/* Department Picker Modal */}
      <Modal
        visible={showDeptPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeptPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>शासकीय विभाग निवडा (२६ विभाग)</Text>
              <TouchableOpacity
                onPress={() => setShowDeptPicker(false)}
                style={styles.modalCloseBtn}
              >
                <Icon source="close" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchWrap}>
              <Icon source="magnify" size={20} color="#94A3B8" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="विभाग शोधा (उदा. महावितरण, पाणीपुरवठा, तहसील)..."
                placeholderTextColor="#94A3B8"
                value={deptSearch}
                onChangeText={setDeptSearch}
              />
            </View>

            {loadingDepts ? (
              <ActivityIndicator size="large" color="#EA580C" style={{ marginVertical: 30 }} />
            ) : (
              <FlatList
                data={filteredDepts}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.deptItemRow,
                      selectedDeptId === item.id && styles.deptItemRowActive,
                    ]}
                    onPress={() => {
                      setSelectedDeptId(item.id);
                      setShowDeptPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.deptItemTextWrap}>
                      <Text
                        style={[
                          styles.deptItemName,
                          selectedDeptId === item.id && styles.deptItemNameActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {(item.services_count !== undefined || item.total_services !== undefined) && (
                        <Text style={styles.deptItemServices}>
                          {item.services_count ?? item.total_services} अधिकृत सेवा समाविष्ट
                        </Text>
                      )}
                    </View>
                    {selectedDeptId === item.id && (
                      <Icon source="check-circle" size={20} color="#EA580C" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  noticeBox: {
    flexDirection: "row",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDBA74",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  noticeIconWrap: {
    marginTop: 2,
  },
  noticeTextWrap: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#9A3412",
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 12,
    color: "#7C2D12",
    lineHeight: 18,
  },
  emergencyBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  emergencyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#991B1B",
  },
  emergencyText: {
    fontSize: 12,
    color: "#7F1D1D",
    lineHeight: 18,
    marginBottom: 10,
  },
  emergencyCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
    alignSelf: "flex-start",
  },
  emergencyCallBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  formGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
  },
  typeSelectorRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  typeBtnActive: {
    backgroundColor: "#EA580C",
    borderColor: "#EA580C",
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  typeBtnTextActive: {
    color: "#FFFFFF",
  },
  deptSelectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  deptSelectLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  deptSelectText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  deptSelectPlaceholder: {
    fontSize: 13,
    color: "#94A3B8",
    flex: 1,
  },
  deptContactHint: {
    fontSize: 11.5,
    color: "#EA580C",
    marginTop: 6,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.2,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 14,
    color: "#0F172A",
  },
  mobileInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.2,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    marginRight: 8,
  },
  mobileInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    paddingVertical: 10,
    minHeight: 44,
  },
  fieldHint: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 5,
    lineHeight: 16,
  },
  textArea: {
    minHeight: 110,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    borderRadius: 12,
    paddingVertical: 15,
    gap: 8,
    marginTop: 10,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    color: "#0F172A",
  },
  deptItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  deptItemRowActive: {
    backgroundColor: "#FFF7ED",
    borderRadius: 8,
  },
  deptItemTextWrap: {
    flex: 1,
  },
  deptItemName: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  deptItemNameActive: {
    color: "#EA580C",
    fontWeight: "800",
  },
  deptItemServices: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
});
