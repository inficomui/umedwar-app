import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
  RefreshControl,
  Share,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign } from "../context/CampaignContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { refreshAppConfig } = useCampaign();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAppConfig();
    } finally {
      setRefreshing(false);
    }
  }, [refreshAppConfig]);

  // ── Notification Toggles ─────────────────────────────────
  const [issueNotif, setIssueNotif] = useState(true);
  const [newsNotif, setNewsNotif] = useState(true);
  const [eventNotif, setEventNotif] = useState(true);
  const [adminNotif, setAdminNotif] = useState(true);

  // ── Appearance ───────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(false);

  // ── Cache ────────────────────────────────────────────────
  const [cacheSize, setCacheSize] = useState("12.4 MB");

  // ── Handlers ─────────────────────────────────────────────
  const handleClearCache = () => {
    Alert.alert(
      "कॅशे साफ करायची आहे का?",
      `सध्याची कॅशे: ${cacheSize}\n\nसर्व तात्पुरत्या फाईल्स आणि इमेजेस साफ होतील. ॲप पुन्हा थोडा वेळ लोड होईल.`,
      [
        { text: "रद्द करा", style: "cancel" },
        {
          text: "साफ करा",
          style: "destructive",
          onPress: () => {
            setCacheSize("0 KB");
            Alert.alert(
              "✅ कॅशे साफ झाली",
              "ॲप कॅशे यशस्वीरीत्या साफ केली आहे. ॲप आता फ्रेश डेटा लोड करेल."
            );
          },
        },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message:
          "श्री. सचिन मलिक – शिवसेना अधिकृत उमेदवार, कोपरगाव!\n\nआपल्या परिसरातील समस्या थेट नोंदवा आणि प्रगती ट्रॅक करा.\n\nॲप डाउनलोड करा: https://play.google.com/store/apps/",
        title: "सचिन मलिक ॲप शेअर करा",
      });
    } catch {
      // ignore
    }
  };

  const handleRateApp = () => {
    Alert.alert(
      "ॲप रेट करा ⭐",
      "आपला अनुभव कसा आहे?\n\nगुगल प्ले स्टोअरवर ॲपला रेट करा आणि आपले मत नोंदवा.",
      [
        { text: "नंतर करा", style: "cancel" },
        {
          text: "आत्ता रेट करा",
          onPress: () =>
            Linking.openURL(
              "https://play.google.com/store/apps/"
            ).catch(() =>
              Alert.alert("त्रुटी", "Play Store उघडता आले नाही.")
            ),
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "लॉगआउट करायचे आहे का?",
      "तुम्ही खरोखर ॲपमधून बाहेर पडायचे आहे का?",
      [
        { text: "नाही", style: "cancel" },
        {
          text: "लॉगआउट करा",
          style: "destructive",
          onPress: () => {
            Alert.alert("लॉगआउट झाले", "तुम्ही सुरक्षितपणे बाहेर पडला आहात.");
            router.replace("/login");
          },
        },
      ]
    );
  };

  const handleDarkModeToggle = (val: boolean) => {
    setDarkMode(val);
    if (val) {
      Alert.alert(
        "डार्क मोड 🌙",
        "डार्क मोड लवकरच पूर्णपणे उपलब्ध होईल. सध्या आम्ही हे फीचर तयार करत आहोत.",
        [{ text: "ठीक आहे", onPress: () => setDarkMode(false) }]
      );
    }
  };

  // ─────────────────────────────────────────────────────────

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

        <Text style={styles.headerTitle}>सेटिंग्स</Text>

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
        {/* ═══════════════════════════════════════════════
            SECTION 1: सूचना (Notifications)
        ═══════════════════════════════════════════════ */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: "#FFF7ED" }]}>
              <Icon source="bell-outline" size={16} color="#EA580C" />
            </View>
            <Text style={styles.sectionHeader}>सूचना सेटिंग्स</Text>
          </View>

          {/* Issue Updates */}
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#FFEDD5" }]}>
                <Icon source="message-text-outline" size={16} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.rowTitle}>समस्या अपडेट</Text>
                <Text style={styles.rowSubtext}>तक्रारींच्या प्रगतीबद्दल सूचना</Text>
              </View>
            </View>
            <Switch
              value={issueNotif}
              onValueChange={setIssueNotif}
              trackColor={{ false: "#D1D5DB", true: "#FED7AA" }}
              thumbColor={issueNotif ? "#EA580C" : "#9CA3AF"}
            />
          </View>

          {/* News Updates */}
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#DBEAFE" }]}>
                <Icon source="bullhorn-outline" size={16} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.rowTitle}>बातम्या व घडामोडी</Text>
                <Text style={styles.rowSubtext}>नवीन बातम्या प्रकाशित झाल्यावर</Text>
              </View>
            </View>
            <Switch
              value={newsNotif}
              onValueChange={setNewsNotif}
              trackColor={{ false: "#D1D5DB", true: "#FED7AA" }}
              thumbColor={newsNotif ? "#EA580C" : "#9CA3AF"}
            />
          </View>

          {/* Events */}
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#F0FDF4" }]}>
                <Icon source="calendar-star" size={16} color="#22C55E" />
              </View>
              <View>
                <Text style={styles.rowTitle}>कार्यक्रम सूचना</Text>
                <Text style={styles.rowSubtext}>येणाऱ्या सभा, मेळावे व कार्यक्रम</Text>
              </View>
            </View>
            <Switch
              value={eventNotif}
              onValueChange={setEventNotif}
              trackColor={{ false: "#D1D5DB", true: "#FED7AA" }}
              thumbColor={eventNotif ? "#EA580C" : "#9CA3AF"}
            />
          </View>

          {/* Admin Custom Notifications */}
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#F5F3FF" }]}>
                <Icon source="bell-ring-outline" size={16} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.rowTitle}>प्रशासक संदेश</Text>
                <Text style={styles.rowSubtext}>कार्यालयाकडून विशेष सूचना</Text>
              </View>
            </View>
            <Switch
              value={adminNotif}
              onValueChange={setAdminNotif}
              trackColor={{ false: "#D1D5DB", true: "#FED7AA" }}
              thumbColor={adminNotif ? "#EA580C" : "#9CA3AF"}
            />
          </View>
        </View>

        {/* ═══════════════════════════════════════════════
            SECTION 2: देखावा (Appearance)
        ═══════════════════════════════════════════════ */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: "#F5F3FF" }]}>
              <Icon source="palette-outline" size={16} color="#7C3AED" />
            </View>
            <Text style={styles.sectionHeader}>देखावा</Text>
          </View>

          {/* Dark / Light Mode */}
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.rowIconWrap,
                  { backgroundColor: darkMode ? "#1E1B4B" : "#F3F4F6" },
                ]}
              >
                <Icon
                  source={darkMode ? "weather-night" : "white-balance-sunny"}
                  size={16}
                  color={darkMode ? "#A78BFA" : "#F59E0B"}
                />
              </View>
              <View>
                <Text style={styles.rowTitle}>
                  {darkMode ? "डार्क मोड" : "लाईट मोड"}
                </Text>
                <Text style={styles.rowSubtext}>
                  {darkMode ? "डार्क थीम सक्रिय आहे" : "लाईट थीम सक्रिय आहे (डिफॉल्ट)"}
                </Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: "#D1D5DB", true: "#C4B5FD" }}
              thumbColor={darkMode ? "#7C3AED" : "#9CA3AF"}
            />
          </View>
        </View>

        {/* ═══════════════════════════════════════════════
            SECTION 3: खाते व सुरक्षा (Account)
        ═══════════════════════════════════════════════ */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: "#FFF1F2" }]}>
              <Icon source="shield-lock-outline" size={16} color="#E11D48" />
            </View>
            <Text style={styles.sectionHeader}>खाते व सुरक्षा</Text>
          </View>

          {/* Login */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push("/login")}
            activeOpacity={0.75}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#DBEAFE" }]}>
                <Icon source="account-lock-outline" size={16} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.rowTitle}>नागरिक लॉगिन</Text>
                <Text style={styles.rowSubtext}>OTP द्वारे खात्यात प्रवेश करा</Text>
              </View>
            </View>
            <Icon source="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Password Update with OTP */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={() => router.push("/forgot-password")}
            activeOpacity={0.75}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#FFEDD5" }]}>
                <Icon source="key-change" size={16} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.rowTitle}>पासवर्ड बदला</Text>
                <Text style={styles.rowSubtext}>OTP पडताळणीसह ३-टप्पे प्रक्रिया</Text>
              </View>
            </View>
            <View style={styles.otpBadge}>
              <Text style={styles.otpBadgeText}>OTP</Text>
            </View>
            <Icon source="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════
            SECTION 4: ॲप व समर्थन (App & Support)
        ═══════════════════════════════════════════════ */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: "#F0FDF4" }]}>
              <Icon source="apps" size={16} color="#16A34A" />
            </View>
            <Text style={styles.sectionHeader}>ॲप व समर्थन</Text>
          </View>

          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push("/privacy-policy")}
            activeOpacity={0.75}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#F3F4F6" }]}>
                <Icon source="file-document-outline" size={16} color="#4B5563" />
              </View>
              <Text style={styles.rowTitle}>गोपनीयता धोरण</Text>
            </View>
            <Icon source="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Help & Support */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push("/contact")}
            activeOpacity={0.75}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#DBEAFE" }]}>
                <Icon source="lifebuoy" size={16} color="#2563EB" />
              </View>
              <Text style={styles.rowTitle}>मदत व समर्थन</Text>
            </View>
            <Icon source="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Share App */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleShareApp}
            activeOpacity={0.75}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#F0FDF4" }]}>
                <Icon source="share-variant-outline" size={16} color="#16A34A" />
              </View>
              <View>
                <Text style={styles.rowTitle}>ॲप शेअर करा</Text>
                <Text style={styles.rowSubtext}>मित्रांना व कार्यकर्त्यांना पाठवा</Text>
              </View>
            </View>
            <Icon source="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Rate & Feedback */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={handleRateApp}
            activeOpacity={0.75}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#FFFBEB" }]}>
                <Icon source="star-outline" size={16} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.rowTitle}>रेट करा व अभिप्राय द्या</Text>
                <Text style={styles.rowSubtext}>Play Store वर रेटिंग द्या</Text>
              </View>
            </View>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Icon key={s} source="star" size={12} color="#F59E0B" />
              ))}
            </View>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════
            SECTION 5: स्टोरेज व लॉगआउट
        ═══════════════════════════════════════════════ */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: "#FFF1F2" }]}>
              <Icon source="cog-outline" size={16} color="#DC2626" />
            </View>
            <Text style={styles.sectionHeader}>स्टोरेज व खाते</Text>
          </View>

          {/* Clear Cache */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleClearCache}
            activeOpacity={0.75}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#F3F4F6" }]}>
                <Icon source="delete-sweep-outline" size={16} color="#4B5563" />
              </View>
              <View>
                <Text style={styles.rowTitle}>कॅशे साफ करा</Text>
                <Text style={styles.rowSubtext}>तात्पुरत्या फाईल्स आणि इमेजेस</Text>
              </View>
            </View>
            <View style={styles.cacheBadge}>
              <Text style={styles.cacheBadgeText}>{cacheSize}</Text>
            </View>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={handleLogout}
            activeOpacity={0.75}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconWrap, { backgroundColor: "#FEE2E2" }]}>
                <Icon source="logout" size={16} color="#DC2626" />
              </View>
              <Text style={[styles.rowTitle, { color: "#DC2626" }]}>लॉगआउट</Text>
            </View>
            <Icon source="chevron-right" size={20} color="#FCA5A5" />
          </TouchableOpacity>
        </View>

        {/* App Version Footer */}
        <View style={styles.versionFooter}>
          <Text style={styles.versionText}>सचिन मलिक ॲप — आवृत्ती 1.0.0</Text>
          <Text style={styles.versionSubtext}>Inficom AI Solutions</Text>
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

  // Header
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

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
    gap: 14,
  },

  // Section Card
  sectionWrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1.5,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Row
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#1F2937",
  },
  rowSubtext: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 1,
    fontWeight: "500",
  },

  // Badges / indicators
  otpBadge: {
    backgroundColor: "#FFEDD5",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
  },
  otpBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EA580C",
  },
  cacheBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cacheBadgeText: {
    fontSize: 11.5,
    color: "#6B7280",
    fontWeight: "700",
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },

  // Footer
  versionFooter: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 3,
  },
  versionText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  versionSubtext: {
    fontSize: 10.5,
    color: "#C4B5FD",
    fontWeight: "700",
  },
});
