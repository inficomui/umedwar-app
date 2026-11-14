import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { appConfigApi } from "../services/appConfigApi";

interface DocumentItem {
  id: string | number;
  category: "notice" | "scheme" | "pdf" | "other" | string;
  title: string;
  fileSize?: string;
  url?: string;
  file_url?: string;
}

const DOC_CATEGORIES = [
  { id: "all", name: "सर्व" },
  { id: "notice", name: "जाहिरात" },
  { id: "scheme", name: "योजना" },
  { id: "pdf", name: "PDF" },
  { id: "other", name: "इतर" },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDocs = useCallback(async () => {
    try {
      const data = await appConfigApi.getDocuments();
      if (Array.isArray(data)) {
        setDocuments(data);
      }
    } catch {
      // Ignore network errors
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDocs();
    setRefreshing(false);
  }, [fetchDocs]);

  const filteredDocs = documents.filter((item) => {
    if (selectedCategory === "all") return true;
    return item.category === selectedCategory;
  });

  const handleDownload = async (item: DocumentItem) => {
    const fileUrl = item.url || item.file_url;
    if (fileUrl) {
      try {
        const supported = await Linking.canOpenURL(fileUrl);
        if (supported) {
          await Linking.openURL(fileUrl);
          return;
        }
      } catch {
        // Fallback
      }
    }
    setDownloadingId(item.id);
    setTimeout(() => {
      setDownloadingId(null);
      Alert.alert("दस्तऐवज", `${item.title} उघडण्यात येत आहे.`);
    }, 600);
  };

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

        <Text style={styles.headerTitle}>दस्तऐवज / जाहिराती</Text>

        <View style={styles.headerPlaceholder} />
      </View>

      {/* Filter Pills */}
      <View style={styles.filterPillsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          {DOC_CATEGORIES.map((cat) => {
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

      {/* Documents List */}
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
        {filteredDocs.length === 0 ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 20 }}>
            <Icon source="file-document-outline" size={48} color="#D1D5DB" />
            <Text style={{ marginTop: 12, fontSize: 15, fontWeight: "700", color: "#6B7280", textAlign: "center" }}>
              सध्या कोणतेही दस्तऐवज उपलब्ध नाहीत.
            </Text>
          </View>
        ) : (
          filteredDocs.map((doc) => {
          const isDownloading = downloadingId === doc.id;
          return (
            <View key={doc.id} style={styles.docCard}>
              {/* PDF Red Badge Icon */}
              <View style={styles.pdfIconBox}>
                <Icon source="file-pdf-box" size={32} color="#DC2626" />
              </View>

              {/* Center Info */}
              <View style={styles.docInfoCol}>
                <Text style={styles.docTitle} numberOfLines={1}>
                  {doc.title}
                </Text>
                <Text style={styles.docSize}>{doc.fileSize}</Text>
              </View>

              {/* Download Button */}
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => handleDownload(doc)}
                disabled={isDownloading}
                activeOpacity={0.8}
              >
                <Icon
                  source={isDownloading ? "progress-download" : "download"}
                  size={22}
                  color="#EA580C"
                />
              </TouchableOpacity>
            </View>
          );
        })
      )}
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
  headerPlaceholder: {
    width: 38,
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
    gap: 12,
    paddingBottom: 32,
  },
  docCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1.5,
  },
  pdfIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  docInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  docTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  docSize: {
    fontSize: 11.5,
    color: "#6B7280",
    fontWeight: "500",
  },
  downloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
