import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  StatusBar,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import {
  CIVIC_DEPARTMENTS_DATA,
  CivicDepartment,
} from "../constants/manifestoAndServicesData";
import { useCampaign } from "../context/CampaignContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CivicServicesScreen() {
  const router = useRouter();
  const { candidate } = useCampaign();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDept, setSelectedDept] = useState<CivicDepartment | null>(null);
  const [activeTab, setActiveTab] = useState<"services" | "grievances">("services");

  // Application Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyType, setApplyType] = useState<"service" | "grievance">("service");
  const [selectedItemName, setSelectedItemName] = useState("");
  const [citizenName, setCitizenName] = useState("");
  const [citizenMobile, setCitizenMobile] = useState("");
  const [citizenVillage, setCitizenVillage] = useState("");
  const [citizenSubject, setCitizenSubject] = useState("");
  const [citizenDetails, setCitizenDetails] = useState("");
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  // Filter departments
  const filteredDepartments = useMemo(() => {
    return CIVIC_DEPARTMENTS_DATA.filter((dept) => {
      const matchSearch =
        !searchQuery.trim() ||
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        dept.grievances.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat =
        selectedCategory === "all" || dept.category === selectedCategory;

      return matchSearch && matchCat;
    });
  }, [searchQuery, selectedCategory]);

  const openApplication = (dept: CivicDepartment, type: "service" | "grievance", item: string) => {
    setSelectedDept(dept);
    setApplyType(type);
    setSelectedItemName(item);
    setCitizenSubject(`${dept.name} - ${item}`);
    setIsApplyModalOpen(true);
  };

  const handleSubmitApplication = () => {
    if (!citizenName.trim() || !citizenMobile.trim() || !citizenVillage.trim()) {
      Alert.alert("माहिती अपूर्ण", "कृपया आपले नाव, मोबाईल क्रमांक आणि गावाचे नाव प्रविष्ट करा.");
      return;
    }
    if (citizenMobile.trim().length < 10) {
      Alert.alert("त्रुटी", "कृपया वैध १० अंकी मोबाईल नंबर प्रविष्ट करा.");
      return;
    }

    const randomId = `APP-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedAppId(randomId);
  };

  const closeApplyModal = () => {
    setIsApplyModalOpen(false);
    setSubmittedAppId(null);
    setCitizenName("");
    setCitizenMobile("");
    setCitizenVillage("");
    setCitizenSubject("");
    setCitizenDetails("");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
          activeOpacity={0.85}
        >
          <Icon source="arrow-left" size={22} color="#2563EB" />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>नागरिक सेवा व तक्रार व्यवस्थापन</Text>
          <Text style={styles.headerSubtitle}>२६ शासकीय विभाग • सेवा व तक्रारी</Text>
        </View>

        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => router.push("/my-issues")}
          activeOpacity={0.85}
        >
          <Icon source="clipboard-text-clock-outline" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Icon source="bank-outline" size={14} color="#FFFFFF" />
            <Text style={styles.heroBadgeText}>एक खिडकी नागरिक सेवा कक्ष</Text>
          </View>
          <Text style={styles.heroTitle}>विभागनिहाय सेवा, तक्रार व अर्ज प्रणाली</Text>
          <Text style={styles.heroSubtitle}>
            तहसील, पं. समिती, महावितरण, पाणीपुरवठा किंवा पोलीस स्टेशन—कोणत्याही शासकीय विभागाशी संबंधित अर्ज किंवा तक्रार दाखल करा आणि पाठपुरावा मिळवा.
          </Text>

          <View style={styles.stepsRow}>
            <View style={styles.stepPill}>
              <Text style={styles.stepPillNum}>१</Text>
              <Text style={styles.stepPillText}>विभाग निवडा</Text>
            </View>
            <Icon source="chevron-right" size={16} color="#93C5FD" />
            <View style={styles.stepPill}>
              <Text style={styles.stepPillNum}>२</Text>
              <Text style={styles.stepPillText}>सेवा / तक्रार</Text>
            </View>
            <Icon source="chevron-right" size={16} color="#93C5FD" />
            <View style={styles.stepPill}>
              <Text style={styles.stepPillNum}>३</Text>
              <Text style={styles.stepPillText}>थेट पाठपुरावा</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Icon source="magnify" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="विभाग, दाखला किंवा समस्या शोधा (उदा. उत्पन्न दाखला, वीज)..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon source="close-circle" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          {[
            { key: "all", label: "सर्व २६ विभाग" },
            { key: "revenue", label: "महसूल व दाखले" },
            { key: "panchayat", label: "ग्राम व पंचायत" },
            { key: "utilities", label: "वीज, पाणी व रस्ते" },
            { key: "welfare", label: "शेती, आरोग्य व शिक्षण" },
            { key: "security", label: "पोलीस व कायदा" },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.catPill,
                selectedCategory === cat.key && styles.catPillActive,
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Text
                style={[
                  styles.catPillText,
                  selectedCategory === cat.key && styles.catPillTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Department Cards List */}
        <View style={styles.deptList}>
          {filteredDepartments.map((dept, idx) => (
            <TouchableOpacity
              key={dept.id}
              style={styles.deptCard}
              activeOpacity={0.88}
              onPress={() => setSelectedDept(dept)}
            >
              <View style={styles.deptCardHeader}>
                <View style={styles.deptIconBadge}>
                  <Icon source={dept.iconName} size={24} color="#2563EB" />
                </View>
                <View style={styles.deptCardInfo}>
                  <Text style={styles.deptName}>{dept.name}</Text>
                  <Text style={styles.deptEnglish}>{dept.englishName}</Text>
                </View>
                <Icon source="chevron-right" size={20} color="#9CA3AF" />
              </View>

              <View style={styles.deptStatsRow}>
                <View style={styles.statChip}>
                  <Icon source="file-document-outline" size={12} color="#1D4ED8" />
                  <Text style={styles.statChipText}>{dept.services.length} उपलब्ध सेवा</Text>
                </View>
                <View style={[styles.statChip, { backgroundColor: "#FEF2F2" }]}>
                  <Icon source="alert-circle-outline" size={12} color="#DC2626" />
                  <Text style={[styles.statChipText, { color: "#B91C1C" }]}>
                    {dept.grievances.length} तक्रार विषय
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* DEPARTMENT DETAILS MODAL */}
      <Modal
        visible={Boolean(selectedDept && !isApplyModalOpen)}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedDept(null)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={["top", "left", "right"]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedDept(null)}
            >
              <Icon source="arrow-left" size={22} color="#2563EB" />
            </TouchableOpacity>
            <View style={{ flex: 1, paddingHorizontal: 10 }}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedDept?.name}
              </Text>
              <Text style={styles.modalSubtitle}>{selectedDept?.englishName}</Text>
            </View>
            <View style={{ width: 38 }} />
          </View>

          {selectedDept && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Emergency Notice if available */}
              {selectedDept.specialNotice && (
                <View style={styles.specialNoticeBox}>
                  <Icon source="alert-octagon-outline" size={20} color="#B91C1C" />
                  <Text style={styles.specialNoticeText}>{selectedDept.specialNotice}</Text>
                </View>
              )}

              {/* Segmented Switch: सेवा व अर्ज vs तक्रारी */}
              <View style={styles.tabToggleRow}>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === "services" && styles.tabButtonActive]}
                  onPress={() => setActiveTab("services")}
                >
                  <Icon
                    source="file-check-outline"
                    size={16}
                    color={activeTab === "services" ? "#FFFFFF" : "#4B5563"}
                  />
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "services" && styles.tabButtonTextActive,
                    ]}
                  >
                    दाखले व सेवा ({selectedDept.services.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, activeTab === "grievances" && styles.tabButtonActiveGrievance]}
                  onPress={() => setActiveTab("grievances")}
                >
                  <Icon
                    source="alert-circle-outline"
                    size={16}
                    color={activeTab === "grievances" ? "#FFFFFF" : "#4B5563"}
                  />
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "grievances" && styles.tabButtonTextActive,
                    ]}
                  >
                    तक्रारी ({selectedDept.grievances.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Items List */}
              <View style={styles.itemsListContainer}>
                {activeTab === "services" ? (
                  selectedDept.services.map((srv, i) => (
                    <View key={i} style={styles.serviceItemCard}>
                      <View style={styles.itemLeft}>
                        <View style={styles.itemDot} />
                        <Text style={styles.itemTitle}>{srv}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={() => openApplication(selectedDept, "service", srv)}
                      >
                        <Text style={styles.applyBtnText}>अर्ज करा</Text>
                        <Icon source="arrow-right" size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  selectedDept.grievances.map((grv, i) => (
                    <View key={i} style={[styles.serviceItemCard, { borderColor: "#FECACA" }]}>
                      <View style={styles.itemLeft}>
                        <View style={[styles.itemDot, { backgroundColor: "#DC2626" }]} />
                        <Text style={styles.itemTitle}>{grv}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.applyBtn, { backgroundColor: "#DC2626" }]}
                        onPress={() => openApplication(selectedDept, "grievance", grv)}
                      >
                        <Text style={styles.applyBtnText}>तक्रार नोंदवा</Text>
                        <Icon source="arrow-right" size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ONLINE APPLICATION / COMPLAINT FORM MODAL */}
      <Modal
        visible={isApplyModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={closeApplyModal}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={["top", "left", "right"]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.backButton} onPress={closeApplyModal}>
              <Icon source="close" size={22} color="#1C1917" />
            </TouchableOpacity>
            <View style={{ flex: 1, paddingHorizontal: 10 }}>
              <Text style={styles.modalTitle}>
                {applyType === "service" ? "नवीन सेवा अर्ज" : "तक्रार नोंदणी"}
              </Text>
              <Text style={styles.modalSubtitle}>{selectedDept?.name}</Text>
            </View>
            <View style={{ width: 38 }} />
          </View>

          {submittedAppId ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconBadge}>
                <Icon source="check-bold" size={36} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>आपला अर्ज यशस्वीरीत्या नोंदवला गेला आहे!</Text>
              <View style={styles.appIdBox}>
                <Text style={styles.appIdLabel}>अर्ज / तक्रार क्रमांक (Application ID):</Text>
                <Text style={styles.appIdValue}>{submittedAppId}</Text>
              </View>
              <Text style={styles.successDesc}>
                हा अर्ज संबंधित शासकीय विभागाकडे पाठपुराव्यासाठी पाठवला गेला आहे. आमचे प्रतिनिधी २४ तासांत आपल्याशी संपर्क साधतील.
              </Text>

              {/* Status Roadmap */}
              <View style={styles.statusRoadmap}>
                <Text style={styles.roadmapHeading}>अर्जाची पुढील स्थिती (Status):</Text>
                {["अर्ज प्राप्त (Received)", "तपासणी (Under Review)", "संबंधित विभागाकडे पाठपुरावा", "निकाली (Resolved)"].map(
                  (st, idx) => (
                    <View key={idx} style={styles.roadmapRow}>
                      <Icon
                        source={idx === 0 ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                        size={16}
                        color={idx === 0 ? "#16A34A" : "#9CA3AF"}
                      />
                      <Text style={[styles.roadmapText, idx === 0 && { color: "#16A34A", fontWeight: "800" }]}>
                        {st}
                      </Text>
                    </View>
                  )
                )}
              </View>

              <TouchableOpacity style={styles.doneBtn} onPress={closeApplyModal}>
                <Text style={styles.doneBtnText}>पूर्ण झाले (Done)</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 18 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Selected Topic Card */}
              <View style={styles.formSelectedBox}>
                <Text style={styles.formSelectedLabel}>विषय / सेवा:</Text>
                <Text style={styles.formSelectedTitle}>{selectedItemName}</Text>
              </View>

              {/* Form Inputs */}
              <Text style={styles.inputLabel}>पूर्ण नाव *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="आपले संपूर्ण नाव प्रविष्ट करा"
                placeholderTextColor="#9CA3AF"
                value={citizenName}
                onChangeText={setCitizenName}
              />

              <Text style={styles.inputLabel}>मोबाईल क्रमांक *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="१० अंकी मोबाईल नंबर"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
                value={citizenMobile}
                onChangeText={setCitizenMobile}
              />

              <Text style={styles.inputLabel}>गाव / शहर *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="उदा. कोपरगाव, संवत्सर, पोहेगाव..."
                placeholderTextColor="#9CA3AF"
                value={citizenVillage}
                onChangeText={setCitizenVillage}
              />

              <Text style={styles.inputLabel}>अर्जाचा विषय</Text>
              <TextInput
                style={styles.textInput}
                value={citizenSubject}
                onChangeText={setCitizenSubject}
              />

              <Text style={styles.inputLabel}>सविस्तर माहिती / अडचण</Text>
              <TextInput
                style={[styles.textInput, { height: 90, textAlignVertical: "top" }]}
                placeholder="आपली समस्या किंवा आवश्यक माहिती थोडक्यात लिहा..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={citizenDetails}
                onChangeText={setCitizenDetails}
              />

              <TouchableOpacity
                style={styles.submitFormBtn}
                activeOpacity={0.88}
                onPress={handleSubmitApplication}
              >
                <Icon source="send" size={18} color="#FFFFFF" />
                <Text style={styles.submitFormBtnText}>अर्ज सादर करा</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleGroup: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1C1917",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#2563EB",
    fontWeight: "700",
    marginTop: 1,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Hero Card
  heroCard: {
    backgroundColor: "#1E40AF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
    marginBottom: 8,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 25,
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: "#DBEAFE",
    lineHeight: 18,
    marginTop: 6,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  stepPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepPillNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    color: "#1E40AF",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 20,
  },
  stepPillText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "700",
  },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#1C1917",
  },

  // Category Filter
  catScroll: {
    gap: 8,
    marginBottom: 14,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  catPillActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  catPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
  },
  catPillTextActive: {
    color: "#FFFFFF",
  },

  // Department List
  deptList: {
    gap: 12,
  },
  deptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deptCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deptIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  deptCardInfo: {
    flex: 1,
  },
  deptName: {
    fontSize: 14.5,
    fontWeight: "900",
    color: "#1C1917",
  },
  deptEnglish: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  deptStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },

  // Modal
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1C1917",
  },
  modalSubtitle: {
    fontSize: 11,
    color: "#6B7280",
  },
  specialNoticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 14,
  },
  specialNoticeText: {
    flex: 1,
    fontSize: 12,
    color: "#991B1B",
    lineHeight: 18,
    fontWeight: "600",
  },
  tabToggleRow: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    padding: 4,
    gap: 4,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: "#2563EB",
  },
  tabButtonActiveGrievance: {
    backgroundColor: "#DC2626",
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#4B5563",
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  itemsListContainer: {
    gap: 10,
  },
  serviceItemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  itemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  applyBtnText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
  },

  // Application Form Inside Modal
  formSelectedBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  formSelectedLabel: {
    fontSize: 11,
    color: "#1E40AF",
    fontWeight: "700",
  },
  formSelectedTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E3A8A",
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 4,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: "#1C1917",
  },
  submitFormBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 22,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  submitFormBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  // Success Box
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  successIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1C1917",
    textAlign: "center",
  },
  appIdBox: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 14,
    alignItems: "center",
  },
  appIdLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
  },
  appIdValue: {
    fontSize: 19,
    fontWeight: "900",
    color: "#2563EB",
    marginTop: 2,
  },
  successDesc: {
    fontSize: 12.5,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 18,
  },
  statusRoadmap: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  roadmapHeading: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  roadmapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roadmapText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
  },
  doneBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
