import React, { useState } from "react";
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
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign } from "../context/CampaignContext";
import { authApi } from "../services/authApi";
import { toast } from "../components/Toast";

export default function LoginScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { candidate, party, refreshAppConfig, login } = useCampaign();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAppConfig();
    } catch (e) {
      console.log("Error refreshing app config:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [mobileOrEmail, setMobileOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // OTP Login Mode specific states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);

  const handlePasswordLogin = async () => {
    const trimmedInput = mobileOrEmail.trim();
    if (!trimmedInput) {
      toast.warning("कृपया आपला मोबाईल नंबर किंवा ईमेल प्रविष्ट करा.", "माहिती आवश्यक");
      return;
    }
    if (trimmedInput.replace(/\D/g, "").length < 10 && !trimmedInput.includes("@")) {
      toast.warning("कृपया वैध १० अंकी मोबाईल नंबर किंवा ईमेल टाका.", "अवैध माहिती");
      return;
    }
    if (!password.trim()) {
      toast.warning("कृपया आपला पासवर्ड प्रविष्ट करा.", "पासवर्ड आवश्यक");
      return;
    }
    if (password.length < 6) {
      toast.warning("पासवर्ड किमान ६ अक्षरांचा असणे आवश्यक आहे.", "लहान पासवर्ड");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.loginWithPassword(trimmedInput, password);
      setIsLoading(false);

      if (res.success && res.data) {
        await login(res.data.user);
        toast.success(`स्वागत आहे, ${res.data.user.name}!`, "लॉगिन यशस्वी!");
        Alert.alert(
          "लॉगिन यशस्वी!",
          `स्वागत आहे ${res.data.user.name}! ${candidate.name} यांच्या अधिकृत ॲपमध्ये आपले मनःपूर्वक स्वागत.`,
          [
            {
              text: "पुढे जा",
              onPress: () => {
                if (returnTo) {
                  router.replace(returnTo as any);
                } else {
                  router.replace("/home");
                }
              },
            },
          ]
        );
      } else {
        toast.error(res.error || "कृपया आपले क्रेडेंशियल्स तपासा.", "लॉगिन अयशस्वी");
      }
    } catch (err: any) {
      setIsLoading(false);
      toast.error(err.message || "सर्व्हरशी संपर्क होऊ शकला नाही.", "सर्व्हर त्रुटी");
    }
  };

  const handleSendLoginOtp = async () => {
    const cleanMobile = mobileOrEmail.trim().replace(/\D/g, "");
    if (cleanMobile.length < 10) {
      toast.warning("कृपया वैध १० अंकी मोबाईल नंबर प्रविष्ट करा.", "मोबाईल नंबर आवश्यक");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.sendOtp(cleanMobile, "login");
      setIsLoading(false);

      if (res.success && res.data) {
        setOtpSent(true);
        const devHint = res.data.devOtpCode ? ` (डेमो OTP: ${res.data.devOtpCode})` : "";
        toast.success(`${res.data.message}${devHint}`, "OTP पाठवला!");
      } else {
        toast.error(res.error || "OTP पाठवता आला नाही.", "सर्व्हर त्रुटी");
      }
    } catch (err: any) {
      setIsLoading(false);
      toast.error(err.message || "सर्व्हरशी संपर्क होऊ शकला नाही.", "सर्व्हर त्रुटी");
    }
  };

  const handleOtpLogin = async () => {
    const cleanMobile = mobileOrEmail.trim().replace(/\D/g, "");
    const fullCode = otpCode.join("");
    if (fullCode.length < 6) {
      toast.warning("कृपया ६ अंकी OTP प्रविष्ट करा.", "अपूर्ण OTP");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.loginWithOtp(cleanMobile, fullCode);
      setIsLoading(false);

      if (res.success && res.data) {
        await login(res.data.user);
        toast.success(`स्वागत आहे, ${res.data.user.name}!`, "OTP लॉगिन यशस्वी!");
        Alert.alert(
          "OTP सत्यापित!",
          `स्वागत आहे ${res.data.user.name}! ${candidate.name} यांच्या अधिकृत ॲपमध्ये आपले मनःपूर्वक स्वागत.`,
          [
            {
              text: "पुढे जा",
              onPress: () => {
                if (returnTo) {
                  router.replace(returnTo as any);
                } else {
                  router.replace("/home");
                }
              },
            },
          ]
        );
      } else {
        toast.error(res.error || "चुकीचा OTP कोड. कृपया पुन्हा प्रयत्न करा.", "पडताळणी अयशस्वी");
      }
    } catch (err: any) {
      setIsLoading(false);
      toast.error(err.message || "सर्व्हरशी संपर्क होऊ शकला नाही.", "सर्व्हर त्रुटी");
    }
  };

  const handleGuestContinue = () => {
    router.replace("/home");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#C2410C" />

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
          {/* Top Brand Banner Card */}
          <View style={styles.brandHeroCard}>
            {/* Top decorative badge */}
            <View style={styles.partyBadgePill}>
              <Text style={styles.partyBadgeBow}>🏹</Text>
              <Text style={styles.partyBadgeText}>{party.name} {party.faction}</Text>
            </View>

            {/* Candidate Photo & Names */}
            <View style={styles.candidateHeaderRow}>
              <View style={styles.avatarBorder}>
                <Image
                  source={
                    typeof candidate.photo === "string"
                      ? { uri: candidate.photo }
                      : candidate.photo
                  }
                  style={styles.avatarImg}
                  contentFit="cover"
                />
              </View>

              <View style={styles.headerTextGroup}>
                <Text style={styles.candidateHonorificText}>
                  ★ {candidate.honorific || "लोकप्रिय उमेदवार"} ★
                </Text>
                <Text style={styles.candidateNameText}>{candidate.name}</Text>
                <Text style={styles.constituencyText}>📍 {candidate.constituency}</Text>
              </View>
            </View>

            {/* Slogan */}
            <View style={styles.sloganBar}>
              <Text style={styles.sloganText}>“{candidate.slogan}”</Text>
            </View>
          </View>

          {/* Main Login Card */}
          <View style={styles.loginCard}>
            {/* Title Header */}
            <View style={styles.loginHeader}>
              <Text style={styles.loginTitle}>नागरिक लॉगिन</Text>
              <Text style={styles.loginSubtitle}>
                आपल्या परिसरातील विकासकामे व समस्यांसाठी थेट संपर्क साधा
              </Text>
            </View>

            {/* Method Tabs: Password vs OTP */}
            <View style={styles.methodToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.methodTab,
                  loginMethod === "password" && styles.methodTabActive,
                ]}
                onPress={() => {
                  setLoginMethod("password");
                  setOtpSent(false);
                }}
                activeOpacity={0.8}
              >
                <Icon
                  source="lock"
                  size={18}
                  color={loginMethod === "password" ? "#E05300" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.methodTabText,
                    loginMethod === "password" && styles.methodTabActiveText,
                  ]}
                >
                  पासवर्ड द्वारे
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodTab,
                  loginMethod === "otp" && styles.methodTabActive,
                ]}
                onPress={() => setLoginMethod("otp")}
                activeOpacity={0.8}
              >
                <Icon
                  source="cellphone-message"
                  size={18}
                  color={loginMethod === "otp" ? "#E05300" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.methodTabText,
                    loginMethod === "otp" && styles.methodTabActiveText,
                  ]}
                >
                  OTP द्वारे
                </Text>
              </TouchableOpacity>
            </View>

            {/* 1. PASSWORD LOGIN FORM */}
            {loginMethod === "password" ? (
              <View style={styles.formContainer}>
                {/* Mobile or Email Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>मोबाईल नंबर किंवा ईमेल</Text>
                  <View style={styles.inputWrapper}>
                    <Icon source="account-outline" size={20} color="#9CA3AF" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="उदा. 9876543210 किंवा ईमेल"
                      placeholderTextColor="#9CA3AF"
                      value={mobileOrEmail}
                      onChangeText={setMobileOrEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.passwordLabelRow}>
                    <Text style={styles.inputLabel}>पासवर्ड</Text>
                    <TouchableOpacity
                      onPress={() => router.push("/forgot-password")}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.forgotPasswordLink}>पासवर्ड विसरलात?</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Icon source="lock-outline" size={20} color="#9CA3AF" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="आपला गुप्त पासवर्ड प्रविष्ट करा"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon
                        source={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remember Me Checkbox Row */}
                <TouchableOpacity
                  style={styles.rememberRow}
                  activeOpacity={0.8}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                    {rememberMe && <Icon source="check" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.rememberText}>लॉगिन लक्षात ठेवा</Text>
                </TouchableOpacity>

                {/* Submit Login Button */}
                <TouchableOpacity
                  style={styles.primaryBtn}
                  activeOpacity={0.85}
                  onPress={handlePasswordLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>लॉगिन करा</Text>
                      <Icon source="arrow-right" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* 2. OTP LOGIN FORM */
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>मोबाईल नंबर</Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.countryCodeBadge}>
                      <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="१० अंकी मोबाईल नंबर"
                      placeholderTextColor="#9CA3AF"
                      value={mobileOrEmail}
                      onChangeText={(t) => setMobileOrEmail(t.replace(/\D/g, "").slice(0, 10))}
                      keyboardType="phone-pad"
                      maxLength={10}
                      editable={!otpSent}
                    />
                    {otpSent && (
                      <TouchableOpacity
                        onPress={() => {
                          setOtpSent(false);
                          setOtpCode(["", "", "", "", "", ""]);
                        }}
                      >
                        <Text style={styles.changeMobileLink}>बदला</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {!otpSent ? (
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    activeOpacity={0.85}
                    onPress={handleSendLoginOtp}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>OTP मिळवा</Text>
                        <Icon source="message-arrow-right" size={18} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <>
                    {/* OTP 6-Digit Entry */}
                    <View style={styles.otpSection}>
                      <Text style={styles.otpPromptText}>
                        +91 {mobileOrEmail} वर पाठवलेला ६ अंकी कोड टाका
                      </Text>

                      <View style={styles.otpBoxesRow}>
                        {otpCode.map((digit, idx) => (
                          <TextInput
                            key={idx.toString()}
                            style={[
                              styles.otpBox,
                              digit ? styles.otpBoxFilled : null,
                            ]}
                            keyboardType="number-pad"
                            maxLength={1}
                            value={digit}
                            onChangeText={(val) => {
                              const newCode = [...otpCode];
                              newCode[idx] = val;
                              setOtpCode(newCode);
                            }}
                          />
                        ))}
                      </View>

                      <View style={styles.otpResendRow}>
                        <Text style={styles.resendTimerText}>
                          पुन्हा कोड मागवा (३० सेकंदात)
                        </Text>
                        <TouchableOpacity
                          onPress={handleSendLoginOtp}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.resendBtnText}>पुन्हा पाठवा</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      activeOpacity={0.85}
                      onPress={handleOtpLogin}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.primaryBtnText}>OTP सत्यापित करून लॉगिन करा</Text>
                          <Icon source="check-decagram" size={18} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>किंवा</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Create Account / Register Button */}
            <TouchableOpacity
              style={styles.registerButton}
              activeOpacity={0.88}
              onPress={() => {
                router.push({
                  pathname: "/register",
                  params: returnTo ? { returnTo } : {},
                });
              }}
            >
              <Icon source="account-plus" size={20} color="#EA580C" />
              <Text style={styles.registerButtonText}>नवीन नागरिक नोंदणी (Register)</Text>
            </TouchableOpacity>

            {/* Continue as Guest Button */}
            <TouchableOpacity
              style={styles.guestButton}
              activeOpacity={0.8}
              onPress={handleGuestContinue}
            >
              <Icon source="account-eye-outline" size={20} color="#64748B" />
              <Text style={styles.guestButtonText}>नोंदणीशिवाय पुढे जा (अतिथी म्हणून)</Text>
            </TouchableOpacity>

            {/* Footer Sign Up Link */}
            <View style={styles.signupFooter}>
              <Text style={styles.signupText}>नवीन मतदार / नागरिक आहात का? </Text>
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: "/register",
                    params: returnTo ? { returnTo } : {},
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.signupLink}>येथे नोंदणी करा</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#C2410C",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Top Hero Branding Card
  brandHeroCard: {
    backgroundColor: "#C2410C",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: "center",
  },
  partyBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  partyBadgeBow: {
    fontSize: 14,
  },
  partyBadgeText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  candidateHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    padding: 12,
    borderRadius: 18,
  },
  avatarBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: "#FDE047",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  headerTextGroup: {
    flex: 1,
  },
  candidateHonorificText: {
    color: "#FDE047",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  candidateNameText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 1,
    includeFontPadding: false,
  },
  constituencyText: {
    color: "#FFEDD5",
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 2,
  },
  sloganBar: {
    marginTop: 12,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  sloganText: {
    color: "#FEF08A",
    fontSize: 12,
    fontWeight: "700",
    fontStyle: "italic",
    textAlign: "center",
  },

  // Main Login Form Card
  loginCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  loginHeader: {
    marginBottom: 18,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1F2937",
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: 12.5,
    color: "#6B7280",
    lineHeight: 18,
  },

  // Method Toggle Tabs
  methodToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  methodTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  methodTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },
  methodTabActiveText: {
    color: "#E05300",
  },

  // Form Fields
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  passwordLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  forgotPasswordLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E05300",
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
  countryCodeBadge: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  countryCodeText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#C2410C",
  },
  changeMobileLink: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E05300",
  },

  // Remember Row
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxActive: {
    backgroundColor: "#E05300",
    borderColor: "#E05300",
  },
  rememberText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "600",
  },

  // OTP Section
  otpSection: {
    backgroundColor: "#FFF7ED",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FED7AA",
    alignItems: "center",
    gap: 12,
  },
  otpPromptText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#C2410C",
    textAlign: "center",
  },
  otpBoxesRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  otpBox: {
    width: 42,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FDBA74",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  otpBoxFilled: {
    borderColor: "#EA580C",
    backgroundColor: "#FFFBEB",
  },
  otpResendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingTop: 4,
  },
  resendTimerText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  resendBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E05300",
  },

  // Buttons
  primaryBtn: {
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
    marginTop: 4,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },

  // Register Button
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "#EA580C",
    borderRadius: 14,
    height: 48,
    marginBottom: 10,
  },
  registerButtonText: {
    color: "#EA580C",
    fontSize: 14,
    fontWeight: "800",
  },

  // Guest Button
  guestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF7ED",
    borderWidth: 1.2,
    borderColor: "#FED7AA",
    borderRadius: 14,
    height: 46,
  },
  guestButtonText: {
    color: "#C2410C",
    fontSize: 13,
    fontWeight: "700",
  },

  // Sign up link
  signupFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  signupText: {
    fontSize: 13,
    color: "#6B7280",
  },
  signupLink: {
    fontSize: 13,
    fontWeight: "800",
    color: "#E05300",
  },
});
