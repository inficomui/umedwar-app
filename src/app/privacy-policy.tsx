import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

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

        <Text style={styles.headerTitle}>गोपनीयता धोरण</Text>

        <View style={styles.headerPlaceholder} />
      </View>

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
        {/* Last Updated Tag */}
        <View style={styles.dateTagContainer}>
          <Text style={styles.dateTagText}>शेवटचे अद्यतन: 1 सप्टेंबर 2026</Text>
        </View>

        {/* Section 1 */}
        <View style={styles.policyCard}>
          <Text style={styles.policySectionTitle}>1. माहिती संकलन</Text>
          <Text style={styles.policyText}>
            आम्ही फक्त तुम्ही स्वेच्छेने दिलेली माहिती (नाव, मोबाईल नंबर, समस्या तपशील) संकलित करतो.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.policyCard}>
          <Text style={styles.policySectionTitle}>2. माहितीचा वापर</Text>
          <Text style={styles.policyText}>
            ही माहिती फक्त नागरिकांच्या समस्यांवर कार्यवाही करण्यासाठी वापरली जाते.
          </Text>
        </View>

        {/* Section 3 */}
        <View style={styles.policyCard}>
          <Text style={styles.policySectionTitle}>3. माहितीची सुरक्षा</Text>
          <Text style={styles.policyText}>
            तुमच्या माहितीची योग्य सुरक्षा केली जाते. तुमची वैयक्तिक माहिती तृतीय पक्षांशी शेअर केली जात नाही.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.policyCard}>
          <Text style={styles.policySectionTitle}>4. तुमचे अधिकार</Text>
          <Text style={styles.policyText}>
            तुम्ही कधीही तुमची माहिती अपडेट किंवा डिलीट करण्याची विनंती करू शकता.
          </Text>
        </View>
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

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  dateTagContainer: {
    marginBottom: 4,
  },
  dateTagText: {
    fontSize: 12.5,
    color: "#4B5563",
    fontWeight: "700",
  },
  policyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  policySectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
  },
  policyText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 22,
  },
});
