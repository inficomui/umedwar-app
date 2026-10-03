import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign } from "../context/CampaignContext";
import { authApi } from "../services/authApi";
import { toast } from "../components/Toast";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { candidate } = useCampaign();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Step 1: Mobile or Email
  const [mobileOrEmail, setMobileOrEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Step 2: OTP
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const otpInputsRef = useRef<Array<TextInput | null>>([]);

  // Step 3: New Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Success Modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: any;
    if (currentStep === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [currentStep, timer]);

  // Handle Step 1 -> Step 2
  const handleSendOtp = async () => {
    const cleanInput = mobileOrEmail.trim();
    if (!cleanInput) {
      toast.warning("कृपया आपला नोंदणीकृत मोबाईल नंबर किंवा ईमेल टाका.", "माहिती आवश्यक");
      return;
    }
    if (cleanInput.replace(/\D/g, "").length < 10 && !cleanInput.includes("@")) {
      toast.warning("कृपया वैध १० अंकी मोबाईल नंबर किंवा ईमेल प्रविष्ट करा.", "अवैध माहिती");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.requestForgotPasswordOtp(cleanInput);
      setIsLoading(false);

      if (res.success && res.data) {
        setTimer(30);
        setCanResend(false);
        setOtpValues(["", "", "", "", "", ""]);
        setCurrentStep(2);

        const devHint = res.data.devOtpCode ? ` (डेमो OTP: ${res.data.devOtpCode})` : "";
        toast.success(`${res.data.message}${devHint}`, "OTP पाठवला आहे!");
      } else {
        toast.error(res.error || "OTP पाठवता आला नाही.", "सर्व्हर त्रुटी");
      }
    } catch (err: any) {
      setIsLoading(false);
      toast.error(err.message || "सर्व्हरशी संपर्क होऊ शकला नाही.", "सर्व्हर त्रुटी");
    }
  };

  // Handle OTP digit change & auto-advance
  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    // Auto-advance to next box
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    try {
      const res = await authApi.requestForgotPasswordOtp(mobileOrEmail.trim());
      setIsLoading(false);
      if (res.success && res.data) {
        setTimer(30);
        setCanResend(false);
        setOtpValues(["", "", "", "", "", ""]);
        const devHint = res.data.devOtpCode ? ` (डेमो OTP: ${res.data.devOtpCode})` : "";
        toast.success(`${res.data.message}${devHint}`, "OTP पुन्हा पाठवला!");
      } else {
        toast.error(res.error || "OTP पाठवता आला नाही.", "सर्व्हर त्रुटी");
      }
    } catch (err: any) {
      setIsLoading(false);
      toast.error(err.message || "सर्व्हरशी संपर्क होऊ शकला नाही.", "सर्व्हर त्रुटी");
    }
  };

  // Handle Step 2 -> Step 3
  const handleVerifyOtp = async () => {
    const enteredOtp = otpValues.join("");
    if (enteredOtp.length < 6) {
      toast.warning("कृपया सर्व ६ अंकी OTP प्रविष्ट करा.", "अपूर्ण OTP");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.verifyForgotPasswordOtp(mobileOrEmail.trim(), enteredOtp);
      setIsLoading(false);

      if (res.success && res.data?.resetToken) {
        setResetToken(res.data.resetToken);
        setCurrentStep(3);
        toast.success("OTP पडताळणी यशस्वी! कृपया नवीन पासवर्ड सेट करा.", "सत्यापित");
      } else {
        toast.error(res.error || "अवैध किंवा कालबाह्य OTP.", "पडताळणी अयशस्वी");
      }
    } catch (err: any) {
      setIsLoading(false);
      toast.error(err.message || "सर्व्हरशी संपर्क होऊ शकला नाही.", "सर्व्हर त्रुटी");
    }
  };

  // Handle Step 3: Change Password
  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast.warning("कृपया नवीन पासवर्ड प्रविष्ट करा.", "पासवर्ड आवश्यक");
      return;
    }
    if (newPassword.length < 6) {
      toast.warning("पासवर्ड किमान ६ अक्षरांचा असणे आवश्यक आहे.", "लहान पासवर्ड");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning("नवीन पासवर्ड आणि पुष्टीकरण पासवर्ड एकसारखे असावेत.", "पासवर्ड जुळत नाही");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.resetPassword(resetToken, newPassword);
      setIsLoading(false);

      if (res.success) {
        toast.success("आपला पासवर्ड यशस्वीरीत्या बदलण्यात आला आहे!", "पासवर्ड बदलला");
        setSuccessModalVisible(true);
      } else {
        toast.error(res.error || "पासवर्ड बदलता आला नाही.", "सर्व्हर त्रुटी");
      }
    } catch (err: any) {
      setIsLoading(false);
      toast.error(err.message || "सर्व्हरशी संपर्क होऊ शकला नाही.", "सर्व्हर त्रुटी");
    }
  };

  const getMaskedIdentifier = () => {
    if (mobileOrEmail.includes("@")) {
      const parts = mobileOrEmail.split("@");
      return `${parts[0].slice(0, 2)}***@${parts[1]}`;
    }
    const clean = mobileOrEmail.replace(/\D/g, "");
    if (clean.length >= 10) {
      return `+91 ${clean.slice(0, 2)}*** ***${clean.slice(-2)}`;
    }
    return mobileOrEmail;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#C2410C" />

      {/* Top Saffron Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (currentStep === 3) setCurrentStep(2);
            else if (currentStep === 2) setCurrentStep(1);
            else router.back();
          }}
          activeOpacity={0.8}
        >
          <Icon source="arrow-left" size={22} color="#E05300" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>पासवर्ड बदला</Text>

        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => router.push("/login")}
          activeOpacity={0.8}
        >
          <Text style={styles.helpButtonText}>लॉगिन</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#EA580C", "#FF6F00"]}
              tintColor="#EA580C"
            />
          }
        >
          {/* 3-Step Visual Progress Stepper Card */}
          <View style={styles.stepperCard}>
            {/* Step 1 */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= 1 ? styles.stepCircleActive : styles.stepCircleInactive,
                ]}
              >
                {currentStep > 1 ? (
                  <Icon source="check" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={styles.stepNumberActive}>१</Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  currentStep >= 1 && styles.stepLabelActive,
                ]}
              >
                मोबाईल
              </Text>
            </View>

            {/* Connecting Line 1-2 */}
            <View
              style={[
                styles.stepConnector,
                currentStep >= 2 ? styles.stepConnectorActive : styles.stepConnectorInactive,
              ]}
            />

            {/* Step 2 */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= 2
                    ? styles.stepCircleActive
                    : styles.stepCircleInactive,
                ]}
              >
                {currentStep > 2 ? (
                  <Icon source="check" size={16} color="#FFFFFF" />
                ) : (
                  <Text
                    style={
                      currentStep >= 2
                        ? styles.stepNumberActive
                        : styles.stepNumberInactive
                    }
                  >
                    २
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  currentStep >= 2 && styles.stepLabelActive,
                ]}
              >
                OTP पडताळणी
              </Text>
            </View>

            {/* Connecting Line 2-3 */}
            <View
              style={[
                styles.stepConnector,
                currentStep >= 3 ? styles.stepConnectorActive : styles.stepConnectorInactive,
              ]}
            />

            {/* Step 3 */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= 3
                    ? styles.stepCircleActive
                    : styles.stepCircleInactive,
                ]}
              >
                <Text
                  style={
                    currentStep >= 3
                      ? styles.stepNumberActive
                      : styles.stepNumberInactive
                  }
                >
                  ३
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  currentStep >= 3 && styles.stepLabelActive,
                ]}
              >
                नवीन पासवर्ड
              </Text>
            </View>
          </View>

          {/* ==================== STEP 1: ENTER MOBILE / EMAIL ==================== */}
          {currentStep === 1 && (
            <View style={styles.stepCard}>
              <View style={styles.stepIconCircle}>
                <Icon source="cellphone-key" size={32} color="#E05300" />
              </View>

              <Text style={styles.stepTitle}>मोबाईल नंबर किंवा ईमेल</Text>
              <Text style={styles.stepDescription}>
                आपला नोंदणीकृत मोबाईल नंबर किंवा ईमेल प्रविष्ट करा. आम्ही आपल्याला पासवर्ड रीसेट करण्यासाठी ६ अंकी OTP पडताळणी कोड पाठवू.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>मोबाईल नंबर / ईमेल</Text>
                <View style={styles.inputWrapper}>
                  <Icon source="phone" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="उदा. 9876543210"
                    placeholderTextColor="#9CA3AF"
                    value={mobileOrEmail}
                    onChangeText={setMobileOrEmail}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.demoTipBox}>
                <Icon source="information" size={16} color="#D97706" />
                <Text style={styles.demoTipText}>
                  परीक्षणासाठी कोणताही १० अंकी नंबर टाका (डेमो OTP: 123456).
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.85}
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>OTP पाठवा</Text>
                    <Icon source="arrow-right" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ==================== STEP 2: VERIFY OTP ==================== */}
          {currentStep === 2 && (
            <View style={styles.stepCard}>
              <View style={styles.stepIconCircle}>
                <Icon source="message-badge-outline" size={32} color="#E05300" />
              </View>

              <Text style={styles.stepTitle}>OTP पडताळणी</Text>
              <Text style={styles.stepDescription}>
                आम्ही खालील क्रमांकावर ६ अंकी पडताळणी कोड पाठवला आहे:
              </Text>

              <View style={styles.identifierPill}>
                <Text style={styles.identifierText}>{getMaskedIdentifier()}</Text>
                <TouchableOpacity
                  onPress={() => setCurrentStep(1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editIdentifierText}>बदला</Text>
                </TouchableOpacity>
              </View>

              {/* 6 OTP Boxes */}
              <View style={styles.otpRow}>
                {otpValues.map((digit, index) => (
                  <TextInput
                    key={index.toString()}
                    ref={(ref) => {
                      otpInputsRef.current[index] = ref;
                    }}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                    ]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(val) => handleOtpChange(val, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  />
                ))}
              </View>

              {/* Countdown / Resend */}
              <View style={styles.resendContainer}>
                {!canResend ? (
                  <Text style={styles.resendTimerText}>
                    पुन्हा कोड पाठवा ({timer} सेकंद)
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    activeOpacity={0.7}
                    style={styles.resendBtn}
                  >
                    <Icon source="refresh" size={16} color="#E05300" />
                    <Text style={styles.resendBtnText}>पुन्हा OTP पाठवा</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.85}
                onPress={handleVerifyOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>OTP सत्यापित करा</Text>
                    <Icon source="check" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ==================== STEP 3: NEW PASSWORD ==================== */}
          {currentStep === 3 && (
            <View style={styles.stepCard}>
              <View style={styles.stepIconCircle}>
                <Icon source="shield-lock-outline" size={32} color="#E05300" />
              </View>

              <Text style={styles.stepTitle}>नवीन पासवर्ड सेट करा</Text>
              <Text style={styles.stepDescription}>
                आपल्या खात्याच्या सुरक्षिततेसाठी नवीन आणि मजबूत पासवर्ड तयार करा.
              </Text>

              {/* New Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>नवीन पासवर्ड</Text>
                <View style={styles.inputWrapper}>
                  <Icon source="lock-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="किमान ६ अक्षरांचा पासवर्ड"
                    placeholderTextColor="#9CA3AF"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    activeOpacity={0.7}
                  >
                    <Icon
                      source={showNewPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>नवीन पासवर्ड पुन्हा टाका</Text>
                <View style={styles.inputWrapper}>
                  <Icon source="lock-check-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="पासवर्डची पुष्टी करा"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    activeOpacity={0.7}
                  >
                    <Icon
                      source={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Password Requirements Checklist */}
              <View style={styles.checklistCard}>
                <View style={styles.checkItem}>
                  <Icon
                    source={newPassword.length >= 6 ? "check-circle" : "checkbox-blank-circle-outline"}
                    size={16}
                    color={newPassword.length >= 6 ? "#16A34A" : "#9CA3AF"}
                  />
                  <Text style={styles.checkText}>किमान ६ अक्षरे असावीत</Text>
                </View>

                <View style={styles.checkItem}>
                  <Icon
                    source={
                      newPassword && newPassword === confirmPassword
                        ? "check-circle"
                        : "checkbox-blank-circle-outline"
                    }
                    size={16}
                    color={
                      newPassword && newPassword === confirmPassword
                        ? "#16A34A"
                        : "#9CA3AF"
                    }
                  />
                  <Text style={styles.checkText}>दोन्ही पासवर्ड जुळले पाहिजेत</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.85}
                onPress={handleChangePassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>पासवर्ड बदला व जतन करा</Text>
                    <Icon source="check-decagram" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* SUCCESS CONFIRMATION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconCircle}>
              <Icon source="check" size={38} color="#FFFFFF" />
            </View>

            <Text style={styles.successModalTitle}>पासवर्ड यशस्वीरित्या बदलला!</Text>
            <Text style={styles.successModalSubtitle}>
              आपला पासवर्ड बदलण्यात आला आहे. आता आपण नवीन पासवर्ड वापरून लॉगिन करू शकता.
            </Text>

            <TouchableOpacity
              style={styles.successDoneBtn}
              activeOpacity={0.85}
              onPress={() => {
                setSuccessModalVisible(false);
                router.replace("/login");
              }}
            >
              <Text style={styles.successDoneBtnText}>लॉगिन स्क्रीनवर जा</Text>
              <Icon source="arrow-right" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#C2410C",
  },
  topHeader: {
    backgroundColor: "#C2410C",
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
    elevation: 2,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  helpButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  helpButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },

  // 3-Step Progress Stepper
  stepperCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  stepItem: {
    alignItems: "center",
    gap: 6,
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    backgroundColor: "#E05300",
  },
  stepCircleInactive: {
    backgroundColor: "#E5E7EB",
  },
  stepNumberActive: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  stepNumberInactive: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "800",
  },
  stepLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  stepLabelActive: {
    color: "#E05300",
    fontWeight: "800",
  },
  stepConnector: {
    flex: 1,
    height: 2.5,
    marginHorizontal: 8,
    marginBottom: 20,
    borderRadius: 2,
  },
  stepConnectorActive: {
    backgroundColor: "#E05300",
  },
  stepConnectorInactive: {
    backgroundColor: "#E5E7EB",
  },

  // Step Form Card
  stepCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    alignItems: "center",
  },
  stepIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 18,
    paddingHorizontal: 10,
  },

  // Input Fields
  inputGroup: {
    width: "100%",
    gap: 6,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    height: "100%",
  },

  demoTipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    width: "100%",
    marginBottom: 18,
  },
  demoTipText: {
    fontSize: 11.5,
    color: "#92400E",
    fontWeight: "600",
    flex: 1,
  },

  // Identifier pill
  identifierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FED7AA",
    marginBottom: 18,
  },
  identifierText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#C2410C",
  },
  editIdentifierText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E05300",
    textDecorationLine: "underline",
  },

  // OTP Row
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 6,
    marginBottom: 16,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
  },
  otpBoxFilled: {
    borderColor: "#E05300",
    backgroundColor: "#FFFBEB",
  },

  resendContainer: {
    marginBottom: 20,
  },
  resendTimerText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#E05300",
  },

  // Checklist
  checklistCard: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    gap: 6,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
  },

  // Buttons
  primaryBtn: {
    width: "100%",
    backgroundColor: "#E05300",
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#E05300",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  successModalSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 10,
  },
  successDoneBtn: {
    width: "100%",
    backgroundColor: "#E05300",
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  successDoneBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
