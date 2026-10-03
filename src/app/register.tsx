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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign } from "../context/CampaignContext";
import { authApi } from "../services/authApi";
import { toast } from "../components/Toast";

export default function RegisterScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { candidate, party, login } = useCampaign();

  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [wardOrArea, setWardOrArea] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAgreed, setIsAgreed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    const trimmedName = fullName.trim();
    const cleanMobile = mobileNumber.trim().replace(/\D/g, "");
    const trimmedWard = wardOrArea.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName) {
      toast.warning("कृपया आपले पूर्ण नाव प्रविष्ट करा.", "माहिती आवश्यक");
      return;
    }
    if (trimmedName.length < 3) {
      toast.warning("कृपया योग्य नाव प्रविष्ट करा.", "अवैध नाव");
      return;
    }
    if (cleanMobile.length < 10) {
      toast.warning("कृपया वैध १० अंकी मोबाईल नंबर प्रविष्ट करा.", "मोबाईल नंबर आवश्यक");
      return;
    }
    if (!trimmedPassword) {
      toast.warning("कृपया पासवर्ड प्रविष्ट करा.", "पासवर्ड आवश्यक");
      return;
    }
    if (trimmedPassword.length < 6) {
      toast.warning("पासवर्ड किमान ६ अक्षरांचा असणे आवश्यक आहे.", "लहान पासवर्ड");
      return;
    }
    if (trimmedPassword !== confirmPassword.trim()) {
      toast.warning("पासवर्ड आणि पुष्टी पासवर्ड एकसारखे असावेत.", "पासवर्ड जुळत नाही");
      return;
    }
    if (!isAgreed) {
      toast.warning("कृपया सत्यतेची हमी देणारा पर्याय निवडा.", "अटी मान्य करा");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.register({
        name: trimmedName,
        mobile: cleanMobile,
        password: trimmedPassword,
        ward: trimmedWard || "कोपरगाव मतदारसंघ",
        email: email.trim() || undefined,
      });

      setIsLoading(false);

      if (res.success && res.data) {
        await login(res.data.user);
        toast.success(`स्वागत आहे, ${res.data.user.name}! आपले खाते तयार झाले आहे.`, "नोंदणी यशस्वी!");
        Alert.alert(
          "नोंदणी यशस्वी!",
          `स्वागत आहे ${res.data.user.name}!\nआपले नागरिक खाते यशस्वीरीत्या तयार झाले आहे.\n${candidate.name} यांच्या अधिकृत ॲपमध्ये आपले मनःपूर्वक स्वागत.`,
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
        toast.error(res.error || "नोंदणी अयशस्वी. कृपया माहिती तपासून पुन्हा प्रयत्न करा.", "सर्व्हर त्रुटी");
      }
    } catch (err: any) {
      setIsLoading(false);
      toast.error(err.message || "सर्व्हरशी संपर्क होऊ शकला नाही.", "सर्व्हर त्रुटी");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#C2410C" />

      {/* Saffron Top Brand Bar */}
      <View style={styles.brandBar}>
        <View style={styles.brandBarLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/home");
            }}
            activeOpacity={0.85}
          >
            <Icon source="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.brandTextGroup}>
            <Text style={styles.brandTitle}>नागरिक नोंदणी</Text>
            <Text style={styles.brandSubtitle}>आपला आवाज, आपले हक्क</Text>
          </View>
        </View>

        <View style={styles.logoEmblemContainer}>
          <Image
            source={require("../../assets/images/shivsena_logo.png")}
            style={styles.logoEmblemImg}
            contentFit="cover"
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card Container */}
          <View style={styles.card}>
            {/* Header / Intro */}
            <View style={styles.cardHeader}>
              <View style={styles.headerIconCircle}>
                <Icon source="account-plus-outline" size={28} color="#EA580C" />
              </View>
              <Text style={styles.cardTitle}>नवीन नागरिक नोंदणी</Text>
              <Text style={styles.cardSubtitle}>
                {candidate.name} यांच्या कार्यालयाशी थेट जोडण्यासाठी आणि समस्या नोंदवण्यासाठी नोंदणी करा.
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formGroup}>
              {/* Full Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>पूर्ण नाव *</Text>
                <View style={styles.inputWrap}>
                  <Icon source="account-outline" size={20} color="#EA580C" />
                  <TextInput
                    style={styles.inputField}
                    placeholder="उदा. राहुल प्रकाश देशमुख"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Mobile Number */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>मोबाईल नंबर *</Text>
                <View style={styles.inputWrap}>
                  <Icon source="phone-outline" size={20} color="#EA580C" />
                  <TextInput
                    style={styles.inputField}
                    placeholder="१० अंकी मोबाईल नंबर"
                    placeholderTextColor="#9CA3AF"
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* Ward / Area */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>प्रभाग / परिसर / गाव *</Text>
                <View style={styles.inputWrap}>
                  <Icon source="map-marker-outline" size={20} color="#EA580C" />
                  <TextInput
                    style={styles.inputField}
                    placeholder="उदा. प्रभाग क्र. १२ किंवा कोपरगाव"
                    placeholderTextColor="#9CA3AF"
                    value={wardOrArea}
                    onChangeText={setWardOrArea}
                  />
                </View>
              </View>

              {/* Email (Optional) */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>ईमेल पत्ता (पर्यायी)</Text>
                <View style={styles.inputWrap}>
                  <Icon source="email-outline" size={20} color="#EA580C" />
                  <TextInput
                    style={styles.inputField}
                    placeholder="उदा. citizen@example.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>पासवर्ड तयार करा *</Text>
                <View style={styles.inputWrap}>
                  <Icon source="lock-outline" size={20} color="#EA580C" />
                  <TextInput
                    style={styles.inputField}
                    placeholder="किमान ६ अक्षरांचा पासवर्ड"
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

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>पासवर्ड पुष्टी करा *</Text>
                <View style={styles.inputWrap}>
                  <Icon source="lock-check-outline" size={20} color="#EA580C" />
                  <TextInput
                    style={styles.inputField}
                    placeholder="पासवर्ड पुन्हा टाका"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>
              </View>

              {/* Agreement Checkbox */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsAgreed(!isAgreed)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.checkboxSquare,
                    isAgreed && styles.checkboxSquareChecked,
                  ]}
                >
                  {isAgreed && <Icon source="check" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  मी दिलेली माहिती खरी असून मी {candidate.constituency} चा नागरिक / मतदार आहे.
                </Text>
              </TouchableOpacity>

              {/* Submit Action Button */}
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                activeOpacity={0.88}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Icon source="check-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>खाते तयार करा व पुढे जा</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>किंवा</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Already Have Account - Login Link */}
            <View style={styles.loginFooter}>
              <Text style={styles.loginFooterText}>आधीच नोंदणीकृत खाते आहे का? </Text>
              <TouchableOpacity
                onPress={() => {
                  router.replace({
                    pathname: "/login",
                    params: returnTo ? { returnTo } : {},
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.loginFooterLink}>लॉगिन करा</Text>
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
  brandBar: {
    backgroundColor: "#C2410C",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTextGroup: {
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  brandSubtitle: {
    fontSize: 11,
    color: "#FED7AA",
    fontWeight: "600",
    marginTop: 1,
  },
  logoEmblemContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    overflow: "hidden",
  },
  logoEmblemImg: {
    width: 32,
    height: 32,
  },
  keyboardView: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 6,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  formGroup: {
    gap: 14,
  },
  inputContainer: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#374151",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "600",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 4,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxSquareChecked: {
    backgroundColor: "#EA580C",
    borderColor: "#EA580C",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: "#475569",
    lineHeight: 17,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#EA580C",
    borderRadius: 12,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  loginFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginFooterText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  loginFooterLink: {
    fontSize: 13,
    color: "#EA580C",
    fontWeight: "900",
    textDecorationLine: "underline",
  },
});
