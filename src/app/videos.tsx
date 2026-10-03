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
import { VideoView, useVideoPlayer } from "expo-video";
import { useCampaign, VideoGalleryItem } from "../context/CampaignContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VIDEO_THUMB_HEIGHT = Math.round((SCREEN_WIDTH - 32) * (180 / 340));

const VIDEO_CATEGORIES = [
  { id: "all", name: "सर्व" },
  { id: "speeches", name: "भाषणे" },
  { id: "events", name: "कार्यक्रम" },
  { id: "dialogue", name: "जनसंवाद" },
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
              <View style={styles.videoCategoryBadge}>
                <Text style={styles.videoCategoryBadgeText}>
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

export default function VideosScreen() {
  const router = useRouter();
  const { videoGallery, refreshAppConfig } = useCampaign();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState<VideoGalleryItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAppConfig();
    } catch {
      // Offline fallback
    } finally {
      setRefreshing(false);
    }
  }, [refreshAppConfig]);

  const sourceVideos = videoGallery || [];

  const filteredVideos = sourceVideos.filter((vid) => {
    if (selectedCategory === "all") return true;
    return vid.category === selectedCategory;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#E05300" />

      {/* Top Saffron Header */}
      <View style={styles.topHeader}>
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

        <Text style={styles.headerTitle}>व्हिडिओ गॅलरी</Text>

        <View style={styles.logoEmblemContainer}>
          <Image
            source={require("../../assets/images/shivsena_logo.png")}
            style={styles.logoEmblemImg}
            contentFit="cover"
          />
        </View>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterPillsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          {VIDEO_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Video Cards List */}
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
        {filteredVideos.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.videoCard}
            onPress={() => setSelectedVideo(item)}
            activeOpacity={0.9}
          >
            {/* Thumbnail Box */}
            <View style={styles.thumbWrap}>
              <Image
                source={item.thumbnail}
                style={styles.videoThumb}
                contentFit="cover"
              />

              {/* Centered Play Button */}
              <View style={styles.playButtonCircle}>
                <Icon source="play" size={28} color="#FFFFFF" />
              </View>

              {/* Duration Badge */}
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{item.duration}</Text>
              </View>
            </View>

            {/* Video Info */}
            <View style={styles.videoInfo}>
              <Text style={styles.videoHeadline} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.videoBottomMeta}>
                <Text style={styles.videoMeta}>
                  {item.date} • {item.views}
                </Text>
                <View style={styles.playNowRow}>
                  <Text style={styles.playNowLabel}>व्हिडिओ पहा</Text>
                  <Icon source="play-circle" size={16} color="#E05300" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Native Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModalContent
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  topHeader: {
    backgroundColor: "#E05300",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  backButton: {
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
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  logoEmblemContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#FBBF24",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmblemImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },

  // Pills
  filterPillsBar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 10,
  },
  filterPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  filterPillActive: {
    backgroundColor: "#EA580C",
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },

  // List
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  videoCard: {
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
  thumbWrap: {
    position: "relative",
    width: "100%",
    height: VIDEO_THUMB_HEIGHT,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  videoThumb: {
    width: "100%",
    height: "100%",
  },
  playButtonCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  durationBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  videoInfo: {
    padding: 14,
  },
  videoHeadline: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 6,
    lineHeight: 21,
  },
  videoBottomMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  videoMeta: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  playNowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  playNowLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E05300",
  },

  // Video Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
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
    backgroundColor: "rgba(0, 0, 0, 0.65)",
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
  videoCategoryBadge: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  videoCategoryBadgeText: {
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
