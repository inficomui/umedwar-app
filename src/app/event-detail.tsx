import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = Math.round(SCREEN_WIDTH * (210 / 375));

export default function EventDetailScreen() {
  const router = useRouter();
  const [isRsvpd, setIsRsvpd] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleRsvp = () => {
    setIsRsvpd(!isRsvpd);
    if (!isRsvpd) {
      Alert.alert(
        "उपस्थिती नोंदवली!",
        "आपण या कार्यक्रमाला उपस्थित राहणार आहात ही नोंद झाली आहे.\nधन्यवाद!"
      );
    }
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

        <Text style={styles.headerTitle}>कार्यक्रम तपशील</Text>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={() =>
            Alert.alert("शेअर", "कार्यक्रमाची लिंक कॉपी करण्यात आली आहे.")
          }
          activeOpacity={0.8}
        >
          <Icon source="share-variant" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
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
        {/* Hero Photo Banner */}
        <View style={styles.heroContainer}>
          <Image
            source={require("../../assets/images/event_hero_banner.jpg")}
            style={styles.heroImage}
            contentFit="cover"
          />

          {/* Floating Date Badge on bottom right of image */}
          <View style={styles.dateBadgeFloat}>
            <Text style={styles.dateBadgeDay}>25</Text>
            <Text style={styles.dateBadgeSub}>सप्टेंबर 2026</Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.eventMainTitle}>जिल्हा जनसंवाद सभा</Text>

          {/* Meta Info Rows */}
          <View style={styles.metaList}>
            <View style={styles.metaRowItem}>
              <View style={styles.metaIconBox}>
                <Icon source="calendar" size={18} color="#EA580C" />
              </View>
              <Text style={styles.metaRowText}>25 सप्टेंबर 2026, शनिवार</Text>
            </View>

            <View style={styles.metaRowItem}>
              <View style={styles.metaIconBox}>
                <Icon source="clock-outline" size={18} color="#EA580C" />
              </View>
              <Text style={styles.metaRowText}>सायं 05:00 वाजता</Text>
            </View>

            <View style={styles.metaRowItem}>
              <View style={styles.metaIconBox}>
                <Icon source="map-marker" size={18} color="#EA580C" />
              </View>
              <Text style={styles.metaRowText}>
                कृषी उत्पन्न बाजार समिती, औरंगाबाद - 431001
              </Text>
            </View>
          </View>

          {/* Section: कार्यक्रमाबद्दल */}
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>कार्यक्रमाबद्दल</Text>
            <Text style={styles.narrativeText}>
              जिल्ह्यातील नागरिकांच्या विविध समस्यांवर संवाद साधण्यासाठी ही सभा आयोजित केली आहे. सर्व नागरिकांनी मोठ्या संख्येने उपस्थित राहावे.
            </Text>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => router.push("/issue-map")}
              activeOpacity={0.8}
            >
              <Icon source="map-outline" size={16} color="#EA580C" />
              <Text style={styles.actionBtnText}>नकाशावर पहा</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() =>
                Alert.alert("कॅलेंडर", "हा कार्यक्रम तुमच्या मोबाईल कॅलेंडरमध्ये सेव्ह करण्यात आला आहे.")
              }
              activeOpacity={0.8}
            >
              <Icon source="calendar-plus" size={16} color="#EA580C" />
              <Text style={styles.actionBtnText}>कॅलेंडरमध्ये जोडा</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Fixed RSVP Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.rsvpBtn, isRsvpd && styles.rsvpBtnActive]}
          onPress={handleRsvp}
          activeOpacity={0.88}
        >
          <Icon
            source={isRsvpd ? "check-circle" : "account-group"}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.rsvpBtnText}>
            {isRsvpd ? "मी हजर राहणार आहे (नोंदवले ✔)" : "मी हजर राहणार आहे"}
          </Text>
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
  shareButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroContainer: {
    position: "relative",
    width: "100%",
    height: HERO_HEIGHT,
    backgroundColor: "#E5E7EB",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  dateBadgeFloat: {
    position: "absolute",
    right: 16,
    bottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dateBadgeDay: {
    fontSize: 18,
    fontWeight: "900",
    color: "#DC2626",
    lineHeight: 22,
  },
  dateBadgeSub: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4B5563",
  },

  // Card Content
  detailsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  eventMainTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1F2937",
    marginBottom: 12,
  },
  metaList: {
    gap: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  metaRowItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaIconBox: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRowText: {
    fontSize: 13.5,
    color: "#4B5563",
    fontWeight: "500",
    flex: 1,
  },

  // About Section
  aboutSection: {
    paddingVertical: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 6,
  },
  narrativeText: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
  },

  // Actions Row
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FED7AA",
    backgroundColor: "#FFF7ED",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#EA580C",
  },

  // Bottom Fixed RSVP Bar
  bottomBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  rsvpBtn: {
    backgroundColor: "#EA580C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  rsvpBtnActive: {
    backgroundColor: "#16A34A",
  },
  rsvpBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
