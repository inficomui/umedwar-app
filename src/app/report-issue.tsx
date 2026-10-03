import React, { useState, useCallback } from "react";
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
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useCampaign } from "../context/CampaignContext";
import { toast } from "../components/Toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_BANNER_HEIGHT = Math.round((SCREEN_WIDTH - 32) * (86 / 448));

interface CategoryType {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: CategoryType[] = [
  { id: "roads", name: "रस्ता / वाहतूक", icon: "road-variant" },
  { id: "water", name: "पाणीपुरवठा", icon: "water-pump" },
  { id: "cleanliness", name: "कचरा / स्वच्छता", icon: "delete-outline" },
  { id: "lights", name: "रस्त्यावरील दिवे", icon: "lightbulb-outline" },
  { id: "drain", name: "गटार / नाले", icon: "view-headline" },
  { id: "environment", name: "पर्यावरण", icon: "tree-outline" },
  { id: "public", name: "सार्वजनिक सुविधा", icon: "account-group-outline" },
  { id: "education", name: "शिक्षण", icon: "school-outline" },
  { id: "health", name: "आरोग्य", icon: "heart-pulse" },
  { id: "other", name: "इतर", icon: "dots-horizontal" },
];

const PRESET_EVIDENCE_PHOTOS = [
  { id: "pothole", label: "रस्ते खड्डे", source: require("../../assets/images/issue_pothole.png") },
  { id: "garbage", label: "कचरा समस्या", source: require("../../assets/images/issue_garbage.png") },
  { id: "water", label: "पाणी गळती / पुरवठा", source: require("../../assets/images/issue_water.png") },
  { id: "drain", label: "ड्रेनेज / तुंबलेले गटार", source: require("../../assets/images/issue_drain.png") },
  { id: "light", label: "स्ट्रीटलाईट बंद", source: require("../../assets/images/issue_streetlight.png") },
];

export default function ReportIssueScreen() {
  const router = useRouter();

  const { createIssue, refreshIssues, currentUser, isLoggedIn } = useCampaign();

  // Form State
  const [selectedCategory, setSelectedCategory] = useState("roads");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("गजानन नगर, कोपरगाव, महाराष्ट्र");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [fullName, setFullName] = useState(currentUser?.name || "");
  const [mobileNumber, setMobileNumber] = useState(currentUser?.mobile || "");
  const [isAgreed, setIsAgreed] = useState(true);
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Sync user details if session loads
  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.name && !fullName) {
        setFullName(currentUser.name);
      }
      if (currentUser.mobile && !mobileNumber) {
        setMobileNumber(currentUser.mobile);
      }
    }
  }, [currentUser]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // 1. Android Image Picker - Media Gallery with Permission Check 1st
  const handlePickFromGallery = async () => {
    if (uploadedPhotos.length >= 4) {
      Alert.alert("मर्यादा पूर्ण", "आपण जास्तीत जास्त ४ फोटो जोडू शकता.");
      return;
    }

    try {
      // Ask / verify Media Library permission 1st
      const current = await ImagePicker.getMediaLibraryPermissionsAsync();
      let granted = current.granted;

      if (!granted) {
        const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
        granted = requested.granted;
      }

      if (!granted) {
        Alert.alert(
          "फोटो गॅलरी परवानगी आवश्यक आहे",
          "समस्येचे छायाचित्र जोडण्यासाठी आपल्या फोनची गॅलरी / मीडिया परवानगी आवश्यक आहे. कृपया ॲप सेटिंग्जमध्ये जाऊन परवानगी सुरू करा.",
          [
            { text: "रद्द करा", style: "cancel" },
            {
              text: "सेटिंग्ज उघडा",
              onPress: () => Linking.openSettings().catch(() => {}),
            },
          ]
        );
        return;
      }

      // Permission granted -> Launch Android Image Picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setUploadedPhotos((prev) => [...prev, selectedUri]);
        setIsPhotoModalOpen(false);
      }
    } catch (error) {
      console.warn("Gallery picker error:", error);
      Alert.alert("त्रुटी", "गॅलरीतून फोटो निवडताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.");
    }
  };

  // 2. Android Image Picker - Camera with Permission Check 1st
  const handleTakePhotoFromCamera = async () => {
    if (uploadedPhotos.length >= 4) {
      Alert.alert("मर्यादा पूर्ण", "आपण जास्तीत जास्त ४ फोटो जोडू शकता.");
      return;
    }

    try {
      // Ask / verify Camera permission 1st
      const current = await ImagePicker.getCameraPermissionsAsync();
      let granted = current.granted;

      if (!granted) {
        const requested = await ImagePicker.requestCameraPermissionsAsync();
        granted = requested.granted;
      }

      if (!granted) {
        Alert.alert(
          "कॅमेरा परवानगी आवश्यक आहे",
          "समस्येचा थेट पुरावा फोटो काढण्यासाठी कॅमेरा परवानगी आवश्यक आहे. कृपया ॲप सेटिंग्जमध्ये जाऊन परवानगी सुरू करा.",
          [
            { text: "रद्द करा", style: "cancel" },
            {
              text: "सेटिंग्ज उघडा",
              onPress: () => Linking.openSettings().catch(() => {}),
            },
          ]
        );
        return;
      }

      // Permission granted -> Launch Camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const capturedUri = result.assets[0].uri;
        setUploadedPhotos((prev) => [...prev, capturedUri]);
        setIsPhotoModalOpen(false);
      }
    } catch (error) {
      console.warn("Camera picker error:", error);
      Alert.alert("त्रुटी", "कॅमेऱ्याने फोटो काढताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.");
    }
  };

  const handleAddPresetPhoto = (photoSource: any) => {
    if (uploadedPhotos.length >= 4) {
      Alert.alert("मर्यादा पूर्ण", "आपण जास्तीत जास्त ४ फोटो जोडू शकता.");
      return;
    }
    setUploadedPhotos((prev) => [...prev, photoSource]);
    setIsPhotoModalOpen(false);
  };

  const handleAddUrlPhoto = () => {
    const trimmed = customPhotoUrl.trim();
    if (!trimmed) {
      Alert.alert("कृपया URL टाका", "फोटोची लिंक / URL प्रविष्ट करा.");
      return;
    }
    if (uploadedPhotos.length >= 4) {
      Alert.alert("मर्यादा पूर्ण", "आपण जास्तीत जास्त ४ फोटो जोडू शकता.");
      return;
    }
    setUploadedPhotos((prev) => [...prev, trimmed]);
    setCustomPhotoUrl("");
    setIsPhotoModalOpen(false);
    Alert.alert("फोटो जोडला", "फोटो यशस्वीरीत्या जोडला गेला आहे.");
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setUploadedPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleOpenGoogleMaps = () => {
    Linking.openURL("https://www.google.com/maps").catch(() => {
      Alert.alert("त्रुटी", "गुगल मॅप्स ॲप उघडता आले नाही.");
    });
  };

  const handleVerifyGoogleMapsUrl = () => {
    const trimmed = googleMapsUrl.trim();
    if (!trimmed) {
      Alert.alert("कृपया लिंक टाका", "आधी गुगल मॅप्सची लाईव्ह लोकेशन लिंक प्रविष्ट करा.");
      return;
    }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      Alert.alert(
        "अवैध लिंक",
        "कृपया वैध HTTP / HTTPS गुगल मॅप्स लिंक टाका (उदा. https://maps.app.goo.gl/...)"
      );
      return;
    }
    Linking.openURL(trimmed).catch(() => {
      Alert.alert("त्रुटी", "ही लिंक उघडता आली नाही. कृपया गुगल मॅप्स लिंक तपासा.");
    });
  };

  const handleSubmitIssue = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        "लॉगिन आवश्यक",
        "समस्या नोंदवण्यासाठी कृपया प्रथम लॉगिन करा.",
        [
          { text: "रद्द करा", style: "cancel" },
          { text: "लॉगिन करा", onPress: () => router.push("/login?returnTo=/report-issue") },
        ]
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert("कृपया समस्येचे शीर्षक टाका", "शीर्षक भरणे आवश्यक आहे.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("कृपया सविस्तर माहिती लिहा", "समस्येबद्दल थोडी माहिती नमूद करा.");
      return;
    }
    if (uploadedPhotos.length === 0) {
      Alert.alert(
        "पुरावा फोटो आवश्यक आहे",
        "समस्येच्या तक्रारीसाठी किमान १ पुरावा फोटो जोडणे आवश्यक आहे. कृपया कॅमेरा किंवा गॅलरीतून फोटो जोडा.",
        [
          { text: "कॅमेरा वापरा", onPress: handleTakePhotoFromCamera },
          { text: "गॅलरीतून निवडा", onPress: handlePickFromGallery },
          { text: "रद्द करा", style: "cancel" },
        ]
      );
      return;
    }
    if (!isAgreed) {
      Alert.alert("अटी मान्य करा", "कृपया माहितीच्या सत्यतेची हमी देणारा पर्याय निवडा.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createIssue({
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory as any,
        location: locationName.trim(),
        googleMapsUrl: googleMapsUrl.trim() || undefined,
        userId: currentUser?.id,
        userName: fullName.trim() || currentUser?.name || "नागरिक",
        userMobile: mobileNumber.trim() || currentUser?.mobile || "",
        userEmail: currentUser?.email,
        images: uploadedPhotos,
      });

      setIsSubmitting(false);
      refreshIssues().catch(() => {});
      toast.success(
        `तक्रार नोंदवली! क्रमांक: #${created.trackingId}`,
        "समस्या यशस्वीरीत्या नोंदवली"
      );
      Alert.alert(
        "समस्या यशस्वीरीत्या नोंदवली!",
        `आपली तक्रार नोंदवली गेली आहे.\nतक्रार क्रमांक: #${created.trackingId}\n\nनागरिक: ${fullName.trim() || currentUser?.name}\nमोबाईल: ${mobileNumber.trim() || currentUser?.mobile}\n\nलवकरच आमदार कार्यालयाकडून स्थानिक प्रशासनाकडे पाठवून कार्यवाही केली जाईल.\nजय महाराष्ट्र!`,
        [
          {
            text: "माझ्या समस्या पहा",
            onPress: () => router.replace("/my-issues"),
          },
        ]
      );
    } catch (err: any) {
      setIsSubmitting(false);
      const serverMessage = err?.message || "तक्रार नोंदवताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.";
      toast.error(serverMessage, "नोंदणी अयशस्वी (Failed)");
      Alert.alert(
        "तक्रार नोंदवण्यात त्रुटी (Submission Failed)",
        `${serverMessage}\n\nसर्व्हरवर ही तक्रार नोंदवली गेली नाही. कृपया थोड्या वेळाने प्रयत्न करा किंवा प्रशासकाशी संपर्क साधा.`
      );
    }
  };

  // Login Gate View
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" backgroundColor="#E05300" />

        {/* Top Header */}
        <View style={styles.topHeader}>
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
              <Text style={styles.headerMainTitle}>समस्या नोंदवा</Text>
              <Text style={styles.headerSubtitle}>नागरिक पडताळणी आवश्यक</Text>
            </View>
          </View>
        </View>

        {/* Login Required Notice Card */}
        <View style={styles.loginGateContainer}>
          <View style={styles.loginGateCard}>
            <View style={styles.loginGateIconWrap}>
              <Icon source="account-lock-outline" size={48} color="#E05300" />
            </View>
            <Text style={styles.loginGateTitle}>नागरिक लॉगिन आवश्यक आहे</Text>
            <Text style={styles.loginGateDesc}>
              आपल्या परिसरातील समस्या थेट आमदार कार्यालयाकडे नोंदवण्यासाठी आणि तक्रारीच्या निवारणाचा थेट पाठपुरावा करण्यासाठी प्रथम लॉगिन करणे आवश्यक आहे.
            </Text>

            <View style={styles.loginBenefitsList}>
              <View style={styles.loginBenefitItem}>
                <Icon source="check-circle" size={18} color="#16A34A" />
                <Text style={styles.loginBenefitText}>थेट आमदार व मनपा प्रशासनाकडे तक्रार पाठवली जाईल</Text>
              </View>
              <View style={styles.loginBenefitItem}>
                <Icon source="check-circle" size={18} color="#16A34A" />
                <Text style={styles.loginBenefitText}>तक्रार क्रमांक (Tracking ID) द्वारे थेट स्थिती ट्रॅक करा</Text>
              </View>
              <View style={styles.loginBenefitItem}>
                <Icon source="check-circle" size={18} color="#16A34A" />
                <Text style={styles.loginBenefitText}>समस्या सोडवल्यावर त्वरित मोबाईलवर सूचना प्राप्त होईल</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.loginGateActionBtn}
              onPress={() => router.push("/login?returnTo=/report-issue")}
              activeOpacity={0.88}
            >
              <Icon source="login" size={20} color="#FFFFFF" />
              <Text style={styles.loginGateActionText}>लॉगिन करा (Login)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginGateRegisterBtn}
              onPress={() => router.push("/register?returnTo=/report-issue")}
              activeOpacity={0.88}
            >
              <Icon source="account-plus" size={20} color="#EA580C" />
              <Text style={styles.loginGateRegisterText}>नवीन नागरिक नोंदणी (Register)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginGateBackBtn}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/home");
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.loginGateBackText}>मागे जा (Go Back)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.headerMainTitle}>नवीन समस्या नोंदवा</Text>
            <Text style={styles.headerSubtitle}>आपला परिसर, आपली जबाबदारी</Text>
          </View>
        </View>

        {/* Right: Golden Shiv Sena Logo */}
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
          {/* Hero Slogan & Commitment Banner */}
          <View style={styles.heroBannerWrap}>
            <Image
              source={require("../../assets/images/report_issue_hero_banner.png")}
              style={styles.heroBannerImg}
              contentFit="cover"
              priority="high"
            />
          </View>

          {/* STEP 1: समस्या प्रकार निवडा * */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepTitleCol}>
                <Text style={styles.stepTitle}>समस्या प्रकार निवडा *</Text>
                <Text style={styles.stepSubtitle}>योग्य प्रकार निवडल्याने जलद कार्यवाही होईल.</Text>
              </View>
            </View>

            {/* 10 Category Tiles in 2 Rows */}
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryTile,
                      isSelected && styles.categoryTileActive,
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Icon
                      source={cat.icon}
                      size={24}
                      color={isSelected ? "#EA580C" : "#57534E"}
                    />
                    <Text
                      style={[
                        styles.categoryTileText,
                        isSelected && styles.categoryTileTextActive,
                      ]}
                      numberOfLines={2}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* STEP 2: समस्येचे तपशील भरा * */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepTitleCol}>
                <Text style={styles.stepTitle}>समस्येचे तपशील भरा *</Text>
              </View>
            </View>

            {/* Field 1: समस्येचे शीर्षक * */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>समस्येचे शीर्षक *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="उदा. रस्त्यावर मोठे खड्डे आहेत"
                placeholderTextColor="#A8A29E"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Field 2: सविस्तर माहिती * */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>सविस्तर माहिती *</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="समस्येबद्दल संपूर्ण माहिती लिहा..."
                placeholderTextColor="#A8A29E"
                multiline
                numberOfLines={4}
                maxLength={500}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
              <Text style={styles.charCounter}>{description.length}/500</Text>
            </View>
          </View>

          {/* STEP 3: फोटो जोडा (किमान 1 फोटो) * */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepTitleCol}>
                <Text style={styles.stepTitle}>फोटो जोडा (किमान 1 फोटो) *</Text>
                <Text style={styles.stepSubtitle}>
                  समस्येचा पुरावा फोटो जोडल्याने तक्रारीचे गांभीर्य त्वरित समजते ({uploadedPhotos.length}/४ फोटो जोडले)
                </Text>
              </View>
            </View>

            {uploadedPhotos.length === 0 ? (
              <View style={styles.photoEmptyPickerCard}>
                <View style={styles.photoEmptyIconCircle}>
                  <Icon source="camera-plus-outline" size={32} color="#EA580C" />
                </View>
                <Text style={styles.photoEmptyTitle}>समस्येचा थेट पुरावा फोटो जोडा *</Text>
                <Text style={styles.photoEmptySubtitle}>
                  थेट कॅमेऱ्याने फोटो काढा किंवा आपल्या फोन गॅलरीतून निवडा (परवानगी विचारली जाईल)
                </Text>

                <View style={styles.photoEmptyButtonsRow}>
                  <TouchableOpacity
                    style={styles.photoDirectCameraBtn}
                    onPress={handleTakePhotoFromCamera}
                    activeOpacity={0.85}
                  >
                    <Icon source="camera" size={18} color="#FFFFFF" />
                    <Text style={styles.photoDirectCameraText}>कॅमेरा वापरा</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.photoDirectGalleryBtn}
                    onPress={handlePickFromGallery}
                    activeOpacity={0.85}
                  >
                    <Icon source="image-multiple" size={18} color="#EA580C" />
                    <Text style={styles.photoDirectGalleryText}>गॅलरीतून निवडा</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.photoMoreOptionsBtn}
                  onPress={() => setIsPhotoModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Icon source="plus-circle-outline" size={15} color="#64748B" />
                  <Text style={styles.photoMoreOptionsText}>इतर पर्याय / नमुना फोटो</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoSlotsRow}>
                {uploadedPhotos.map((photo, idx) => {
                  const photoSrc = typeof photo === "string" ? { uri: photo } : photo;
                  return (
                    <View key={idx} style={styles.photoThumbContainer}>
                      <Image source={photoSrc} style={styles.uploadedPhotoThumb} contentFit="cover" />
                      <TouchableOpacity
                        style={styles.photoDeleteBadge}
                        onPress={() => handleRemovePhoto(idx)}
                        activeOpacity={0.8}
                      >
                        <Icon source="close" size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {uploadedPhotos.length < 4 && (
                  <TouchableOpacity
                    style={styles.uploadSlotActive}
                    onPress={() => setIsPhotoModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Icon source="camera-plus" size={24} color="#EA580C" />
                    <Text style={styles.uploadSlotText}>आणखी जोडा</Text>
                    <Text style={styles.uploadSlotSubtext}>({uploadedPhotos.length}/४)</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* STEP 4: ठिकाण व गुगल लाईव्ह लोकेशन * */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeaderBetween}>
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepNumberCircle}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepTitle}>ठिकाण व लाईव्ह लोकेशन *</Text>
              </View>

              <TouchableOpacity
                style={styles.useCurrentLocationBtn}
                onPress={() => {
                  setLocationName("गजानन नगर, प्रभाग क्र. १२, कोपरगाव");
                  Alert.alert("स्थान निश्चित झाले", "आपले सध्याचे अचूक परिसर स्थान निवडले गेले आहे.");
                }}
                activeOpacity={0.8}
              >
                <Icon source="crosshairs-gps" size={15} color="#3B82F6" />
                <Text style={styles.useCurrentLocationText}>सध्याचे ठिकाण वापरा</Text>
              </TouchableOpacity>
            </View>

            {/* Location Map Preview Card */}
            <View style={styles.locationMapCard}>
              <Image
                source={require("../../assets/images/issue_detail_map.png")}
                style={styles.locationMapImg}
                contentFit="cover"
              />

              <View style={styles.locationTextCol}>
                <Text style={styles.locationMainText} numberOfLines={2}>
                  {locationName}
                </Text>
                <Text style={styles.locationSubText}>परिसर व लँडमार्क</Text>
              </View>

              <TouchableOpacity
                style={styles.selectOnMapBtn}
                onPress={() =>
                  Alert.alert("परिसर निवड", "परिसराचे अचूक नाव खालील पत्ता रकान्यात तपासा.")
                }
                activeOpacity={0.8}
              >
                <Icon source="target" size={16} color="#EA580C" />
                <Text style={styles.selectOnMapText}>नकाशावर</Text>
              </TouchableOpacity>
            </View>

            {/* Location Address Text Input */}
            <View style={[styles.inputGroup, { marginTop: 10 }]}>
              <Text style={styles.fieldLabel}>परिसराचा पत्ता / लँडमार्क *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="उदा. गजानन नगर, मंदिर जवळ, प्रभाग क्र. १२"
                placeholderTextColor="#A8A29E"
                value={locationName}
                onChangeText={setLocationName}
              />
            </View>

            {/* Google Live Location URL Input */}
            <View style={[styles.inputGroup, { marginTop: 12 }]}>
              <View style={styles.googleMapsHeaderRow}>
                <Icon source="google-maps" size={18} color="#EA580C" />
                <Text style={styles.fieldLabel}>गुगल मॅप्स लाईव्ह लोकेशन लिंक (Google Maps URL)</Text>
              </View>
              <Text style={styles.fieldHint}>
                तक्रारीच्या अचूक जागेची गुगल मॅप्स / लाईव्ह लोकेशन लिंक येथे टाका किंवा पेस्ट करा:
              </Text>
              <TextInput
                style={[styles.textInput, { marginBottom: 6 }]}
                placeholder="उदा. https://maps.app.goo.gl/... किंवा https://maps.google.com/?q=..."
                placeholderTextColor="#A8A29E"
                value={googleMapsUrl}
                onChangeText={setGoogleMapsUrl}
                autoCapitalize="none"
                keyboardType="url"
                autoCorrect={false}
              />

              {googleMapsUrl.trim().length > 0 && (
                <View style={styles.googleMapsSuccessBadge}>
                  <Icon source="check-circle" size={15} color="#16A34A" />
                  <Text style={styles.googleMapsSuccessBadgeText}>
                    गुगल मॅप्स थेट लोकेशन लिंक जोडली गेली आहे
                  </Text>
                </View>
              )}

              <View style={styles.googleMapsActionsRow}>
                <TouchableOpacity
                  style={styles.googleMapsActionBtn}
                  onPress={handleOpenGoogleMaps}
                  activeOpacity={0.85}
                >
                  <Icon source="map-search" size={16} color="#475569" />
                  <Text style={styles.googleMapsActionBtnText}>गुगल मॅप्स उघडा</Text>
                </TouchableOpacity>

                {googleMapsUrl.trim().length > 0 && (
                  <TouchableOpacity
                    style={[styles.googleMapsActionBtn, styles.googleMapsVerifyBtn]}
                    onPress={handleVerifyGoogleMapsUrl}
                    activeOpacity={0.85}
                  >
                    <Icon source="open-in-new" size={16} color="#EA580C" />
                    <Text style={styles.googleMapsVerifyText}>लिंक तपासा (Verify Link)</Text>
                  </TouchableOpacity>
                )}

                {googleMapsUrl.trim().length > 0 && (
                  <TouchableOpacity
                    style={[styles.googleMapsActionBtn, styles.googleMapsClearBtn]}
                    onPress={() => setGoogleMapsUrl("")}
                    activeOpacity={0.85}
                  >
                    <Icon source="close-circle-outline" size={15} color="#64748B" />
                    <Text style={styles.googleMapsClearBtnText}>काढा</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* STEP 5: संपर्क माहिती */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumberText}>5</Text>
              </View>
              <View style={styles.stepTitleCol}>
                <View style={styles.stepTitleVerifiedRow}>
                  <Text style={styles.stepTitle}>संपर्क माहिती</Text>
                  {isLoggedIn && (
                    <View style={styles.verifiedBadge}>
                      <Icon source="check-decagram" size={13} color="#16A34A" />
                      <Text style={styles.verifiedBadgeText}>सत्यापित नागरिक</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.stepSubtitle}>
                  {isLoggedIn
                    ? `तक्रारदार: ${currentUser?.name || fullName} (प्रशासनाला ही माहिती पाठवली जाईल)`
                    : "आम्ही तुमच्याशी या माहितीच्या माध्यमातून संपर्क साधू."}
                </Text>
              </View>
            </View>

            {/* Inputs: Name & Mobile */}
            <View style={styles.contactInputsRow}>
              {/* Name */}
              <View style={styles.contactInputWrap}>
                <View style={styles.contactInputInner}>
                  <Icon source="account" size={18} color="#78716C" />
                  <View style={styles.inputCol}>
                    <Text style={styles.inputMiniLabel}>पूर्ण नाव *</Text>
                    <TextInput
                      style={styles.singleLineInput}
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                </View>
              </View>

              {/* Mobile */}
              <View style={styles.contactInputWrap}>
                <View style={styles.contactInputInner}>
                  <Icon source="phone" size={18} color="#78716C" />
                  <View style={styles.inputCol}>
                    <Text style={styles.inputMiniLabel}>मोबाईल नंबर *</Text>
                    <TextInput
                      style={styles.singleLineInput}
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Checkbox */}
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
                मी दिलेली माहिती योग्य असून समस्या माझ्या माहितीनुसार खरी आहे.
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmitIssue}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              <Icon source="send" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                {isSubmitting ? "नोंदवत आहे..." : "समस्या नोंदवा"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Photo Selection Modal */}
      <Modal
        visible={isPhotoModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhotoModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.photoModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Icon source="camera" size={22} color="#EA580C" />
                <Text style={styles.modalTitle}>समस्येचा फोटो जोडा</Text>
              </View>
              <TouchableOpacity onPress={() => setIsPhotoModalOpen(false)}>
                <Icon source="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              समस्येचा पुरावा फोटो जोडण्यासाठी खालीलपैकी पर्याय निवडा:
            </Text>

            {/* Primary Actions: Android Camera & Gallery with Permissions 1st */}
            <View style={styles.modalPrimaryActions}>
              <TouchableOpacity
                style={styles.modalCameraActionBtn}
                onPress={handleTakePhotoFromCamera}
                activeOpacity={0.88}
              >
                <View style={styles.modalActionIconWrapCamera}>
                  <Icon source="camera" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.modalActionTextCol}>
                  <Text style={styles.modalActionTitle}>थेट कॅमेऱ्याने फोटो काढा</Text>
                  <Text style={styles.modalActionSubtitle}>कॅमेरा ॲक्सेस परवानगी विचारली जाईल</Text>
                </View>
                <Icon source="chevron-right" size={20} color="#EA580C" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalGalleryActionBtn}
                onPress={handlePickFromGallery}
                activeOpacity={0.88}
              >
                <View style={styles.modalActionIconWrapGallery}>
                  <Icon source="image-multiple" size={22} color="#EA580C" />
                </View>
                <View style={styles.modalActionTextCol}>
                  <Text style={styles.modalActionTitle}>फोन गॅलरीतून निवडा</Text>
                  <Text style={styles.modalActionSubtitle}>गॅलरी / मीडिया परवानगी विचारली जाईल</Text>
                </View>
                <Icon source="chevron-right" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Presets List */}
            <Text style={styles.modalSectionLabel}>किंवा समस्येनुसार नमुना फोटो निवडा:</Text>
            <View style={styles.presetGrid}>
              {PRESET_EVIDENCE_PHOTOS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.presetTile}
                  onPress={() => handleAddPresetPhoto(p.source)}
                  activeOpacity={0.85}
                >
                  <Image source={p.source} style={styles.presetThumb} contentFit="cover" />
                  <Text style={styles.presetLabel} numberOfLines={1}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom URL Input */}
            <View style={styles.modalUrlSection}>
              <Text style={styles.modalSectionLabel}>किंवा फोटोची थेट लिंक / इमेज URL टाका:</Text>
              <View style={styles.urlInputRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginBottom: 0, height: 42, fontSize: 12 }]}
                  placeholder="https://... इमेज URL पेस्ट करा"
                  placeholderTextColor="#94A3B8"
                  value={customPhotoUrl}
                  onChangeText={setCustomPhotoUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <TouchableOpacity
                  style={styles.addUrlBtn}
                  onPress={handleAddUrlPhoto}
                  activeOpacity={0.85}
                >
                  <Text style={styles.addUrlBtnText}>जोडा</Text>
                </TouchableOpacity>
              </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Top Saffron Header
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
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
  },
  headerSubtitle: {
    color: "#FED7AA",
    fontSize: 11.5,
    fontWeight: "600",
  },
  logoEmblemContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  // Hero Slogan Banner
  heroBannerWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    height: HERO_BANNER_HEIGHT,
    backgroundColor: "#FFF7ED",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  heroBannerImg: {
    width: "100%",
    height: "100%",
  },

  // Step Card Container
  stepCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  stepHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  stepHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  stepNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  stepTitleCol: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1C1917",
  },
  stepSubtitle: {
    fontSize: 11,
    color: "#78716C",
    marginTop: 1,
  },

  // Category Grid (2 rows of 5)
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "space-between",
  },
  categoryTile: {
    width: (SCREEN_WIDTH - 32 - 28 - 24) / 5,
    height: 64,
    backgroundColor: "#FAF9F6",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  categoryTileActive: {
    backgroundColor: "#FFF7ED",
    borderColor: "#EA580C",
    borderWidth: 1.5,
  },
  categoryTileText: {
    fontSize: 9.5,
    color: "#57534E",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 3,
    lineHeight: 12,
  },
  categoryTileTextActive: {
    color: "#EA580C",
    fontWeight: "900",
  },

  // Inputs
  inputGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#44403C",
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: "#FAF9F6",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: "#1C1917",
  },
  textAreaInput: {
    height: 80,
    paddingTop: 8,
    textAlignVertical: "top",
  },
  charCounter: {
    fontSize: 10,
    color: "#A8A29E",
    textAlign: "right",
    marginTop: 3,
  },

  // Photo Slots
  photoSlotsRow: {
    flexDirection: "row",
    gap: 8,
  },
  uploadSlotActive: {
    width: 78,
    height: 78,
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#EA580C",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  uploadSlotText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#EA580C",
    marginTop: 2,
  },
  uploadSlotSubtext: {
    fontSize: 8.5,
    color: "#9A3412",
  },
  photoThumbContainer: {
    position: "relative",
    width: 78,
    height: 78,
    borderRadius: 12,
    marginRight: 8,
  },
  uploadedPhotoThumb: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EA580C",
  },
  photoDeleteBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#EF4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    elevation: 3,
  },

  // Location Step
  googleMapsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  fieldHint: {
    fontSize: 11,
    color: "#78716C",
    marginBottom: 6,
    lineHeight: 15,
  },
  googleMapsActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  googleMapsActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  googleMapsActionBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  googleMapsVerifyBtn: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FFEDD5",
  },
  googleMapsVerifyText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EA580C",
  },
  useCurrentLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  useCurrentLocationText: {
    fontSize: 11,
    color: "#3B82F6",
    fontWeight: "700",
  },
  locationMapCard: {
    flexDirection: "row",
    backgroundColor: "#FAF9F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    padding: 8,
    alignItems: "center",
    gap: 10,
  },
  locationMapImg: {
    width: 90,
    height: 58,
    borderRadius: 8,
  },
  locationTextCol: {
    flex: 1,
  },
  locationMainText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1C1917",
    lineHeight: 16,
  },
  locationSubText: {
    fontSize: 10.5,
    color: "#78716C",
    marginTop: 2,
  },
  selectOnMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFEDD5",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 3,
  },
  selectOnMapText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#EA580C",
  },

  // Contact Info
  contactInputsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  contactInputWrap: {
    flex: 1,
  },
  contactInputInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF9F6",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 44,
    gap: 6,
  },
  inputCol: {
    flex: 1,
  },
  inputMiniLabel: {
    fontSize: 9.5,
    color: "#78716C",
    fontWeight: "600",
  },
  singleLineInput: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1C1917",
    padding: 0,
    height: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#D6D3D1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSquareChecked: {
    backgroundColor: "#EA580C",
    borderColor: "#EA580C",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 11,
    color: "#44403C",
    lineHeight: 15,
  },

  // Submit Section
  submitSection: {
    marginHorizontal: 16,
    marginTop: 14,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#EA580C",
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

  // Verified Badge in Step 5
  stepTitleVerifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803D",
  },

  // Login Gate Screen Styles
  loginGateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#F8FAFC",
  },
  loginGateCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  loginGateIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#FFEDD5",
  },
  loginGateTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 10,
  },
  loginGateDesc: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  loginBenefitsList: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  loginBenefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loginBenefitText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    flex: 1,
  },
  loginGateActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 8,
  },
  loginGateActionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  loginGateRegisterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "#EA580C",
    width: "100%",
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  loginGateRegisterText: {
    color: "#EA580C",
    fontSize: 14,
    fontWeight: "800",
  },
  loginGateBackBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  loginGateBackText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },

  // Photo Selection Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  photoModalCard: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1C1917",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12,
    lineHeight: 17,
  },
  modalSectionLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 8,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  presetTile: {
    width: "31%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 6,
    alignItems: "center",
  },
  presetThumb: {
    width: "100%",
    height: 48,
    borderRadius: 6,
    marginBottom: 4,
  },
  presetLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#334155",
    textAlign: "center",
  },
  modalUrlSection: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12,
  },
  urlInputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  addUrlBtn: {
    backgroundColor: "#EA580C",
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addUrlBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  // Empty Photo Card Styles
  photoEmptyPickerCard: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#FDBA74",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  photoEmptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  photoEmptyTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#9A3412",
    marginBottom: 4,
  },
  photoEmptySubtitle: {
    fontSize: 11.5,
    color: "#78716C",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  photoEmptyButtonsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    justifyContent: "center",
    marginBottom: 10,
  },
  photoDirectCameraBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EA580C",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 2,
  },
  photoDirectCameraText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "800",
  },
  photoDirectGalleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.2,
    borderColor: "#EA580C",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  photoDirectGalleryText: {
    color: "#EA580C",
    fontSize: 12.5,
    fontWeight: "800",
  },
  photoMoreOptionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  photoMoreOptionsText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#64748B",
  },

  // Modal Primary Actions (Camera & Gallery)
  modalPrimaryActions: {
    gap: 10,
    marginBottom: 16,
  },
  modalCameraActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "#FDBA74",
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  modalActionIconWrapCamera: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center",
  },
  modalGalleryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  modalActionIconWrapGallery: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
  },
  modalActionTextCol: {
    flex: 1,
  },
  modalActionTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#1E293B",
  },
  modalActionSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },

  // Google Maps Success Badge and Clear Btn
  googleMapsSuccessBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  googleMapsSuccessBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#16A34A",
  },
  googleMapsClearBtn: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  googleMapsClearBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
});
