import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Icon } from "react-native-paper";

export interface NotificationItem {
  id: number | string;
  title: string;
  message?: string;
  description?: string;
  category?: string;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  timeAgo?: string;
  indicatorDot?: string;
  targetRoute?: string;
  type?: string;
  mediaType?: "none" | "image" | "video" | "audio" | "pdf" | string;
  media_type?: string;
  mediaUrl?: string;
  media_url?: string;
  fileName?: string;
  file_name?: string;
  fileSize?: number;
  file_size?: number;
  duration?: number;
  priority?: string;
  sentAt?: string;
  sent_at?: string;
  createdAt?: string;
  created_at?: string;
}

// 1. Image Viewer (View-Only + Fullscreen Lightbox)
const ImageViewer: React.FC<{ url: string }> = ({ url }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => setModalVisible(true)}
        style={styles.imageWrapper}
      >
        <Image
          source={{ uri: url }}
          style={styles.imagePreview}
          resizeMode="cover"
        />
        <View style={styles.tapBadge}>
          <Icon source="fullscreen" size={14} color="#FFFFFF" />
          <Text style={styles.tapBadgeText}>पूर्ण आकार पहा</Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setModalVisible(false)}
            activeOpacity={0.8}
          >
            <View style={styles.closeBtnCircle}>
              <Icon source="close" size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Image
            source={{ uri: url }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </>
  );
};

// 2. Video Player (View-Only, Modern Native expo-video)
const VideoPlayerComponent: React.FC<{ url: string }> = ({ url }) => {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });

  return (
    <View style={styles.videoWrapper}>
      <VideoView
        style={styles.videoPlayer}
        player={player}
        nativeControls={true}
        contentFit="contain"
      />
    </View>
  );
};

// 3. Audio Player (Listen-Only, Modern Native expo-audio)
const AudioPlayerComponent: React.FC<{
  url: string;
  fileName?: string;
  durationSec?: number;
}> = ({ url, fileName, durationSec }) => {
  const player = useAudioPlayer(url, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  const isPlaying = Boolean(status.playing);
  const currentTime = status.currentTime || 0;
  const totalDuration = status.duration || durationSec || 0;

  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const formatTime = (secs: number) => {
    const s = Math.floor(secs);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  const progressPercent =
    totalDuration > 0
      ? Math.min(Math.max((currentTime / totalDuration) * 100, 0), 100)
      : 0;

  return (
    <View style={styles.audioContainer}>
      <View style={styles.audioRow}>
        <TouchableOpacity
          style={styles.audioPlayBtn}
          onPress={togglePlay}
          activeOpacity={0.8}
        >
          <Icon
            source={isPlaying ? "pause" : "play"}
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View style={styles.audioDetails}>
          <Text style={styles.audioFileName} numberOfLines={1}>
            {fileName || "ऑडिओ संदेश"}
          </Text>

          {/* Progress bar */}
          <View style={styles.audioProgressTrack}>
            <View
              style={[
                styles.audioProgressFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>

          <View style={styles.audioTimeRow}>
            <Text style={styles.audioTimeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.audioTimeText}>{formatTime(totalDuration)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// 4. PDF Document Card (Download & View)
const PdfDownloadCard: React.FC<{
  url: string;
  fileName: string;
  fileSize?: number;
}> = ({ url, fileName, fileSize }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const safeName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${safeName}`;

      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      setIsDownloading(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: safeName,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("डाउनलोड पूर्ण", `फाईल सेव्ह झाली: ${uri}`);
      }
    } catch (e: any) {
      setIsDownloading(false);
      Alert.alert(
        "डाउनलोड त्रुटी",
        e?.message || "दस्तऐवज डाउनलोड करण्यात त्रुटी आली."
      );
    }
  };

  const formattedSize = fileSize
    ? `${
        fileSize / (1024 * 1024) > 1
          ? (fileSize / (1024 * 1024)).toFixed(1) + " MB"
          : (fileSize / 1024).toFixed(1) + " KB"
      }`
    : "PDF दस्तऐवज";

  return (
    <View style={styles.pdfCard}>
      <View style={styles.pdfIconWrap}>
        <Icon source="file-pdf-box" size={32} color="#DC2626" />
      </View>
      <View style={styles.pdfInfo}>
        <Text style={styles.pdfTitle} numberOfLines={1}>
          {fileName}
        </Text>
        <Text style={styles.pdfSize}>{formattedSize}</Text>
      </View>
      <TouchableOpacity
        style={[styles.pdfDownloadBtn, isDownloading && { opacity: 0.65 }]}
        onPress={handleDownload}
        disabled={isDownloading}
        activeOpacity={0.8}
      >
        {isDownloading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <View style={styles.pdfBtnInner}>
            <Icon source="download" size={15} color="#FFFFFF" />
            <Text style={styles.pdfDownloadBtnText}>डाउनलोड</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export const NotificationMediaRenderer: React.FC<{ item: NotificationItem }> = ({
  item,
}) => {
  const mediaType = (
    item.mediaType ||
    item.media_type ||
    "none"
  )
    .toString()
    .toLowerCase()
    .trim();

  const mediaUrl = item.mediaUrl || item.media_url;
  const fileName =
    item.fileName ||
    item.file_name ||
    (mediaUrl ? mediaUrl.split("/").pop()?.split("?")[0] : undefined) ||
    "दस्तऐवज";
  const fileSize = item.fileSize || item.file_size;

  if (!mediaType || mediaType === "none" || !mediaUrl) {
    return null;
  }

  return (
    <View style={styles.container}>
      {mediaType === "image" && <ImageViewer url={mediaUrl} />}
      {mediaType === "video" && <VideoPlayerComponent url={mediaUrl} />}
      {mediaType === "audio" && (
        <AudioPlayerComponent
          url={mediaUrl}
          fileName={fileName}
          durationSec={item.duration}
        />
      )}
      {mediaType === "pdf" && (
        <PdfDownloadCard
          url={mediaUrl}
          fileName={fileName}
          fileSize={fileSize}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  // 1. Image styles
  imageWrapper: {
    position: "relative",
    width: "100%",
    backgroundColor: "#F3F4F6",
  },
  imagePreview: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  tapBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(17, 24, 39, 0.78)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tapBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 20,
  },
  closeBtnCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullImage: {
    width: "100%",
    height: "85%",
  },

  // 2. Video styles
  videoWrapper: {
    width: "100%",
    height: 200,
    backgroundColor: "#000000",
    borderRadius: 8,
    overflow: "hidden",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },

  // 3. Audio styles
  audioContainer: {
    padding: 10,
    backgroundColor: "#FFF7ED",
    borderRadius: 8,
  },
  audioRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  audioPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  audioDetails: {
    flex: 1,
    marginLeft: 12,
  },
  audioFileName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  audioProgressTrack: {
    height: 4,
    backgroundColor: "#FED7AA",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  audioProgressFill: {
    height: "100%",
    backgroundColor: "#EA580C",
    borderRadius: 2,
  },
  audioTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  audioTimeText: {
    fontSize: 10.5,
    color: "#9A3412",
    fontWeight: "600",
  },

  // 4. PDF styles
  pdfCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
  },
  pdfIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  pdfTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  pdfSize: {
    fontSize: 11,
    color: "#991B1B",
    marginTop: 2,
    fontWeight: "500",
  },
  pdfDownloadBtn: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pdfDownloadBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
