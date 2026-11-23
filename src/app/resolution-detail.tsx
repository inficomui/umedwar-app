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
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign, ResolutionItem } from "../context/CampaignContext";
import { enrichResolution } from "../constants/campaignData";
import { sankalpApi, SankalpDetailItem } from "../services/sankalpApi";
import { SankalpDocumentRenderer } from "../components/SankalpDocumentRenderer";
import {
  NewDevelopmentPlanService,
  InitiativeDetailResponse,
  CardItem,
  PolicyPoint,
  ActionPlanStep,
} from "../services/newDevelopmentPlanService";

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
  const [devPlanDetail, setDevPlanDetail] = useState<InitiativeDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isPoliciesExpanded, setIsPoliciesExpanded] = useState(false);

  const targetKey = params.slug || params.id || "";

  // Fetch full rich formatted document & dev plan initiative detail
  useEffect(() => {
    let isMounted = true;
    if (targetKey) {
      setLoadingDetail(true);
      Promise.allSettled([
        NewDevelopmentPlanService.getInitiativeDetail(targetKey),
        sankalpApi.getSankalpDetail(targetKey),
      ])
        .then(([planResult, sankalpResult]) => {
          if (!isMounted) return;
          if (planResult.status === "fulfilled" && planResult.value) {
            setDevPlanDetail(planResult.value);
          }
          if (sankalpResult.status === "fulfilled" && sankalpResult.value) {
            setCmsDetail(sankalpResult.value);
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
        const [planRes, sankalpRes] = await Promise.allSettled([
          NewDevelopmentPlanService.getInitiativeDetail(targetKey),
          sankalpApi.getSankalpDetail(targetKey),
        ]);
        if (planRes.status === "fulfilled" && planRes.value) setDevPlanDetail(planRes.value);
        if (sankalpRes.status === "fulfilled" && sankalpRes.value) setCmsDetail(sankalpRes.value);
      }
    } catch {
      // offline fallback
    } finally {
      setRefreshing(false);
    }
  }, [refreshAppConfig, targetKey]);

  const allResolutions: ResolutionItem[] = resolutions || [];

  const legacyResolution: ResolutionItem | null = useMemo(() => {
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

  const initiative = devPlanDetail?.initiative;

  // Clean and deduplicate policy points so no repeated point is displayed
  const uniquePolicies = useMemo(() => {
    let sourcePolicies = legacyResolution?.policies;
    if (!sourcePolicies || !Array.isArray(sourcePolicies) || sourcePolicies.length === 0) {
      if (legacyResolution?.fullDetails && typeof legacyResolution.fullDetails === "string") {
        sourcePolicies = legacyResolution.fullDetails
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
  }, [legacyResolution]);

  const initiativePolicies: PolicyPoint[] = initiative?.policies || [];
  const hasInitiativePolicies = initiativePolicies.length > 0;

  // Show only 3 points initially unless expanded with "Read more"
  const displayedInitiativePolicies = useMemo(() => {
    if (isPoliciesExpanded || initiativePolicies.length <= 3) {
      return initiativePolicies;
    }
    return initiativePolicies.slice(0, 3);
  }, [initiativePolicies, isPoliciesExpanded]);

  const displayedLegacyPolicies = useMemo(() => {
    if (isPoliciesExpanded || uniquePolicies.length <= 3) {
      return uniquePolicies;
    }
    return uniquePolicies.slice(0, 3);
  }, [uniquePolicies, isPoliciesExpanded]);

  const hasMorePolicies = hasInitiativePolicies
    ? initiativePolicies.length > 3
    : uniquePolicies.length > 3;

  const totalPoliciesCount = hasInitiativePolicies
    ? initiativePolicies.length
    : uniquePolicies.length;

  const handleShare = async () => {
    const title = initiative?.title || legacyResolution?.title || "संकल्प";
    const statement = initiative?.sankalp_text || legacyResolution?.sankalpStatement || "";

    let policiesText = "";
    if (hasInitiativePolicies) {
      policiesText =
        `\n\n📋 *माझे धोरण:*\n` +
        initiativePolicies
          .map(
            (p, idx) =>
              `${toMarathiNumber(idx + 1)}. ${p.heading ? `*${p.heading}*: ` : ""}${p.description}`
          )
          .join("\n");
    } else if (uniquePolicies.length > 0) {
      policiesText =
        `\n\n📋 *माझे धोरण:*\n` +
        uniquePolicies
          .map((p, idx) => `${toMarathiNumber(idx + 1)}. ${p}`)
          .join("\n");
    }

    let actionText = "";
    if (initiative?.actionPlans && initiative.actionPlans.length > 0) {
      actionText =
        `\n\n🎯 *कृती आराखडा:*\n` +
        initiative.actionPlans
          .map(
            (a) =>
              `• टप्पा ${toMarathiNumber(a.step_number)}: ${a.action_heading} - ${a.action_description}`
          )
          .join("\n");
    } else if (legacyResolution?.actionPlan) {
      actionText = `\n\n🎯 *कृती आराखडा:*\n${legacyResolution.actionPlan}`;
    }

    const shareMsg =
      `🚩 *${candidate.name} – ${title}* 🚩\n\n` +
      (statement ? `*माझा संकल्प:* ${statement}\n` : "") +
      policiesText +
      actionText +
      `\n\n📲 *“मी सचिन मलिक” ॲप डाऊनलोड करा!*`;

    try {
      await Share.share({
        message: shareMsg,
        title,
      });
    } catch {
      // ignore
    }
  };

  const handleCallOfficer = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
  };

  const isReady = !!(initiative || legacyResolution);

  if (loadingDetail && !isReady) {
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
          <Text style={styles.headerTitle}>संकल्प व सेवा तपशील</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#E05300" />
          <Text style={styles.emptyTitle}>माहिती लोड होत आहे...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isReady) {
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
          <Text style={styles.headerTitle}>संकल्प व सेवा तपशील</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Icon source="alert-circle-outline" size={54} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>हा उपक्रम आढळला नाही किंवा अद्याप प्रसिद्ध झालेला नाही.</Text>
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

  const activeTitle = initiative?.title || legacyResolution?.title || "संकल्प";
  const activeSubtitle =
    initiative?.short_description ||
    legacyResolution?.subtitle ||
    legacyResolution?.fullTitle;
  const activeSankalpStatement =
    initiative?.sankalp_text || legacyResolution?.sankalpStatement;
  const activeLogoUrl = initiative?.image_url || legacyResolution?.logoUrl;
  const activeIconEmoji = initiative?.icon;

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

        <Text style={styles.headerTitle} numberOfLines={1}>
          {initiative?.section?.title || "संकल्प व सेवा तपशील"}
        </Text>

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
        {/* Main Card: Section Badge, Icon/Logo, and Main Heading */}
        <View style={styles.headerCard}>
          {initiative?.section && (
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>
                {initiative.section.icon || "🎯"} {initiative.section.title}
              </Text>
            </View>
          )}

          {/* Logo Image or Emoji Icon */}
          <View style={styles.logoWrap}>
            {activeLogoUrl ? (
              <Image
                source={{ uri: activeLogoUrl }}
                style={styles.logoImage}
                contentFit="contain"
              />
            ) : activeIconEmoji ? (
              <Text style={{ fontSize: 34 }}>{activeIconEmoji}</Text>
            ) : (
              <Icon
                source={legacyResolution?.iconName || "star"}
                size={34}
                color="#E05300"
              />
            )}
          </View>

          {/* Main Card Heading */}
          <Text style={styles.mainHeadingTitle}>{activeTitle}</Text>

          {activeSubtitle && activeSubtitle !== activeTitle ? (
            <Text style={styles.fullTitleSubText}>{activeSubtitle}</Text>
          ) : null}

          {legacyResolution?.sankalpNumber ? (
            <View style={styles.numberBadge}>
              <Text style={styles.numberBadgeText}>
                संकल्प क्रमांक {toMarathiNumber(legacyResolution.sankalpNumber)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Section 1: "माझा संकल्प" (Statement) - if present */}
        {activeSankalpStatement ? (
          <View style={styles.statementCard}>
            <View style={styles.cardHeaderSmall}>
              <Icon source="bullseye-arrow" size={18} color="#E05300" />
              <Text style={styles.cardHeaderSmallText}>माझा संकल्प</Text>
            </View>
            <Text style={styles.statementText}>{activeSankalpStatement}</Text>
          </View>
        ) : null}

        {/* Dynamic Rich Document Content from CMS Word-style Editor if available */}
        {(cmsDetail?.content || legacyResolution?.content) ? (
          <View style={{ marginBottom: 16 }}>
            <View style={[styles.cardHeaderSmall, { marginBottom: 8 }]}>
              <Icon source="file-document-outline" size={18} color="#EA580C" />
              <Text style={styles.cardHeaderSmallText}>
                सविस्तर विकास आराखडा व कृती धोरण
              </Text>
            </View>
            <SankalpDocumentRenderer
              htmlContent={cmsDetail?.content || legacyResolution?.content || ""}
            />
          </View>
        ) : null}

        {/* Section 2: "माझे धोरण" (Point-to-Point Options - 3 Points Initial + Read More) */}
        {hasInitiativePolicies ? (
          <View style={styles.pointsCard}>
            <View style={styles.cardHeaderSmall}>
              <Icon source="clipboard-text-outline" size={18} color="#E05300" />
              <Text style={styles.cardHeaderSmallText}>माझे धोरण (प्रमुख धोरणे)</Text>
            </View>

            <View style={styles.pointsList}>
              {displayedInitiativePolicies.map((point, index) => (
                <View key={point.id || index} style={styles.policyCardRow}>
                  <View style={styles.pointNumberBadge}>
                    <Text style={styles.pointNumberText}>
                      {toMarathiNumber(index + 1)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    {point.heading ? (
                      <Text style={styles.policyHeadingText}>{point.heading}</Text>
                    ) : null}
                    <Text style={styles.policyDescText}>{point.description}</Text>
                  </View>
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
                    : `अधिक वाचा (+${toMarathiNumber(totalPoliciesCount - 3)} आणखी धोरणे)`}
                </Text>
                <Icon
                  source={isPoliciesExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#E05300"
                />
              </TouchableOpacity>
            )}
          </View>
        ) : uniquePolicies.length > 0 ? (
          <View style={styles.pointsCard}>
            <View style={styles.cardHeaderSmall}>
              <Icon source="clipboard-text-outline" size={18} color="#E05300" />
              <Text style={styles.cardHeaderSmallText}>माझे धोरण (प्रमुख मुद्दे)</Text>
            </View>

            <View style={styles.pointsList}>
              {displayedLegacyPolicies.map((pointText, index) => (
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
                    : `अधिक वाचा (+${toMarathiNumber(totalPoliciesCount - 3)} आणखी मुद्दे)`}
                </Text>
                <Icon
                  source={isPoliciesExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#E05300"
                />
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Section 3: "कृती आराखडा" (Action Plan) */}
        {initiative?.actionPlans && initiative.actionPlans.length > 0 ? (
          <View style={styles.actionPlanCard}>
            <View style={styles.cardHeaderSmall}>
              <Icon source="clock-fast" size={18} color="#C2410C" />
              <Text style={[styles.cardHeaderSmallText, { color: "#9A3412" }]}>
                कृती आराखडा (टप्पे)
              </Text>
            </View>
            <View style={styles.actionTimeline}>
              {initiative.actionPlans.map((action, index) => (
                <View key={action.id || index} style={styles.timelineItem}>
                  <View style={styles.timelineStepBadge}>
                    <Text style={styles.timelineStepText}>
                      टप्पा {toMarathiNumber(action.step_number || index + 1)}
                    </Text>
                  </View>
                  <View style={styles.timelineContentBox}>
                    <Text style={styles.timelineHeadingText}>{action.action_heading}</Text>
                    <Text style={styles.timelineDescText}>{action.action_description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : legacyResolution?.actionPlan ? (
          <View style={styles.actionPlanCard}>
            <View style={styles.cardHeaderSmall}>
              <Icon source="clock-fast" size={18} color="#C2410C" />
              <Text style={[styles.cardHeaderSmallText, { color: "#9A3412" }]}>
                कृती आराखडा
              </Text>
            </View>
            <Text style={styles.actionPlanText}>{legacyResolution.actionPlan}</Text>
          </View>
        ) : null}

        {/* Section 4: Civic Services Specific Fields (नागरिक सेवा व तक्रार व्यवस्थापन) */}
        {initiative?.service_details ? (
          <View style={styles.serviceDetailsCard}>
            <View style={styles.cardHeaderSmall}>
              <Icon source="information-outline" size={18} color="#2563EB" />
              <Text style={[styles.cardHeaderSmallText, { color: "#1D4ED8" }]}>
                नागरी सेवा माहिती व स्वरूप
              </Text>
            </View>
            <Text style={styles.serviceDetailsText}>{initiative.service_details}</Text>
          </View>
        ) : null}

        {initiative?.required_documents && initiative.required_documents.length > 0 ? (
          <View style={styles.documentsCard}>
            <View style={styles.cardHeaderSmall}>
              <Icon source="file-document-check-outline" size={18} color="#059669" />
              <Text style={[styles.cardHeaderSmallText, { color: "#047857" }]}>
                आवश्यक कागदपत्रे
              </Text>
            </View>
            <View style={styles.documentList}>
              {initiative.required_documents.map((doc, dIdx) => (
                <View key={dIdx} style={styles.documentRow}>
                  <Icon source="check-circle" size={16} color="#059669" />
                  <Text style={styles.documentText}>{doc}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {initiative?.application_procedure ? (
          <View style={styles.procedureCard}>
            <View style={styles.cardHeaderSmall}>
              <Icon source="format-list-checks" size={18} color="#7C3AED" />
              <Text style={[styles.cardHeaderSmallText, { color: "#6D28D9" }]}>
                अर्ज प्रक्रिया (अर्ज कसा करावा?)
              </Text>
            </View>
            <Text style={styles.procedureText}>{initiative.application_procedure}</Text>
          </View>
        ) : null}

        {initiative?.contact_info &&
        (initiative.contact_info.officer || initiative.contact_info.phone) ? (
          <View style={styles.contactCard}>
            <View style={styles.cardHeaderSmall}>
              <Icon source="card-account-phone-outline" size={18} color="#E05300" />
              <Text style={styles.cardHeaderSmallText}>संपर्क अधिकारी व साहाय्यता</Text>
            </View>
            {initiative.contact_info.officer ? (
              <Text style={styles.officerNameText}>
                अधिकारी/कार्यालय: {initiative.contact_info.officer}
              </Text>
            ) : null}
            {initiative.contact_info.phone ? (
              <TouchableOpacity
                style={styles.callOfficerButton}
                activeOpacity={0.8}
                onPress={() => handleCallOfficer(initiative.contact_info?.phone)}
              >
                <Icon source="phone" size={18} color="#FFFFFF" />
                <Text style={styles.callOfficerButtonText}>
                  कॉल करा: {initiative.contact_info.phone}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Previous & Next Initiative Navigation Bar */}
        {devPlanDetail?.navigation &&
        (devPlanDetail.navigation.previous || devPlanDetail.navigation.next) ? (
          <View style={styles.navigationRow}>
            {devPlanDetail.navigation.previous ? (
              <TouchableOpacity
                style={styles.navButton}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/resolution-detail",
                    params: {
                      slug: devPlanDetail.navigation.previous!.slug,
                      id: String(devPlanDetail.navigation.previous!.id),
                    },
                  })
                }
              >
                <Icon source="arrow-left" size={18} color="#E05300" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.navButtonSub}>मागील उपक्रम</Text>
                  <Text style={styles.navButtonTitle} numberOfLines={1}>
                    {devPlanDetail.navigation.previous.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {devPlanDetail.navigation.next ? (
              <TouchableOpacity
                style={[styles.navButton, { alignItems: "flex-end" }]}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/resolution-detail",
                    params: {
                      slug: devPlanDetail.navigation.next!.slug,
                      id: String(devPlanDetail.navigation.next!.id),
                    },
                  })
                }
              >
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={styles.navButtonSub}>पुढील उपक्रम</Text>
                  <Text style={styles.navButtonTitle} numberOfLines={1}>
                    {devPlanDetail.navigation.next.title}
                  </Text>
                </View>
                <Icon source="arrow-right" size={18} color="#E05300" />
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}
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

  // Section Badge
  sectionBadge: {
    alignSelf: "center",
    backgroundColor: "#FFF7ED",
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FED7AA",
    marginBottom: 12,
  },
  sectionBadgeText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#C2410C",
  },

  // Policy Item (Rich with heading & description)
  policyCardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FAFAF9",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F5F5F4",
  },
  policyHeadingText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1C1917",
    marginBottom: 3,
  },
  policyDescText: {
    fontSize: 13.5,
    fontWeight: "500",
    color: "#44403C",
    lineHeight: 20,
  },

  // Action Timeline
  actionTimeline: {
    gap: 12,
  },
  timelineItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  timelineStepBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFEDD5",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  timelineStepText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#9A3412",
  },
  timelineContentBox: {},
  timelineHeadingText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1C1917",
    marginBottom: 4,
  },
  timelineDescText: {
    fontSize: 13.5,
    fontWeight: "500",
    color: "#44403C",
    lineHeight: 20,
  },

  // Civic Service: Details Card
  serviceDetailsCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    marginBottom: 16,
  },
  serviceDetailsText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E3A8A",
    lineHeight: 22,
  },

  // Civic Service: Documents Card
  documentsCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    marginBottom: 16,
  },
  documentList: {
    gap: 8,
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  documentText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "600",
    color: "#065F46",
    lineHeight: 20,
  },

  // Civic Service: Procedure Card
  procedureCard: {
    backgroundColor: "#F5F3FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#DDD6FE",
    marginBottom: 16,
  },
  procedureText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#5B21B6",
    lineHeight: 22,
  },

  // Civic Service: Contact Card
  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    marginBottom: 16,
  },
  officerNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 10,
  },
  callOfficerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  callOfficerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  // Previous & Next Navigation
  navigationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginVertical: 16,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  navButtonSub: {
    fontSize: 11,
    fontWeight: "600",
    color: "#78716C",
  },
  navButtonTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#1C1917",
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
