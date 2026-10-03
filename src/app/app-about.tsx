import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Share,
  RefreshControl,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign } from "../context/CampaignContext";

export default function AppAboutScreen() {
  const router = useRouter();
  const { candidate, party } = useCampaign();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: `${candidate.name} अधिकृत ॲप - ${candidate.slogan} ${candidate.tagline}! आपल्या परिसरातील समस्या थेट लोकप्रतिनिधींपर्यंत पोहोचवा.`,
      });
    } catch (error) {
      // ignore
    }
  };

  const handleRateApp = () => {
    Alert.alert("रेट करा", "गुगल प्ले स्टोअरवर लवकरच उपलब्ध होईल. आपले सहकार्य मोलाचे आहे!");
  };

  const handleFeedback = () => {
    Alert.alert(
      "अभिप्राय नोंदवा",
      "आपला बहुमूल्य अभिप्राय आमच्यासाठी अत्यंत महत्त्वाचा आहे.\nसंपर्क: संपर्क स्क्रीनवर जाऊन मेसेज पाठवा.",
      [
        { text: "रद्द करा", style: "cancel" },
        { text: "संपर्क करा", onPress: () => router.push("/contact") },
      ]
    );
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

        <Text style={styles.headerTitle}>ॲपबद्दल</Text>

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
        {/* Center Logo & Slogan Header */}
        <View style={styles.logoSection}>
          <View style={styles.logoRing}>
            <Image
              source={typeof party.logo === "string" ? { uri: party.logo } : party.logo}
              style={styles.logoImg}
              contentFit="cover"
            />
          </View>

          <Text style={styles.partySlogan}>{party.name} {party.faction}</Text>
          <Text style={styles.partySloganSub}>{candidate.slogan} • {candidate.tagline}</Text>

          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>आवृत्ती 1.0.0</Text>
          </View>
        </View>

        {/* Narrative Description Card */}
        <View style={styles.descCard}>
          <Text style={styles.descText}>
            {candidate.name} ({candidate.constituency}) यांच्या अधिकृत ॲपच्या माध्यमातून नागरिक आणि जनप्रतिनिधी यांच्यात थेट संवाद साधण्यासाठी, परिसरातील विकासकामे व समस्यांवर तत्परतेने कार्यवाही करण्यासाठी हे ॲप विकसित करण्यात आले आहे.
          </Text>
        </View>

        {/* Action Menu List */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleRateApp}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Icon source="star-outline" size={20} color="#EA580C" />
              <Text style={styles.menuTitle}>रेट करा</Text>
            </View>
            <Icon source="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/contact")}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Icon source="email-outline" size={20} color="#EA580C" />
              <Text style={styles.menuTitle}>आमच्याशी संपर्क करा</Text>
            </View>
            <Icon source="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleFeedback}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Icon source="message-text-outline" size={20} color="#EA580C" />
              <Text style={styles.menuTitle}>अभिप्राय द्या</Text>
            </View>
            <Icon source="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={handleShareApp}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Icon source="share-variant-outline" size={20} color="#EA580C" />
              <Text style={styles.menuTitle}>शेअर करा</Text>
            </View>
            <Icon source="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Developer Info Card */}
        <View style={styles.devCard}>
          {/* Header */}
          <View style={styles.devCardHeader}>
            <View style={styles.devCardIconWrap}>
              <Icon source="code-braces" size={16} color="#EA580C" />
            </View>
            <Text style={styles.devCardHeaderText}>Developed with ❤️</Text>
          </View>

          {/* Divider */}
          <View style={styles.devDivider} />

          {/* Company Row */}
          <TouchableOpacity
            style={styles.devRow}
            onPress={() => Linking.openURL("https://www.inficomsolutions.com/")}
            activeOpacity={0.75}
          >
            <View style={styles.devRowLeft}>
              <View style={[styles.devRowIcon, { backgroundColor: "#EFF6FF" }]}>
                <Icon source="office-building" size={15} color="#3B82F6" />
              </View>
              <View style={styles.devRowText}>
                <Text style={styles.devRowLabel}>Company</Text>
                <Text style={styles.devRowValue}>Inficom AI Solutions</Text>
              </View>
            </View>
            <Icon source="open-in-new" size={14} color="#3B82F6" />
          </TouchableOpacity>

          {/* Developer Row */}
          <TouchableOpacity
            style={[styles.devRow, { borderBottomWidth: 0 }]}
            onPress={() => Linking.openURL("https://someshwarholkar.vercel.app/")}
            activeOpacity={0.75}
          >
            <View style={styles.devRowLeft}>
              <View style={[styles.devRowIcon, { backgroundColor: "#F0FDF4" }]}>
                <Icon source="account-circle" size={15} color="#22C55E" />
              </View>
              <View style={styles.devRowText}>
                <Text style={styles.devRowLabel}>Developer</Text>
                <Text style={styles.devRowValue}>Someshwar Holkar</Text>
              </View>
            </View>
            <Icon source="open-in-new" size={14} color="#22C55E" />
          </TouchableOpacity>
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
    gap: 16,
    alignItems: "center",
  },

  // Logo Section
  logoSection: {
    alignItems: "center",
    marginTop: 10,
  },
  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#FBBF24",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 14,
  },
  logoImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  partySlogan: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1F2937",
    textAlign: "center",
  },
  partySloganSub: {
    fontSize: 18,
    fontWeight: "900",
    color: "#EA580C",
    textAlign: "center",
    marginBottom: 8,
  },
  versionBadge: {
    backgroundColor: "#FFEDD5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  versionText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#C2410C",
  },

  // Desc Card
  descCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1.5,
  },
  descText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 22,
    textAlign: "center",
  },

  // Menu List
  menuContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1.5,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },

  // Developer Info Card
  devCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1.5,
  },
  devCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  devCardIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  devCardHeaderText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#374151",
    letterSpacing: 0.3,
  },
  devDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 4,
  },
  devRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  devRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  devRowIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  devRowText: {
    justifyContent: "center",
  },
  devRowLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    marginBottom: 1,
  },
  devRowValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F2937",
  },
});
