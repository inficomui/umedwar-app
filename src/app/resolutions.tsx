import React, { useState, useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign, ResolutionItem } from "../context/CampaignContext";
import { MANIFESTO_INFO } from "../constants/campaignData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function toMarathiNumber(num?: number | string): string {
  if (num === undefined || num === null) return "";
  const marathiDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(num)
    .split("")
    .map((d) => {
      const parsed = parseInt(d, 10);
      return !isNaN(parsed) ? marathiDigits[parsed] : d;
    })
    .join("");
}

export default function ResolutionsScreen() {
  const router = useRouter();
  const { resolutions, candidate, refreshAppConfig } = useCampaign();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isVisionExpanded, setIsVisionExpanded] = useState(false);
  const [isPrinciplesExpanded, setIsPrinciplesExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (refreshAppConfig) {
        await refreshAppConfig();
      }
    } catch {
      // offline fallback
    } finally {
      setRefreshing(false);
    }
  }, [refreshAppConfig]);

  const allItems: ResolutionItem[] = resolutions || [];

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ["all", ...Array.from(set)];
  }, [allItems]);

  // Filtered resolutions
  const filteredResolutions = useMemo(() => {
    return allItems.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.shortTitle &&
          item.shortTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.sankalpStatement &&
          item.sankalpStatement.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category &&
          item.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allItems, searchQuery, selectedCategory]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#E05300" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon source="arrow-left" size={22} color="#E05300" />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerMainTitle}>माझे प्रमुख संकल्प</Text>
          <Text style={styles.headerSubtitle}>विकास आराखडा २०२६</Text>
        </View>

        <TouchableOpacity
          style={styles.searchIconButton}
          onPress={() => router.push("/report-issue")}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon source="pencil-plus-outline" size={20} color="#E05300" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#E05300"]}
            tintColor="#E05300"
          />
        }
      >
        {/* Hero Manifesto Banner */}
        <View style={styles.manifestoHero}>
          <View style={styles.manifestoBadge}>
            <Icon source="bullhorn" size={13} color="#FFFFFF" />
            <Text style={styles.manifestoBadgeText}>{candidate.constituency || "कोपरगाव"}</Text>
          </View>
          <Text style={styles.manifestoTitle}>{MANIFESTO_INFO.title}</Text>
          <Text style={styles.manifestoTagline}>{MANIFESTO_INFO.subtitle}</Text>
          <Text style={styles.manifestoSub}>{MANIFESTO_INFO.tagline}</Text>

          {/* Collapsible: "माझी विकासाची भूमिका" */}
          <TouchableOpacity
            style={styles.visionToggle}
            activeOpacity={0.8}
            onPress={() => setIsVisionExpanded(!isVisionExpanded)}
          >
            <View style={styles.visionToggleLeft}>
              <Icon source="account-tie" size={18} color="#E05300" />
              <Text style={styles.visionToggleText}>{MANIFESTO_INFO.visionTitle}</Text>
            </View>
            <Icon
              source={isVisionExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#E05300"
            />
          </TouchableOpacity>

          {isVisionExpanded && (
            <View style={styles.visionBox}>
              <Text style={styles.visionText}>{MANIFESTO_INFO.visionRole}</Text>
              <Text style={styles.visionAuthor}>– {MANIFESTO_INFO.candidateName}</Text>
            </View>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon source="magnify" size={20} color="#78716C" />
          <TextInput
            style={styles.searchInput}
            placeholder="संकल्प किंवा विषय शोधा (उदा. रस्ते, पाणी, शिक्षण)..."
            placeholderTextColor="#A8A29E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon source="close-circle" size={18} color="#78716C" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Pills (if any categories available) */}
        {categories.length > 2 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    isSelected && styles.categoryPillActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isSelected && styles.categoryPillTextActive,
                    ]}
                  >
                    {cat === "all" ? "सर्व संकल्प" : cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Total Count Header */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            एकूण {toMarathiNumber(filteredResolutions.length)} संकल्प उपलब्ध
          </Text>
        </View>

        {/* Resolutions Cards List */}
        <View style={styles.resolutionsList}>
          {filteredResolutions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon source="clipboard-text-outline" size={44} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>कोणतेही संकल्प उपलब्ध नाहीत</Text>
              <Text style={styles.emptySubtitle}>नवीन संकल्प लवकरच येथे प्रसिद्ध केले जातील.</Text>
            </View>
          ) : (
            filteredResolutions.map((item, index) => {
              const sankalpNum = item.sankalpNumber || index + 1;
              const policyCount = item.policies ? item.policies.length : 0;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.resolutionCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/resolution-detail",
                      params: {
                        id: String(item.id),
                        slug: item.slug || String(item.id),
                      },
                    })
                  }
                >
                  <View style={styles.cardHeaderRow}>
                    {/* Logo or Icon */}
                    <View style={styles.cardLogoWrap}>
                      {item.logoUrl ? (
                        <Image
                          source={{ uri: item.logoUrl }}
                          style={styles.cardLogoImage}
                          contentFit="contain"
                        />
                      ) : (
                        <Icon
                          source={item.iconName || "star"}
                          size={24}
                          color="#E05300"
                        />
                      )}
                    </View>

                    <View style={styles.cardHeaderInfo}>
                      <View style={styles.cardBadgeRow}>
                        <View style={styles.cardNumberBadge}>
                          <Text style={styles.cardNumberText}>
                            संकल्प {toMarathiNumber(sankalpNum)}
                          </Text>
                        </View>
                        {item.category && (
                          <View style={styles.cardCategoryBadge}>
                            <Text style={styles.cardCategoryText}>{item.category}</Text>
                          </View>
                        )}
                      </View>

                      {/* Main Card Heading */}
                      <Text style={styles.cardMainHeading} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </View>
                  </View>

                  {/* Brief statement snippet */}
                  {item.sankalpStatement ? (
                    <Text style={styles.cardStatement} numberOfLines={2}>
                      {item.sankalpStatement}
                    </Text>
                  ) : null}

                  {/* Card Footer: Policy Count + Action Button */}
                  <View style={styles.cardFooterRow}>
                    {policyCount > 0 ? (
                      <View style={styles.policyCountBadge}>
                        <Icon source="format-list-checks" size={13} color="#C2410C" />
                        <Text style={styles.policyCountText}>
                          {toMarathiNumber(policyCount)} धोरणात्मक मुद्दे
                        </Text>
                      </View>
                    ) : (
                      <View />
                    )}

                    <View style={styles.readMoreRow}>
                      <Text style={styles.readMoreText}>सविस्तर वाचा</Text>
                      <Icon source="arrow-right" size={14} color="#E05300" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Operating Principles Section ("माझे विकासविषयक कार्यतत्त्व") */}
        <View style={styles.principlesCard}>
          <TouchableOpacity
            style={styles.principlesHeader}
            activeOpacity={0.8}
            onPress={() => setIsPrinciplesExpanded(!isPrinciplesExpanded)}
          >
            <View style={styles.principlesHeaderLeft}>
              <View style={styles.principlesIcon}>
                <Icon source="shield-star" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.principlesTitle}>
                  {MANIFESTO_INFO.principlesTitle}
                </Text>
                <Text style={styles.principlesSubtitle}>
                  १० मूलभूत तत्त्वांवर आधारित पारदर्शक कामकाज
                </Text>
              </View>
            </View>
            <Icon
              source={isPrinciplesExpanded ? "chevron-up" : "chevron-down"}
              size={22}
              color="#E05300"
            />
          </TouchableOpacity>

          {isPrinciplesExpanded && (
            <View style={styles.principlesContent}>
              {MANIFESTO_INFO.principles.map((pr, idx) => (
                <View key={idx} style={styles.principleRow}>
                  <View style={styles.principleNumber}>
                    <Text style={styles.principleNumberText}>
                      {toMarathiNumber(idx + 1)}
                    </Text>
                  </View>
                  <Text style={styles.principleText}>{pr}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Citizen Engagement Box */}
        <View style={styles.citizenBox}>
          <Icon source="account-group" size={26} color="#E05300" />
          <Text style={styles.citizenTitle}>
            {MANIFESTO_INFO.citizenParticipationTitle}
          </Text>
          <Text style={styles.citizenText}>
            {MANIFESTO_INFO.citizenParticipationText}
          </Text>
          <TouchableOpacity
            style={styles.citizenButton}
            activeOpacity={0.85}
            onPress={() => router.push("/report-issue")}
          >
            <Icon source="pencil-plus-outline" size={17} color="#FFFFFF" />
            <Text style={styles.citizenButtonText}>आपली सूचना नोंदवा</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleGroup: {
    flex: 1,
    alignItems: "center",
  },
  headerMainTitle: {
    fontSize: 16.5,
    fontWeight: "900",
    color: "#1C1917",
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#78716C",
    marginTop: 1,
  },
  searchIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Manifesto Hero Banner
  manifestoHero: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    shadowColor: "#E05300",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  manifestoBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E05300",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
    marginBottom: 8,
  },
  manifestoBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  manifestoTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#1C1917",
    lineHeight: 27,
  },
  manifestoTagline: {
    fontSize: 14,
    fontWeight: "800",
    color: "#E05300",
    marginTop: 2,
  },
  manifestoSub: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#78716C",
    marginTop: 4,
  },
  visionToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  visionToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  visionToggleText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#E05300",
  },
  visionBox: {
    marginTop: 10,
    backgroundColor: "#FFFBF5",
    borderLeftWidth: 3,
    borderLeftColor: "#E05300",
    padding: 12,
    borderRadius: 8,
  },
  visionText: {
    fontSize: 13,
    color: "#292524",
    lineHeight: 21,
    fontWeight: "500",
  },
  visionAuthor: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E05300",
    textAlign: "right",
    marginTop: 6,
  },

  // Search
  searchContainer: {
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
    fontSize: 13.5,
    color: "#1C1917",
    paddingVertical: 0,
  },

  // Category Pills
  categoryScroll: {
    gap: 8,
    marginBottom: 12,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryPillActive: {
    backgroundColor: "#E05300",
    borderColor: "#E05300",
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
  },

  // Count Row
  countRow: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#78716C",
  },

  // Resolutions List
  resolutionsList: {
    gap: 12,
  },
  resolutionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  cardLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  cardLogoImage: {
    width: 32,
    height: 32,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  cardNumberBadge: {
    backgroundColor: "#FFF7ED",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  cardNumberText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#C2410C",
  },
  cardCategoryBadge: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  cardCategoryText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#4B5563",
  },
  cardMainHeading: {
    fontSize: 15.5,
    fontWeight: "900",
    color: "#1C1917",
    lineHeight: 22,
  },
  cardStatement: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 19,
    marginTop: 8,
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  policyCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF7ED",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  policyCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#C2410C",
  },
  readMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readMoreText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#E05300",
  },

  // Principles Section
  principlesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 20,
    overflow: "hidden",
  },
  principlesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  principlesHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  principlesIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E05300",
    justifyContent: "center",
    alignItems: "center",
  },
  principlesTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1C1917",
  },
  principlesSubtitle: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 1,
  },
  principlesContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  principleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
  },
  principleNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  principleNumberText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#C2410C",
  },
  principleText: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    lineHeight: 19,
    fontWeight: "500",
  },

  // Citizen Engagement
  citizenBox: {
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FED7AA",
  },
  citizenTitle: {
    fontSize: 15.5,
    fontWeight: "900",
    color: "#9A3412",
    marginTop: 8,
    textAlign: "center",
  },
  citizenText: {
    fontSize: 12.5,
    color: "#78350F",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },
  citizenButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E05300",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    gap: 6,
    marginTop: 14,
  },
  citizenButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  emptyContainer: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginVertical: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
});
