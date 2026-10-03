import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign } from "../context/CampaignContext";
import { BottomTabBar } from "../components/BottomTabBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function AboutScreen() {
  const router = useRouter();
  const { candidate, party, aboutDetails, gallery, refreshAppConfig } = useCampaign();
  const [activeSegment, setActiveSegment] = useState<"intro" | "journey" | "social" | "gallery">("intro");
  const [refreshing, setRefreshing] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);

  // Dynamic hero banner source from admin panel config
  const heroBannerSource = React.useMemo(() => {
    if (heroImageError) {
      return require("../../assets/images/home_hero_banner.jpg");
    }

    // 1. Dynamic hero banner from admin config
    const dynamicBanner =
      aboutDetails?.heroBannerUrl ||
      aboutDetails?.heroBannerImage ||
      aboutDetails?.bannerUrl ||
      (aboutDetails as any)?.imageUrl ||
      (aboutDetails as any)?.image_url;

    if (dynamicBanner && typeof dynamicBanner === "string" && dynamicBanner.trim().length > 0) {
      return { uri: dynamicBanner.trim() };
    }

    // 2. Candidate photo from campaign context
    if (candidate?.photo) {
      if (typeof candidate.photo === "string") {
        return { uri: candidate.photo };
      }
      return candidate.photo;
    }

    // 3. Bundled asset fallback
    return require("../../assets/images/home_hero_banner.jpg");
  }, [aboutDetails, candidate?.photo, heroImageError]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAppConfig();
    } catch (e) {
      console.log("Error refreshing about info:", e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#E05300" />

      {/* Top Navigation Header */}
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
            <Text style={styles.headerMainTitle}>आमच्याबद्दल</Text>
            <Text style={styles.headerSubtitle}>About</Text>
          </View>
        </View>

        {/* Right: Shiv Sena Logo Emblem */}
        <View style={styles.logoEmblemContainer}>
          <Image
            source={require("../../assets/images/shivsena_logo.png")}
            style={styles.logoEmblemImg}
            contentFit="cover"
          />
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
        {/* Top Hero Profile Card */}
        <View style={styles.heroProfileCard}>
          {/* Left: Candidate Photo / Hero Banner */}
          <View style={styles.heroImageWrapper}>
            <Image
              source={heroBannerSource}
              style={styles.heroCandidateImage}
              contentFit="cover"
              priority="high"
              onError={() => setHeroImageError(true)}
            />
          </View>

          {/* Right: Quote, Name & Subtitle */}
          <View style={styles.heroInfoColumn}>
            <View style={styles.quoteWrapper}>
              <Text style={styles.quoteMark}>“</Text>
              <Text style={styles.quoteText} numberOfLines={3}>
                {aboutDetails?.quoteText || candidate.tagline || "माणसांसाठी काम करणारा, आपला माणूस !"}
              </Text>
              <Text style={styles.quoteMarkRight}>”</Text>
              <View style={styles.orangeBrushLine} />
            </View>

            <View style={styles.nameBlock}>
              <Text style={styles.candidateName} numberOfLines={1}>{candidate.name || "श्री. सचिन मलिक"}</Text>
              <Text style={styles.candidateTagline} numberOfLines={1}>
                {aboutDetails?.quoteAuthor || candidate.designation || candidate.tagline || "शिवसेना अधिकृत उमेदवार"}
              </Text>
            </View>
          </View>
        </View>

        {/* 4-Segment Navigation Tabs */}
        <View style={styles.segmentRow}>
          {/* Tab 1: परिचय */}
          <TouchableOpacity
            style={styles.segmentItem}
            onPress={() => setActiveSegment("intro")}
            activeOpacity={0.75}
          >
            <View style={[styles.segmentIconWrap, activeSegment === "intro" && styles.segmentIconActive]}>
              <Icon source="account" size={24} color={activeSegment === "intro" ? "#E05300" : "#78716C"} />
            </View>
            <Text style={[styles.segmentText, activeSegment === "intro" && styles.segmentTextActive]}>
              परिचय
            </Text>
            {activeSegment === "intro" && <View style={styles.activeUnderline} />}
          </TouchableOpacity>

          {/* Tab 2: कार्यप्रवास */}
          <TouchableOpacity
            style={styles.segmentItem}
            onPress={() => setActiveSegment("journey")}
            activeOpacity={0.75}
          >
            <View style={[styles.segmentIconWrap, activeSegment === "journey" && styles.segmentIconActive]}>
              <Icon source="flag-variant" size={24} color={activeSegment === "journey" ? "#E05300" : "#78716C"} />
            </View>
            <Text style={[styles.segmentText, activeSegment === "journey" && styles.segmentTextActive]}>
              कार्यप्रवास
            </Text>
            {activeSegment === "journey" && <View style={styles.activeUnderline} />}
          </TouchableOpacity>

          {/* Tab 3: सामाजिक कार्य */}
          <TouchableOpacity
            style={styles.segmentItem}
            onPress={() => setActiveSegment("social")}
            activeOpacity={0.75}
          >
            <View style={[styles.segmentIconWrap, activeSegment === "social" && styles.segmentIconActive]}>
              <Icon source="account-group" size={24} color={activeSegment === "social" ? "#E05300" : "#78716C"} />
            </View>
            <Text style={[styles.segmentText, activeSegment === "social" && styles.segmentTextActive]}>
              सामाजिक कार्य
            </Text>
            {activeSegment === "social" && <View style={styles.activeUnderline} />}
          </TouchableOpacity>

          {/* Tab 4: गॅलरी */}
          <TouchableOpacity
            style={styles.segmentItem}
            onPress={() => setActiveSegment("gallery")}
            activeOpacity={0.75}
          >
            <View style={[styles.segmentIconWrap, activeSegment === "gallery" && styles.segmentIconActive]}>
              <Icon source="image-outline" size={24} color={activeSegment === "gallery" ? "#E05300" : "#78716C"} />
            </View>
            <Text style={[styles.segmentText, activeSegment === "gallery" && styles.segmentTextActive]}>
              गॅलरी
            </Text>
            {activeSegment === "gallery" && <View style={styles.activeUnderline} />}
          </TouchableOpacity>
        </View>

        {/* Segment 1: "परिचय" (Intro) */}
        {activeSegment === "intro" && (
          <>
            <View style={styles.introCard}>
              <View style={styles.introContentLayout}>
                {/* Left Column: Narrative Bio */}
                <View style={styles.bioColumn}>
                  <View style={styles.titleUnderlineWrap}>
                    <Text style={styles.sectionHeading}>माझा परिचय</Text>
                    <View style={styles.titleBar} />
                  </View>

                  <Text style={styles.bioText}>
                    {aboutDetails.biography || candidate.biography}
                  </Text>
                </View>

                {/* Right Column: Personal Data Box */}
                <View style={styles.personalDataBox}>
                  <View style={styles.dataRow}>
                    <Icon source="account" size={18} color="#E05300" />
                    <View style={styles.dataTextWrap}>
                      <Text style={styles.dataLabel}>पूर्ण नाव</Text>
                      <Text style={styles.dataValue}>{candidate.name}</Text>
                    </View>
                  </View>

                  <View style={styles.dataRow}>
                    <Icon source="map-marker" size={18} color="#E05300" />
                    <View style={styles.dataTextWrap}>
                      <Text style={styles.dataLabel}>मतदारसंघ</Text>
                      <Text style={styles.dataValue}>{candidate.constituency}</Text>
                    </View>
                  </View>

                  <View style={styles.dataRow}>
                    <Icon source="briefcase-outline" size={18} color="#E05300" />
                    <View style={styles.dataTextWrap}>
                      <Text style={styles.dataLabel}>पक्ष</Text>
                      <Text style={styles.dataValue}>
                        {party.name} {party.faction}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dataRow}>
                    <Icon source="calendar-month-outline" size={18} color="#E05300" />
                    <View style={styles.dataTextWrap}>
                      <Text style={styles.dataLabel}>राजकीय प्रवेश</Text>
                      <Text style={styles.dataValue}>{aboutDetails.politicalEntryYear || "2015"}</Text>
                    </View>
                  </View>

                  <View style={styles.dataRow}>
                    <Icon source="heart" size={18} color="#E05300" />
                    <View style={styles.dataTextWrap}>
                      <Text style={styles.dataLabel}>ध्येय</Text>
                      <Text style={styles.dataValue}>जनतेचा सर्वांगीण विकास</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* 2 Side-by-Side Cards: "माझे ध्येय" & "माझी भूमिका" */}
            <View style={styles.dualCardsRow}>
              {/* Card 1: माझे ध्येय */}
              <View style={styles.pillarCard}>
                <View style={styles.pillarHeader}>
                  <View style={styles.pillarIconCircle}>
                    <Icon source="target" size={22} color="#E05300" />
                  </View>
                  <Text style={styles.pillarTitle}>माझे ध्येय</Text>
                </View>
                <Text style={styles.pillarText}>
                  {aboutDetails.missionStatement ||
                    "प्रत्येक नागरिकाला विकासाच्या मुख्य प्रवाहात आणणे आणि सुशासन, सुविधा व संधी सर्वांपर्यंत पोहोचवणे."}
                </Text>
              </View>

              {/* Card 2: माझी भूमिका */}
              <View style={styles.pillarCard}>
                <View style={styles.pillarHeader}>
                  <View style={styles.pillarIconCircle}>
                    <Icon source="account-group" size={22} color="#E05300" />
                  </View>
                  <Text style={styles.pillarTitle}>माझी भूमिका</Text>
                </View>
                <Text style={styles.pillarText}>
                  {aboutDetails.roleDescription ||
                    "जनतेचे प्रश्न समजून घेणे, त्यावर कृती करणे आणि एक विकसित, सक्षम आणि प्रगत समाज घडवणे."}
                </Text>
              </View>
            </View>

            {/* Quote Strip with Architectural Watermark */}
            <View style={styles.quoteStrip}>
              <View style={styles.watermarkBuilding}>
                <Icon source="bank" size={90} color="rgba(224, 83, 0, 0.08)" />
              </View>
              <View style={styles.quoteStripContent}>
                <Text style={styles.stripQuoteMark}>“</Text>
                <Text style={styles.stripQuoteText}>
                  {aboutDetails.quoteText || "माझं ध्येय – आपला विकास, आपला विश्वास !"}
                </Text>
                <Text style={styles.stripQuoteMark}>”</Text>
              </View>
              <View style={styles.stripBrushLine} />
            </View>

            {/* "सोशल मिडिया" (Social Media) Section */}
            <View style={styles.socialSection}>
              <View style={styles.titleUnderlineWrap}>
                <Text style={styles.sectionHeading}>सोशल मिडिया</Text>
                <View style={styles.titleBar} />
              </View>

              <View style={styles.socialIconsRow}>
                {/* Facebook */}
                <TouchableOpacity
                  style={[styles.socialCircle, { backgroundColor: "#1877F2" }]}
                  onPress={() =>
                    aboutDetails.socialLinks?.facebook &&
                    Linking.openURL(aboutDetails.socialLinks.facebook).catch(() => {})
                  }
                  activeOpacity={0.8}
                >
                  <Icon source="facebook" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Instagram */}
                <TouchableOpacity
                  style={[styles.socialCircle, { backgroundColor: "#E4405F" }]}
                  onPress={() =>
                    aboutDetails.socialLinks?.instagram &&
                    Linking.openURL(aboutDetails.socialLinks.instagram).catch(() => {})
                  }
                  activeOpacity={0.8}
                >
                  <Icon source="instagram" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                {/* X (Twitter) */}
                <TouchableOpacity
                  style={[styles.socialCircle, { backgroundColor: "#000000" }]}
                  onPress={() =>
                    aboutDetails.socialLinks?.twitter &&
                    Linking.openURL(aboutDetails.socialLinks.twitter).catch(() => {})
                  }
                  activeOpacity={0.8}
                >
                  <Icon source="twitter" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                {/* YouTube */}
                <TouchableOpacity
                  style={[styles.socialCircle, { backgroundColor: "#FF0000" }]}
                  onPress={() =>
                    aboutDetails.socialLinks?.youtube &&
                    Linking.openURL(aboutDetails.socialLinks.youtube).catch(() => {})
                  }
                  activeOpacity={0.8}
                >
                  <Icon source="youtube" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                {/* WhatsApp */}
                <TouchableOpacity
                  style={[styles.socialCircle, { backgroundColor: "#25D366" }]}
                  onPress={() =>
                    aboutDetails.socialLinks?.whatsapp &&
                    Linking.openURL(aboutDetails.socialLinks.whatsapp).catch(() => {})
                  }
                  activeOpacity={0.8}
                >
                  <Icon source="whatsapp" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Segment 2: "कार्यप्रवास" (Journey Timeline) */}
        {activeSegment === "journey" && (
          <View style={styles.segmentContainer}>
            <View style={styles.titleUnderlineWrap}>
              <Text style={styles.sectionHeading}>कार्यप्रवास व महत्त्वाचे टप्पे</Text>
              <View style={styles.titleBar} />
            </View>
            <Text style={styles.segmentSubHeading}>
              जनसेवेतील उल्लेखनीय कामगिरी आणि राजकीय प्रवासाचा ऐतिहासिक आलेख
            </Text>

            <View style={styles.timelineList}>
              {aboutDetails.milestones?.map((item, index) => (
                <View key={item.id || index} style={styles.timelineItemRow}>
                  {/* Left Column: Year Badge & Vertical Connector */}
                  <View style={styles.timelineLeftCol}>
                    <View style={styles.timelineYearBadge}>
                      <Text style={styles.timelineYearText}>{item.year}</Text>
                    </View>
                    {index < (aboutDetails.milestones?.length || 0) - 1 && (
                      <View style={styles.timelineConnector} />
                    )}
                  </View>

                  {/* Right Column: Card with Details */}
                  <View style={styles.timelineCard}>
                    <View style={styles.timelineCardHeader}>
                      <Text style={styles.timelineTitle}>{item.title}</Text>
                      {item.tag && (
                        <View style={styles.timelineTagBadge}>
                          <Text style={styles.timelineTagText}>{item.tag}</Text>
                        </View>
                      )}
                    </View>
                    {item.subtitle && (
                      <Text style={styles.timelineSubtitle}>{item.subtitle}</Text>
                    )}
                    <Text style={styles.timelineDesc}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Segment 3: "सामाजिक कार्य" (Social Work & Public Welfare) */}
        {activeSegment === "social" && (
          <View style={styles.segmentContainer}>
            <View style={styles.titleUnderlineWrap}>
              <Text style={styles.sectionHeading}>सामाजिक कार्य व लोककल्याण</Text>
              <View style={styles.titleBar} />
            </View>
            <Text style={styles.segmentSubHeading}>
              कोपरगाव व परिसरातील नागरिकांच्या कल्याणासाठी राबवलेले मुख्य उपक्रम
            </Text>

            <View style={styles.socialCardsList}>
              {aboutDetails.socialWorks?.map((work, idx) => (
                <View key={work.id || idx} style={styles.socialWorkCard}>
                  <View style={styles.socialCardTopRow}>
                    <View style={styles.socialWorkIconWrap}>
                      <Icon source={work.iconName || "heart"} size={22} color="#E05300" />
                    </View>
                    <View style={styles.socialWorkMeta}>
                      <Text style={styles.socialWorkTitle}>{work.title}</Text>
                      <View style={styles.socialWorkCategoryBadge}>
                        <Text style={styles.socialWorkCategoryText}>{work.category}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.socialWorkDesc}>{work.description}</Text>
                  <View style={styles.socialImpactChip}>
                    <Icon source="check-decagram" size={16} color="#16A34A" />
                    <Text style={styles.socialImpactText}>{work.impactCount}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Segment 4: "गॅलरी" (Gallery Highlights) */}
        {activeSegment === "gallery" && (
          <View style={styles.segmentContainer}>
            <View style={styles.titleUnderlineWrap}>
              <Text style={styles.sectionHeading}>निवडक क्षणचित्रे</Text>
              <View style={styles.titleBar} />
            </View>
            <Text style={styles.segmentSubHeading}>
              जनसंवाद मेळावे, विकासकामे आणि समाजकार्यातील निवडक क्षण
            </Text>

            {gallery && gallery.length > 0 ? (
              <View style={styles.galleryPreviewGrid}>
                {gallery.slice(0, 4).map((item: any) => (
                  <TouchableOpacity
                    key={String(item.id)}
                    style={styles.galleryGridCard}
                    onPress={() => router.push("/gallery")}
                    activeOpacity={0.88}
                  >
                    <Image
                      source={item.image}
                      style={styles.galleryGridImg}
                      contentFit="cover"
                    />
                    <Text style={styles.galleryGridLabel} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <Icon source="image-outline" size={36} color="#D1D5DB" />
                <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 8 }}>
                  सध्या गॅलरीमध्ये फोटो उपलब्ध नाहीत.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.fullGalleryBtn}
              onPress={() => router.push("/gallery")}
              activeOpacity={0.85}
            >
              <Text style={styles.fullGalleryBtnText}>संपूर्ण फोटो गॅलरी पहा</Text>
              <Icon source="arrow-right" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Navigation Tab Bar */}
      <BottomTabBar currentTab="about" />
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
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
  },
  headerSubtitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.95,
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

  // Top Hero Profile Card
  heroProfileCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
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
    height: 180,
  },
  heroImageWrapper: {
    width: "48%",
    height: "100%",
    backgroundColor: "#FDF8F3",
    overflow: "hidden",
  },
  heroCandidateImage: {
    width: "100%",
    height: "100%",
  },
  heroInfoColumn: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  quoteWrapper: {
    position: "relative",
  },
  quoteMark: {
    color: "#E05300",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 22,
    marginBottom: -4,
  },
  quoteText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1C1917",
    lineHeight: 18,
  },
  quoteMarkRight: {
    color: "#E05300",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 22,
    alignSelf: "flex-end",
    marginTop: -8,
  },
  orangeBrushLine: {
    width: 70,
    height: 3,
    backgroundColor: "#E05300",
    borderRadius: 2,
    marginTop: 2,
  },
  nameBlock: {
    marginTop: 6,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1C1917",
  },
  candidateTagline: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E05300",
    marginTop: 2,
  },

  // 4-Segment Tabs
  segmentRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0EFEA",
  },
  segmentItem: {
    alignItems: "center",
    position: "relative",
    paddingBottom: 4,
    minWidth: 64,
  },
  segmentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  segmentIconActive: {
    backgroundColor: "#FFEDD5",
  },
  segmentText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#78716C",
  },
  segmentTextActive: {
    color: "#E05300",
    fontWeight: "800",
  },
  activeUnderline: {
    position: "absolute",
    bottom: 0,
    width: 28,
    height: 2.5,
    backgroundColor: "#E05300",
    borderRadius: 2,
  },

  // Section: "माझा परिचय"
  introCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0EFEA",
  },
  introContentLayout: {
    flexDirection: "row",
    gap: 12,
  },
  bioColumn: {
    flex: 1.15,
  },
  titleUnderlineWrap: {
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16.5,
    fontWeight: "900",
    color: "#1C1917",
  },
  titleBar: {
    width: 28,
    height: 3,
    backgroundColor: "#E05300",
    borderRadius: 2,
    marginTop: 3,
  },
  bioText: {
    fontSize: 11.5,
    color: "#44403C",
    lineHeight: 18,
    textAlign: "justify",
  },
  personalDataBox: {
    flex: 1,
    backgroundColor: "#F8F7F4",
    borderRadius: 14,
    padding: 10,
    justifyContent: "space-around",
    gap: 8,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  dataTextWrap: {
    flex: 1,
  },
  dataLabel: {
    fontSize: 10,
    color: "#78716C",
    fontWeight: "600",
  },
  dataValue: {
    fontSize: 11,
    color: "#1C1917",
    fontWeight: "800",
    lineHeight: 15,
  },

  // 2 Side-by-Side Cards
  dualCardsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  pillarCard: {
    flex: 1,
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  pillarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  pillarIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  pillarTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#E05300",
  },
  pillarText: {
    fontSize: 11.5,
    color: "#44403C",
    lineHeight: 16.5,
  },

  // Quote Strip
  quoteStrip: {
    backgroundColor: "#FFFBEB",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FDE68A",
    alignItems: "center",
  },
  watermarkBuilding: {
    position: "absolute",
    left: 8,
    bottom: -15,
  },
  quoteStripContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  stripQuoteMark: {
    color: "#E05300",
    fontSize: 22,
    fontWeight: "900",
    marginHorizontal: 4,
  },
  stripQuoteText: {
    color: "#1C1917",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },
  stripBrushLine: {
    width: 140,
    height: 3,
    backgroundColor: "#E05300",
    borderRadius: 2,
    marginTop: 6,
  },

  // Social Section
  socialSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  socialIconsRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 4,
  },
  socialCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },

  // Segment Containers & Headings
  segmentContainer: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0EFEA",
  },
  segmentSubHeading: {
    fontSize: 12,
    color: "#78716C",
    fontWeight: "600",
    marginBottom: 16,
  },

  // Timeline (Journey)
  timelineList: {
    marginTop: 4,
  },
  timelineItemRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  timelineLeftCol: {
    alignItems: "center",
    width: 62,
    marginRight: 8,
  },
  timelineYearBadge: {
    backgroundColor: "#E05300",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineYearText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "900",
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: "#FFD8B5",
    marginVertical: 4,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: "#FDF8F3",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  timelineCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#1C1917",
    flex: 1,
  },
  timelineTagBadge: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timelineTagText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "800",
  },
  timelineSubtitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#C2410C",
    marginBottom: 4,
  },
  timelineDesc: {
    fontSize: 11,
    color: "#57534E",
    lineHeight: 16,
  },

  // Social Works
  socialCardsList: {
    gap: 12,
  },
  socialWorkCard: {
    backgroundColor: "#FDF8F3",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  socialCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  socialWorkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
  },
  socialWorkMeta: {
    flex: 1,
  },
  socialWorkTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1C1917",
  },
  socialWorkCategoryBadge: {
    backgroundColor: "#FED7AA",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  socialWorkCategoryText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#C2410C",
  },
  socialWorkDesc: {
    fontSize: 11.5,
    color: "#44403C",
    lineHeight: 17,
    marginBottom: 8,
  },
  socialImpactChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F0FDF4",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  socialImpactText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#15803D",
  },

  // Gallery Highlights Preview
  galleryPreviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  galleryGridCard: {
    width: "48%",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    backgroundColor: "#F5F5F4",
  },
  galleryGridImg: {
    width: "100%",
    height: 95,
  },
  galleryGridLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#1C1917",
    paddingVertical: 5,
    textAlign: "center",
    backgroundColor: "#FFFFFF",
  },
  fullGalleryBtn: {
    backgroundColor: "#E05300",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 14,
    gap: 6,
  },
  fullGalleryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
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
});
