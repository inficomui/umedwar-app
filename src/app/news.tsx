import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign, NewsArticleItem } from "../context/CampaignContext";
import { BottomTabBar } from "../components/BottomTabBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface NewsItem {
  id: string;
  category: "all" | "politics" | "development" | "outreach" | "events";
  date: string;
  title: string;
  description: string;
  summary?: string;
  fullContent?: string;
  image: any;
  imageUrl?: string;
  image_url?: string;
  isFeatured?: boolean;
  isBreaking?: boolean;
}

const DEFAULT_NEWS_IMAGE = require("../../assets/images/home_hero_banner.jpg");

function getNewsImage(item?: any) {
  if (!item) return DEFAULT_NEWS_IMAGE;
  const img = item.image || item.imageUrl || item.image_url;
  if (!img) return DEFAULT_NEWS_IMAGE;
  if (typeof img === "string") {
    if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("file://") || img.startsWith("data:")) {
      return { uri: img };
    }
    return DEFAULT_NEWS_IMAGE;
  }
  if (typeof img === "object" && img.uri) {
    return img;
  }
  if (typeof img === "number") {
    return img;
  }
  return DEFAULT_NEWS_IMAGE;
}

export default function NewsScreen() {
  const router = useRouter();
  const { newsArticles, party, refreshAppConfig } = useCampaign();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedNews, setSelectedNews] = useState<NewsArticleItem | NewsItem | null>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAppConfig();
    } catch {
      // offline fallback
    } finally {
      setRefreshing(false);
    }
  }, [refreshAppConfig]);

  const sourceNews = newsArticles || [];

  const filteredNews =
    selectedCategory === "all"
      ? sourceNews
      : sourceNews.filter((item) => {
          const cat = String(item.category || "").toLowerCase();
          const sel = selectedCategory.toLowerCase();
          if (cat === sel) return true;
          if (sel === "politics" && (cat.includes("राजकारण") || cat.includes("politic"))) return true;
          if (sel === "development" && (cat.includes("विकास") || cat.includes("development"))) return true;
          if (sel === "outreach" && (cat.includes("संपर्क") || cat.includes("कल्याण") || cat.includes("outreach") || cat.includes("योजना"))) return true;
          if (sel === "events" && (cat.includes("कार्यक्रम") || cat.includes("रोजगार") || cat.includes("event") || cat.includes("संवाद"))) return true;
          return false;
        });

  const featuredNews =
    filteredNews.find((item) => item.isFeatured || (item as any).isBreaking) || filteredNews[0];
  const listNews = featuredNews
    ? filteredNews.filter((item) => String(item.id) !== String(featuredNews.id))
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#E05300" />

      {/* Top Saffron Header */}
      <View style={styles.topHeader}>
        {/* Left: Shiv Sena Emblem & Title */}
        <View style={styles.headerLeftGroup}>
          <View style={styles.logoEmblemContainer}>
            <View style={styles.logoEmblemInner}>
              <Icon source="bow-arrow" size={22} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerMainTitle}>{party?.name || "शिवसेना"}</Text>
            <Text style={styles.headerSubtitle}>{party?.faction || "(शिंदे गट)"}</Text>
          </View>
        </View>

        {/* Right: Search & Notifications */}
        <View style={styles.headerRightGroup}>
          <TouchableOpacity style={styles.headerCircleBtn} activeOpacity={0.85}>
            <Icon source="magnify" size={21} color="#E05300" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerCircleBtn} activeOpacity={0.85}>
            <Icon source="bell" size={21} color="#E05300" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
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
        {/* Page Title & Filter Row */}
        <View style={styles.titleFilterRow}>
          <View style={styles.titleTextGroup}>
            <Text style={styles.pageTitle}>बातम्या</Text>
            <Text style={styles.pageSubtitle}>ताज्या घडामोडी, उपक्रम आणि विकासकार्य</Text>
          </View>

          {/* Filter Dropdown Button */}
          <TouchableOpacity
            style={styles.filterDropdownBtn}
            onPress={() => setFilterDropdownOpen(!filterDropdownOpen)}
            activeOpacity={0.85}
          >
            <Text style={styles.filterDropdownText}>सर्व बातम्या</Text>
            <Icon source="chevron-down" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {/* Pill 1: सर्व */}
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === "all" ? styles.categoryPillActive : styles.categoryPillInactive,
            ]}
            onPress={() => setSelectedCategory("all")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === "all" ? styles.categoryTextActive : styles.categoryTextInactive,
              ]}
            >
              सर्व
            </Text>
          </TouchableOpacity>

          {/* Pill 2: राजकारण */}
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === "politics" ? styles.categoryPillActive : styles.categoryPillInactive,
            ]}
            onPress={() => setSelectedCategory("politics")}
            activeOpacity={0.8}
          >
            <Icon
              source="bank-outline"
              size={17}
              color={selectedCategory === "politics" ? "#FFFFFF" : "#E05300"}
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === "politics" ? styles.categoryTextActive : styles.categoryTextInactive,
              ]}
            >
              राजकारण
            </Text>
          </TouchableOpacity>

          {/* Pill 3: विकासकार्य */}
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === "development" ? styles.categoryPillActive : styles.categoryPillInactive,
            ]}
            onPress={() => setSelectedCategory("development")}
            activeOpacity={0.8}
          >
            <Icon
              source="road-variant"
              size={17}
              color={selectedCategory === "development" ? "#FFFFFF" : "#E05300"}
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === "development" ? styles.categoryTextActive : styles.categoryTextInactive,
              ]}
            >
              विकासकार्य
            </Text>
          </TouchableOpacity>

          {/* Pill 4: जनसंपर्क */}
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === "outreach" ? styles.categoryPillActive : styles.categoryPillInactive,
            ]}
            onPress={() => setSelectedCategory("outreach")}
            activeOpacity={0.8}
          >
            <Icon
              source="account-group-outline"
              size={17}
              color={selectedCategory === "outreach" ? "#FFFFFF" : "#E05300"}
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === "outreach" ? styles.categoryTextActive : styles.categoryTextInactive,
              ]}
            >
              जनसंपर्क
            </Text>
          </TouchableOpacity>

          {/* Pill 5: कार्यक्रम */}
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === "events" ? styles.categoryPillActive : styles.categoryPillInactive,
            ]}
            onPress={() => setSelectedCategory("events")}
            activeOpacity={0.8}
          >
            <Icon
              source="calendar-month-outline"
              size={17}
              color={selectedCategory === "events" ? "#FFFFFF" : "#E05300"}
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === "events" ? styles.categoryTextActive : styles.categoryTextInactive,
              ]}
            >
              कार्यक्रम
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Featured Breaking News Card ("मुख्य बातमी") */}
        {featuredNews && (
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() =>
              router.push({
                pathname: "/news-detail",
                params: { id: featuredNews.id },
              })
            }
            activeOpacity={0.92}
          >
            {/* Left Half: Image with Badge */}
            <View style={styles.featuredImageWrapper}>
              <Image
                source={getNewsImage(featuredNews)}
                style={styles.featuredImage}
                contentFit="cover"
                priority="high"
                transition={200}
              />
              <View style={styles.breakingBadge}>
                <Text style={styles.breakingBadgeText}>
                  {featuredNews.isFeatured || (featuredNews as any).isBreaking ? "मुख्य बातमी" : "ताजी बातमी"}
                </Text>
              </View>
            </View>

            {/* Right Half: Details */}
            <View style={styles.featuredContentColumn}>
              <View style={styles.dateRow}>
                <Icon source="calendar-blank-outline" size={13} color="#78716C" />
                <Text style={styles.dateText}>{featuredNews.date || "ताजी बातमी"}</Text>
              </View>

              <Text style={styles.featuredTitle} numberOfLines={3}>
                {featuredNews.title}
              </Text>

              <Text style={styles.featuredDescription} numberOfLines={3}>
                {featuredNews.description || featuredNews.summary || ""}
              </Text>

              <TouchableOpacity
                style={styles.readMoreBtn}
                onPress={() =>
                  router.push({
                    pathname: "/news-detail",
                    params: { id: featuredNews.id },
                  })
                }
                activeOpacity={0.85}
              >
                <Text style={styles.readMoreBtnText}>सविस्तर वाचा</Text>
                <Icon source="arrow-right" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {filteredNews.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Icon source="newspaper-variant-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>कोणतीही बातमी उपलब्ध नाही</Text>
            <Text style={styles.emptyStateSubtitle}>सध्या या श्रेणीत कोणतीही बातमी उपलब्ध नाही.</Text>
          </View>
        ) : (
          <>
            {/* List of Other News Items */}
            {listNews.length > 0 && (
              <View style={styles.newsList}>
                {listNews.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.newsListItem}
                    onPress={() =>
                      router.push({
                        pathname: "/news-detail",
                        params: { id: item.id },
                      })
                    }
                    activeOpacity={0.85}
                  >
                    {/* Thumbnail */}
                    <Image
                      source={getNewsImage(item)}
                      style={styles.newsThumb}
                      contentFit="cover"
                      transition={200}
                    />

                    {/* Text Info */}
                    <View style={styles.newsListTextCol}>
                      <View style={styles.dateRow}>
                        <Icon source="calendar-blank-outline" size={12} color="#78716C" />
                        <Text style={styles.dateText}>{item.date || "ताजी बातमी"}</Text>
                      </View>
                      <Text style={styles.newsListTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.newsListDescription} numberOfLines={2}>
                        {item.description || item.summary || ""}
                      </Text>
                    </View>

                    {/* Right Chevron */}
                    <View style={styles.chevronWrap}>
                      <Icon source="chevron-right" size={20} color="#E05300" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* "अधिक बातम्या पहा ⌵" (Load More Button) */}
            <TouchableOpacity style={styles.loadMoreBtn} activeOpacity={0.85}>
              <Text style={styles.loadMoreText}>अधिक बातम्या पहा</Text>
              <Icon source="chevron-down" size={17} color="#E05300" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Fixed Bottom Navigation Tab Bar */}
      <BottomTabBar currentTab="news" />

      {/* Full Article Reader Modal */}
      {selectedNews && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={true}
          onRequestClose={() => setSelectedNews(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Image source={getNewsImage(selectedNews)} style={styles.modalImage} contentFit="cover" transition={200} />
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.dateRow}>
                  <Icon source="calendar-blank-outline" size={13} color="#78716C" />
                  <Text style={styles.dateText}>{selectedNews.date}</Text>
                </View>
                <Text style={styles.modalHeadline}>{selectedNews.title}</Text>
                <Text style={styles.modalArticleText}>
                  {Array.isArray(selectedNews.fullContent)
                    ? selectedNews.fullContent.join("\n\n")
                    : selectedNews.fullContent || selectedNews.description}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedNews(null)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalCloseBtnText}>बंद करा (Close)</Text>
                </TouchableOpacity>
              </ScrollView>
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
    paddingBottom: 24,
  },

  // Top Header
  topHeader: {
    backgroundColor: "#E05300",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  headerLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoEmblemContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FBBF24",
    backgroundColor: "#C2410C",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoEmblemInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleGroup: {
    justifyContent: "center",
  },
  headerMainTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.4,
    lineHeight: 26,
  },
  headerSubtitle: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
    opacity: 0.95,
  },
  headerRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerCircleBtn: {
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
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#EF4444",
  },

  // Title & Filter Row
  titleFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  titleTextGroup: {
    flex: 1,
    paddingRight: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1C1917",
    letterSpacing: 0.3,
  },
  pageSubtitle: {
    fontSize: 12.5,
    color: "#78716C",
    fontWeight: "600",
    marginTop: 2,
  },
  filterDropdownBtn: {
    backgroundColor: "#E05300",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  filterDropdownText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  // Categories Row
  categoriesRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
    borderWidth: 1,
    elevation: 1,
  },
  categoryPillActive: {
    backgroundColor: "#E05300",
    borderColor: "#E05300",
  },
  categoryPillInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E7E5E4",
  },
  categoryText: {
    fontSize: 12.5,
    fontWeight: "800",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  categoryTextInactive: {
    color: "#1C1917",
  },

  // Featured News Card
  featuredCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0EFEA",
    height: 220,
  },
  featuredImageWrapper: {
    width: "48%",
    height: "100%",
    position: "relative",
    backgroundColor: "#FDF8F3",
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  breakingBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#E05300",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    elevation: 3,
  },
  breakingBadgeText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "900",
  },
  featuredContentColumn: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 11,
    color: "#78716C",
    fontWeight: "600",
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1C1917",
    lineHeight: 18.5,
  },
  featuredDescription: {
    fontSize: 11,
    color: "#57534E",
    lineHeight: 15,
    marginVertical: 4,
  },
  readMoreBtn: {
    backgroundColor: "#E05300",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  readMoreBtnText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
  },

  // News List
  newsList: {
    marginTop: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  newsListItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0EFEA",
  },
  newsThumb: {
    width: 88,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#F5F5F4",
  },
  newsListTextCol: {
    flex: 1,
    paddingHorizontal: 10,
  },
  newsListTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1C1917",
    lineHeight: 17,
    marginTop: 1,
  },
  newsListDescription: {
    fontSize: 11,
    color: "#78716C",
    lineHeight: 15,
    marginTop: 2,
  },
  chevronWrap: {
    paddingLeft: 2,
  },

  // Load More Button
  loadMoreBtn: {
    backgroundColor: "#FFF1E8",
    marginHorizontal: 16,
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  loadMoreText: {
    color: "#E05300",
    fontSize: 13.5,
    fontWeight: "800",
  },

  // Bottom Tab Bar
  bottomTabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 10,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    minWidth: 56,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#78716C",
    marginTop: 2,
  },
  tabActiveLabel: {
    color: "#E05300",
    fontWeight: "800",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    overflow: "hidden",
    elevation: 10,
  },
  modalImage: {
    width: "100%",
    height: 180,
  },
  modalBody: {
    padding: 16,
  },
  modalHeadline: {
    fontSize: 16.5,
    fontWeight: "900",
    color: "#1C1917",
    marginVertical: 8,
    lineHeight: 22,
  },
  modalArticleText: {
    fontSize: 13,
    color: "#44403C",
    lineHeight: 20,
    marginBottom: 20,
  },
  modalCloseBtn: {
    backgroundColor: "#E05300",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCloseBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyStateContainer: {
    paddingVertical: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginTop: 14,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
  },
});
