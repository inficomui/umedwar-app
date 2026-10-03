import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
  Alert,
  TextInput,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign, CarouselBanner } from "../context/CampaignContext";
import { BottomTabBar } from "../components/BottomTabBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// 1024 x 512 image aspect ratio (2:1)
const HERO_HEIGHT = Math.round(SCREEN_WIDTH * 0.52);
const GALLERY_CARD_W = Math.round((SCREEN_WIDTH - 16 * 2 - 10) / 2.2);

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

export default function HomeScreen() {
  const router = useRouter();
  const {
    party,
    candidate,
    contact,
    quoteCard,
    carouselBanners,
    customAdBanners,
    resolutions,
    newsArticles,
    videoGallery,
    gallery,
    issues,
    aboutDetails,
    carouselIntervalMs,
    refreshAppConfig,
    currentUser,
    isLoggedIn,
    logout,
  } = useCampaign();
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [selectedBanner, setSelectedBanner] = useState<CarouselBanner | null>(null);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAppConfig();
    } catch (e) {
      console.log("Error refreshing app config:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const flatListRef = useRef<FlatList<CarouselBanner>>(null);

  // Auto-advance carousel using dynamic interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (!carouselBanners || carouselBanners.length === 0) return;
      const nextIndex = (activeBannerIndex + 1) % carouselBanners.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveBannerIndex(nextIndex);
    }, carouselIntervalMs || 4200);

    return () => clearInterval(interval);
  }, [activeBannerIndex, carouselBanners?.length, carouselIntervalMs]);

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / SCREEN_WIDTH);
    if (index !== activeBannerIndex && index >= 0 && index < (carouselBanners?.length || 0)) {
      setActiveBannerIndex(index);
    }
  };

  const renderBanner = ({ item }: { item: CarouselBanner }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        style={styles.bannerSlide}
        onPress={() => setSelectedBanner(item)}
      >
        <Image
          source={item.image}
          style={styles.bannerImage}
          contentFit="cover"
          priority="high"
          transition={250}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#E05300" />

      {/* Top Navigation Header */}
      <View style={styles.topHeader}>
        {/* Left: Shiv Sena Logo Emblem & Text */}
        <View style={styles.headerLeftGroup}>
          <View style={styles.logoEmblemContainer}>
            <Image
              source={require("../../assets/images/shivsena_logo.png")}
              style={styles.logoEmblemImg}
              contentFit="cover"
            />
          </View>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerMainTitle}>{party.name}</Text>
            <Text style={styles.headerSubtitle}>{party.faction}</Text>
          </View>
        </View>

        {/* Right: Support Button, Notification Bell & Hamburger Menu */}
        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => router.push("/notifications")}
            activeOpacity={0.85}
          >
            <Icon source="bell-outline" size={20} color="#E05300" />
            <View style={styles.notifBadgeDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hamburgerButton}
            onPress={() => setMenuModalVisible(true)}
            activeOpacity={0.85}
          >
            <Icon source="menu" size={22} color="#E05300" />
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
        {/* Full-Width Hero Carousel */}
        {carouselBanners && carouselBanners.length > 0 && (
          <View style={styles.heroCarouselContainer}>
            <FlatList
              ref={flatListRef}
              data={carouselBanners}
              renderItem={renderBanner}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleBannerScroll}
              decelerationRate="fast"
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
            />

            {/* Active Pagination Indicators Overlaid on Banner Bottom */}
            <View style={styles.carouselIndicators}>
              {carouselBanners.map((_, idx) => {
                const isActive = idx === activeBannerIndex;
                return (
                  <TouchableOpacity
                    key={idx.toString()}
                    activeOpacity={0.8}
                    onPress={() => {
                      flatListRef.current?.scrollToIndex({ index: idx, animated: true });
                      setActiveBannerIndex(idx);
                    }}
                    style={[
                      styles.indicatorDot,
                      isActive ? styles.indicatorActive : styles.indicatorInactive,
                    ]}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* Candidate / Umedwar Name Showcase Card (Bottom of Carousel) */}
        <TouchableOpacity
          style={styles.candidateNameCard}
          activeOpacity={0.9}
          onPress={() => router.push("/about")}
        >
          {/* Top Badges Row */}
          <View style={styles.candidateBadgeRow}>
            <View style={styles.candidateHonorificBadge}>
              <Text style={styles.candidateHonorificText}>
                ★ {candidate.honorific || "लोकप्रिय उमेदवार"} ★
              </Text>
            </View>
            <View style={styles.candidatePartyBadge}>
              <Text style={styles.candidatePartyBadgeText}>
                🏹 {party.shortName}
              </Text>
            </View>
          </View>

          {/* Big Bold Candidate Name in Marathi */}
          <Text style={styles.candidateBigName}>
            {candidate.name}
          </Text>

          {/* Subtitle Details: English Name & Constituency */}
          <View style={styles.candidateInfoRow}>
            <Text style={styles.candidateEnglishSub}>{candidate.englishName}</Text>
            <Text style={styles.candidateMetaSep}>•</Text>
            <Text style={styles.candidateConstituencySub}>📍 {candidate.constituency}</Text>
          </View>
        </TouchableOpacity>

        {/* Orange Quote Card with Architectural Silhouette & Paper Icon */}
        <View style={styles.quoteCardContainer}>
          <View style={styles.quoteCard}>
            {/* Background architectural watermark */}
            <View style={styles.watermarkBuilding}>
              <Icon source={quoteCard.icon || "bank"} size={110} color="rgba(255, 255, 255, 0.18)" />
            </View>

            <View style={styles.quoteCardContent}>
              <View style={styles.quoteHeaderRow}>
                <Text style={styles.giantQuote}>“</Text>
                <Text style={styles.quoteText}>
                  {quoteCard.text}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.knowMoreButton}
                activeOpacity={0.85}
                onPress={() => router.push((quoteCard.actionUrl as any) || "/issues")}
              >
                <Text style={styles.knowMoreButtonText}>अधिक जाणून घ्या</Text>
                <Icon source="arrow-right" size={16} color="#E05300" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section: "माझे प्रमुख संकल्प" */}
        {resolutions && resolutions.length > 0 && (
          <View style={styles.resolutionsSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.titleWithUnderline}>
                <Text style={styles.sectionTitle}>माझे प्रमुख संकल्प</Text>
                <View style={styles.titleUnderline} />
              </View>

              <TouchableOpacity
                style={styles.viewAllRow}
                activeOpacity={0.75}
                onPress={() => router.push("/issues")}
              >
                <Text style={styles.viewAllText}>सर्व पहा</Text>
                <Icon source="arrow-right" size={15} color="#E05300" />
              </TouchableOpacity>
            </View>

            {/* Dynamic Grid Cards from Context */}
            <View style={styles.resolutionsGrid}>
              {resolutions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.resolutionCard}
                  activeOpacity={0.85}
                  onPress={() => router.push("/issues")}
                >
                  <View style={styles.resolutionIconWrap}>
                    <Icon source={item.iconName || "star"} size={26} color="#E05300" />
                  </View>
                  <Text style={styles.resolutionText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Section: Custom Ads Banners ("विशेष जाहिराती व शासकीय योजना") */}
        {customAdBanners && customAdBanners.length > 0 && (
          <View style={styles.adsSection}>
            <View style={[styles.sectionHeaderRow, { paddingHorizontal: 16 }]}>
              <View style={styles.titleWithUnderline}>
                <Text style={styles.sectionTitle}>विशेष जाहिराती व योजना</Text>
                <View style={styles.titleUnderline} />
              </View>
              <TouchableOpacity
                style={styles.viewAllRow}
                activeOpacity={0.75}
                onPress={() => router.push("/documents")}
              >
                <Text style={styles.viewAllText}>सर्व जाहिराती</Text>
                <Icon source="arrow-right" size={15} color="#E05300" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.adsScrollContent}
              decelerationRate="fast"
              snapToInterval={SCREEN_WIDTH - 48 + 12}
            >
              {customAdBanners.map((ad) => (
                <TouchableOpacity
                  key={ad.id}
                  style={[styles.adCard, { backgroundColor: ad.gradientColors[0] }]}
                  activeOpacity={0.9}
                  onPress={() => router.push(ad.actionRoute as any)}
                >
                  {/* Decorative Background Icon Watermark */}
                  <View style={styles.adWatermarkIcon}>
                    <Icon source={ad.icon || "star"} size={110} color="rgba(255, 255, 255, 0.12)" />
                  </View>

                  {/* Top Tag & Badge */}
                  <View style={styles.adTopRow}>
                    <View style={[styles.adTagBadge, { backgroundColor: ad.badgeBg }]}>
                      <Text style={styles.adTagText}>{ad.tag}</Text>
                    </View>
                    <View style={styles.adSponsoredBadge}>
                      <Icon source="bullhorn-outline" size={12} color="#FFFFFF" />
                      <Text style={styles.adSponsoredText}>जाहिरात</Text>
                    </View>
                  </View>

                  {/* Headline & Subtitle */}
                  <Text style={styles.adTitle} numberOfLines={2}>
                    {ad.title}
                  </Text>
                  <Text style={styles.adSubtitle} numberOfLines={1}>
                    {ad.subtitle}
                  </Text>
                  <Text style={styles.adDescription} numberOfLines={2}>
                    {ad.description}
                  </Text>

                  {/* Bottom Action Button */}
                  <View style={styles.adActionBtn}>
                    <Text style={styles.adActionBtnText}>{ad.actionText}</Text>
                    <Icon source="arrow-right-circle" size={18} color={ad.gradientColors[0]} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Section: News & Updates ("ताज्या घडामोडी व बातम्या") */}
        {newsArticles && newsArticles.length > 0 && (
          <View style={styles.newsSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.titleWithUnderline}>
                <Text style={styles.sectionTitle}>ताज्या घडामोडी व बातम्या</Text>
                <View style={styles.titleUnderline} />
              </View>

              <TouchableOpacity
                style={styles.viewAllRow}
                activeOpacity={0.75}
                onPress={() => router.push("/news")}
              >
                <Text style={styles.viewAllText}>सर्व बातम्या</Text>
                <Icon source="arrow-right" size={15} color="#E05300" />
              </TouchableOpacity>
            </View>

            {/* Featured Article Card */}
            {newsArticles[0] && (
              <TouchableOpacity
                style={styles.featuredNewsCard}
                activeOpacity={0.92}
                onPress={() =>
                  router.push({
                    pathname: "/news-detail",
                    params: { id: newsArticles[0].id },
                  })
                }
              >
                <View style={styles.featuredNewsImageWrap}>
                  <Image
                    source={getNewsImage(newsArticles[0])}
                    style={styles.featuredNewsImage}
                    contentFit="cover"
                    transition={250}
                  />
                  <View style={styles.featuredNewsBadge}>
                    <Text style={styles.featuredNewsBadgeText}>
                      {newsArticles[0].categoryName || "महत्त्वाची बातमी"}
                    </Text>
                  </View>
                </View>

                <View style={styles.featuredNewsBody}>
                  <View style={styles.newsMetaRow}>
                    <View style={styles.newsMetaItem}>
                      <Icon source="calendar-blank-outline" size={13} color="#78716C" />
                      <Text style={styles.newsMetaText}>{newsArticles[0].date || "ताजी बातमी"}</Text>
                    </View>
                    {newsArticles[0].readTime && (
                      <View style={styles.newsMetaItem}>
                        <Icon source="clock-outline" size={13} color="#78716C" />
                        <Text style={styles.newsMetaText}>{newsArticles[0].readTime}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.featuredNewsTitle} numberOfLines={2}>
                    {newsArticles[0].title}
                  </Text>

                  <Text style={styles.featuredNewsSummary} numberOfLines={2}>
                    {newsArticles[0].summary || newsArticles[0].description}
                  </Text>

                  <View style={styles.readMoreRow}>
                    <Text style={styles.readMoreText}>सविस्तर बातमी वाचा</Text>
                    <Icon source="arrow-right" size={15} color="#E05300" />
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Secondary News Items (Up to 2 additional articles) */}
            {newsArticles.slice(1, 3).map((item) => (
              <TouchableOpacity
                key={String(item.id)}
                style={styles.secondaryNewsCard}
                activeOpacity={0.88}
                onPress={() =>
                  router.push({
                    pathname: "/news-detail",
                    params: { id: item.id },
                  })
                }
              >
                <Image
                  source={getNewsImage(item)}
                  style={styles.secondaryNewsThumb}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.secondaryNewsInfo}>
                  <View style={styles.newsMetaRow}>
                    <View style={styles.newsMetaItem}>
                      <Icon source="calendar-blank-outline" size={11} color="#78716C" />
                      <Text style={styles.secondaryNewsDate}>{item.date || "ताजी बातमी"}</Text>
                    </View>
                    {item.categoryName && (
                      <View style={styles.secondaryNewsCatBadge}>
                        <Text style={styles.secondaryNewsCatText}>{item.categoryName}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.secondaryNewsTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>

                <View style={styles.secondaryNewsChevron}>
                  <Icon source="chevron-right" size={20} color="#E05300" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* Section: Political Campaign Banners */}
        <View style={styles.politicalBannerSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.politicalBannerScrollContent}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH - 32 + 12}
          >
            {[
              { id: "pb-1", bg: "#9A3412", title: "धनुष्यबाण चिन्हासमोरील\nबटण दाबा!", subtitle: "श्री. सचिन मलिक यांना प्रचंड बहुमताने निवडून द्या!", badge: "चुनाव मोहीम २०२६", icon: "bullhorn", rightLabel: "शिवसेना" },
              { id: "pb-2", bg: "#1D4ED8", title: "कोपरगावसाठी\nसर्वांगीण विकास!", subtitle: "रस्ते, पाणी, वीज, शिक्षण आणि रोजगार — आमचे वचन!", badge: "विकास अजेंडा", icon: "city-variant-outline", rightLabel: "विकास" },
              { id: "pb-3", bg: "#065F46", title: "शेतकरी बांधवांचा\nसर्वांगीण विकास!", subtitle: "सिंचन, कर्जमाफी, वीज आणि कृषी मदत — आमची जबाबदारी!", badge: "शेतकरी सन्मान", icon: "sprout", rightLabel: "शेती" },
            ].map((pb) => (
              <View key={pb.id} style={[styles.politicalBannerCard, { backgroundColor: pb.bg }]}>
                <View style={styles.politicalBannerTopRow}>
                  <View style={styles.politicalBannerBadge}>
                    <Text style={styles.politicalBannerBadgeText}>{pb.badge}</Text>
                  </View>
                  <View style={styles.politicalBannerPartyBadge}>
                    <Icon source="bullhorn" size={12} color="#FFF" />
                    <Text style={styles.politicalBannerPartyText}>{pb.rightLabel}</Text>
                  </View>
                </View>
                <View style={styles.politicalBannerCenter}>
                  <View style={styles.politicalBannerIconRing}>
                    <Icon source={pb.icon} size={32} color="#FFFFFF" />
                  </View>
                  <Text style={styles.politicalBannerTitle}>{pb.title}</Text>
                  <Text style={styles.politicalBannerSubtitle}>{pb.subtitle}</Text>
                </View>
                <TouchableOpacity
                  style={styles.politicalBannerCTA}
                  activeOpacity={0.85}
                  onPress={() => router.push("/about" as any)}
                >
                  <Text style={styles.politicalBannerCTAText}>आधिक जाणून घ्या</Text>
                  <Icon source="arrow-right" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ════════════════════════════════════════════════════════ */}
        {/* Section: Key Achievements Stats Strip */}
        <View style={styles.statsStripSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsStripRow}>
            {[
              { icon: "road-variant", number: "५०+", label: "कोटी निधी", color: "#EA580C" },
              { icon: "water-pump", number: "२४/७", label: "पाणी योजना", color: "#2563EB" },
              { icon: "school", number: "५००+", label: "युवा रोजगार", color: "#059669" },
              { icon: "sprout", number: "१२०+", label: "गावे विकसित", color: "#7C3AED" },
              { icon: "home-group", number: "२५०+", label: "घरे बांधली", color: "#D97706" },
              { icon: "hospital-building", number: "१५+", label: "आरोग्य सुविधा", color: "#DC2626" },
            ].map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: stat.color + "18" }]}>
                  <Icon source={stat.icon} size={22} color={stat.color} />
                </View>
                <Text style={[styles.statNumber, { color: stat.color }]}>{stat.number}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ════════════════════════════════════════════════════════ */}
        {/* Section: Ad Banners (customAdBanners) */}
        {customAdBanners && customAdBanners.length > 0 && (
          <View style={styles.adBannerSection}>
            <View style={styles.adBannerSectionHeader}>
              <View style={styles.titleWithUnderline}>
                <Text style={styles.sectionTitle}>शासकीय योजना आणि सेवा</Text>
                <View style={styles.titleUnderline} />
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.adBannerScrollContent}
              decelerationRate="fast"
              snapToInterval={SCREEN_WIDTH - 40 + 12}
            >
              {customAdBanners.map((ad) => (
                <TouchableOpacity
                  key={ad.id}
                  style={[styles.adBannerCard, { backgroundColor: ad.gradientColors[0] }]}
                  activeOpacity={0.88}
                  onPress={() => router.push(ad.actionRoute as any)}
                >
                  <View style={styles.adBannerTag}>
                    <Text style={styles.adBannerTagText}>{ad.tag}</Text>
                  </View>
                  <View style={styles.adBannerIconWrap}>
                    <Icon source={ad.icon} size={38} color="rgba(255,255,255,0.9)" />
                  </View>
                  <Text style={styles.adBannerTitle}>{ad.title}</Text>
                  <Text style={styles.adBannerSubtitle}>{ad.subtitle}</Text>
                  <Text style={styles.adBannerDesc} numberOfLines={2}>{ad.description}</Text>
                  <View style={styles.adBannerCTA}>
                    <Text style={styles.adBannerCTAText}>{ad.actionText}</Text>
                    <Icon source="arrow-right" size={14} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* Section: Quick Links Shortcuts */}
        <View style={styles.quickLinksSection}>
          <View style={styles.quickLinksHeaderStrip}>
            <Icon source="lightning-bolt" size={18} color="#FFFFFF" />
            <Text style={styles.quickLinksHeaderText}>त्वरित सेवा लिंक्स</Text>
            <Icon source="lightning-bolt" size={18} color="#FFFFFF" />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickLinksRow}
          >
            {[
              { icon: "file-document-outline", label: "योजना", route: "/documents", bg: "#FEF3C7", color: "#D97706" },
              { icon: "alert-circle-outline", label: "समस्या", route: "/report-issue", bg: "#FFF1F2", color: "#E11D48" },
              { icon: "calendar-month", label: "कार्यक्रम", route: "/events", bg: "#ECFDF5", color: "#059669" },
              { icon: "image-multiple-outline", label: "गॅलरी", route: "/gallery", bg: "#EFF6FF", color: "#2563EB" },
              { icon: "play-circle-outline", label: "व्हिडिओ", route: "/videos", bg: "#FEE2E2", color: "#DC2626" },
              { icon: "newspaper-variant-outline", label: "बातम्या", route: "/news", bg: "#F0FDF4", color: "#16A34A" },
              { icon: "map-marker-radius-outline", label: "नकाशा", route: "/issue-map", bg: "#DBEAFE", color: "#3B82F6" },
              { icon: "account-outline", label: "माझ्याबद्दल", route: "/about", bg: "#FFEDD5", color: "#EA580C" },
              { icon: "phone-outline", label: "संपर्क", route: "/contact", bg: "#F5F3FF", color: "#7C3AED" },
            ].map((ql) => (
              <TouchableOpacity
                key={ql.route}
                style={styles.quickLinkItem}
                activeOpacity={0.82}
                onPress={() => router.push(ql.route as any)}
              >
                <View style={[styles.quickLinkIconWrap, { backgroundColor: ql.bg }]}>
                  <Icon source={ql.icon} size={26} color={ql.color} />
                </View>
                <Text style={styles.quickLinkLabel}>{ql.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ────────────────────────────────────────────────────────── */}
        {/* Section: Video Highlights (2 videos slider) */}
        {videoGallery && videoGallery.length > 0 && (
          <View style={styles.videosSection}>
            <View style={[styles.sectionHeaderRow, { paddingHorizontal: 16, paddingTop: 16 }]}>
              <View style={styles.titleWithUnderline}>
                <Text style={styles.sectionTitle}>व्हिडिओ हायलाइट्स</Text>
                <View style={styles.titleUnderline} />
              </View>
              <TouchableOpacity style={styles.viewAllRow} activeOpacity={0.75} onPress={() => router.push("/videos")}>
                <Text style={styles.viewAllText}>सर्व व्हिडिओ</Text>
                <Icon source="arrow-right" size={15} color="#E05300" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.videosScrollContent}
              decelerationRate="fast"
              snapToInterval={SCREEN_WIDTH - 48 + 12}
            >
              {videoGallery.slice(0, 2).map((vid) => (
                <TouchableOpacity
                  key={vid.id}
                  style={styles.videoCard}
                  activeOpacity={0.9}
                  onPress={() => router.push("/videos")}
                >
                  <View style={styles.videoThumbWrap}>
                    <Image
                      source={vid.thumbnail}
                      style={styles.videoThumb}
                      contentFit="cover"
                      transition={200}
                    />
                    {/* Play overlay */}
                    <View style={styles.videoPlayOverlay}>
                      <View style={styles.videoPlayBtn}>
                        <Icon source="play" size={22} color="#FFFFFF" />
                      </View>
                    </View>
                    {/* Duration badge */}
                    <View style={styles.videoDurationBadge}>
                      <Icon source="clock-outline" size={11} color="#FFF" />
                      <Text style={styles.videoDurationText}>{vid.duration}</Text>
                    </View>
                    {/* Category badge */}
                    <View style={styles.videoCatBadge}>
                      <Text style={styles.videoCatText}>{vid.categoryName}</Text>
                    </View>
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle} numberOfLines={2}>{vid.title}</Text>
                    <View style={styles.videoMeta}>
                      <Icon source="eye-outline" size={13} color="#78716C" />
                      <Text style={styles.videoMetaText}>{vid.views}</Text>
                      <Text style={styles.videoMetaSep}>•</Text>
                      <Icon source="calendar-blank-outline" size={13} color="#78716C" />
                      <Text style={styles.videoMetaText}>{vid.date}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* Section: Gallery Preview (3 images carousel) */}
        {gallery && gallery.length > 0 && (
          <View style={styles.galleryPreviewSection}>
            <View style={[styles.sectionHeaderRow, { paddingHorizontal: 16 }]}>
              <View style={styles.titleWithUnderline}>
                <Text style={styles.sectionTitle}>फोटो गॅलरी</Text>
                <View style={styles.titleUnderline} />
              </View>
              <TouchableOpacity style={styles.viewAllRow} activeOpacity={0.75} onPress={() => router.push("/gallery")}>
                <Text style={styles.viewAllText}>सर्व फोटो</Text>
                <Icon source="arrow-right" size={15} color="#E05300" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryPreviewScroll}
              decelerationRate="fast"
              snapToInterval={GALLERY_CARD_W + 10}
            >
              {gallery.slice(0, 3).map((gal) => (
                <TouchableOpacity
                  key={String(gal.id)}
                  style={styles.galleryPreviewCard}
                  activeOpacity={0.88}
                  onPress={() => router.push("/gallery")}
                >
                  <Image
                    source={gal.image}
                    style={styles.galleryPreviewImg}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.galleryPreviewOverlay}>
                    <Text style={styles.galleryPreviewTitle} numberOfLines={2}>{gal.title}</Text>
                    {gal.photoCount != null && (
                      <View style={styles.galleryPhotoCountBadge}>
                        <Icon source="image-multiple" size={12} color="#FFF" />
                        <Text style={styles.galleryPhotoCountText}>{gal.photoCount} फोटो</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* Section: Recent Issues */}
        {issues && issues.length > 0 && (
          <View style={styles.recentIssuesSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.titleWithUnderline}>
                <Text style={styles.sectionTitle}>नवीन नोंदविलेल्या समस्या</Text>
                <View style={styles.titleUnderline} />
              </View>
              <TouchableOpacity style={styles.viewAllRow} activeOpacity={0.75} onPress={() => router.push("/issues")}>
                <Text style={styles.viewAllText}>सर्व पहा</Text>
                <Icon source="arrow-right" size={15} color="#E05300" />
              </TouchableOpacity>
            </View>
            {issues.slice(0, 3).map((issue) => {
              const statusColor = issue.status === "resolved" ? "#15803D" : issue.status === "in_progress" ? "#D97706" : "#DC2626";
              const statusBg = issue.status === "resolved" ? "#DCFCE7" : issue.status === "in_progress" ? "#FEF3C7" : "#FEE2E2";
              const statusLabel = issue.status === "resolved" ? "सोडविले" : issue.status === "in_progress" ? "प्रगतीत" : "नवीन";
              return (
                <TouchableOpacity
                  key={issue.id}
                  style={styles.recentIssueCard}
                  activeOpacity={0.88}
                  onPress={() => router.push("/issues")}
                >
                  <View style={[styles.recentIssueIconWrap, { backgroundColor: statusBg }]}>
                    <Icon source="alert-circle-outline" size={22} color={statusColor} />
                  </View>
                  <View style={styles.recentIssueInfo}>
                    <Text style={styles.recentIssueTitle} numberOfLines={1}>{issue.title}</Text>
                    <Text style={styles.recentIssueMeta} numberOfLines={1}>
                      {issue.category ? `${issue.category} • ` : ""}{issue.createdAt || "नुकतीच नोंदविली"}
                    </Text>
                  </View>
                  <View style={[styles.recentIssueStatusBadge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.recentIssueStatusText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.reportNewIssueBtn}
              activeOpacity={0.88}
              onPress={() => router.push("/report-issue")}
            >
              <Icon source="plus-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.reportNewIssueBtnText}>नवीन समस्या नोंदवा</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* Section: Social Media Links */}
        <View style={styles.socialSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.titleWithUnderline}>
              <Text style={styles.sectionTitle}>सोशल मीडिया</Text>
              <View style={styles.titleUnderline} />
            </View>
          </View>
          <View style={styles.socialRow}>
            {[
              { icon: "facebook", color: "#1877F2", bg: "#EFF6FF", url: aboutDetails?.socialLinks?.facebook || "https://facebook.com" },
              { icon: "instagram", color: "#E1306C", bg: "#FFF1F2", url: aboutDetails?.socialLinks?.instagram || "https://instagram.com" },
              { icon: "twitter", color: "#1DA1F2", bg: "#E0F2FE", url: aboutDetails?.socialLinks?.twitter || "https://twitter.com" },
              { icon: "youtube", color: "#FF0000", bg: "#FEE2E2", url: aboutDetails?.socialLinks?.youtube || "https://youtube.com" },
              { icon: "whatsapp", color: "#25D366", bg: "#DCFCE7", url: aboutDetails?.socialLinks?.whatsapp || `https://wa.me/917387877820` },
            ].map((s) => (
              <TouchableOpacity
                key={s.icon}
                style={[styles.socialBtn, { backgroundColor: s.bg }]}
                activeOpacity={0.82}
                onPress={() => Linking.openURL(s.url).catch(() => {})}
              >
                <Icon source={s.icon} size={28} color={s.color} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ────────────────────────────────────────────────────────── */}
        {/* Section: Inline Contact Form */}
        <View style={styles.contactFormSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.titleWithUnderline}>
              <Text style={styles.sectionTitle}>संपर्क साधा</Text>
              <View style={styles.titleUnderline} />
            </View>
          </View>

          {/* Contact Info Row */}
          <View style={styles.contactInfoRow}>
            <TouchableOpacity
              style={styles.contactInfoCard}
              activeOpacity={0.85}
              onPress={() => Linking.openURL(`tel:${contact.helpline1}`).catch(() => {})}
            >
              <View style={[styles.contactInfoIcon, { backgroundColor: "#FFEDD5" }]}>
                <Icon source="phone" size={20} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.contactInfoLabel}>हेल्पलाईन</Text>
                <Text style={styles.contactInfoValue}>{contact.helpline1}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactInfoCard}
              activeOpacity={0.85}
              onPress={() => Linking.openURL(`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`).catch(() => {})}
            >
              <View style={[styles.contactInfoIcon, { backgroundColor: "#DCFCE7" }]}>
                <Icon source="whatsapp" size={20} color="#16A34A" />
              </View>
              <View>
                <Text style={styles.contactInfoLabel}>WhatsApp</Text>
                <Text style={styles.contactInfoValue}>{contact.whatsapp}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Office info */}
          <View style={styles.officeInfoCard}>
            <Icon source="map-marker-outline" size={18} color="#EA580C" />
            <View style={{ flex: 1 }}>
              <Text style={styles.officeInfoName}>{contact.officeName}</Text>
              <Text style={styles.officeInfoAddress}>{contact.address}, {contact.city} - {contact.pincode}</Text>
              <Text style={styles.officeInfoTimings}>{contact.officeTimings}</Text>
            </View>
          </View>

          {/* Quick message form */}
          {contactSent ? (
            <View style={styles.contactSentCard}>
              <Icon source="check-circle" size={32} color="#16A34A" />
              <Text style={styles.contactSentTitle}>संदेश पाठवला गेला!</Text>
              <Text style={styles.contactSentSubtitle}>आम्ही लवकरच आपल्याशी संपर्क साधू.</Text>
              <TouchableOpacity onPress={() => { setContactSent(false); setContactName(""); setContactMessage(""); }}>
                <Text style={styles.contactSentReset}>पुन्हा संपर्क करा</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.contactFormCard}>
              <Text style={styles.contactFormTitle}>🙏 संदेश पाठवा</Text>
              <TextInput
                style={styles.contactInput}
                placeholder="आपले नाव"
                placeholderTextColor="#9CA3AF"
                value={contactName}
                onChangeText={setContactName}
              />
              <TextInput
                style={[styles.contactInput, styles.contactMessageInput]}
                placeholder="आपला संदेश किंवा सूचना लिहा..."
                placeholderTextColor="#9CA3AF"
                value={contactMessage}
                onChangeText={setContactMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.contactSubmitBtn, (!contactName.trim() || !contactMessage.trim()) && { opacity: 0.55 }]}
                activeOpacity={0.85}
                onPress={() => {
                  if (!contactName.trim() || !contactMessage.trim()) {
                    Alert.alert("माहिती भरा", "कृपया नाव आणि संदेश दोन्ही लिहा.");
                    return;
                  }
                  setContactSent(true);
                }}
              >
                <Icon source="send" size={18} color="#FFFFFF" />
                <Text style={styles.contactSubmitBtnText}>संदेश पाठवा</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Replay Splash Screen Dev Button */}
        <View style={styles.replaySplashWrap}>
          <TouchableOpacity
            style={styles.replaySplashBtn}
            onPress={() => router.replace("/")}
            activeOpacity={0.85}
          >
            <Icon source="refresh" size={16} color="#92400E" />
            <Text style={styles.replaySplashText}>स्प्लॅश स्क्रीन पुन्हा पहा (Replay Splash)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating WhatsApp Button */}
      <TouchableOpacity
        style={styles.floatingWhatsapp}
        activeOpacity={0.88}
        onPress={() => Linking.openURL(`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`).catch(() => {})}
      >
        <Icon source="whatsapp" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Fixed Bottom Navigation Tab Bar */}
      <BottomTabBar currentTab="home" />

      {/* Full-view Modal when tapping banner */}
      {selectedBanner && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={true}
          onRequestClose={() => setSelectedBanner(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Image
                source={selectedBanner.image}
                style={styles.modalImage}
                contentFit="cover"
              />
              <View style={styles.modalBody}>
                <View style={[styles.modalTag, { backgroundColor: selectedBanner.badgeBg }]}>
                  <Text style={styles.modalTagText}>{selectedBanner.tag}</Text>
                </View>
                <Text style={styles.modalTitle}>{selectedBanner.title}</Text>
                <Text style={styles.modalSubtitle}>{selectedBanner.subtitle}</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedBanner(null)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalCloseBtnText}>बंद करा (Close)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Drawer / Navigation Menu Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={menuModalVisible}
        onRequestClose={() => setMenuModalVisible(false)}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setMenuModalVisible(false)}
          />
          <View style={styles.drawerContent}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerHeaderLeft}>
                <Image
                  source={require("../../assets/images/shivsena_logo.png")}
                  style={styles.drawerLogo}
                  contentFit="cover"
                />
                <View>
                  <Text style={styles.drawerTitle}>{candidate.name} ॲप</Text>
                  <Text style={styles.drawerSubtitle}>जनतेसाठी, जनतेसोबत</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.drawerCloseBtn}
                onPress={() => setMenuModalVisible(false)}
                activeOpacity={0.8}
              >
                <Icon source="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Menu List */}
            <ScrollView
              style={styles.drawerScroll}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuModalVisible(false);
                  router.push("/events");
                }}
              >
                <View style={[styles.drawerItemIcon, { backgroundColor: "#FFEDD5" }]}>
                  <Icon source="calendar" size={20} color="#EA580C" />
                </View>
                <Text style={styles.drawerItemText}>कार्यक्रम व सभा</Text>
                <Icon source="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuModalVisible(false);
                  router.push("/issue-map");
                }}
              >
                <View style={[styles.drawerItemIcon, { backgroundColor: "#DBEAFE" }]}>
                  <Icon source="map-marker-radius" size={20} color="#2563EB" />
                </View>
                <Text style={styles.drawerItemText}>समस्या नकाशा</Text>
                <Icon source="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuModalVisible(false);
                  router.push("/report-issue");
                }}
              >
                <View style={[styles.drawerItemIcon, { backgroundColor: "#FFF7ED" }]}>
                  <Icon source="plus-circle" size={20} color="#EA580C" />
                </View>
                <Text style={[styles.drawerItemText, { fontWeight: "700", color: "#EA580C" }]}>
                  नवीन समस्या नोंदवा
                </Text>
                <Icon source="chevron-right" size={20} color="#EA580C" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuModalVisible(false);
                  router.push("/my-issues");
                }}
              >
                <View style={[styles.drawerItemIcon, { backgroundColor: "#DCFCE7" }]}>
                  <Icon source="format-list-checks" size={20} color="#16A34A" />
                </View>
                <Text style={styles.drawerItemText}>माझ्या नोंदविलेल्या समस्या</Text>
                <Icon source="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuModalVisible(false);
                  router.push("/videos");
                }}
              >
                <View style={[styles.drawerItemIcon, { backgroundColor: "#FEE2E2" }]}>
                  <Icon source="play-circle" size={20} color="#DC2626" />
                </View>
                <Text style={styles.drawerItemText}>व्हिडिओ गॅलरी</Text>
                <Icon source="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuModalVisible(false);
                  router.push("/documents");
                }}
              >
                <View style={[styles.drawerItemIcon, { backgroundColor: "#FEF3C7" }]}>
                  <Icon source="file-document-outline" size={20} color="#D97706" />
                </View>
                <Text style={styles.drawerItemText}>दस्तऐवज / जाहिराती</Text>
                <Icon source="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuModalVisible(false);
                  router.push("/notifications");
                }}
              >
                <View style={[styles.drawerItemIcon, { backgroundColor: "#FFEDD5" }]}>
                  <Icon source="bell-ring" size={20} color="#EA580C" />
                </View>
                <Text style={styles.drawerItemText}>सूचना (Notifications)</Text>
                <Icon source="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <View style={styles.drawerDivider} />

              {/* User Profile or Login in Drawer */}
              {isLoggedIn && currentUser ? (
                <View style={styles.drawerUserCard}>
                  <View style={styles.drawerUserAvatarWrap}>
                    <Icon source="account-check" size={22} color="#15803D" />
                  </View>
                  <View style={styles.drawerUserInfo}>
                    <Text style={styles.drawerUserName} numberOfLines={1}>
                      {currentUser.name}
                    </Text>
                    <Text style={styles.drawerUserPhone} numberOfLines={1}>
                      {currentUser.mobile ? currentUser.mobile : "सत्यापित नागरिक"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.drawerLogoutBtn}
                    onPress={() => {
                      setMenuModalVisible(false);
                      Alert.alert(
                        "लॉगआउट",
                        "आपण आपल्या खात्यातून बाहेर पडू इच्छिता का?",
                        [
                          { text: "रद्द करा", style: "cancel" },
                          {
                            text: "होय, लॉगआउट",
                            style: "destructive",
                            onPress: () => logout(),
                          },
                        ]
                      );
                    }}
                    activeOpacity={0.8}
                  >
                    <Icon source="logout" size={17} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => {
                    setMenuModalVisible(false);
                    router.push("/login");
                  }}
                >
                  <View style={[styles.drawerItemIcon, { backgroundColor: "#FFF7ED" }]}>
                    <Icon source="account-circle" size={20} color="#EA580C" />
                  </View>
                  <Text style={styles.drawerItemText}>नागरिक लॉगिन (Login)</Text>
                  <Icon source="chevron-right" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuModalVisible(false);
                  router.push("/settings");
                }}
              >
                <View style={[styles.drawerItemIcon, { backgroundColor: "#F3F4F6" }]}>
                  <Icon source="cog-outline" size={20} color="#4B5563" />
                </View>
                <Text style={styles.drawerItemText}>ॲप सेटिंग्स</Text>
                <Icon source="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuModalVisible(false);
                  router.push("/app-about");
                }}
              >
                <View style={[styles.drawerItemIcon, { backgroundColor: "#F3F4F6" }]}>
                  <Icon source="information-outline" size={20} color="#4B5563" />
                </View>
                <Text style={styles.drawerItemText}>ॲपबद्दल</Text>
                <Icon source="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuModalVisible(false);
                  router.push("/privacy-policy");
                }}
              >
                <View style={[styles.drawerItemIcon, { backgroundColor: "#F3F4F6" }]}>
                  <Icon source="shield-check-outline" size={20} color="#4B5563" />
                </View>
                <Text style={styles.drawerItemText}>गोपनीयता धोरण</Text>
                <Icon source="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  logoEmblemImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  notifButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  notifBadgeDot: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DC2626",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  hamburgerButton: {
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
  },

  // Hero Campaign Carousel Section
  heroCarouselContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    backgroundColor: "#EA580C",
    position: "relative",
  },
  bannerSlide: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  carouselIndicators: {
    position: "absolute",
    top: 12,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  indicatorDot: {
    height: 5,
    borderRadius: 3,
  },
  indicatorActive: {
    width: 18,
    backgroundColor: "#FBBF24",
  },
  indicatorInactive: {
    width: 6,
    backgroundColor: "rgba(255, 255, 255, 0.65)",
  },

  // Candidate / Umedwar Name Showcase Card (Bottom of Carousel)
  candidateNameCard: {
    marginHorizontal: 16,
    marginTop: -16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E05300",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    zIndex: 10,
  },
  candidateBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  candidateHonorificBadge: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  candidateHonorificText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#C2410C",
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
  candidatePartyBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  candidatePartyBadgeText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#B45309",
    includeFontPadding: false,
  },
  candidateBigName: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: "900",
    color: "#E05300",
    textAlign: "center",
    letterSpacing: 0.3,
    marginVertical: 3,
    includeFontPadding: false,
  },
  candidateInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  candidateEnglishSub: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
    includeFontPadding: false,
  },
  candidateMetaSep: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "700",
  },
  candidateConstituencySub: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#EA580C",
    includeFontPadding: false,
  },

  // Orange Quote Card
  quoteCardContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  quoteCard: {
    backgroundColor: "#E05300",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#E05300",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  watermarkBuilding: {
    position: "absolute",
    right: -15,
    bottom: -20,
    opacity: 0.2,
  },
  quoteCardContent: {
    zIndex: 2,
  },
  quoteHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  giantQuote: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FBBF24",
    lineHeight: 32,
    marginRight: 6,
    marginTop: -4,
  },
  quoteText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 25,
  },
  knowMoreButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  knowMoreButtonText: {
    color: "#E05300",
    fontSize: 12.5,
    fontWeight: "800",
  },

  // "माझे प्रमुख संकल्प" Section
  resolutionsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  titleWithUnderline: {
    position: "relative",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1C1917",
  },
  titleUnderline: {
    width: 32,
    height: 3.5,
    backgroundColor: "#E05300",
    borderRadius: 2,
    marginTop: 4,
  },
  viewAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E05300",
  },
  resolutionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  resolutionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0EFEA",
  },
  resolutionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  resolutionText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1C1917",
    textAlign: "center",
    lineHeight: 16,
  },

  // Custom Ads Section
  adsSection: {
    marginTop: 22,
  },
  adsScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  adCard: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 20,
    padding: 18,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  adWatermarkIcon: {
    position: "absolute",
    right: -15,
    bottom: -15,
  },
  adTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  adTagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  adTagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  adSponsoredBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  adSponsoredText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  adTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 23,
    marginBottom: 4,
  },
  adSubtitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#FEF08A",
    marginBottom: 6,
  },
  adDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.92)",
    lineHeight: 17,
    marginBottom: 14,
  },
  adActionBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  adActionBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1F2937",
  },

  // News Section
  newsSection: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  featuredNewsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0EFEA",
    marginBottom: 12,
  },
  featuredNewsImageWrap: {
    width: "100%",
    height: 160,
    position: "relative",
    backgroundColor: "#E5E7EB",
  },
  featuredNewsImage: {
    width: "100%",
    height: "100%",
  },
  featuredNewsBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(224, 83, 0, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredNewsBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  featuredNewsBody: {
    padding: 14,
  },
  newsMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  newsMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newsMetaText: {
    fontSize: 11.5,
    color: "#78716C",
    fontWeight: "600",
  },
  featuredNewsTitle: {
    fontSize: 15.5,
    fontWeight: "900",
    color: "#1C1917",
    lineHeight: 22,
    marginBottom: 6,
  },
  featuredNewsSummary: {
    fontSize: 12.5,
    color: "#57534E",
    lineHeight: 18,
    marginBottom: 10,
  },
  readMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  readMoreText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#E05300",
  },

  secondaryNewsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0EFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
    marginBottom: 8,
    gap: 10,
  },
  secondaryNewsThumb: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },
  secondaryNewsInfo: {
    flex: 1,
    justifyContent: "center",
  },
  secondaryNewsCatBadge: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  secondaryNewsCatText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#E05300",
  },
  secondaryNewsDate: {
    fontSize: 10.5,
    color: "#78716C",
    fontWeight: "600",
  },
  secondaryNewsTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F2937",
    lineHeight: 18,
    marginTop: 3,
  },
  secondaryNewsChevron: {
    paddingRight: 4,
  },

  // Replay Splash Button
  replaySplashWrap: {
    marginTop: 22,
    alignItems: "center",
  },
  replaySplashBtn: {
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  replaySplashText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "700",
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
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    overflow: "hidden",
    elevation: 8,
  },
  modalImage: {
    width: "100%",
    height: 190,
  },
  modalBody: {
    padding: 18,
  },
  modalTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalTagText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1C1917",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#57534E",
    marginBottom: 16,
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

  // Drawer / Navigation Menu Modal
  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  drawerBackdrop: {
    flex: 1,
  },
  drawerContent: {
    width: "82%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    height: "100%",
    paddingTop: 48,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  drawerHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  drawerLogo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#FBBF24",
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
  },
  drawerSubtitle: {
    fontSize: 11,
    color: "#EA580C",
    fontWeight: "700",
  },
  drawerCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerScroll: {
    flex: 1,
    paddingTop: 8,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FAFAFA",
  },
  drawerItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  drawerItemText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "700",
    color: "#374151",
  },
  drawerDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
    marginHorizontal: 16,
  },
  drawerUserCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    marginHorizontal: 16,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  drawerUserAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  drawerUserInfo: {
    flex: 1,
  },
  drawerUserName: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#166534",
  },
  drawerUserPhone: {
    fontSize: 11,
    color: "#15803D",
    fontWeight: "600",
    marginTop: 1,
  },
  drawerLogoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },

  // ─── Political Campaign Banners ─────────────────────────────────────────────
  politicalBannerSection: {
    marginTop: 14,
    marginBottom: 4,
  },
  politicalBannerScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  politicalBannerCard: {
    width: SCREEN_WIDTH - 32,
    borderRadius: 20,
    padding: 18,
    minHeight: 180,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
    overflow: "hidden",
  },
  politicalBannerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  politicalBannerBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  politicalBannerBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  politicalBannerPartyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  politicalBannerPartyText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  politicalBannerCenter: {
    alignItems: "center",
    paddingVertical: 8,
  },
  politicalBannerIconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  politicalBannerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 4,
  },
  politicalBannerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.88)",
    textAlign: "center",
    lineHeight: 17,
    paddingHorizontal: 12,
  },
  politicalBannerCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignSelf: "center",
    marginTop: 8,
  },
  politicalBannerCTAText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // ─── Key Achievements Stats Strip ───────────────────────────────────────────
  statsStripSection: {
    marginTop: 12,
    marginBottom: 4,
  },
  statsStripRow: {
    paddingHorizontal: 16,
    gap: 10,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    minWidth: 96,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
    textAlign: "center",
  },

  // ─── Ad Banners (Second Row) ────────────────────────────────────────────────
  adBannerSection: {
    marginTop: 14,
    marginBottom: 4,
  },
  adBannerSectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  adBannerScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  adBannerCard: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 18,
    padding: 18,
    minHeight: 150,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  adBannerTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  adBannerTagText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  adBannerIconWrap: {
    position: "absolute",
    right: 14,
    top: 14,
    opacity: 0.25,
  },
  adBannerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 8,
  },
  adBannerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  adBannerDesc: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 4,
    lineHeight: 15,
  },
  adBannerCTA: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 8,
  },
  adBannerCTAText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  // ─── Quick Links ────────────────────────────────────────────────────────────
  quickLinksSection: {
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  quickLinksHeaderStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EA580C",
    marginHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    marginBottom: 14,
  },
  quickLinksHeaderText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  quickLinksRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    gap: 8,
  },
  quickLinkItem: {
    alignItems: "center",
    width: 68,
  },
  quickLinkIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  quickLinkLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
  },

  // ─── Videos Slider ──────────────────────────────────────────────────────────
  videosSection: {
    paddingTop: 0,
    paddingBottom: 16,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 4,
    borderTopColor: "#EA580C",
  },
  videosScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 12,
  },
  videoCard: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  videoThumbWrap: {
    width: "100%",
    height: 180,
    position: "relative",
  },
  videoThumb: {
    width: "100%",
    height: 180,
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  videoPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(234,88,12,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  videoDurationBadge: {
    position: "absolute",
    bottom: 8,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  videoDurationText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  videoCatBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#EA580C",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  videoCatText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
  },
  videoInfo: {
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  videoTitle: {
    color: "#1C1917",
    fontSize: 13.5,
    fontWeight: "700",
    lineHeight: 19,
    marginBottom: 6,
  },
  videoMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  videoMetaText: {
    color: "#78716C",
    fontSize: 11.5,
    fontWeight: "500",
  },
  videoMetaSep: {
    color: "#D6D3D1",
    fontSize: 12,
  },

  // ─── Floating WhatsApp Button ────────────────────────────────────────────────
  floatingWhatsapp: {
    position: "absolute",
    bottom: 88,
    right: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 999,
  },

  // ─── Gallery Preview Carousel ────────────────────────────────────────────────
  galleryPreviewSection: {
    paddingTop: 20,
    paddingBottom: 16,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
  },
  galleryPreviewScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  galleryPreviewCard: {
    width: GALLERY_CARD_W,
    height: Math.round(GALLERY_CARD_W * 1.25),
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  galleryPreviewImg: {
    width: "100%",
    height: "100%",
  },
  galleryPreviewOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.42)",
    justifyContent: "flex-end",
    padding: 10,
  },
  galleryPreviewTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    marginBottom: 5,
  },
  galleryPhotoCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(234,88,12,0.85)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  galleryPhotoCountText: {
    color: "#FFF",
    fontSize: 10.5,
    fontWeight: "700",
  },

  // ─── Recent Issues ───────────────────────────────────────────────────────────
  recentIssuesSection: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
  },
  recentIssueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  recentIssueIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  recentIssueInfo: {
    flex: 1,
  },
  recentIssueTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 3,
  },
  recentIssueMeta: {
    fontSize: 11,
    color: "#78716C",
    fontWeight: "500",
  },
  recentIssueStatusBadge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginLeft: 8,
  },
  recentIssueStatusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  reportNewIssueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EA580C",
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 4,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reportNewIssueBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // ─── Social Media ────────────────────────────────────────────────────────────
  socialSection: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 6,
  },
  socialBtn: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },

  // ─── Contact Form ────────────────────────────────────────────────────────────
  contactFormSection: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
  },
  contactInfoRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  contactInfoCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  contactInfoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfoLabel: {
    fontSize: 10.5,
    color: "#78716C",
    fontWeight: "600",
  },
  contactInfoValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1C1917",
    marginTop: 1,
  },
  officeInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: "#FFEDD5",
    marginBottom: 14,
  },
  officeInfoName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#92400E",
    marginBottom: 3,
  },
  officeInfoAddress: {
    fontSize: 11.5,
    color: "#78716C",
    fontWeight: "500",
    marginBottom: 2,
  },
  officeInfoTimings: {
    fontSize: 11,
    color: "#A16207",
    fontWeight: "600",
  },
  contactFormCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactFormTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1C1917",
    marginBottom: 12,
  },
  contactInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#1C1917",
    marginBottom: 10,
    fontWeight: "500",
  },
  contactMessageInput: {
    height: 100,
    paddingTop: 11,
  },
  contactSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EA580C",
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 2,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  contactSubmitBtnText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "800",
  },
  contactSentCard: {
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    gap: 8,
  },
  contactSentTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#166534",
  },
  contactSentSubtitle: {
    fontSize: 12.5,
    color: "#15803D",
    fontWeight: "500",
    textAlign: "center",
  },
  contactSentReset: {
    color: "#EA580C",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    textDecorationLine: "underline",
  },
});

