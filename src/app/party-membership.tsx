import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import {
  CAREER_LIFE_SERVICES_DATA,
  SHIVSENA_ROLES_OPTIONS,
  WORK_AREAS_CONFIG,
  LifeUtilityService,
} from "../constants/manifestoAndServicesData";
import { useCampaign } from "../context/CampaignContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PartyMembershipScreen() {
  const router = useRouter();
  const { candidate, party } = useCampaign();
  const [activeMainTab, setActiveMainTab] = useState<"membership" | "services">("membership");

  // Registration Form State
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [mobile, setMobile] = useState("");
  const [altMobile, setAltMobile] = useState("");
  const [village, setVillage] = useState("");
  const [address, setAddress] = useState("");
  const [education, setEducation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [email, setEmail] = useState("");

  // Organizational questions
  const [hadPastOrgExperience, setHadPastOrgExperience] = useState(false);
  const [pastOrgName, setPastOrgName] = useState("");
  const [pastOrgPost, setPastOrgPost] = useState("");
  const [joiningReason, setJoiningReason] = useState("");

  // Post Selection (13 roles)
  const [selectedRole, setSelectedRole] = useState(SHIVSENA_ROLES_OPTIONS[0]);
  const [customRoleText, setCustomRoleText] = useState("");

  // Work Area Selection
  const [selectedGan, setSelectedGan] = useState(WORK_AREAS_CONFIG.gans[0]);
  const [selectedGat, setSelectedGat] = useState(WORK_AREAS_CONFIG.gats[0]);
  const [boothNumber, setBoothNumber] = useState("");
  const [dedicatedHoursPerWeek, setDedicatedHoursPerWeek] = useState("");
  const [teamCount, setTeamCount] = useState("");
  const [specialSkills, setSpecialSkills] = useState("");

  // Submitted Membership ID Card State
  const [registeredMember, setRegisteredMember] = useState<{
    id: string;
    name: string;
    role: string;
    village: string;
    date: string;
  } | null>(null);

  // Selected Service for detail modal
  const [selectedService, setSelectedService] = useState<LifeUtilityService | null>(null);

  const handleSubmitRegistration = () => {
    if (!fullName.trim() || !mobile.trim() || !village.trim()) {
      Alert.alert("माहिती अपूर्ण", "कृपया आपले पूर्ण नाव, मोबाईल क्रमांक आणि गाव प्रविष्ट करा.");
      return;
    }
    if (mobile.trim().length < 10) {
      Alert.alert("त्रुटी", "कृपया वैध १० अंकी मोबाईल नंबर प्रविष्ट करा.");
      return;
    }

    const memberId = `SS-KOP-${Math.floor(10000 + Math.random() * 90000)}`;
    const finalRole =
      selectedRole.includes("इतर पद") && customRoleText.trim()
        ? customRoleText.trim()
        : selectedRole;

    setRegisteredMember({
      id: memberId,
      name: fullName.trim(),
      role: finalRole,
      village: village.trim(),
      date: new Date().toLocaleDateString("mr-IN"),
    });
  };

  const handleShareIdCard = async () => {
    if (!registeredMember) return;
    try {
      await Share.share({
        message:
          `🚩 *शिवसेना अधिकृत सदस्य नोंदणी* 🚩\n\n` +
          `सदस्य नाव: *${registeredMember.name}*\n` +
          `सदस्य क्रमांक: *${registeredMember.id}*\n` +
          `इच्छित पद: *${registeredMember.role}*\n` +
          `गाव: *${registeredMember.village}*\n\n` +
          `आदरणीय एकनाथजी शिंदे साहेब व सचिन मलिक यांच्या नेतृत्वात कोपरगावच्या विकासात सहभागी व्हा!\n` +
          `📲 “मी सचिन मलिक” ॲपवरून आपलीही सदस्य नोंदणी पूर्ण करा!`,
      });
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#EA580C" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
          activeOpacity={0.85}
        >
          <Icon source="arrow-left" size={22} color="#EA580C" />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>रोजगार, सेवा व शिवसेना नोंदणी</Text>
          <Text style={styles.headerSubtitle}>१२ जीवनोपयोगी सेवा • सदस्य व पद नोंदणी</Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      {/* Main Switcher: शिवसेना सदस्य नोंदणी VS १२ जीवनोपयोगी सेवा */}
      <View style={styles.switcherContainer}>
        <TouchableOpacity
          style={[styles.switchTab, activeMainTab === "membership" && styles.switchTabActive]}
          onPress={() => setActiveMainTab("membership")}
        >
          <Icon
            source="card-account-details-outline"
            size={18}
            color={activeMainTab === "membership" ? "#FFFFFF" : "#4B5563"}
          />
          <Text
            style={[styles.switchTabText, activeMainTab === "membership" && styles.switchTabTextActive]}
          >
            शिवसेना सदस्य नोंदणी
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchTab, activeMainTab === "services" && styles.switchTabActive]}
          onPress={() => setActiveMainTab("services")}
        >
          <Icon
            source="hand-heart"
            size={18}
            color={activeMainTab === "services" ? "#FFFFFF" : "#4B5563"}
          />
          <Text
            style={[styles.switchTabText, activeMainTab === "services" && styles.switchTabTextActive]}
          >
            १२ जीवनोपयोगी सेवा
          </Text>
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
        >
        {activeMainTab === "membership" ? (
          /* ========================================= */
          /* TAB 1: SHIV SENA MEMBERSHIP & ROLES FORM   */
          /* ========================================= */
          registeredMember ? (
            /* Digital ID Card Display */
            <View style={styles.idCardSuccessContainer}>
              <View style={styles.successBadge}>
                <Icon source="check-decagram" size={20} color="#FFFFFF" />
                <Text style={styles.successBadgeText}>नोंदणी यशस्वी!</Text>
              </View>

              {/* Digital Member ID Card (ओळखपत्र) */}
              <View style={styles.digitalIdCard}>
                <View style={styles.idCardHeader}>
                  <View>
                    <Text style={styles.idCardPartyName}>शिवसेना (Shiv Sena)</Text>
                    <Text style={styles.idCardTaluka}>कोपरगाव विधानसभा मतदारसंघ</Text>
                  </View>
                  <Icon source="bow-arrow" size={32} color="#FFFFFF" />
                </View>

                <View style={styles.idCardBody}>
                  <View style={styles.idAvatarBox}>
                    <Icon source="account" size={44} color="#EA580C" />
                  </View>

                  <View style={styles.idInfoCol}>
                    <Text style={styles.idMemberName}>{registeredMember.name}</Text>
                    <Text style={styles.idMemberRole}>{registeredMember.role}</Text>
                    <Text style={styles.idMemberLoc}>📍 गाव: {registeredMember.village}</Text>
                    <Text style={styles.idMemberNo}>सदस्य क्र: {registeredMember.id}</Text>
                  </View>
                </View>

                <View style={styles.idCardFooter}>
                  <View>
                    <Text style={styles.idLeaderName}>नेतृत्व: सचिन मलिक</Text>
                    <Text style={styles.idDate}>नोंदणी तारीख: {registeredMember.date}</Text>
                  </View>
                  <View style={styles.qrBadge}>
                    <Icon source="qrcode" size={26} color="#1C1917" />
                  </View>
                </View>
              </View>

              {/* Status Roadmap */}
              <View style={styles.verificationBox}>
                <Text style={styles.verifTitle}>अर्जाची सद्यस्थिती (Status):</Text>
                <View style={styles.verifRow}>
                  <Icon source="clock-outline" size={16} color="#D97706" />
                  <Text style={styles.verifText}>
                    पडताळणी सुरू • अधिकृत पदाधिकारी आपल्याशी संपर्क साधतील.
                  </Text>
                </View>
              </View>

              <View style={styles.idCardActionsRow}>
                <TouchableOpacity style={styles.shareIdBtn} onPress={handleShareIdCard}>
                  <Icon source="whatsapp" size={18} color="#FFFFFF" />
                  <Text style={styles.shareIdBtnText}>ओळखपत्र शेअर करा</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.newRegBtn}
                  onPress={() => setRegisteredMember(null)}
                >
                  <Text style={styles.newRegBtnText}>नवीन अर्ज भरा</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Membership Registration Form */
            <View style={styles.formWrapper}>
              <View style={styles.formIntroCard}>
                <Icon source="bow-arrow" size={26} color="#EA580C" />
                <Text style={styles.formIntroTitle}>शिवसेना सदस्य व पदासाठी इच्छुक नोंदणी</Text>
                <Text style={styles.formIntroDesc}>
                  कोपरगाव तालुक्यात हिंदुहृदयसम्राट बाळासाहेब ठाकरे व धर्मवीर आनंद दिघे साहेबांच्या विचारांवर आदरणीय एकनाथजी शिंदे साहेब यांच्या नेतृत्वाखाली शिवसेनेत सहभागी व्हा!
                </Text>
              </View>

              {/* Section 1: वैयक्तिक माहिती */}
              <View style={styles.formSection}>
                <Text style={styles.sectionHeaderTitle}>१. अर्जदाराची वैयक्तिक माहिती</Text>

                <Text style={styles.fieldLabel}>पूर्ण नाव *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="उदा. राहुल बापूसाहेब पवार"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                />

                <View style={styles.rowTwoCols}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>जन्मतारीख</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#9CA3AF"
                      value={dob}
                      onChangeText={setDob}
                    />
                  </View>
                  <View style={{ width: 80 }}>
                    <Text style={styles.fieldLabel}>वय</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="वय"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={age}
                      onChangeText={setAge}
                    />
                  </View>
                </View>

                <View style={styles.rowTwoCols}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>मोबाईल क्रमांक *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="१० अंकी मोबाईल नंबर"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={mobile}
                      onChangeText={setMobile}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>पर्यायी मोबाईल</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="पर्यायी नंबर"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={altMobile}
                      onChangeText={setAltMobile}
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>गावाचे नाव *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="उदा. संवत्सर, कोपरगाव शहर, पोहेगाव..."
                  placeholderTextColor="#9CA3AF"
                  value={village}
                  onChangeText={setVillage}
                />

                <Text style={styles.fieldLabel}>संपूर्ण पत्ता</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="घर क्रमांक, गल्ली, परिसर..."
                  placeholderTextColor="#9CA3AF"
                  value={address}
                  onChangeText={setAddress}
                />

                <View style={styles.rowTwoCols}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>शैक्षणिक पात्रता</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="उदा. पदवीधर, १० वी, ITI..."
                      placeholderTextColor="#9CA3AF"
                      value={education}
                      onChangeText={setEducation}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>व्यवसाय</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="उदा. शेती, नोकरी, व्यवसाय..."
                      placeholderTextColor="#9CA3AF"
                      value={occupation}
                      onChangeText={setOccupation}
                    />
                  </View>
                </View>
              </View>

              {/* Section 2: संघटनेत कोणत्या पदासाठी इच्छुक आहात? */}
              <View style={styles.formSection}>
                <Text style={styles.sectionHeaderTitle}>
                  २. आपण शिवसेना संघटनेमध्ये कोणत्या पदासाठी इच्छुक आहात? *
                </Text>
                <Text style={styles.sectionSubDesc}>खालीलपैकी इच्छित पदावर टिक करा:</Text>

                <View style={styles.rolesGrid}>
                  {SHIVSENA_ROLES_OPTIONS.map((role, idx) => {
                    const isSelected = selectedRole === role;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.roleOptionCard, isSelected && styles.roleOptionCardActive]}
                        onPress={() => setSelectedRole(role)}
                      >
                        <Icon
                          source={isSelected ? "radiobox-marked" : "radiobox-blank"}
                          size={18}
                          color={isSelected ? "#EA580C" : "#9CA3AF"}
                        />
                        <Text style={[styles.roleOptionText, isSelected && styles.roleOptionTextActive]}>
                          {role}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedRole.includes("इतर पद") && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.fieldLabel}>इच्छित पदाचे नाव प्रविष्ट करा *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="आपण ज्या पदावर काम करू इच्छिता ते पद लिहा..."
                      placeholderTextColor="#9CA3AF"
                      value={customRoleText}
                      onChangeText={setCustomRoleText}
                    />
                  </View>
                )}
              </View>

              {/* Section 3: कार्यक्षेत्र निवड */}
              <View style={styles.formSection}>
                <Text style={styles.sectionHeaderTitle}>३. इच्छित कार्यक्षेत्र निवड</Text>

                <Text style={styles.fieldLabel}>गण (Gan)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {WORK_AREAS_CONFIG.gans.map((g, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.choicePill, selectedGan === g && styles.choicePillActive]}
                        onPress={() => setSelectedGan(g)}
                      >
                        <Text style={[styles.choicePillText, selectedGan === g && styles.choicePillTextActive]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={styles.fieldLabel}>गट (Gat)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {WORK_AREAS_CONFIG.gats.map((gt, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.choicePill, selectedGat === gt && styles.choicePillActive]}
                        onPress={() => setSelectedGat(gt)}
                      >
                        <Text style={[styles.choicePillText, selectedGat === gt && styles.choicePillTextActive]}>
                          {gt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={styles.fieldLabel}>बूथ क्रमांक किंवा बूथ क्षेत्र (असल्यास)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="उदा. बूथ क्र. १२ किंवा शाळेचे नाव..."
                  placeholderTextColor="#9CA3AF"
                  value={boothNumber}
                  onChangeText={setBoothNumber}
                />
              </View>

              {/* Section 4: संघटनात्मक पार्श्वभूमी व योगदान */}
              <View style={styles.formSection}>
                <Text style={styles.sectionHeaderTitle}>४. संघटनात्मक अनुभव व वेळ</Text>

                <Text style={styles.fieldLabel}>
                  संघटनात्मक कामासाठी दर आठवड्याला किती वेळ देऊ शकता?
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="उदा. दररोज २ तास किंवा शनिवार-रविवार पूर्ण वेळ..."
                  placeholderTextColor="#9CA3AF"
                  value={dedicatedHoursPerWeek}
                  onChangeText={setDedicatedHoursPerWeek}
                />

                <Text style={styles.fieldLabel}>आपल्याकडे कार्यकर्त्यांची टीम आहे का?</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="उदा. ५-१० मित्र / कार्यकर्ते सोबत आहेत..."
                  placeholderTextColor="#9CA3AF"
                  value={teamCount}
                  onChangeText={setTeamCount}
                />

                <Text style={styles.fieldLabel}>शिवसेनेत सहभागी होण्यामागील उद्देश</Text>
                <TextInput
                  style={[styles.formInput, { height: 75, textAlignVertical: "top" }]}
                  placeholder="आपला उद्देश किंवा समाजसेवेची इच्छा थोडक्यात लिहा..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  value={joiningReason}
                  onChangeText={setJoiningReason}
                />
              </View>

              {/* Submit Registration Button */}
              <TouchableOpacity
                style={styles.submitMembershipBtn}
                activeOpacity={0.88}
                onPress={handleSubmitRegistration}
              >
                <Icon source="card-account-details-star" size={20} color="#FFFFFF" />
                <Text style={styles.submitMembershipBtnText}>
                  सदस्य नोंदणी सबमिट करा व ओळखपत्र मिळवा
                </Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </View>
          )
        ) : (
          /* ========================================= */
          /* TAB 2: 12 CAREER & LIFE UTILITY SERVICES  */
          /* ========================================= */
          <View style={styles.servicesGrid}>
            <View style={styles.servicesHeaderCard}>
              <Icon source="star-box-multiple" size={26} color="#EA580C" />
              <Text style={styles.servicesHeaderTitle}>१२ जीवनोपयोगी व करिअर सेवा</Text>
              <Text style={styles.servicesHeaderDesc}>
                कोपरगावच्या युवक, विद्यार्थी, महिला आणि सर्वसामान्य नागरिकांच्या शिक्षण, नोकरी, आरोग्य व स्वयंरोजगारासाठी उपलब्ध उपक्रम.
              </Text>
            </View>

            {CAREER_LIFE_SERVICES_DATA.map((srv) => (
              <TouchableOpacity
                key={srv.id}
                style={styles.lifeServiceCard}
                activeOpacity={0.88}
                onPress={() => setSelectedService(srv)}
              >
                <View style={styles.lifeServiceTop}>
                  <View style={styles.lifeServiceBadge}>
                    <Text style={styles.lifeServiceBadgeText}>{srv.order}</Text>
                  </View>
                  <Icon source={srv.iconName} size={26} color="#EA580C" />
                </View>

                <Text style={styles.lifeServiceTitle}>{srv.title}</Text>
                <Text style={styles.lifeServiceSubtitle} numberOfLines={2}>
                  {srv.subtitle}
                </Text>

                <View style={styles.lifeServiceFooter}>
                  <Text style={styles.lifeServiceCountText}>{srv.features.length} प्रमुख सुविधा</Text>
                  <Icon source="arrow-right" size={14} color="#EA580C" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>

      {/* Detail Modal for 12 Life Services */}
      <Modal
        visible={Boolean(selectedService)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedService(null)}
      >
        <View style={styles.serviceModalOverlay}>
          {selectedService && (
            <View style={styles.serviceModalContent}>
              <View style={styles.serviceModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceModalTitle}>{selectedService.title}</Text>
                  <Text style={styles.serviceModalSubtitle}>{selectedService.subtitle}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedService(null)}
                  style={styles.closeModalBtn}
                >
                  <Icon source="close" size={20} color="#1C1917" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.featuresHeading}>उपलब्ध सुविधा व मार्गदर्शन:</Text>
                {selectedService.features.map((feat, idx) => (
                  <View key={idx} style={styles.featRow}>
                    <Icon source="check-circle" size={16} color="#16A34A" />
                    <Text style={styles.featText}>{feat}</Text>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.contactDeskBtn}
                onPress={() => {
                  setSelectedService(null);
                  router.push("/contact");
                }}
              >
                <Text style={styles.contactDeskBtnText}>या सेवेसाठी थेट संपर्क साधा</Text>
              </TouchableOpacity>
            </View>
          )}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleGroup: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 15.5,
    fontWeight: "900",
    color: "#1C1917",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#EA580C",
    fontWeight: "700",
    marginTop: 1,
  },

  // Main Tabs
  switcherContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 8,
  },
  switchTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    gap: 6,
  },
  switchTabActive: {
    backgroundColor: "#EA580C",
  },
  switchTabText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#4B5563",
  },
  switchTabTextActive: {
    color: "#FFFFFF",
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },

  // Form Wrapper
  formWrapper: {
    gap: 16,
  },
  formIntroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    alignItems: "center",
  },
  formIntroTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#9A3412",
    marginTop: 6,
    textAlign: "center",
  },
  formIntroDesc: {
    fontSize: 12.5,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionHeaderTitle: {
    fontSize: 14.5,
    fontWeight: "900",
    color: "#1C1917",
    marginBottom: 4,
  },
  sectionSubDesc: {
    fontSize: 11.5,
    color: "#6B7280",
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#374151",
    marginTop: 10,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1.2,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 13.5,
    color: "#1C1917",
  },
  rowTwoCols: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },

  // Role Option Cards
  rolesGrid: {
    gap: 8,
  },
  roleOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  roleOptionCardActive: {
    borderColor: "#EA580C",
    backgroundColor: "#FFF7ED",
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    flex: 1,
  },
  roleOptionTextActive: {
    color: "#C2410C",
    fontWeight: "800",
  },

  // Choice Pills
  choicePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  choicePillActive: {
    backgroundColor: "#EA580C",
    borderColor: "#EA580C",
  },
  choicePillText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "700",
  },
  choicePillTextActive: {
    color: "#FFFFFF",
  },

  // Submit Button
  submitMembershipBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitMembershipBtnText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "900",
  },

  // Digital ID Card Result
  idCardSuccessContainer: {
    alignItems: "center",
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  successBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  digitalIdCard: {
    width: "100%",
    backgroundColor: "#EA580C",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#FDBA74",
  },
  idCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
    paddingBottom: 10,
    marginBottom: 12,
  },
  idCardPartyName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  idCardTaluka: {
    fontSize: 11,
    color: "#FED7AA",
    fontWeight: "700",
  },
  idCardBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  idAvatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FED7AA",
  },
  idInfoCol: {
    flex: 1,
  },
  idMemberName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1C1917",
  },
  idMemberRole: {
    fontSize: 13,
    fontWeight: "800",
    color: "#EA580C",
    marginTop: 2,
  },
  idMemberLoc: {
    fontSize: 11.5,
    color: "#4B5563",
    marginTop: 2,
  },
  idMemberNo: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
    marginTop: 2,
  },
  idCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  idLeaderName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  idDate: {
    fontSize: 10.5,
    color: "#FED7AA",
    marginTop: 2,
  },
  qrBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  verificationBox: {
    width: "100%",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 12,
    padding: 12,
    marginVertical: 14,
  },
  verifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  verifTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#92400E",
  },
  verifText: {
    fontSize: 12,
    color: "#B45309",
    marginTop: 3,
  },
  idCardActionsRow: {
    width: "100%",
    gap: 10,
  },
  shareIdBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16A34A",
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  shareIdBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  newRegBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 12,
    borderRadius: 12,
  },
  newRegBtnText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "800",
  },

  // 12 Life Services Grid
  servicesGrid: {
    gap: 12,
  },
  servicesHeaderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    alignItems: "center",
  },
  servicesHeaderTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#9A3412",
    marginTop: 6,
  },
  servicesHeaderDesc: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 17,
  },
  lifeServiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  lifeServiceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  lifeServiceBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  lifeServiceBadgeText: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#EA580C",
  },
  lifeServiceTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1C1917",
  },
  lifeServiceSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    lineHeight: 17,
  },
  lifeServiceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  lifeServiceCountText: {
    fontSize: 11,
    color: "#EA580C",
    fontWeight: "700",
  },

  // Service Detail Modal
  serviceModalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  serviceModalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
  },
  serviceModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 10,
    marginBottom: 12,
  },
  serviceModalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1C1917",
  },
  serviceModalSubtitle: {
    fontSize: 11.5,
    color: "#6B7280",
    marginTop: 2,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  featuresHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1C1917",
    marginBottom: 8,
  },
  featRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  featText: {
    flex: 1,
    fontSize: 12.5,
    color: "#374151",
    lineHeight: 18,
  },
  contactDeskBtn: {
    backgroundColor: "#EA580C",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 14,
  },
  contactDeskBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
  },
});
