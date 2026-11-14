import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { authApi } from "../services/authApi";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmationWord, setConfirmationWord] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Initial Warning Alert
  const promptInitialConfirmation = () => {
    Alert.alert(
      "खाते हटवा (Delete Account)",
      "तुमचे खाते कायमचे हटवायचे आहे का? तुमचे नाव, मोबाईल क्रमांक आणि सर्व नोंदी प्रणालीतून काढून टाकल्या जातील.\n\nAre you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "रद्द करा (Cancel)", style: "cancel" },
        {
          text: "पुढे जा (Proceed)",
          style: "destructive",
          onPress: () => setModalVisible(true),
        },
      ]
    );
  };

  // Step 2: Final API Execution & Data Cleanup
  const executeAccountDeletion = async () => {
    if (confirmationWord.trim().toUpperCase() !== "DELETE") {
      Alert.alert(
        "पुष्टी आवश्यक (Confirmation Required)",
        'कृपया खात्री करण्यासाठी "DELETE" हा शब्द टाईप करा.\nPlease type "DELETE" to confirm.'
      );
      return;
    }

    if (!password.trim()) {
      Alert.alert(
        "पासवर्ड आवश्यक (Password Required)",
        "खाते हटवण्यासाठी पासवर्ड प्रविष्ट करणे अनिवार्य आहे.\nPlease enter your account password to proceed."
      );
      return;
    }

    try {
      setLoading(true);

      // Call authApi which connects to https://backend.misachinmalik.in/auth/delete-account
      const result = await authApi.deleteAccount({
        password: password.trim(),
        confirm: true,
        reason: "Mobile citizen requested account deletion",
      });

      setLoading(false);

      if (!result.success) {
        // DO NOT show success! DO NOT clear local session! Abort operation and show exact error
        Alert.alert(
          "खाते हटवता आले नाही (Operation Aborted)",
          result.error || "सर्व्हरवरून खाते हटवता आले नाही. कृपया पुन्हा प्रयत्न करा.",
          [{ text: "समजले (OK)" }]
        );
        return;
      }

      setModalVisible(false);
      setPassword("");
      setConfirmationWord("");

      // Show success alert only when backend strictly confirms deletion
      Alert.alert(
        "खाते हटवले (Account Deleted)",
        "तुमचे खाते व सर्व वैयक्तिक माहिती कायमस्वरूपी हटवण्यात आली आहे.\nYour account and all associated personal records have been permanently deleted.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/home");
            },
          },
        ]
      );
    } catch (err: any) {
      setLoading(false);
      Alert.alert(
        "त्रुटी (Error - Operation Aborted)",
        err.message || "काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा."
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
              router.replace("/settings");
            }
          }}
          activeOpacity={0.85}
        >
          <Icon source="arrow-left" size={22} color="#E05300" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>खाते हटवा (Delete Account)</Text>

        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Badge */}
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>🛡️ Google Play Data Safety Compliance</Text>
        </View>

        <Text style={styles.mainTitle}>खाते व डेटा हटवा</Text>
        <Text style={styles.subTitle}>Delete Account & Personal Data</Text>

        {/* Informational Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>⚠️ काय हटवले जाईल? (What will be deleted?)</Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>वैयक्तिक माहिती:</Text> तुमचे नाव, मोबाईल क्रमांक, ईमेल व प्रभागाचा तपशील. (Profile & Registration Data)
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>पुश नोटिफिकेशन्स:</Text> तुमच्या मोबाईलचे सर्व FCM डिव्हाइस टोकन्स कायमचे काढले जातील. (Push Device Tokens)
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>तक्रार नोंदी:</Text> तुमच्या तक्रारींमधील तुमचा वैयक्तिक संपर्क तपशील पूर्णपणे नष्ट केला जाईल. (Scrubbed PII)
            </Text>
          </View>
        </View>

        {/* Warning Callout */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>कायमस्वरूपी कृती (Permanent Action)</Text>
          <Text style={styles.warningText}>
            एकदा खाते हटवल्यानंतर ते पुन्हा सुरू करता येणार नाही. तुम्हाला पुन्हा नवीन नोंदणी करावी लागेल.
          </Text>
        </View>

        {/* Trigger Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={promptInitialConfirmation}
          activeOpacity={0.85}
        >
          <Text style={styles.deleteButtonText}>🗑️ खाते कायमचे हटवा (Delete Account)</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          सदर प्रक्रिया गुगल प्ले डेटा सुरक्षा नियमांनुसार अधिकृत आहे.
        </Text>
      </ScrollView>

      {/* ─── FINAL CONFIRMATION MODAL ────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!loading) {
            setModalVisible(false);
            setPassword("");
            setConfirmationWord("");
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>अंतिम पुष्टी (Final Confirmation)</Text>
            <Text style={styles.modalDesc}>
              खाते हटवण्यासाठी खालील चौकटीत <Text style={styles.bold}>DELETE</Text> हा शब्द टाईप करा आणि आपला चालू पासवर्ड टाका:
            </Text>

            {/* Type DELETE confirmation */}
            <Text style={styles.inputLabel}>पुष्टी शब्द (Confirmation) *</Text>
            <TextInput
              style={styles.input}
              placeholder='Type "DELETE" here'
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              value={confirmationWord}
              onChangeText={setConfirmationWord}
              editable={!loading}
            />

            {/* Required Password confirmation */}
            <Text style={styles.inputLabel}>पासवर्ड (आवश्यक / Password Required) *</Text>
            <TextInput
              style={styles.input}
              placeholder="तुमचा पासवर्ड प्रविष्ट करा *"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />

            {/* Modal Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={() => {
                  setModalVisible(false);
                  setPassword("");
                  setConfirmationWord("");
                }}
                disabled={loading}
              >
                <Text style={styles.cancelBtnText}>रद्द करा (Cancel)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.dangerBtn]}
                onPress={executeAccountDeletion}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.dangerBtnText}>हटवा (Confirm)</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 16,
    fontWeight: "800",
  },
  headerPlaceholder: {
    width: 38,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  badgeContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    color: "#EA580C",
    fontWeight: "700",
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },
  subTitle: {
    fontSize: 13.5,
    color: "#64748B",
    marginBottom: 20,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 12,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  bulletDot: {
    fontSize: 16,
    color: "#EA580C",
    marginRight: 8,
    marginTop: -2,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  bold: {
    fontWeight: "700",
    color: "#0F172A",
  },
  warningBox: {
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#991B1B",
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: "#7F1D1D",
    lineHeight: 18,
  },
  deleteButton: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  footerNote: {
    textAlign: "center",
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 16,
    lineHeight: 16,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 14,
    backgroundColor: "#F8FAFC",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#F1F5F9",
  },
  cancelBtnText: {
    color: "#475569",
    fontWeight: "700",
    fontSize: 13,
  },
  dangerBtn: {
    backgroundColor: "#DC2626",
  },
  dangerBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
});
