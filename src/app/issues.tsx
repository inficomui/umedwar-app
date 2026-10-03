import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  Modal,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign, IssueItem } from "../context/CampaignContext";
import DynamicIssueMap from "../components/DynamicIssueMap";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_CARD_HEIGHT = Math.round((SCREEN_WIDTH - 32) * (120 / 448));

const CATEGORIES = [
  { id: "all", label: "सर्व" },
  { id: "roads", label: "रस्ते" },
  { id: "water", label: "पाणीपुरवठा" },
  { id: "electricity", label: "वीज" },
  { id: "cleanliness", label: "स्वच्छता" },
  { id: "health", label: "आरोग्य" },
  { id: "education", label: "शिक्षण" },
];

export default function IssuesScreen() {
  const router = useRouter();

  const { issues, createIssue, refreshIssues, isLoggedIn } = useCampaign();

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedIssueDetail, setSelectedIssueDetail] = useState<IssueItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshIssues();
    } finally {
      setRefreshing(false);
    }
  }, [refreshIssues]);

  // New Issue Form
  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newCategory, setNewCategory] = useState<string>("roads");
  const [newDescription, setNewDescription] = useState("");

  const totalCount = issues.length;
  const resolvedCount = issues.filter((i) => i.status === "resolved").length;
  const inProgressCount = issues.filter(
    (i) => i.status === "in_progress" || i.status === "forwarded"
  ).length;
  const pendingCount = issues.filter((i) => i.status === "pending").length;

  const filteredIssues = issues
    .filter((item) => {
      if (!item) return false;
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        String(item.title || "").toLowerCase().includes(q) ||
        String(item.location || "").toLowerCase().includes(q) ||
        String(item.description || "").toLowerCase().includes(q) ||
        (item.trackingId ? String(item.trackingId).toLowerCase().includes(q) : false);
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      const aId = String(a?.id || "");
      const bId = String(b?.id || "");
      if (sortOrder === "asc") {
        return aId.localeCompare(bId);
      }
      return bId.localeCompare(aId);
    });

  const handleCreateIssue = async () => {
    if (!isLoggedIn) {
      setIsRegisterModalOpen(false);
      Alert.alert(
        "लॉगिन आवश्यक",
        "समस्या नोंदवण्यासाठी कृपया प्रथम नागरिक लॉगिन करा.",
        [
          { text: "रद्द करा", style: "cancel" },
          {
            text: "लॉगिन करा",
            onPress: () => router.push("/login?returnTo=/report-issue"),
          },
        ]
      );
      return;
    }

    if (!newTitle.trim()) {
      Alert.alert("कृपया समस्या शीर्षक टाका", "समस्येचे नाव प्रविष्ट करा.");
      return;
    }
    if (!newLocation.trim()) {
      Alert.alert("कृपया ठिकाण टाका", "समस्या असलेल्या परिसराचे नाव प्रविष्ट करा.");
      return;
    }

    try {
      const created = await createIssue({
        title: newTitle.trim(),
        location: newLocation.trim(),
        category: newCategory as any,
        description: newDescription.trim() || "नागरिकाने समस्या नोंदवली आहे.",
      });

      setIsRegisterModalOpen(false);
      setNewTitle("");
      setNewLocation("");
      setNewDescription("");

      Alert.alert(
        "समस्या नोंदवली!",
        `आपली समस्या यशस्वीरीत्या नोंदवली गेली आहे.\nतक्रार क्रमांक: #${created.trackingId}\n\nआपण 'माझ्या समस्या' मध्ये जाऊन प्रगती ट्रॅक करू शकता.`
      );
    } catch {
      Alert.alert("त्रुटी", "समस्या नोंदवताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.");
    }
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#E05300" />

      {/* Top Saffron Header */}
      <View style={styles.topHeader}>
        {/* Left: Back Button & Title */}
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
            <Text style={styles.headerMainTitle}>भागातील समस्या</Text>
            <Text style={styles.headerSubtitle}>आपला परिसर, आपली जबाबदारी</Text>
          </View>
        </View>

        {/* Right: My Issues & Shiv Sena Logo */}
        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            style={styles.myIssuesBtn}
            onPress={() => router.push("/my-issues")}
            activeOpacity={0.85}
          >
            <Text style={styles.myIssuesBtnText}>माझ्या समस्या</Text>
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
        {/* Hero Slogan & Commitment Card */}
        <View style={styles.heroCardWrapper}>
          <Image
            source={require("../../assets/images/issues_hero_card.png")}
            style={styles.heroCardImage}
            contentFit="cover"
            priority="high"
          />
        </View>

        {/* 4 Status Metric Cards */}
        <View style={styles.metricsRow}>
          {/* Card 1: एकूण समस्या */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: "#FEE2E2" }]}>
              <Icon source="alert-circle" size={17} color="#EF4444" />
            </View>
            <Text style={styles.metricNumber}>{totalCount}</Text>
            <Text style={styles.metricLabel}>एकूण समस्या</Text>
          </View>

          {/* Card 2: निकाली */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: "#DCFCE7" }]}>
              <Icon source="check-circle" size={17} color="#10B981" />
            </View>
            <Text style={styles.metricNumber}>{resolvedCount}</Text>
            <Text style={[styles.metricLabel, { color: "#10B981" }]}>निकाली</Text>
          </View>

          {/* Card 3: प्रगतीपथावर */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: "#FFEDD5" }]}>
              <Icon source="clock-outline" size={17} color="#F97316" />
            </View>
            <Text style={styles.metricNumber}>{inProgressCount}</Text>
            <Text style={styles.metricLabel}>प्रगतीपथावर</Text>
          </View>

          {/* Card 4: प्रलंबित */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: "#DBEAFE" }]}>
              <Icon source="dots-horizontal-circle" size={17} color="#3B82F6" />
            </View>
            <Text style={styles.metricNumber}>{pendingCount}</Text>
            <Text style={styles.metricLabel}>प्रलंबित</Text>
          </View>
        </View>

        {/* 2 Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
          {/* ➕ नवी समस्या नोंदवा */}
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => {
              if (isLoggedIn) {
                router.push("/report-issue");
              } else {
                Alert.alert(
                  "लॉगिन आवश्यक",
                  "समस्या नोंदवण्यासाठी कृपया प्रथम नागरिक लॉगिन करा.",
                  [
                    { text: "रद्द करा", style: "cancel" },
                    {
                      text: "लॉगिन करा",
                      onPress: () => router.push("/login?returnTo=/report-issue"),
                    },
                  ]
                );
              }
            }}
            activeOpacity={0.88}
          >
            <Icon source="plus-circle" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>नवी समस्या नोंदवा</Text>
          </TouchableOpacity>

          {/* 📍 नकाशावर पहा / यादी पहा Toggle */}
          <TouchableOpacity
            style={[
              styles.secondaryActionBtn,
              viewMode === "map" && styles.secondaryActionBtnActive,
            ]}
            onPress={() => setViewMode(viewMode === "map" ? "list" : "map")}
            activeOpacity={0.88}
          >
            <Icon
              source={viewMode === "map" ? "format-list-bulleted" : "map-marker"}
              size={18}
              color={viewMode === "map" ? "#FFFFFF" : "#E05300"}
            />
            <Text
              style={[
                styles.secondaryActionText,
                viewMode === "map" && styles.secondaryActionTextActive,
              ]}
            >
              {viewMode === "map" ? "यादी पहा" : "नकाशावर पहा"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Mode Switcher Tab */}
        <View style={styles.viewModeSwitcher}>
          <TouchableOpacity
            style={[
              styles.viewModeTab,
              viewMode === "list" && styles.viewModeTabActive,
            ]}
            onPress={() => setViewMode("list")}
            activeOpacity={0.85}
          >
            <Icon
              source="format-list-bulleted"
              size={16}
              color={viewMode === "list" ? "#FFFFFF" : "#57534E"}
            />
            <Text
              style={[
                styles.viewModeTabText,
                viewMode === "list" && styles.viewModeTabTextActive,
              ]}
            >
              यादी स्वरूपात ({filteredIssues.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewModeTab,
              viewMode === "map" && styles.viewModeTabActive,
            ]}
            onPress={() => setViewMode("map")}
            activeOpacity={0.85}
          >
            <Icon
              source="map-marker-radius"
              size={16}
              color={viewMode === "map" ? "#FFFFFF" : "#57534E"}
            />
            <Text
              style={[
                styles.viewModeTabText,
                viewMode === "map" && styles.viewModeTabTextActive,
              ]}
            >
              नकाशावर परिसरनिहाय समस्या
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === "map" ? (
          <DynamicIssueMap isEmbedded={true} />
        ) : (
          <>
            {/* Search & Filter Row */}
            <View style={styles.searchFilterRow}>
              {/* Search Input */}
              <View style={styles.searchInputContainer}>
                <Icon source="magnify" size={20} color="#78716C" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="समस्या शोधा (उदा. रस्ता, पाणी, वीज...)"
                  placeholderTextColor="#A8A29E"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Icon source="close-circle" size={16} color="#A8A29E" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Button */}
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => {
                  Alert.alert("फिल्टर", "आपण खालील कॅटेगरी टॅब वापरून समस्या फिल्टर करू शकता.");
                }}
                activeOpacity={0.85}
              >
                <Icon source="filter-variant" size={18} color="#1C1917" />
                <Text style={styles.filterBtnText}>फिल्टर</Text>
              </TouchableOpacity>
            </View>

            {/* Category Filter Pills (Horizontal Scroll) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryPill,
                      isActive ? styles.categoryPillActive : styles.categoryPillInactive,
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        isActive ? styles.categoryTextActive : styles.categoryTextInactive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Title & Sort Row ("अलीकडील समस्या" / "नवीन ते जुने ⇅") */}
            <View style={styles.titleSortRow}>
              <Text style={styles.sectionTitle}>अलीकडील समस्या</Text>
              <TouchableOpacity
                style={styles.sortToggleBtn}
                onPress={toggleSort}
                activeOpacity={0.8}
              >
                <Text style={styles.sortToggleText}>नवीन ते जुने</Text>
                <Icon source="swap-vertical" size={16} color="#44403C" />
              </TouchableOpacity>
            </View>

            {/* Issues List */}
            {filteredIssues.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon source="clipboard-text-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>कोणतीही समस्या उपलब्ध नाही</Text>
                <Text style={styles.emptySub}>सध्या या भागात कोणतीही नोंदवलेली समस्या नाही.</Text>
              </View>
            ) : (
              <>
                <View style={styles.issuesList}>
                  {filteredIssues.map((item, index) => {
                    if (!item) return null;

                    let cardImageSource: any = require("../../assets/images/issue_pothole.png");
                    if (typeof item.image === "string" && item.image.trim().length > 0) {
                      cardImageSource = { uri: item.image.trim() };
                    } else if (
                      item.image &&
                      typeof item.image === "object" &&
                      item.image.uri &&
                      typeof item.image.uri === "string" &&
                      item.image.uri.trim().length > 0
                    ) {
                      cardImageSource = { uri: item.image.uri.trim() };
                    } else if (typeof item.image === "number") {
                      cardImageSource = item.image;
                    } else if (Array.isArray(item.images) && item.images.length > 0) {
                      const first = item.images[0];
                      if (typeof first === "string" && first.trim().length > 0) {
                        cardImageSource = { uri: first.trim() };
                      } else if (
                        first &&
                        typeof first === "object" &&
                        first.uri &&
                        typeof first.uri === "string" &&
                        first.uri.trim().length > 0
                      ) {
                        cardImageSource = { uri: first.uri.trim() };
                      } else if (typeof first === "number") {
                        cardImageSource = first;
                      }
                    }

                    let badgeBg = "#FEE2E2";
                    let badgeColor = "#DC2626";
                    let statusLabel = item.statusText || "प्रलंबित";

                    if (item.status === "resolved") {
                      badgeBg = "#DCFCE7";
                      badgeColor = "#16A34A";
                      statusLabel = "मार्गी लागली";
                    } else if (item.status === "in_progress" || item.status === "forwarded") {
                      badgeBg = "#FEF3C7";
                      badgeColor = "#D97706";
                      statusLabel = "काम सुरू";
                    }

                    return (
                      <TouchableOpacity
                        key={String(item.id || index)}
                        style={styles.issueCard}
                        onPress={() => setSelectedIssueDetail(item)}
                        activeOpacity={0.88}
                      >
                        {/* Thumbnail */}
                        <Image
                          source={cardImageSource}
                          style={styles.issueThumb}
                          contentFit="cover"
                          transition={200}
                        />

                        {/* Middle: Title, Location, Date */}
                        <View style={styles.issueDetailsCol}>
                          {item.trackingId ? (
                            <View style={styles.trackingPill}>
                              <Text style={styles.trackingPillText}>#{String(item.trackingId)}</Text>
                            </View>
                          ) : null}

                          <Text style={styles.issueTitle} numberOfLines={2}>
                            {String(item.title)}
                          </Text>

                          <View style={styles.issueMetaRow}>
                            <Icon source="map-marker-outline" size={12} color="#EA580C" />
                            <Text style={styles.issueLocation} numberOfLines={1}>
                              {String(item.location)}
                            </Text>
                          </View>

                          {item.description ? (
                            <Text style={styles.issueDescription} numberOfLines={1}>
                              {String(item.description)}
                            </Text>
                          ) : null}
                        </View>

                        {/* Right Side: Status Badge & Chevron */}
                        <View style={styles.issueRightCol}>
                          <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                            <View style={[styles.statusDot, { backgroundColor: badgeColor }]} />
                            <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
                              {statusLabel}
                            </Text>
                          </View>

                          <View style={styles.chevronWrap}>
                            <Icon source="chevron-right" size={20} color="#EA580C" />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* "अधिक समस्या पहा ➔" Button */}
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={() =>
                    Alert.alert("अधिक समस्या", "सध्या सर्व उपलब्ध तक्रारी प्रदर्शित केल्या आहेत.")
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.loadMoreText}>अधिक समस्या पहा</Text>
                  <Icon source="arrow-right" size={16} color="#E05300" />
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Register New Issue Modal ("नवी समस्या नोंदवा") */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isRegisterModalOpen}
        onRequestClose={() => setIsRegisterModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>नवी समस्या नोंदवा</Text>
              <TouchableOpacity
                onPress={() => setIsRegisterModalOpen(false)}
                activeOpacity={0.8}
              >
                <Icon source="close" size={22} color="#78716C" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormBody}>
              <Text style={styles.inputLabel}>समस्येचे नाव / विषय *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="उदा. रस्त्यावरील खड्डे दुरुस्त करा"
                placeholderTextColor="#A8A29E"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.inputLabel}>परिसर / ठिकाण *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="उदा. गजानन नगर, प्रभाग क्र. २५"
                placeholderTextColor="#A8A29E"
                value={newLocation}
                onChangeText={setNewLocation}
              />

              <Text style={styles.inputLabel}>कॅटेगरी निवडा</Text>
              <View style={styles.categoryPickerRow}>
                {(["roads", "water", "electricity", "cleanliness"] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.modalCatChip,
                      newCategory === cat && styles.modalCatChipActive,
                    ]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.modalCatChipText,
                        newCategory === cat && styles.modalCatChipTextActive,
                      ]}
                    >
                      {CATEGORIES.find((c) => c.id === cat)?.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>सविस्तर वर्णन</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="समस्येचे स्वरूप आणि नागरिकांना होणारा त्रास येथे लिहा..."
                placeholderTextColor="#A8A29E"
                multiline
                numberOfLines={3}
                value={newDescription}
                onChangeText={setNewDescription}
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateIssue}
                activeOpacity={0.88}
              >
                <Icon source="send" size={18} color="#FFFFFF" />
                <Text style={styles.modalSubmitText}>नोंदवा व पाठवा</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Issue Detail View Modal */}
      {selectedIssueDetail && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={true}
          onRequestClose={() => setSelectedIssueDetail(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailCard}>
              <Image
                source={selectedIssueDetail.image}
                style={styles.detailImage}
                contentFit="cover"
              />
              <View style={styles.detailBody}>
                <View style={styles.detailStatusRow}>
                  <View style={styles.detailBadge}>
                    <Text style={styles.detailBadgeText}>
                      {selectedIssueDetail.statusText}
                    </Text>
                  </View>
                  <Text style={styles.detailDate}>{selectedIssueDetail.date}</Text>
                </View>

                <Text style={styles.detailTitle}>{selectedIssueDetail.title}</Text>
                <Text style={styles.detailLocation}>
                  📍 {selectedIssueDetail.location}
                </Text>
                <Text style={styles.detailDesc}>{selectedIssueDetail.description}</Text>

                <TouchableOpacity
                  style={styles.detailCloseBtn}
                  onPress={() => setSelectedIssueDetail(null)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.detailCloseText}>बंद करा (Close)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  scrollContent: {
    paddingBottom: 28,
  },

  // Top Header
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
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 25,
  },
  headerSubtitle: {
    color: "#FED7AA",
    fontSize: 12,
    fontWeight: "600",
  },
  headerRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  myIssuesBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myIssuesBtnText: {
    color: "#E05300",
    fontSize: 11.5,
    fontWeight: "800",
  },
  logoEmblemContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  // Hero Card
  heroCardWrapper: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    overflow: "hidden",
    height: HERO_CARD_HEIGHT,
    backgroundColor: "#FFF7ED",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2.5,
  },
  heroCardImage: {
    width: "100%",
    height: "100%",
  },

  // 4 Metrics Cards
  metricsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2.5,
    elevation: 2,
  },
  metricIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1C1917",
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#57534E",
    marginTop: 1,
  },

  // 2 Action Buttons
  actionButtonsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1.35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E05300",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#E05300",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "900",
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1E8",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  secondaryActionBtnActive: {
    backgroundColor: "#E05300",
    borderColor: "#E05300",
  },
  secondaryActionText: {
    color: "#E05300",
    fontSize: 13.5,
    fontWeight: "900",
  },
  secondaryActionTextActive: {
    color: "#FFFFFF",
  },

  // View Mode Switcher
  viewModeSwitcher: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  viewModeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  viewModeTabActive: {
    backgroundColor: "#EA580C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  viewModeTabTextActive: {
    color: "#FFFFFF",
  },

  // Search & Filter
  searchFilterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: "#1C1917",
    paddingVertical: 0,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    gap: 6,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C1917",
  },

  // Category Filter Pills
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryPillActive: {
    backgroundColor: "#E05300",
  },
  categoryPillInactive: {
    backgroundColor: "#E5E7EB",
  },
  categoryText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  categoryTextInactive: {
    color: "#44403C",
  },

  // Title & Sort Row
  titleSortRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1C1917",
  },
  sortToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#57534E",
  },

  // Issues List
  issuesList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  issueCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    gap: 10,
  },
  issueThumb: {
    width: 84,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },
  issueDetailsCol: {
    flex: 1,
  },
  issueTitle: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#1C1917",
    marginBottom: 3,
  },
  issueMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  issueLocation: {
    fontSize: 11,
    color: "#57534E",
    fontWeight: "600",
  },
  issueDate: {
    fontSize: 10.5,
    color: "#78716C",
  },
  issueDescription: {
    fontSize: 10.5,
    color: "#78716C",
    marginTop: 2,
  },
  issueRightCol: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 64,
  },
  trackingPill: {
    alignSelf: "flex-start",
    backgroundColor: "#FFEDD5",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginBottom: 2,
  },
  trackingPillText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#EA580C",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
    gap: 4,
  },
  statusBadgeInProgress: {
    backgroundColor: "#FFF1E8",
  },
  statusBadgeResolved: {
    backgroundColor: "#DCFCE7",
  },
  statusBadgePending: {
    backgroundColor: "#DBEAFE",
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
  },
  statusTextInProgress: {
    color: "#EA580C",
  },
  statusTextResolved: {
    color: "#10B981",
  },
  statusTextPending: {
    color: "#3B82F6",
  },
  chevronWrap: {
    justifyContent: "center",
  },

  // Load More Button
  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E05300",
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#E05300",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#E05300",
  },
  modalFormBody: {
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#44403C",
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: "#FAF9F6",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: "#1C1917",
  },
  modalTextArea: {
    height: 75,
    paddingTop: 8,
    textAlignVertical: "top",
  },
  categoryPickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  modalCatChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
  },
  modalCatChipActive: {
    backgroundColor: "#E05300",
  },
  modalCatChipText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#44403C",
  },
  modalCatChipTextActive: {
    color: "#FFFFFF",
  },
  modalSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E05300",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  modalSubmitText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "900",
  },

  // Detail Modal
  detailCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
  },
  detailImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#E5E7EB",
  },
  detailBody: {
    padding: 16,
  },
  detailStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailBadge: {
    backgroundColor: "#FFEDD5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  detailBadgeText: {
    color: "#EA580C",
    fontSize: 12,
    fontWeight: "800",
  },
  detailDate: {
    fontSize: 12,
    color: "#78716C",
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#1C1917",
    marginBottom: 4,
  },
  detailLocation: {
    fontSize: 12.5,
    color: "#EA580C",
    fontWeight: "700",
    marginBottom: 8,
  },
  detailDesc: {
    fontSize: 13.5,
    color: "#44403C",
    lineHeight: 20,
    marginBottom: 16,
  },
  detailCloseBtn: {
    backgroundColor: "#E05300",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  detailCloseText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginTop: 14,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
  },
});
