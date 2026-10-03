import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign } from "../context/CampaignContext";
import { BottomTabBar } from "../components/BottomTabBar";
import { inquiryApi } from "../services/inquiryApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ContactScreen() {
  const router = useRouter();
  const { contact, candidate, quoteCard, currentUser, refreshAppConfig } = useCampaign();
  const [refreshing, setRefreshing] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  // Dynamic candidate photo with error fallback
  const candidatePhotoSource = React.useMemo(() => {
    if (photoError) {
      return require("../../assets/images/umedwar.png");
    }
    if (!candidate?.photo) {
      return require("../../assets/images/umedwar.png");
    }
    if (typeof candidate.photo === "string") {
      return { uri: candidate.photo };
    }
    return candidate.photo;
  }, [candidate?.photo, photoError]);

  // Quote text displayed on the hero card (from Admin quote card or slogan)
  const displayQuote = React.useMemo(() => {
    if (quoteCard?.text && quoteCard.text.trim()) {
      return quoteCard.text.replace(/["“”]/g, "").trim();
    }
    if (candidate?.slogan && candidate.slogan.trim()) {
      return candidate.slogan.replace(/["“”]/g, "").trim();
    }
    return "जनतेचा आवाज नेहमी माझ्यापर्यंत पोहोचवा !";
  }, [quoteCard?.text, candidate?.slogan]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPhotoError(false);
    try {
      await refreshAppConfig();
    } catch (e) {
      console.log("Error refreshing contact info:", e);
    } finally {
      setRefreshing(false);
    }
  };

  // Form State
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhoneCall = () => {
    Linking.openURL(`tel:${contact.helpline1.replace(/\s+/g, "")}`);
  };

  const handleWhatsApp = () => {
    Linking.openURL(`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}?text=जय%20महाराष्ट्र!%20मला%20संपर्क%20करायचा%20आहे.`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${contact.email}?subject=जनसंपर्क%20संदेश`);
  };

  const handleOpenMap = () => {
    Linking.openURL("https://maps.google.com/?q=Kopargaon+Maharashtra");
  };

  const handleSocialOpen = (platform: string) => {
    const urls: Record<string, string> = {
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      twitter: "https://twitter.com",
      youtube: "https://youtube.com",
      whatsappChannel: "https://whatsapp.com/channel",
    };
    if (urls[platform]) {
      Linking.openURL(urls[platform]);
    }
  };

  // Pre-fill fields from logged-in user profile
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name && !name) setName(currentUser.name);
      if (currentUser.mobile && !mobile) setMobile(currentUser.mobile);
      if (currentUser.email && !email) setEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("कृपया नाव प्रविष्ट करा", "आपले पूर्ण नाव भरणे आवश्यक आहे.");
      return;
    }
    if (!mobile.trim() || mobile.length < 10) {
      Alert.alert("कृपया वैध मोबाईल नंबर टाका", "१० अंकी मोबाईल नंबर भरणे आवश्यक आहे.");
      return;
    }
    if (!message.trim()) {
      Alert.alert("कृपया संदेश लिहा", "आपला संदेश किंवा समस्या नमूद करा.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await inquiryApi.submitInquiry({
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        message: message.trim(),
        userId: currentUser?.id,
      });

      if (res.success) {
        Alert.alert(
          "संदेश यशस्वीरीत्या पाठवला!",
          "आपला संदेश सचिन मलिक जनसंपर्क कार्यालयाकडे थेट नोंदवला गेला आहे. आमची टीम लवकरच आपल्याशी संपर्क करेल.\n\nजय महाराष्ट्र!",
          [
            {
              text: "धन्यवाद",
              onPress: () => {
                setMessage("");
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "संदेश पाठवता आला नाही",
          res.message || "कृपया थोड्या वेळाने पुन्हा प्रयत्न करा."
        );
      }
    } catch (e: any) {
      Alert.alert(
        "तांत्रिक अडचण",
        "संदेश पाठवताना समस्या आली. कृपया इंटरनेट तपासून पुन्हा प्रयत्न करा."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#E05300" />

      {/* Top Saffron Header */}
      <View style={styles.topHeader}>
        {/* Left: Back Button & Title */}
        <View style={styles.headerLeftGroup}>
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

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerMainTitle}>संपर्क</Text>
            <Text style={styles.headerSubtitle}>आपला संवाद, आपली ताकद</Text>
          </View>
        </View>

        {/* Right: Golden Shiv Sena Bow & Arrow Logo */}
        <View style={styles.logoEmblemContainer}>
          <Image
            source={require("../../assets/images/shivsena_logo.png")}
            style={styles.logoEmblemImg}
            contentFit="cover"
          />
        </View>
      </View>

      {/* Main Scrollable Content */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
          {/* Hero Profile / Slogan Card (Dynamic from Admin Panel) */}
          <TouchableOpacity
            style={styles.heroCardContainer}
            activeOpacity={0.88}
            onPress={() => {
              if (quoteCard?.actionUrl) {
                router.push(quoteCard.actionUrl as any);
              } else {
                router.push("/about");
              }
            }}
          >
            {/* Left: Candidate Photo Frame */}
            <View style={styles.candidatePhotoFrame}>
              <Image
                source={candidatePhotoSource}
                style={styles.candidatePhotoImg}
                contentFit="cover"
                priority="high"
                onError={() => setPhotoError(true)}
              />
            </View>

            {/* Right: Quote, Candidate Name & Designation */}
            <View style={styles.candidateInfoCol}>
              <Text style={styles.heroQuoteText} numberOfLines={2}>
                “ {displayQuote} ”
              </Text>
              <Text style={styles.heroCandidateName} numberOfLines={1}>
                {candidate?.englishName || candidate?.name || "Mr. Sachin Malik"}
              </Text>
              <Text style={styles.heroDesignation} numberOfLines={1}>
                {candidate?.designation || "शिवसेना अधिकृत उमेदवार"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 4 Quick Contact Cards */}
          <View style={styles.quickContactRow}>
            {/* 1. फोन करा */}
            <TouchableOpacity
              style={styles.contactActionCard}
              onPress={handlePhoneCall}
              activeOpacity={0.85}
            >
              <View style={[styles.contactIconCircle, { backgroundColor: "#EA580C" }]}>
                <Icon source="phone" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionCardTitle}>फोन करा</Text>
              <Text style={styles.actionCardValue} numberOfLines={1}>
                {contact.helpline1}
              </Text>
            </TouchableOpacity>

            {/* 2. WhatsApp */}
            <TouchableOpacity
              style={styles.contactActionCard}
              onPress={handleWhatsApp}
              activeOpacity={0.85}
            >
              <View style={[styles.contactIconCircle, { backgroundColor: "#25D366" }]}>
                <Icon source="whatsapp" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionCardTitle}>WhatsApp</Text>
              <Text style={styles.actionCardValue} numberOfLines={1}>
                {contact.whatsapp}
              </Text>
            </TouchableOpacity>

            {/* 3. ईमेल करा */}
            <TouchableOpacity
              style={styles.contactActionCard}
              onPress={handleEmail}
              activeOpacity={0.85}
            >
              <View style={[styles.contactIconCircle, { backgroundColor: "#EF4444" }]}>
                <Icon source="email" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionCardTitle}>ईमेल करा</Text>
              <Text style={styles.actionCardValue} numberOfLines={1}>
                {contact.email}
              </Text>
            </TouchableOpacity>

            {/* 4. कार्यालय भेट */}
            <TouchableOpacity
              style={styles.contactActionCard}
              onPress={handleOpenMap}
              activeOpacity={0.85}
            >
              <View style={[styles.contactIconCircle, { backgroundColor: "#3B82F6" }]}>
                <Icon source="map-marker" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionCardTitle}>कार्यालय भेट</Text>
              <Text style={styles.actionCardValue} numberOfLines={1}>
                आमचे कार्यालय
              </Text>
            </TouchableOpacity>
          </View>

          {/* "मुख्य कार्यालय" (Head Office) Section Card */}
          <View style={styles.officeCard}>
            <View style={styles.officeHeader}>
              <View style={styles.officePinCircle}>
                <Icon source="map-marker" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.officeHeading}>मुख्य कार्यालय</Text>
            </View>

            <View style={styles.officeContentRow}>
              {/* Left Column: Address Details */}
              <View style={styles.officeTextCol}>
                <Text style={styles.officeName}>
                  {contact.officeName}
                </Text>
                <Text style={styles.officeAddress}>
                  {contact.address},{"\n"}
                  {contact.city} - {contact.pincode}
                </Text>

                <TouchableOpacity
                  style={styles.viewMapBtn}
                  onPress={handleOpenMap}
                  activeOpacity={0.85}
                >
                  <Text style={styles.viewMapBtnText}>नकाशावर पहा</Text>
                  <Icon source="arrow-right" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Right Column: Map Preview */}
              <TouchableOpacity
                style={styles.mapWrapper}
                onPress={handleOpenMap}
                activeOpacity={0.9}
              >
                <Image
                  source={require("../../assets/images/contact_map_preview.png")}
                  style={styles.mapImage}
                  contentFit="cover"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* "आपला संदेश पाठवा" (Message Form) Card */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <View style={styles.formSendCircle}>
                <Icon source="send" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.formHeaderTitles}>
                <Text style={styles.formHeading}>आपला संदेश पाठवा</Text>
                <Text style={styles.formSubtitle}>
                  आपले प्रश्न, सूचना किंवा समस्या खाली लिहा. आमची टीम लवकरात लवकर संपर्क करेल.
                </Text>
              </View>
            </View>

            {/* Inputs: Name & Mobile Row */}
            <View style={styles.inputsRow}>
              {/* Name */}
              <View style={styles.halfInputWrap}>
                <View style={styles.inputInner}>
                  <Icon source="account-outline" size={17} color="#78716C" />
                  <TextInput
                    style={styles.input}
                    placeholder="पूर्ण नाव *"
                    placeholderTextColor="#A8A29E"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Mobile */}
              <View style={styles.halfInputWrap}>
                <View style={styles.inputInner}>
                  <Icon source="phone-outline" size={17} color="#78716C" />
                  <TextInput
                    style={styles.input}
                    placeholder="मोबाईल नंबर *"
                    placeholderTextColor="#A8A29E"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={mobile}
                    onChangeText={setMobile}
                  />
                </View>
              </View>
            </View>

            {/* Input: Email (Optional) */}
            <View style={styles.fullInputWrap}>
              <View style={styles.inputInner}>
                <Icon source="email-outline" size={17} color="#78716C" />
                <TextInput
                  style={styles.input}
                  placeholder="ईमेल (पर्यायी)"
                  placeholderTextColor="#A8A29E"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Input: Message Textarea */}
            <View style={styles.messageInputWrap}>
              <View style={styles.messageInner}>
                <View style={styles.messageIconRow}>
                  <Icon source="file-document-outline" size={17} color="#78716C" />
                  <Text style={styles.messageLabel}>आपला संदेश *</Text>
                </View>
                <TextInput
                  style={styles.messageInput}
                  placeholder="आपली समस्या किंवा सूचना येथे लिहा..."
                  placeholderTextColor="#A8A29E"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  value={message}
                  onChangeText={setMessage}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{message.length}/500</Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              <Icon source="send" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                {isSubmitting ? "पाठवत आहे..." : "संदेश पाठवा"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* "सोशल मीडियावर संपर्कात रहा" (Social Media Card) */}
          <View style={styles.socialCard}>
            <View style={styles.socialHeader}>
              <View style={styles.socialHeaderCircle}>
                <Icon source="account-group" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.socialHeaderTitles}>
                <Text style={styles.socialHeading}>सोशल मीडियावर संपर्कात रहा</Text>
                <Text style={styles.socialSubtitle}>
                  नवीन अपडेट, कार्यक्रम आणि जनहिताचे उपक्रम पाहण्यासाठी आम्हाला फॉलो करा.
                </Text>
              </View>
            </View>

            {/* 5 Social Media Buttons */}
            <View style={styles.socialButtonsRow}>
              {/* Facebook */}
              <TouchableOpacity
                style={styles.socialBtnCol}
                onPress={() => handleSocialOpen("facebook")}
                activeOpacity={0.8}
              >
                <View style={[styles.socialIconCircle, { backgroundColor: "#1877F2" }]}>
                  <Icon source="facebook" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.socialBtnLabel}>Facebook</Text>
              </TouchableOpacity>

              {/* Instagram */}
              <TouchableOpacity
                style={styles.socialBtnCol}
                onPress={() => handleSocialOpen("instagram")}
                activeOpacity={0.8}
              >
                <View style={[styles.socialIconCircle, { backgroundColor: "#E1306C" }]}>
                  <Icon source="instagram" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.socialBtnLabel}>Instagram</Text>
              </TouchableOpacity>

              {/* X (Twitter) */}
              <TouchableOpacity
                style={styles.socialBtnCol}
                onPress={() => handleSocialOpen("twitter")}
                activeOpacity={0.8}
              >
                <View style={[styles.socialIconCircle, { backgroundColor: "#000000" }]}>
                  <Icon source="twitter" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.socialBtnLabel}>X (Twitter)</Text>
              </TouchableOpacity>

              {/* YouTube */}
              <TouchableOpacity
                style={styles.socialBtnCol}
                onPress={() => handleSocialOpen("youtube")}
                activeOpacity={0.8}
              >
                <View style={[styles.socialIconCircle, { backgroundColor: "#FF0000" }]}>
                  <Icon source="youtube" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.socialBtnLabel}>YouTube</Text>
              </TouchableOpacity>

              {/* WhatsApp Channel */}
              <TouchableOpacity
                style={styles.socialBtnCol}
                onPress={() => handleSocialOpen("whatsappChannel")}
                activeOpacity={0.8}
              >
                <View style={[styles.socialIconCircle, { backgroundColor: "#25D366" }]}>
                  <Icon source="whatsapp" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.socialBtnLabel}>WhatsApp Channel</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Slogan Strip */}
          <View style={styles.footerSloganStrip}>
            <View style={styles.ornamentLine} />
            <View style={styles.sloganCenter}>
              <Icon source="account-group" size={20} color="#E05300" />
              <Text style={styles.sloganText}>
                जनतेचा विश्वास, आमची शक्ती !
              </Text>
            </View>
            <View style={styles.ornamentLine} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 5-Tab Bottom Navigation Bar */}
      <BottomTabBar currentTab="contact" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  scrollContent: {
    paddingBottom: 28,
  },

  // Top Header
  topHeader: {
    backgroundColor: "#E05300",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleGroup: {
    justifyContent: "center",
  },
  headerMainTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 25,
  },
  headerSubtitle: {
    color: "#FED7AA",
    fontSize: 12,
    fontWeight: "600",
  },
  logoEmblemContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#FBBF24",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoEmblemImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  // Hero Card (Dynamic with Candidate Photo & Quote)
  heroCardContainer: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: "#FFFDF0",
    borderWidth: 1.2,
    borderColor: "#FDE68A",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  candidatePhotoFrame: {
    width: 78,
    height: 88,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  candidatePhotoImg: {
    width: "100%",
    height: "100%",
  },
  candidateInfoCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  heroQuoteText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#EA580C",
    lineHeight: 17,
  },
  heroCandidateName: {
    fontSize: 16.5,
    fontWeight: "900",
    color: "#1E293B",
    marginTop: 4,
    letterSpacing: -0.2,
  },
  heroDesignation: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
    marginTop: 2,
  },

  // 4 Quick Contact Cards
  quickContactRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  contactActionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2.5,
    elevation: 2,
  },
  contactIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actionCardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1C1917",
    marginBottom: 2,
  },
  actionCardValue: {
    fontSize: 9.5,
    color: "#78716C",
    fontWeight: "600",
    textAlign: "center",
  },

  // Office Section Card
  officeCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  officeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  officePinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E05300",
    alignItems: "center",
    justifyContent: "center",
  },
  officeHeading: {
    fontSize: 16,
    fontWeight: "900",
    color: "#E05300",
  },
  officeContentRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  officeTextCol: {
    flex: 1,
  },
  officeName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1C1917",
    marginBottom: 4,
  },
  officeAddress: {
    fontSize: 11.5,
    color: "#57534E",
    lineHeight: 16,
    marginBottom: 10,
  },
  viewMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E05300",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: "flex-start",
    gap: 4,
  },
  viewMapBtnText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
  },
  mapWrapper: {
    width: 140,
    height: 95,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },

  // Form Card
  formCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 10,
  },
  formSendCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E05300",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  formHeaderTitles: {
    flex: 1,
  },
  formHeading: {
    fontSize: 16,
    fontWeight: "900",
    color: "#E05300",
  },
  formSubtitle: {
    fontSize: 11,
    color: "#78716C",
    lineHeight: 15,
    marginTop: 2,
  },
  inputsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  halfInputWrap: {
    flex: 1,
  },
  fullInputWrap: {
    marginBottom: 10,
  },
  inputInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF9F6",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
    gap: 6,
  },
  input: {
    flex: 1,
    fontSize: 12.5,
    color: "#1C1917",
    paddingVertical: 0,
  },
  messageInputWrap: {
    marginBottom: 14,
  },
  messageInner: {
    backgroundColor: "#FAF9F6",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 10,
    padding: 10,
  },
  messageIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  messageLabel: {
    fontSize: 12,
    color: "#78716C",
    fontWeight: "600",
  },
  messageInput: {
    fontSize: 12.5,
    color: "#1C1917",
    minHeight: 65,
    padding: 0,
  },
  charCount: {
    fontSize: 10,
    color: "#A8A29E",
    textAlign: "right",
    marginTop: 4,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E05300",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    shadowColor: "#E05300",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  // Social Card
  socialCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  socialHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 10,
  },
  socialHeaderCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  socialHeaderTitles: {
    flex: 1,
  },
  socialHeading: {
    fontSize: 15.5,
    fontWeight: "900",
    color: "#1C1917",
  },
  socialSubtitle: {
    fontSize: 11,
    color: "#78716C",
    lineHeight: 15,
    marginTop: 2,
  },
  socialButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  socialBtnCol: {
    alignItems: "center",
    flex: 1,
  },
  socialIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 2.5,
    elevation: 2,
  },
  socialBtnLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#44403C",
    textAlign: "center",
  },

  // Footer Slogan Strip
  footerSloganStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  ornamentLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#FDBA74",
  },
  sloganCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sloganText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#C2410C",
  },

  // Bottom Navigation Bar
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 6,
    justifyContent: "space-around",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tabLabel: {
    fontSize: 11,
    color: "#78716C",
    fontWeight: "600",
    marginTop: 3,
  },
  tabActiveLabel: {
    color: "#E05300",
    fontWeight: "800",
  },
});
