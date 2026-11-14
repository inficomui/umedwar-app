import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Linking,
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
          <Text style={styles.dateTagText}>शेवटचे अद्यतन: 12 ऑक्टोबर 2026</Text>
        </View>

        {/* Non-Government Affiliation Card */}
        <View style={[styles.policyCard, { borderColor: "#FED7AA", backgroundColor: "#FFFBEB" }]}>
          <Text style={[styles.policySectionTitle, { color: "#C2410C" }]}>
            महत्त्वाची सूचना: शासकीय अस्वीकरण (Government Disclaimer)
          </Text>
          <Text style={[styles.policyText, { color: "#78350F" }]}>
            हे ॲप्लिकेशन कोणत्याही सरकारी विभाग, शासन किंवा शासकीय संस्थेचे प्रतिनिधित्व करत नाही. हे सचिन मलिक यांच्या जनसंपर्क कार्यालयाचे स्वतंत्र ॲप असून नागरी समस्या नोंदणी व जनसंवादासाठी आहे.
          </Text>
          <Text style={[styles.policyText, { fontSize: 11.5, color: "#92400E", marginTop: 4 }]}>
            This application does not represent any government entity. Government schemes information is for civic awareness sourced from official portals (e.g. maharashtra.gov.in / india.gov.in).
          </Text>
        </View>

        {/* Section 1 */}
        <View style={styles.policyCard}>
          <Text style={styles.policySectionTitle}>1. प्रस्तावना (Introduction)</Text>
          <Text style={styles.policyText}>
            हे ॲप्लिकेशन ("सचिन मलिक - Sachin Malik") नागरिकांना त्यांच्या समस्या नोंदवण्यासाठी, परिसरातील विकासकामे, अद्यतने आणि कार्यक्रमांविषयी माहिती मिळवण्यासाठी तयार करण्यात आले आहे. आम्ही तुमच्या वैयक्तिक गोपनीयतेचा आदर करतो आणि तुमचा डेटा सुरक्षित ठेवण्यास वचनबद्ध आहोत.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.policyCard}>
          <Text style={styles.policySectionTitle}>2. गोळा केली जाणारी माहिती (Information We Collect)</Text>
          <Text style={styles.policyText}>
            • वैयक्तिक माहिती: नाव, मोबाईल नंबर, विधानसभा/प्रभाग माहिती (नोंदणी व समस्या पाठवण्यासाठी).{"\n"}
            • नागरी समस्या तपशील: समस्येचे वर्णन, पत्ता/स्थान, आणि समस्येचे फोटो.{"\n"}
            • डिव्हाइस माहिती: ॲप नोटिफिकेशन पाठवण्यासाठी डिव्हाइस टोकन (FCM).
          </Text>
        </View>

        {/* Section 3 */}
        <View style={styles.policyCard}>
          <Text style={styles.policySectionTitle}>3. परवानग्या (App Permissions)</Text>
          <Text style={styles.policyText}>
            • कॅमेरा व फोटो गॅलरी: नागरी समस्येचा प्रत्यक्ष फोटो काढण्यासाठी किंवा गॅलरीतून फोटो अपलोड करण्यासाठी परवानग्या मागितल्या जातात.{"\n"}
            • सूचना (Notifications): समस्या निवारण स्थिती, ताजी अद्यतने व कार्यक्रमांची माहिती तात्काळ देण्यासाठी.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.policyCard}>
          <Text style={styles.policySectionTitle}>4. माहितीचा वापर (How We Use Information)</Text>
          <Text style={styles.policyText}>
            • नोंदवलेल्या तक्रारींचे निवारण करण्यासाठी व संबंधित प्रशासकीय/कार्यकर्त्यांच्या टीमकडे पाठवण्यासाठी.{"\n"}
            • वापरकर्त्याला तक्रारीच्या स्थितीबद्दल अपडेट पाठवण्यासाठी.{"\n"}
            • परिसरातील महत्त्वाच्या घडामोडी व उपक्रमांविषयी नागरिकांना माहिती देण्यासाठी.
          </Text>
        </View>

        {/* Section 5 */}
        <View style={styles.policyCard}>
          <Text style={styles.policySectionTitle}>5. डेटा सुरक्षा व गोपनीयता (Data Security & Sharing)</Text>
          <Text style={styles.policyText}>
            आम्ही तुमची वैयक्तिक माहिती कोणत्याही व्यावसायिक हेतूसाठी विकत नाही, भाड्याने देत नाही किंवा तृतीय पक्षांना शेअर करत नाही. संकलित डेटा सुरक्षित सर्व्हरवर एन्क्रिप्टेड स्वरूपात साठवला जातो.
          </Text>
        </View>

        {/* Section 6 */}
        <View style={styles.policyCard}>
          <Text style={styles.policySectionTitle}>6. तुमचे अधिकार व डेटा हटवणे (User Rights & Data Deletion)</Text>
          <Text style={styles.policyText}>
            वापरकर्त्यांना त्यांच्या प्रोफाइलमधील माहिती पाहण्याचा, अपडेट करण्याचा आणि खाते किंवा डेटा हटवण्याची (Delete Request) विनंती करण्याचा पूर्ण अधिकार आहे. यासाठी तुम्ही संपर्क पर्यायाद्वारे आमच्याशी संपर्क साधू शकता.
          </Text>
        </View>

        {/* Section 7 */}
        <View style={styles.policyCard}>
          <Text style={styles.policySectionTitle}>7. संपर्क (Contact Us)</Text>
          <Text style={styles.policyText}>
            गोपनीयता धोरणाबाबत काही प्रश्न किंवा तक्रारी असल्यास कृपया आमच्याशी संपर्क साधा:{"\n"}
            ईमेल: contact@sachinmalik.com{"\n"}
            वेबसाइट: www.sachinmalik.com
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
