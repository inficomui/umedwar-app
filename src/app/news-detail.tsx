import React, { useState, useCallback } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign, NewsArticleItem } from "../context/CampaignContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_HEIGHT = Math.round(SCREEN_WIDTH * 0.56);

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

export default function NewsDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { newsArticles, party, refreshAppConfig } = useCampaign();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Find article by id, or fallback to first article
  const articleId = params.id || "";
  const allArticles: NewsArticleItem[] = newsArticles || [];

  const article =
    allArticles.find((item) => String(item.id) === String(articleId)) ||
    (allArticles.length > 0 ? allArticles[0] : null);

  if (!article) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" backgroundColor="#E05300" />
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/news"))}
            activeOpacity={0.85}
          >
            <Icon source="arrow-left" size={22} color="#E05300" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerMainTitle}>बातमी तपशील</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Icon source="newspaper-variant-outline" size={56} color="#D1D5DB" />
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#374151", marginTop: 16 }}>
            बातमी आढळली नाही
          </Text>
          <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 6, textAlign: "center" }}>
            सध्या कोणतीही बातमी उपलब्ध नाही किंवा बातमी काढून टाकण्यात आली आहे.
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 20,
              backgroundColor: "#E05300",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 10,
            }}
            onPress={() => router.replace("/news")}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>बातम्यांवर परत जा</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Related articles (excluding current)
  const relatedArticles = allArticles.filter((item) => String(item.id) !== String(article.id));

  const handleShare = async () => {
    try {
      const summaryText = (article as any).summary || (article as any).description || "";
      await Share.share({
        message: `${article.title}\n\n${summaryText}\n\nअधिक वाचा: ${party?.name || "शिवसेना"} अधिकृत ॲप`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleNextArticle = () => {
    if (allArticles.length === 0) return;
    const currentIndex = allArticles.findIndex((item) => String(item.id) === String(article.id));
    const nextIndex = (currentIndex + 1) % allArticles.length;
    router.push({
      pathname: "/news-detail",
      params: { id: allArticles[nextIndex].id },
    });
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
            <Text style={styles.headerMainTitle}>बातमी सविस्तर</Text>
            <Text style={styles.headerSubtitle}>News Details</Text>
          </View>
        </View>

        {/* Right: Share & Bookmark Buttons */}
        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setIsBookmarked(!isBookmarked)}
            activeOpacity={0.85}
          >
            <Icon
              source={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={21}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Icon source="share-variant-outline" size={21} color="#FFFFFF" />
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
        {/* Hero Image Banner */}
        <View style={styles.bannerWrapper}>
          <Image
            source={getNewsImage(article)}
            style={styles.bannerImage}
            contentFit="cover"
            priority="high"
            transition={200}
          />
          {/* Category Tag Overlay */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              🚩 {article.categoryName || "मुख्य घडामोडी"}
            </Text>
          </View>
        </View>

        {/* Article Body Container */}
        <View style={styles.articleBody}>
          {/* Metadata Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon source="calendar-blank-outline" size={14} color="#E05300" />
              <Text style={styles.metaText}>{article.date || "ताजी बातमी"}</Text>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <Icon source="clock-outline" size={14} color="#78716C" />
              <Text style={styles.metaText}>{article.readTime || "२ मिनिटे वाचन"}</Text>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <Icon source="map-marker-outline" size={14} color="#78716C" />
              <Text style={styles.metaText}>{article.location || "कोपरगाव विधानसभा"}</Text>
            </View>
          </View>

          {/* Article Main Headline */}
          <Text style={styles.articleTitle}>{article.title}</Text>

          {/* Subtitle / Lead Paragraph */}
          {article.subtitle && (
            <Text style={styles.articleSubtitle}>{article.subtitle}</Text>
          )}

          {/* Key Highlights Box ("ठळक मुद्दे") */}
          {article.highlights && article.highlights.length > 0 && (
            <View style={styles.highlightsBox}>
              <View style={styles.highlightsHeader}>
                <Icon source="star-circle" size={18} color="#E05300" />
                <Text style={styles.highlightsTitle}>ठळक मुद्दे (Key Highlights)</Text>
              </View>
              {article.highlights.map((point, index) => (
                <View key={index} style={styles.highlightBulletRow}>
                  <Text style={styles.bulletDot}>🔸</Text>
                  <Text style={styles.highlightText}>{point}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Full Content Paragraphs */}
          <View style={styles.contentSection}>
            {(Array.isArray(article.fullContent)
              ? article.fullContent
              : article.fullContent
              ? [article.fullContent]
              : [(article as any).content || (article as any).summary || (article as any).description || ""]
            ).map((paragraph, index) => (
              <Text key={index} style={styles.paragraphText}>
                {paragraph}
              </Text>
            ))}
          </View>

          {/* Styled Quote Box */}
          {article.quote && (
            <View style={styles.quoteCard}>
              <Text style={styles.giantQuote}>“</Text>
              <Text style={styles.quoteText}>{article.quote.text}</Text>
              <Text style={styles.quoteAuthor}>— {article.quote.author}</Text>
            </View>
          )}

          {/* Social Share Strip */}
          <View style={styles.shareStrip}>
            <Text style={styles.shareLabel}>ही बातमी शेअर करा:</Text>
            <View style={styles.shareButtonsRow}>
              {/* WhatsApp */}
              <TouchableOpacity
                style={[styles.socialShareCircle, { backgroundColor: "#25D366" }]}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Icon source="whatsapp" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Facebook */}
              <TouchableOpacity
                style={[styles.socialShareCircle, { backgroundColor: "#1877F2" }]}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Icon source="facebook" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* X / Twitter */}
              <TouchableOpacity
                style={[styles.socialShareCircle, { backgroundColor: "#000000" }]}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Icon source="twitter" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Native Share */}
              <TouchableOpacity
                style={[styles.socialShareCircle, { backgroundColor: "#E05300" }]}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Icon source="share-variant" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Related News Section */}
          <View style={styles.relatedSection}>
            <View style={styles.relatedTitleRow}>
              <Text style={styles.relatedSectionHeading}>इतर महत्त्वाच्या बातम्या</Text>
              <View style={styles.titleBar} />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedScrollRow}
            >
              {relatedArticles.map((relItem) => (
                <TouchableOpacity
                  key={relItem.id}
                  style={styles.relatedCard}
                  onPress={() => {
                    router.push({
                      pathname: "/news-detail",
                      params: { id: relItem.id },
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <Image
                    source={getNewsImage(relItem)}
                    style={styles.relatedCardImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.relatedCardBody}>
                    <Text style={styles.relatedCardDate}>{relItem.date || "ताजी बातमी"}</Text>
                    <Text style={styles.relatedCardTitle} numberOfLines={2}>
                      {relItem.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomBackBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/home");
            }
          }}
          activeOpacity={0.85}
        >
          <Icon source="arrow-left" size={18} color="#1C1917" />
          <Text style={styles.bottomBackBtnText}>मागे जा (Back)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextArticleBtn}
          onPress={handleNextArticle}
          activeOpacity={0.85}
        >
          <Text style={styles.nextArticleBtnText}>पुढील बातमी</Text>
          <Icon source="arrow-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 20,
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
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 23,
  },
  headerSubtitle: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "600",
    opacity: 0.95,
  },
  headerRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },

  // Hero Banner
  bannerWrapper: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
    position: "relative",
    backgroundColor: "#1C1917",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  categoryBadge: {
    position: "absolute",
    bottom: 14,
    left: 16,
    backgroundColor: "#E05300",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  categoryBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  // Article Body
  articleBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11.5,
    color: "#78716C",
    fontWeight: "700",
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#D6D3D1",
    marginHorizontal: 8,
  },
  articleTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#1C1917",
    lineHeight: 29,
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  articleSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#57534E",
    lineHeight: 20,
    marginBottom: 16,
  },

  // Highlights Box
  highlightsBox: {
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#E05300",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  highlightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  highlightsTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#C2410C",
  },
  highlightBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 6,
  },
  bulletDot: {
    fontSize: 12,
    marginTop: 2,
  },
  highlightText: {
    flex: 1,
    fontSize: 12.5,
    color: "#44403C",
    lineHeight: 18,
    fontWeight: "600",
  },

  // Paragraph Content
  contentSection: {
    marginBottom: 16,
  },
  paragraphText: {
    fontSize: 14.5,
    color: "#292524",
    lineHeight: 24,
    marginBottom: 14,
    textAlign: "justify",
  },

  // Quote Card
  quoteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  giantQuote: {
    fontSize: 28,
    fontWeight: "900",
    color: "#F59E0B",
    lineHeight: 28,
    marginBottom: -4,
  },
  quoteText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1C1917",
    fontStyle: "italic",
    lineHeight: 21,
  },
  quoteAuthor: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E05300",
    marginTop: 8,
    textAlign: "right",
  },

  // Social Share Strip
  shareStrip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F0EFEA",
  },
  shareLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#1C1917",
  },
  shareButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  socialShareCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  // Related News
  relatedSection: {
    marginTop: 6,
  },
  relatedTitleRow: {
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  relatedSectionHeading: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1C1917",
  },
  titleBar: {
    width: 32,
    height: 3,
    backgroundColor: "#E05300",
    borderRadius: 2,
    marginTop: 3,
  },
  relatedScrollRow: {
    gap: 12,
    paddingBottom: 6,
  },
  relatedCard: {
    width: 200,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0EFEA",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  relatedCardImage: {
    width: "100%",
    height: 105,
  },
  relatedCardBody: {
    padding: 10,
  },
  relatedCardDate: {
    fontSize: 10.5,
    color: "#78716C",
    fontWeight: "600",
    marginBottom: 3,
  },
  relatedCardTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#1C1917",
    lineHeight: 16,
  },

  // Bottom Sticky Bar
  bottomBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  bottomBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F5F5F4",
    gap: 6,
  },
  bottomBackBtnText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#1C1917",
  },
  nextArticleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#E05300",
    gap: 6,
  },
  nextArticleBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
