import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Share,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign, ResolutionItem } from "../context/CampaignContext";
import { enrichResolution } from "../constants/campaignData";
import { sankalpApi, SankalpDetailItem } from "../services/sankalpApi";
import { SankalpDocumentRenderer } from "../components/SankalpDocumentRenderer";

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

// Strips out any existing leading numbers/bullets (e.g. "1. ", "१. ", "- ") so numbers never repeat
function cleanPointText(text: string): string {
  return text.replace(/^[\d\u0966-\u096F]+[\.\)\-\s:]+/, "").trim();
}

export default function ResolutionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; slug?: string }>();
  const { resolutions, candidate, refreshAppConfig } = useCampaign();
  const [refreshing, setRefreshing] = useState(false);
  const [cmsDetail, setCmsDetail] = useState<SankalpDetailItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isPoliciesExpanded, setIsPoliciesExpanded] = useState(false);

  const targetKey = params.slug || params.id || "";

  // Fetch full rich formatted document from CMS API GET /api/v1/sankalp/:slugOrId
  useEffect(() => {
    let isMounted = true;
    if (targetKey) {
      setLoadingDetail(true);
      sankalpApi
        .getSankalpDetail(targetKey)
        .then((detail) => {
          if (isMounted && detail) {
            setCmsDetail(detail);
          }
        })
        .finally(() => {
          if (isMounted) setLoadingDetail(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [targetKey]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (refreshAppConfig) {
        await refreshAppConfig();
      }
      if (targetKey) {
        const detail = await sankalpApi.getSankalpDetail(targetKey);
        if (detail) setCmsDetail(detail);
      }
    } catch {
      // offline fallback
    } finally {
      setRefreshing(false);
    }
  }, [refreshAppConfig, targetKey]);

  const allResolutions: ResolutionItem[] = resolutions || [];

  const resolution: ResolutionItem | null = useMemo(() => {
    let rawItem =
      allResolutions.find((item) => String(item.slug || item.id) === String(targetKey)) ||
      allResolutions.find((item) => String(item.id) === String(targetKey)) ||
      allResolutions.find(
        (item) => String(item.sankalpNumber) === String(targetKey)
      );

    if (cmsDetail) {
      const base = rawItem ? enrichResolution(rawItem) : enrichResolution(cmsDetail);
      return {
        ...base,
        id: String(cmsDetail.slug || cmsDetail.id),
        title: cmsDetail.title || base.title,
        logoUrl: cmsDetail.icon_image || base.logoUrl,
        subtitle: cmsDetail.short_description || base.subtitle,
        buttonText: cmsDetail.button_text || base.buttonText,
        content: cmsDetail.content || base.content,
        slug: cmsDetail.slug || base.slug,
      };
    }

    if (rawItem) {
      return enrichResolution(rawItem);
    }

    return null;
  }, [allResolutions, targetKey, cmsDetail]);

  // Clean and deduplicate policy points so no repeated point is displayed
  const uniquePolicies = useMemo(() => {
    let sourcePolicies = resolution?.policies;
    if (!sourcePolicies || !Array.isArray(sourcePolicies) || sourcePolicies.length === 0) {
      if (resolution?.fullDetails && typeof resolution.fullDetails === "string") {
        sourcePolicies = resolution.fullDetails
          .split(/[,;\n।]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 3);
      }
    }

    if (!sourcePolicies || !Array.isArray(sourcePolicies)) return [];
    const seen = new Set<string>();
    const result: string[] = [];

    for (const raw of sourcePolicies) {
      const cleaned = cleanPointText(raw);
      if (cleaned && !seen.has(cleaned)) {
        seen.add(cleaned);
        result.push(cleaned);
      }
    }
    return result;
  }, [resolution]);

  // Show only 3 points initially unless expanded with "Read more"
  const displayedPolicies = useMemo(() => {
    if (isPoliciesExpanded || uniquePolicies.length <= 3) {
      return uniquePolicies;
    }
    return uniquePolicies.slice(0, 3);
  }, [uniquePolicies, isPoliciesExpanded]);

  const hasMorePolicies = uniquePolicies.length > 3;

  const handleShare = async () => {
    if (!resolution) return;
    try {
      const policiesText =
        uniquePolicies.length > 0
          ? `\n\n📋 *माझे धोरण:*\n` +
            uniquePolicies
              .map((p, idx) => `${toMarathiNumber(idx + 1)}. ${p}`)
              .join("\n")
          : "";

      const actionText = resolution.actionPlan
        ? `\n\n🎯 *कृती आराखडा:*\n${resolution.actionPlan}`
        : "";

      const shareMsg =
        `🚩 *${candidate.name} – ${resolution.title}* 🚩\n\n` +
        (resolution.sankalpStatement ? `*माझा संकल्प:* ${resolution.sankalpStatement}\n` : "") +
        policiesText +
        actionText +
        `\n\n📲 *“मी सचिन मलिक” ॲप डाऊनलोड करा!*`;

      await Share.share({
        message: shareMsg,
        title: resolution.title,
      });
    } catch {
      // ignore
    }
  };

  if (loadingDetail && !resolution) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" backgroundColor="#E05300" />
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
            activeOpacity={0.85}
          >
            <Icon source="arrow-left" size={22} color="#E05300" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>संकल्प तपशील</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Icon source="file-document-outline" size={54} color="#EA580C" />
          <Text style={styles.emptyTitle}>माहिती लोड होत आहे...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!resolution) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" backgroundColor="#E05300" />
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
            activeOpacity={0.85}
          >
            <Icon source="arrow-left" size={22} color="#E05300" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>संकल्प तपशील</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Icon source="alert-circle-outline" size={54} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>हा संकल्प आढळला नाही किंवा अद्याप प्रसिद्ध झालेला नाही.</Text>
          <TouchableOpacity
            style={styles.emptyBackButton}
            onPress={() => router.replace("/home")}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyBackButtonText}>मुख्य पानावर जा</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

        <Text style={styles.headerTitle}>संकल्प तपशील</Text>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon source="share-variant" size={20} color="#E05300" />
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
        {/* Main Card: Uploaded Logo Image & Main Card Heading */}
        <View style={styles.headerCard}>
          {/* Logo Image (or Fallback Icon) */}
          <View style={styles.logoWrap}>
            {resolution.logoUrl ? (
              <Image
                source={{ uri: resolution.logoUrl }}
                style={styles.logoImage}
                contentFit="contain"
              />
            ) : (
              <Icon
                source={resolution.iconName || "star"}
                size={34}
                color="#E05300"
              />
            )}
          </View>

          {/* Main Card Heading */}
          <Text style={styles.mainHeadingTitle}>{resolution.title}</Text>

          {resolution.fullTitle && resolution.fullTitle !== resolution.title ? (
            <Text style={styles.fullTitleSubText}>{resolution.fullTitle}</Text>
          ) : null}

          {resolution.sankalpNumber ? (
            <View style={styles.numberBadge}>
              <Text style={styles.numberBadgeText}>
                संकल्प क्रमांक {toMarathiNumber(resolution.sankalpNumber)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Section 1: "माझा संकल्प" (Statement) - if present */}
        {resolution.sankalpStatement ? (
          <View style={styles.statementCard}>
            <View style={styles.cardHeaderSmall}>
              <Icon source="bullseye-arrow" size={18} color="#E05300" />
              <Text style={styles.cardHeaderSmallText}>माझा संकल्प</Text>
            </View>
            <Text style={styles.statementText}>
              {resolution.sankalpStatement}
            </Text>
          </View>
        ) : null}

        {/* Dynamic Rich Document Content from CMS Word-style Editor */}
        {(cmsDetail?.content || resolution.content) ? (
          <View style={{ marginBottom: 16 }}>
            <View style={[styles.cardHeaderSmall, { marginBottom: 8 }]}>
              <Icon source="file-document-outline" size={18} color="#EA580C" />
              <Text style={styles.cardHeaderSmallText}>
                सविस्तर विकास आराखडा व कृती धोरण
              </Text>
            </View>
            <SankalpDocumentRenderer
              htmlContent={cmsDetail?.content || resolution.content || ""}
            />
          </View>
        ) : null}

        {/* Section 2: "माझे धोरण" (Point-to-Point Options - 3 Points Initial + Read More) */}
        {uniquePolicies.length > 0 && (
          <View style={styles.pointsCard}>
            <View style={styles.cardHeaderSmall}>
              <Icon source="clipboard-text-outline" size={18} color="#E05300" />
              <Text style={styles.cardHeaderSmallText}>माझे धोरण (प्रमुख मुद्दे)</Text>
            </View>

            <View style={styles.pointsList}>
              {displayedPolicies.map((pointText, index) => (
                <View key={index} style={styles.pointRow}>
                  <View style={styles.pointNumberBadge}>
                    <Text style={styles.pointNumberText}>
                      {toMarathiNumber(index + 1)}
                    </Text>
                  </View>
                  <Text style={styles.pointText}>{pointText}</Text>
                </View>
              ))}
            </View>

            {hasMorePolicies && (
              <TouchableOpacity
                style={styles.readMoreButton}
                activeOpacity={0.8}
                onPress={() => setIsPoliciesExpanded((prev) => !prev)}
              >
                <Text style={styles.readMoreButtonText}>
                  {isPoliciesExpanded
                    ? "कमी दाखवा"
                    : `अधिक वाचा (+${toMarathiNumber(uniquePolicies.length - 3)} आणखी मुद्दे)`}
                </Text>
                <Icon
                  source={isPoliciesExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#E05300"
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Section 3: "कृती आराखडा" (Action Plan) - if present */}
        {resolution.actionPlan ? (
          <View style={styles.actionPlanCard}>
            <View style={styles.cardHeaderSmall}>
              <Icon source="clock-fast" size={18} color="#C2410C" />
              <Text style={[styles.cardHeaderSmallText, { color: "#9A3412" }]}>
                कृती आराखडा
              </Text>
            </View>
            <Text style={styles.actionPlanText}>{resolution.actionPlan}</Text>
          </View>
        ) : null}

        {/* Share Button at Bottom */}
        <TouchableOpacity
          style={styles.bottomShareButton}
          activeOpacity={0.85}
          onPress={handleShare}
        >
          <Icon source="whatsapp" size={18} color="#FFFFFF" />
          <Text style={styles.bottomShareButtonText}>हा संकल्प शेअर करा</Text>
        </TouchableOpacity>

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
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#1C1917",
  },
  shareButton: {
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

  // Main Card: Logo + Heading
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    shadowColor: "#E05300",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  logoWrap: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFEDD5",
    marginBottom: 12,
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  mainHeadingTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1C1917",
    textAlign: "center",
    lineHeight: 28,
  },
  fullTitleSubText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EA580C",
    textAlign: "center",
    marginTop: 4,
  },
  numberBadge: {
    marginTop: 10,
    backgroundColor: "#FFF7ED",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  numberBadgeText: {
    color: "#C2410C",
    fontSize: 12,
    fontWeight: "800",
  },

  // Statement Card
  statementCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  cardHeaderSmallText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1C1917",
  },
  statementText: {
    fontSize: 14.5,
    fontWeight: "600",
    color: "#292524",
    lineHeight: 23,
    backgroundColor: "#FFFBF5",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#E05300",
  },

  // Points (Point to Point Options) Card
  pointsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  pointsList: {
    gap: 10,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FAFAF9",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F5F5F4",
  },
  pointNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  pointNumberText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#C2410C",
  },
  pointText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#292524",
    lineHeight: 21,
  },
  readMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#FFF7ED",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  readMoreButtonText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#E05300",
  },

  // Action Plan Card
  actionPlanCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    marginBottom: 16,
  },
  actionPlanText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#431407",
    lineHeight: 22,
  },

  // Bottom Share Button
  bottomShareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16A34A",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomShareButtonText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "800",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#374151",
    marginTop: 14,
  },
  emptyBackButton: {
    marginTop: 20,
    backgroundColor: "#E05300",
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
  emptyBackButtonText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },
});
