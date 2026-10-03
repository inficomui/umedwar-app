import React, { useState, useCallback, useMemo } from "react";
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
import { Icon } from "react-native-paper";
import { VideoView, useVideoPlayer } from "expo-video";
import { BottomTabBar } from "../components/BottomTabBar";
import { useCampaign, GalleryItem, VideoGalleryItem } from "../context/CampaignContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 32 - 12) / 2; // 16px padding on sides, 12px gap
const CARD_HEIGHT = Math.round(CARD_WIDTH * 0.95);
const VIDEO_THUMB_HEIGHT = Math.round((SCREEN_WIDTH - 32) * (185 / 340));

const VIDEO_CATEGORIES = [
  { id: "all", name: "सर्व" },
  { id: "speeches", name: "भाषणे" },
  { id: "dialogue", name: "जनसंवाद" },
  { id: "events", name: "कार्यक्रम" },
  { id: "development", name: "विकासकार्य" },
];

// Native Video Player Modal Component
const VideoPlayerModalContent: React.FC<{
  video: VideoGalleryItem;
  onClose: () => void;
}> = ({ video, onClose }) => {
  const player = useVideoPlayer(video.videoUrl, (p) => {
    p.loop = false;
    p.play();
  });

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.videoModalContent}>
          <View style={styles.videoModalPlayerWrap}>
            <VideoView
              style={styles.videoModalPlayer}
              player={player}
              nativeControls={true}
              contentFit="contain"
            />
            <TouchableOpacity
              style={styles.videoModalCloseBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Icon source="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.videoModalBody}>
            <View style={styles.videoModalHeaderRow}>
              <View style={styles.videoModalCategoryBadge}>
                <Text style={styles.videoModalCategoryText}>
                  {video.categoryName || "व्हिडिओ"}
                </Text>
              </View>
              <Text style={styles.videoModalMeta}>
                {video.date} • {video.views}
              </Text>
            </View>

            <Text style={styles.videoModalTitle}>{video.title}</Text>
            {video.description ? (
              <Text style={styles.videoModalDesc}>{video.description}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.videoModalDismissBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.videoModalDismissText}>बंद करा (Close)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function GalleryScreen() {
  const { gallery, videoGallery, refreshGallery, refreshAppConfig } = useCampaign();
  const [activeTab, setActiveTab] = useState<"photos" | "videos">("photos");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVideoCategory, setSelectedVideoCategory] = useState<string>("all");
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoGalleryItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const displayItems: GalleryItem[] = useMemo(() => {
    return gallery || [];
  }, [gallery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshGallery();
      await refreshAppConfig();
    } catch {
      // Offline fallback
    } finally {
      setRefreshing(false);
    }
  }, [refreshGallery, refreshAppConfig]);

  const counts = useMemo(() => {
    const list = displayItems;
    return {
      all: list.length,
      events: list.filter((i) => String(i.category || "").toLowerCase() === "events").length,
      dialogue: list.filter((i) => String(i.category || "").toLowerCase() === "dialogue").length,
      meetings: list.filter((i) => String(i.category || "").toLowerCase() === "meetings").length,
      media: list.filter((i) => String(i.category || "").toLowerCase() === "media").length,
      other: list.filter((i) => String(i.category || "").toLowerCase() === "other").length,
    };
  }, [displayItems]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") return displayItems;
    return displayItems.filter(
      (item) => String(item.category || "").toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [displayItems, selectedCategory]);

  const filteredVideos = useMemo(() => {
    const list = videoGallery || [];
    if (selectedVideoCategory === "all") return list;
    return list.filter((v) => v.category === selectedVideoCategory);
  }, [videoGallery, selectedVideoCategory]);

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
            <Text style={styles.headerMainTitle}>शिवसेना</Text>
            <Text style={styles.headerSubtitle}>(शिंदे गट)</Text>
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
        {/* Title & Quote Banner Row */}
        <View style={styles.titleQuoteRow}>
          {/* Left Title & Subtitle */}
          <View style={styles.titleLeftGroup}>
            <Text style={styles.pageTitle}>गॅलरी</Text>
            <Text style={styles.pageSubtitle}>
              कार्यक्रम, भेटी, जनसंवाद आणि महत्त्वपूर्ण क्षण
            </Text>
          </View>

          {/* Right Brush Quote Banner */}
          <View style={styles.quoteBadgeWrapper}>
            <Image
              source={require("../../assets/images/gallery_quote_badge.png")}
              style={styles.quoteBadgeImage}
              contentFit="contain"
            />
          </View>
        </View>

        {/* Top Segmented Control: फोटो (Photos) | व्हिडिओ (Videos) */}
        <View style={styles.segmentWrapper}>
          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === "photos" && styles.segmentTabActive,
            ]}
            onPress={() => setActiveTab("photos")}
            activeOpacity={0.85}
          >
            <Icon
              source="image-multiple"
              size={17}
              color={activeTab === "photos" ? "#FFFFFF" : "#6B7280"}
            />
            <Text
              style={[
                styles.segmentTabText,
                activeTab === "photos" && styles.segmentTabTextActive,
              ]}
            >
              छायाचित्रे ({displayItems.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              activeTab === "videos" && styles.segmentTabActive,
            ]}
            onPress={() => setActiveTab("videos")}
            activeOpacity={0.85}
          >
            <Icon
              source="play-circle"
              size={18}
              color={activeTab === "videos" ? "#FFFFFF" : "#6B7280"}
            />
            <Text
              style={[
                styles.segmentTabText,
                activeTab === "videos" && styles.segmentTabTextActive,
              ]}
            >
              व्हिडिओ ({videoGallery?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* PHOTOS TAB CONTENT */}
        {activeTab === "photos" && (
          <>
            {/* Horizontal Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {/* 1. सर्व */}
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  selectedCategory === "all"
                    ? styles.categoryPillActive
                    : styles.categoryPillInactive,
                ]}
                onPress={() => setSelectedCategory("all")}
                activeOpacity={0.85}
              >
                <Icon
                  source="image-multiple"
                  size={17}
                  color={selectedCategory === "all" ? "#FFFFFF" : "#E05300"}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === "all"
                      ? styles.categoryTextActive
                      : styles.categoryTextInactive,
                  ]}
                >
                  सर्व ({counts.all})
                </Text>
              </TouchableOpacity>

              {/* 2. कार्यक्रम */}
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  selectedCategory === "events"
                    ? styles.categoryPillActive
                    : styles.categoryPillInactive,
                ]}
                onPress={() => setSelectedCategory("events")}
                activeOpacity={0.85}
              >
                <Icon
                  source="calendar-month-outline"
                  size={17}
                  color={selectedCategory === "events" ? "#FFFFFF" : "#E05300"}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === "events"
                      ? styles.categoryTextActive
                      : styles.categoryTextInactive,
                  ]}
                >
                  कार्यक्रम ({counts.events})
                </Text>
              </TouchableOpacity>

              {/* 3. जनसंवाद */}
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  selectedCategory === "dialogue"
                    ? styles.categoryPillActive
                    : styles.categoryPillInactive,
                ]}
                onPress={() => setSelectedCategory("dialogue")}
                activeOpacity={0.85}
              >
                <Icon
                  source="account-group-outline"
                  size={17}
                  color={selectedCategory === "dialogue" ? "#FFFFFF" : "#E05300"}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === "dialogue"
                      ? styles.categoryTextActive
                      : styles.categoryTextInactive,
                  ]}
                >
                  जनसंवाद ({counts.dialogue})
                </Text>
              </TouchableOpacity>

              {/* 4. भेटीगाठी */}
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  selectedCategory === "meetings"
                    ? styles.categoryPillActive
                    : styles.categoryPillInactive,
                ]}
                onPress={() => setSelectedCategory("meetings")}
                activeOpacity={0.85}
              >
                <Icon
                  source="handshake-outline"
                  size={17}
                  color={selectedCategory === "meetings" ? "#FFFFFF" : "#E05300"}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === "meetings"
                      ? styles.categoryTextActive
                      : styles.categoryTextInactive,
                  ]}
                >
                  भेटीगाठी ({counts.meetings})
                </Text>
              </TouchableOpacity>

              {/* 5. माध्यमे */}
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  selectedCategory === "media"
                    ? styles.categoryPillActive
                    : styles.categoryPillInactive,
                ]}
                onPress={() => setSelectedCategory("media")}
                activeOpacity={0.85}
              >
                <Icon
                  source="video-outline"
                  size={17}
                  color={selectedCategory === "media" ? "#FFFFFF" : "#E05300"}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === "media"
                      ? styles.categoryTextActive
                      : styles.categoryTextInactive,
                  ]}
                >
                  माध्यमे ({counts.media})
                </Text>
              </TouchableOpacity>

              {/* 6. इतर */}
              {counts.other > 0 && (
                <TouchableOpacity
                  style={[
                    styles.categoryPill,
                    selectedCategory === "other"
                      ? styles.categoryPillActive
                      : styles.categoryPillInactive,
                  ]}
                  onPress={() => setSelectedCategory("other")}
                  activeOpacity={0.85}
                >
                  <Icon
                    source="dots-horizontal"
                    size={17}
                    color={selectedCategory === "other" ? "#FFFFFF" : "#E05300"}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === "other"
                        ? styles.categoryTextActive
                        : styles.categoryTextInactive,
                    ]}
                  >
                    इतर ({counts.other})
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {filteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon source="image-multiple-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>कोणतेही फोटो उपलब्ध नाहीत</Text>
                <Text style={styles.emptySub}>सध्या या श्रेणीत कोणतेही फोटो उपलब्ध नाहीत.</Text>
              </View>
            ) : (
              <>
                {/* 2-Column Photo Grid */}
                <View style={styles.gridContainer}>
                  {filteredItems.map((item) => (
                    <TouchableOpacity
                      key={String(item.id)}
                      style={styles.gridCard}
                      onPress={() => setSelectedPhoto(item)}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={item.image}
                        style={styles.cardImage}
                        contentFit="cover"
                        priority="high"
                        transition={200}
                      />
                      {/* Category Badge */}
                      <View style={styles.cardCategoryBadge}>
                        <Text style={styles.cardCategoryText}>
                          {item.category || "events"}
                        </Text>
                      </View>
                      {/* Bottom Gradient / Dark Banner with Title */}
                      <View style={styles.cardBottomOverlay}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.date ? (
                          <Text style={styles.cardSubtitle} numberOfLines={1}>
                            {item.date}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Section: Video Highlights strip inside Photo gallery */}
                {videoGallery && videoGallery.length > 0 && (
                  <View style={styles.inlineVideoSection}>
                    <View style={styles.inlineVideoHeader}>
                      <View>
                        <Text style={styles.inlineVideoTitle}>🎥 व्हिडिओ गॅलरी व भाषणे</Text>
                        <Text style={styles.inlineVideoSub}>नागरिकांशी संवाद आणि विकास संकल्प</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.inlineVideoAllBtn}
                        onPress={() => setActiveTab("videos")}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.inlineVideoAllText}>सर्व व्हिडिओ</Text>
                        <Icon source="arrow-right" size={15} color="#E05300" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.inlineVideoScroll}
                    >
                      {videoGallery.map((vid) => (
                        <TouchableOpacity
                          key={vid.id}
                          style={styles.inlineVideoCard}
                          onPress={() => setSelectedVideo(vid)}
                          activeOpacity={0.9}
                        >
                          <View style={styles.inlineVideoThumbWrap}>
                            <Image
                              source={vid.thumbnail}
                              style={styles.inlineVideoThumb}
                              contentFit="cover"
                            />
                            <View style={styles.inlinePlayCircle}>
                              <Icon source="play" size={20} color="#FFFFFF" />
                            </View>
                            <View style={styles.inlineDurationBadge}>
                              <Text style={styles.inlineDurationText}>{vid.duration}</Text>
                            </View>
                          </View>
                          <View style={styles.inlineVideoInfo}>
                            <Text style={styles.inlineVideoHeadline} numberOfLines={2}>
                              {vid.title}
                            </Text>
                            <Text style={styles.inlineVideoMeta}>
                              {vid.views} • {vid.date}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* VIDEOS TAB CONTENT */}
        {activeTab === "videos" && (
          <View style={styles.videosTabWrap}>
            {/* Horizontal Video Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {VIDEO_CATEGORIES.map((cat) => {
                const isSelected = selectedVideoCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryPill,
                      isSelected ? styles.categoryPillActive : styles.categoryPillInactive,
                    ]}
                    onPress={() => setSelectedVideoCategory(cat.id)}
                    activeOpacity={0.85}
                  >
                    <Icon
                      source={cat.id === "speeches" ? "microphone" : cat.id === "dialogue" ? "account-group" : "play-circle-outline"}
                      size={16}
                      color={isSelected ? "#FFFFFF" : "#E05300"}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected ? styles.categoryTextActive : styles.categoryTextInactive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Video Cards List */}
            <View style={styles.videoListContainer}>
              {filteredVideos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={styles.fullVideoCard}
                  onPress={() => setSelectedVideo(video)}
                  activeOpacity={0.92}
                >
                  {/* Thumbnail Box */}
                  <View style={styles.fullVideoThumbWrap}>
                    <Image
                      source={video.thumbnail}
                      style={styles.fullVideoThumb}
                      contentFit="cover"
                    />

                    {/* Centered Play Button */}
                    <View style={styles.fullVideoPlayBtn}>
                      <Icon source="play" size={30} color="#FFFFFF" />
                    </View>

                    {/* Duration Badge */}
                    <View style={styles.fullVideoDurationBadge}>
                      <Text style={styles.fullVideoDurationText}>{video.duration}</Text>
                    </View>

                    {/* Category Overlay Tag */}
                    <View style={styles.fullVideoCatOverlay}>
                      <Text style={styles.fullVideoCatOverlayText}>
                        {video.categoryName || "व्हिडिओ"}
                      </Text>
                    </View>
                  </View>

                  {/* Video Info */}
                  <View style={styles.fullVideoInfo}>
                    <Text style={styles.fullVideoHeadline} numberOfLines={2}>
                      {video.title}
                    </Text>
                    <View style={styles.fullVideoMetaRow}>
                      <View style={styles.metaWithIcon}>
                        <Icon source="calendar-blank-outline" size={13} color="#6B7280" />
                        <Text style={styles.fullVideoMetaText}>{video.date}</Text>
                      </View>
                      <View style={styles.metaWithIcon}>
                        <Icon source="eye-outline" size={13} color="#6B7280" />
                        <Text style={styles.fullVideoMetaText}>{video.views}</Text>
                      </View>
                      <View style={styles.playNowBtn}>
                        <Text style={styles.playNowText}>पहा</Text>
                        <Icon source="play" size={12} color="#E05300" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={true}
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalImageWrapper}>
                <Image
                  source={selectedPhoto.image}
                  style={styles.modalImage}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={styles.modalCloseCircle}
                  onPress={() => setSelectedPhoto(null)}
                  activeOpacity={0.85}
                >
                  <Icon source="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalTitle}>{selectedPhoto.title}</Text>
                    <Text style={styles.modalDate}>{selectedPhoto.date}</Text>
                  </View>
                  <View style={styles.modalBadge}>
                    <Icon source="image" size={14} color="#E05300" />
                    <Text style={styles.modalBadgeText}>
                      {selectedPhoto.photoCount} फोटो
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalDesc}>{selectedPhoto.description}</Text>

                <TouchableOpacity
                  style={styles.modalDismissBtn}
                  onPress={() => setSelectedPhoto(null)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalDismissText}>बंद करा (Close)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Native Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModalContent
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* 5-Tab Bottom Navigation Bar */}
      <BottomTabBar currentTab="gallery" />
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
    paddingBottom: 12,
  },
  headerLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoEmblemContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleGroup: {
    justifyContent: "center",
  },
  headerMainTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 0.5,
    lineHeight: 25,
  },
  headerSubtitle: {
    color: "#FED7AA",
    fontSize: 12,
    fontWeight: "700",
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
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },

  // Title & Quote Row
  titleQuoteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  titleLeftGroup: {
    flex: 1,
    paddingRight: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1C1917",
    letterSpacing: 0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#78716C",
    marginTop: 2,
    lineHeight: 16,
  },
  quoteBadgeWrapper: {
    width: 145,
    height: 48,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  quoteBadgeImage: {
    width: 145,
    height: 48,
  },

  // Category Filter Pills
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7.5,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1.5,
  },
  categoryPillActive: {
    backgroundColor: "#E05300",
  },
  categoryPillInactive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "700",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  categoryTextInactive: {
    color: "#44403C",
  },

  // 2-Column Photo Grid
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    marginTop: 4,
    rowGap: 12,
  },
  gridCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardCategoryBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(17, 24, 39, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardCategoryText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "lowercase",
  },
  cardBottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(17, 24, 39, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  cardSubtitle: {
    color: "#E5E7EB",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
  },

  // Load More Button
  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEDD5",
    marginHorizontal: 16,
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: 22,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#E05300",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalImageWrapper: {
    width: "100%",
    height: 240,
    position: "relative",
    backgroundColor: "#1C1917",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalCloseCircle: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: 16,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1C1917",
  },
  modalDate: {
    fontSize: 12,
    color: "#78716C",
    fontWeight: "600",
    marginTop: 2,
  },
  modalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  modalBadgeText: {
    fontSize: 12,
    color: "#E05300",
    fontWeight: "700",
  },
  modalDesc: {
    fontSize: 13.5,
    color: "#44403C",
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 16,
  },
  modalDismissBtn: {
    backgroundColor: "#E05300",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  modalDismissText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  // Bottom Navigation Bar
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 6,
    justifyContent: "space-around",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tabLabel: {
    fontSize: 11,
    color: "#78716C",
    fontWeight: "600",
    marginTop: 3,
  },
  tabActiveLabel: {
    color: "#E05300",
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

  // Segmented Switcher (फोटो / व्हिडिओ)
  segmentWrapper: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 14,
    padding: 4,
    gap: 6,
  },
  segmentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  segmentTabActive: {
    backgroundColor: "#E05300",
    shadowColor: "#E05300",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentTabText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#4B5563",
  },
  segmentTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  // Inline Video Section on Photos Tab
  inlineVideoSection: {
    marginTop: 24,
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F0EFEA",
  },
  inlineVideoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  inlineVideoTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1C1917",
  },
  inlineVideoSub: {
    fontSize: 11.5,
    color: "#78716C",
    fontWeight: "600",
    marginTop: 1,
  },
  inlineVideoAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  inlineVideoAllText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E05300",
  },
  inlineVideoScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  inlineVideoCard: {
    width: 220,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  inlineVideoThumbWrap: {
    width: "100%",
    height: 125,
    backgroundColor: "#1F2937",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  inlineVideoThumb: {
    width: "100%",
    height: "100%",
  },
  inlinePlayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.85)",
  },
  inlineDurationBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inlineDurationText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  inlineVideoInfo: {
    padding: 10,
  },
  inlineVideoHeadline: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#1F2937",
    lineHeight: 17,
    marginBottom: 4,
  },
  inlineVideoMeta: {
    fontSize: 10.5,
    color: "#6B7280",
    fontWeight: "500",
  },

  // Videos Tab View
  videosTabWrap: {
    paddingBottom: 16,
  },
  videoListContainer: {
    paddingHorizontal: 16,
    gap: 14,
    marginTop: 8,
  },
  fullVideoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  fullVideoThumbWrap: {
    width: "100%",
    height: VIDEO_THUMB_HEIGHT,
    backgroundColor: "#1F2937",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  fullVideoThumb: {
    width: "100%",
    height: "100%",
  },
  fullVideoPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },
  fullVideoDurationBadge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(0,0,0,0.82)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fullVideoDurationText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  fullVideoCatOverlay: {
    position: "absolute",
    left: 10,
    top: 10,
    backgroundColor: "rgba(224, 83, 0, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fullVideoCatOverlayText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  fullVideoInfo: {
    padding: 14,
  },
  fullVideoHeadline: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1F2937",
    lineHeight: 21,
    marginBottom: 8,
  },
  fullVideoMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  fullVideoMetaText: {
    fontSize: 11.5,
    color: "#6B7280",
    fontWeight: "600",
  },
  playNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playNowText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#E05300",
  },

  // Video Modal Styles
  videoModalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  videoModalPlayerWrap: {
    width: "100%",
    height: 220,
    backgroundColor: "#000000",
    position: "relative",
  },
  videoModalPlayer: {
    width: "100%",
    height: "100%",
  },
  videoModalCloseBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  videoModalBody: {
    padding: 16,
  },
  videoModalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  videoModalCategoryBadge: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  videoModalCategoryText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#E05300",
  },
  videoModalMeta: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  videoModalTitle: {
    fontSize: 16.5,
    fontWeight: "900",
    color: "#1C1917",
    lineHeight: 23,
    marginBottom: 6,
  },
  videoModalDesc: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 19,
    marginBottom: 16,
  },
  videoModalDismissBtn: {
    backgroundColor: "#E05300",
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
  },
  videoModalDismissText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
