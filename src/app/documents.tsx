import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";

interface DocumentItem {
  id: string;
  category: "notice" | "scheme" | "pdf" | "other";
  title: string;
  fileSize: string;
}

const DOCUMENTS_DATA: DocumentItem[] = [
  {
    id: "doc-1",
    category: "pdf",
    title: "विकास आराखडा 2026-2030",
    fileSize: "PDF • 2.4 MB",
  },
  {
    id: "doc-2",
    category: "notice",
    title: "जनसंवाद सभा सूचना",
    fileSize: "PDF • 1.2 MB",
  },
  {
    id: "doc-3",
    category: "notice",
    title: "स्वच्छता अभियान मार्गदर्शक",
    fileSize: "PDF • 950 KB",
  },
  {
    id: "doc-4",
    category: "scheme",
    title: "शासकीय योजनांची माहिती",
    fileSize: "PDF • 1.8 MB",
  },
  {
    id: "doc-5",
    category: "scheme",
    title: "पाणीपुरवठा सुधारणा योजना",
    fileSize: "PDF • 2.1 MB",
  },
];

const DOC_CATEGORIES = [
  { id: "all", name: "सर्व" },
  { id: "notice", name: "जाहिरात" },
  { id: "scheme", name: "योजना" },
  { id: "pdf", name: "PDF" },
  { id: "other", name: "इतर" },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const filteredDocs = DOCUMENTS_DATA.filter((item) => {
    if (selectedCategory === "all") return true;
    return item.category === selectedCategory;
  });

  const handleDownload = (item: DocumentItem) => {
    setDownloadingId(item.id);
    setTimeout(() => {
      setDownloadingId(null);
      Alert.alert("डाउनलोड पूर्ण", `${item.title} डाऊनलोड फोल्डरमध्ये सेव्ह झाली आहे.`);
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
        {filteredDocs.map((doc) => {
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
        })}
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
