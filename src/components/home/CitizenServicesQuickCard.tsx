import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CitizenServicesQuickCard() {
  const router = useRouter();

  return (
    <View style={styles.cardContainer}>
      {/* Top Header Badge */}
      <View style={styles.headerRow}>
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>🏛️ २६ शासकीय विभाग • २४-तास SLA</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/citizen-departments")}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>सर्व विभाग पहा ➔</Text>
        </TouchableOpacity>
      </View>

      {/* Main Title & Description */}
      <Text style={styles.mainTitle}>नागरिक सेवा व तक्रार निवारण कक्ष</Text>
      <Text style={styles.subtitle}>
        तहसील, पंचायत, महावितरण, पाणीपुरवठा व पोलीस विभागाच्या सेवा, दाखले व तक्रार निवारण.
      </Text>

      {/* 3 Prominent Quick Action Pills */}
      <View style={styles.actionRow}>
        {/* Action 1: New Grievance */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={() => router.push("/new-citizen-submission")}
          activeOpacity={0.85}
        >
          <Text style={styles.actionIcon}>📝</Text>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionBtnPrimaryText}>तक्रार नोंदवा</Text>
            <Text style={styles.actionSubTextPrimary}>२४ तासांत अद्यतन</Text>
          </View>
        </TouchableOpacity>

        {/* Action 2: 26 Departments Directory */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={() => router.push("/citizen-departments")}
          activeOpacity={0.85}
        >
          <Text style={styles.actionIcon}>🏛️</Text>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionBtnSecondaryText}>२६ विभाग</Text>
            <Text style={styles.actionSubTextSecondary}>सेवा व दाखले</Text>
          </View>
        </TouchableOpacity>

        {/* Action 3: Track Status */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnTertiary]}
          onPress={() => router.push("/submission-tracking")}
          activeOpacity={0.85}
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionBtnTertiaryText}>स्थिती ट्रॅक करा</Text>
            <Text style={styles.actionSubTextTertiary}>थेट प्रगती पहा</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FDBA74",
    padding: 16,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badgePill: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgePillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  viewAllText: {
    color: "#C2410C",
    fontSize: 12,
    fontWeight: "700",
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#9A3412",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#7C2D12",
    lineHeight: 17,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    gap: 5,
  },
  actionTextCol: {
    flex: 1,
  },
  actionBtnPrimary: {
    backgroundColor: "#EA580C",
  },
  actionBtnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
  },
  actionSubTextPrimary: {
    color: "#FFEDD5",
    fontSize: 9,
    fontWeight: "600",
  },
  actionBtnSecondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  actionBtnSecondaryText: {
    color: "#9A3412",
    fontSize: 11.5,
    fontWeight: "800",
  },
  actionSubTextSecondary: {
    color: "#9A3412",
    fontSize: 9,
    fontWeight: "600",
  },
  actionBtnTertiary: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  actionBtnTertiaryText: {
    color: "#B45309",
    fontSize: 11.5,
    fontWeight: "800",
  },
  actionSubTextTertiary: {
    color: "#92400E",
    fontSize: 9,
    fontWeight: "600",
  },
  actionIcon: {
    fontSize: 18,
  },
});
