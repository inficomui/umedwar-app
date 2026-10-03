import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Share,
  Alert,
  Linking,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign, IssueItem } from "../context/CampaignContext";
import { issuesApi } from "../services/issuesApi";
import { toast } from "../components/Toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function IssueDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { issues, refreshIssues } = useCampaign();

  const inMemoryIssue: IssueItem | undefined = Array.isArray(issues)
    ? issues.find((i) => i.id === params.id || i.trackingId === params.id) ||
      (params.id ? undefined : issues[0])
    : undefined;

  const [fetchedIssue, setFetchedIssue] = useState<IssueItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!inMemoryIssue && Boolean(params.id));

  useEffect(() => {
    if (params.id) {
      issuesApi
        .getIssueById(params.id)
        .then((res) => {
          if (res.data) {
            setFetchedIssue(res.data);
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [params.id]);

  const issue: IssueItem | undefined = fetchedIssue || inMemoryIssue;
  const timeline = Array.isArray(issue?.timeline) ? issue.timeline : [];

  const [isSaved, setIsSaved] = useState(false);
  const [isNotified, setIsNotified] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (params.id) {
        const singleRes = await issuesApi.getIssueById(params.id);
        if (singleRes.data) {
          setFetchedIssue(singleRes.data);
        }
      }
      await refreshIssues();
    } finally {
      setRefreshing(false);
    }
  }, [params.id, refreshIssues]);

  if (isLoading && !issue) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" backgroundColor="#E05300" />
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/issues"))}
            activeOpacity={0.85}
          >
            <Icon source="arrow-left" size={22} color="#E05300" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerMainTitle}>समस्या तपशील</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <ActivityIndicator size="large" color="#E05300" />
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#6B7280", marginTop: 16 }}>
            समस्येचे थेट अपडेट लोड होत आहेत...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!issue) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" backgroundColor="#E05300" />
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/issues"))}
            activeOpacity={0.85}
          >
            <Icon source="arrow-left" size={22} color="#E05300" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerMainTitle}>समस्या तपशील</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Icon source="clipboard-alert-outline" size={56} color="#D1D5DB" />
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#374151", marginTop: 16 }}>
            समस्या आढळली नाही
          </Text>
          <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 6, textAlign: "center" }}>
            सध्या ही समस्या उपलब्ध नाही किंवा अस्तित्वात नाही.
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 20,
              backgroundColor: "#E05300",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 10,
            }}
            onPress={() => router.replace("/issues")}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>समस्या यादीवर परत जा</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `समस्या क्रमांक #${issue.trackingId}\n${issue.title} - ${issue.location}\nस्थिती: ${issue.statusText}\n\nशिवसेना (शिंदे गट) अधिकृत ॲप`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCallOfficer = () => {
    const phone = issue.assignedOfficer?.phone || "+919876543210";
    Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
  };

  const handleOpenMap = () => {
    if (issue.googleMapsUrl && issue.googleMapsUrl.trim().length > 0) {
      const url = issue.googleMapsUrl.trim();
      Linking.openURL(url).catch(() => {
        const loc = encodeURIComponent(issue.location);
        Linking.openURL(`https://maps.google.com/?q=${loc}`);
      });
      return;
    }
    const loc = encodeURIComponent(issue.location);
    Linking.openURL(`https://maps.google.com/?q=${loc}`);
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
            <Text style={styles.headerMainTitle}>समस्या तपशील</Text>
            <Text style={styles.headerSubtitle}>समस्या क्रमांक #{issue.trackingId}</Text>
          </View>
        </View>

        {/* Right: Share & Overflow 3-dots */}
        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Icon source="share-variant" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() =>
              Alert.alert(
                "पर्याय",
                `१. तक्रार क्रमांक: #${issue.trackingId}\n२. स्थिती: ${issue.statusText}\n३. अधिकारी संपर्क: ${issue.assignedOfficer?.phone || "उपलब्ध नाही"}`
              )
            }
            activeOpacity={0.8}
          >
            <Icon source="dots-vertical" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scrollable Content */}
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
        {/* Header Info Card */}
        <View style={styles.headerInfoCard}>
          <View style={styles.headerInfoTopRow}>
            {/* Category Icon */}
            <View style={styles.roadIconBox}>
              <Icon
                source={
                  issue.category === "water"
                    ? "water-pump"
                    : issue.category === "electricity" || issue.category === "lights"
                    ? "lightbulb-outline"
                    : issue.category === "cleanliness" || issue.category === "drain"
                    ? "delete-outline"
                    : "road"
                }
                size={28}
                color="#475569"
              />
            </View>

            {/* Title & Category Column */}
            <View style={styles.headerInfoTextCol}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{issue.categoryName}</Text>
              </View>
              <Text style={styles.issueHeadline}>{issue.title}</Text>
              <View style={styles.metaRow}>
                <Icon source="map-marker" size={13} color="#EA580C" />
                <Text style={styles.metaLocation} numberOfLines={1}>
                  {issue.location}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Icon source="calendar-blank-outline" size={13} color="#78716C" />
                <Text style={styles.metaDate}>नोंदवली : {issue.date}</Text>
              </View>
            </View>

            {/* Right Status Card */}
            <View style={styles.statusBox}>
              <View style={styles.statusRow}>
                <Icon
                  source={
                    issue.status === "resolved"
                      ? "check-circle"
                      : issue.status === "pending"
                      ? "dots-horizontal-circle"
                      : "clock-outline"
                  }
                  size={15}
                  color={issue.statusColor || "#EA580C"}
                />
                <Text
                  style={[
                    styles.statusTitle,
                    { color: issue.statusColor || "#EA580C" },
                  ]}
                >
                  {issue.statusText}
                </Text>
              </View>
              <Text style={styles.estLabel}>अंदाजित पूर्णता</Text>
              <Text style={styles.estDate}>
                {issue.estimatedResolutionDate || "लवकरच"}
              </Text>
            </View>
          </View>
        </View>

        {/* 4-Step Horizontal Timeline Card */}
        <View style={styles.timelineStepCard}>
          <View style={styles.timelineStepsRow}>
            {/* Step 1: समस्या नोंदवली */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                <Icon source="check" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.stepLabel}>समस्या नोंदवली</Text>
              <Text style={styles.stepDate}>
                {timeline[0]?.timestamp?.split(",")[0] || issue.date}
              </Text>
            </View>

            <View
              style={[
                styles.stepLine,
                (issue.status === "forwarded" ||
                  issue.status === "in_progress" ||
                  issue.status === "resolved") &&
                  styles.stepLineActive,
              ]}
            />

            {/* Step 2: अधिकाऱ्यांकडे पाठवली */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  (issue.status === "forwarded" ||
                    issue.status === "in_progress" ||
                    issue.status === "resolved")
                    ? styles.stepCircleCompleted
                    : styles.stepCirclePending,
                ]}
              >
                {issue.status === "forwarded" ||
                issue.status === "in_progress" ||
                issue.status === "resolved" ? (
                  <Icon source="check" size={16} color="#FFFFFF" />
                ) : (
                  <View style={styles.stepDotGray} />
                )}
              </View>
              <Text style={styles.stepLabel}>अधिकाऱ्यांकडे वर्ग</Text>
              <Text style={styles.stepDate}>
                {timeline[1]?.completed
                  ? timeline[1]?.timestamp?.split(",")[0]
                  : "- - -"}
              </Text>
            </View>

            <View
              style={[
                styles.stepLine,
                (issue.status === "in_progress" || issue.status === "resolved") &&
                  styles.stepLineActive,
              ]}
            />

            {/* Step 3: काम प्रगतीपथावर */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  issue.status === "resolved"
                    ? styles.stepCircleCompleted
                    : issue.status === "in_progress"
                    ? styles.stepCircleCurrent
                    : styles.stepCirclePending,
                ]}
              >
                {issue.status === "resolved" ? (
                  <Icon source="check" size={16} color="#FFFFFF" />
                ) : issue.status === "in_progress" ? (
                  <View style={styles.stepDotOrange} />
                ) : (
                  <View style={styles.stepDotGray} />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  issue.status === "in_progress" && styles.stepLabelActive,
                ]}
              >
                प्रगतीपथावर
              </Text>
              <Text style={styles.stepDate}>
                {timeline[2]?.completed
                  ? timeline[2]?.timestamp?.split(",")[0]
                  : "- - -"}
              </Text>
            </View>

            <View
              style={[
                styles.stepLine,
                issue.status === "resolved" && styles.stepLineActive,
              ]}
            />

            {/* Step 4: काम पूर्ण */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  issue.status === "resolved"
                    ? styles.stepCircleCompleted
                    : styles.stepCirclePending,
                ]}
              >
                {issue.status === "resolved" ? (
                  <Icon source="check" size={16} color="#FFFFFF" />
                ) : (
                  <View style={styles.stepDotGray} />
                )}
              </View>
              <Text style={styles.stepLabel}>काम पूर्ण</Text>
              <Text style={styles.stepDate}>
                {issue.status === "resolved"
                  ? timeline[3]?.timestamp?.split(",")[0] || "पूर्ण"
                  : "- - -"}
              </Text>
            </View>
          </View>
        </View>

        {/* "समस्येचे फोटो" (Issue Photos Section) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderBetween}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIconSquare, { backgroundColor: "#EA580C" }]}>
                <Icon source="image" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.sectionHeadingText}>समस्येचे फोटो</Text>
            </View>

            <View style={styles.photosRightGroup}>
              <Text style={styles.photoCountText}>
                {issue.images && issue.images.length > 0
                  ? `${issue.images.length} फोटो`
                  : "१ फोटो"}
              </Text>
              <TouchableOpacity
                style={styles.viewAllPhotosBtn}
                onPress={() =>
                  Alert.alert("फोटो गॅलरी", "या समस्येचे सर्व उपलब्ध फोटो लोड होत आहेत.")
                }
                activeOpacity={0.8}
              >
                <Text style={styles.viewAllPhotosText}>सर्व फोटो पहा</Text>
                <Icon source="arrow-right" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Photos Row */}
          <View style={styles.photosRow}>
            {(issue.images && issue.images.length > 0 ? issue.images : [issue.image]).map(
              (img, idx) => {
                let src: any = require("../../assets/images/issue_pothole.png");
                if (typeof img === "string" && img.trim().length > 0) {
                  src = { uri: img.trim() };
                } else if (img && typeof img === "object" && img.uri && typeof img.uri === "string" && img.uri.trim().length > 0) {
                  src = { uri: img.uri.trim() };
                } else if (typeof img === "number") {
                  src = img;
                }
                return (
                  <View key={idx} style={styles.photoCol}>
                    <Image
                      source={src}
                      style={styles.photoImg}
                      contentFit="cover"
                    />
                  </View>
                );
              }
            )}
          </View>
        </View>

        {/* "समस्येचे वर्णन" (Description Card) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIconSquare, { backgroundColor: "#64748B" }]}>
              <Icon source="file-document-outline" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionHeadingText}>समस्येचे वर्णन</Text>
          </View>
          <Text style={styles.descriptionParagraph}>{issue.description}</Text>
        </View>

        {/* 4 Info Cards (2x2 Grid) */}
        <View style={styles.infoGrid}>
          {/* Card 1: संबंधित विभाग */}
          <View style={styles.infoGridCard}>
            <View style={[styles.infoIconSquare, { backgroundColor: "#EFF6FF" }]}>
              <Icon source="office-building" size={18} color="#3B82F6" />
            </View>
            <Text style={styles.infoLabel}>संबंधित विभाग</Text>
            <Text style={styles.infoValue}>
              {issue.department || "स्थानिक प्रशासन विभाग"}
            </Text>
          </View>

          {/* Card 2: जबाबदार अधिकारी */}
          <View style={styles.infoGridCard}>
            <View style={[styles.infoIconSquare, { backgroundColor: "#EFF6FF" }]}>
              <Icon source="account" size={18} color="#3B82F6" />
            </View>
            <Text style={styles.infoLabel}>जबाबदार अधिकारी</Text>
            <Text style={styles.infoValue}>
              {issue.assignedOfficer?.name || "कार्यकारी अधिकारी"}
            </Text>
            <TouchableOpacity
              style={styles.contactOfficerBtn}
              onPress={handleCallOfficer}
              activeOpacity={0.8}
            >
              <Icon source="phone" size={13} color="#EA580C" />
              <Text style={styles.contactOfficerText}>संपर्क करा</Text>
            </TouchableOpacity>
          </View>

          {/* Card 3: अंदाजित पूर्णता दिनांक */}
          <View style={styles.infoGridCard}>
            <View style={[styles.infoIconSquare, { backgroundColor: "#ECFDF5" }]}>
              <Icon source="calendar" size={18} color="#10B981" />
            </View>
            <Text style={styles.infoLabel}>अंदाजित पूर्णता दिनांक</Text>
            <Text style={styles.infoValue}>
              {issue.estimatedResolutionDate || "लवकरच"}
            </Text>
          </View>

          {/* Card 4: शेवटचे अपडेट */}
          <View style={styles.infoGridCard}>
            <View style={[styles.infoIconSquare, { backgroundColor: "#FFF7ED" }]}>
              <Icon source="file-document" size={18} color="#F97316" />
            </View>
            <Text style={styles.infoLabel}>शेवटचे अपडेट</Text>
            <Text style={styles.infoValue}>
              {timeline && timeline.length > 0
                ? timeline[timeline.length - 1].timestamp
                : issue.date}
            </Text>
          </View>
        </View>

        {/* "समस्येचे ठिकाण" (Location & Map Card) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderBetween}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIconSquare, { backgroundColor: "#EA580C" }]}>
                <Icon source="map-marker" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.sectionHeadingText}>समस्येचे ठिकाण</Text>
            </View>

            <TouchableOpacity
              style={styles.viewMapBtn}
              onPress={handleOpenMap}
              activeOpacity={0.8}
            >
              <Text style={styles.viewMapBtnText}>नकाशात पहा</Text>
              <Icon source="arrow-right" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.locationContentRow}>
            {/* Map Preview */}
            <TouchableOpacity
              style={styles.mapWrap}
              onPress={handleOpenMap}
              activeOpacity={0.9}
            >
              <Image
                source={require("../../assets/images/issue_detail_map.png")}
                style={styles.mapSnapshot}
                contentFit="cover"
              />
            </TouchableOpacity>

            {/* Address Details */}
            <View style={styles.addressCol}>
              <View style={styles.addressLabelRow}>
                <Icon source="map-marker-radius" size={14} color="#475569" />
                <Text style={styles.addressLabel}>संपूर्ण पत्ता</Text>
              </View>
              <Text style={styles.addressFull}>
                {issue.location}
                {issue.ward ? `,\n${issue.ward}` : ""}
              </Text>

              {issue.googleMapsUrl && issue.googleMapsUrl.trim().length > 0 ? (
                <TouchableOpacity
                  style={styles.googleMapsOpenBtn}
                  onPress={handleOpenMap}
                  activeOpacity={0.85}
                >
                  <Icon source="google-maps" size={14} color="#EA580C" />
                  <Text style={styles.googleMapsOpenBtnText}>गुगल मॅप्स थेट लोकेशन उघडा</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* "स्थितीचा इतिहास" (Timeline Card) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIconSquare, { backgroundColor: "#EA580C" }]}>
              <Icon source="clock-outline" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionHeadingText}>स्थितीचा इतिहास व प्रगती</Text>
          </View>

          <View style={styles.verticalTimeline}>
            {timeline.map((event, idx) => {
              const isLast = idx === timeline.length - 1;
              return (
                <View key={idx} style={styles.timelineRow}>
                  <View style={styles.timelineIndicatorCol}>
                    <View
                      style={[
                        styles.tlDot,
                        { backgroundColor: event.completed ? "#10B981" : "#EA580C" },
                      ]}
                    />
                    {!isLast && (
                      <View
                        style={[
                          styles.tlVerticalLine,
                          {
                            backgroundColor: event.completed ? "#10B981" : "#E2E8F0",
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineContentCol}>
                    <Text style={styles.tlTime}>{event.timestamp}</Text>
                    <Text style={styles.tlTitle}>{event.title}</Text>
                    <Text style={styles.tlSubtitle}>{event.description}</Text>
                    {event.officerRemark ? (
                      <View style={styles.officerRemarkBox}>
                        <Text style={styles.officerRemarkLabel}>अधिकारी शेरा:</Text>
                        <Text style={styles.officerRemarkText}>
                          {event.officerRemark}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Admin / MLA Remarks */}
          {issue.adminRemarks && issue.adminRemarks.length > 0 && (
            <View style={styles.adminRemarksCard}>
              <View style={styles.adminRemarksHeader}>
                <Icon source="shield-star" size={16} color="#EA580C" />
                <Text style={styles.adminRemarksTitle}>आमदार कार्यालय शेरा व पाठपुरावा</Text>
              </View>
              {issue.adminRemarks.map((rem, rIdx) => (
                <Text key={rIdx} style={styles.adminRemarkLine}>
                  • {rem}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar (3 Action Buttons) */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        {/* 1. सूचना मिळवा (Get Notification) */}
        <TouchableOpacity
          style={[
            styles.bottomActionBtn,
            isNotified && styles.bottomActionBtnActive,
          ]}
          onPress={() => {
            const next = !isNotified;
            setIsNotified(next);
            toast.show({
              type: next ? "success" : "info",
              title: next ? "सूचना सुरू केल्या" : "सूचना बंद केल्या",
              message: next
                ? "या समस्येच्या पुढील प्रत्येक अपडेटची नोटिफिकेशन आपल्याला मिळेल."
                : "या समस्येच्या सूचना बंद करण्यात आल्या आहेत.",
            });
          }}
          activeOpacity={0.75}
        >
          <Icon
            source={isNotified ? "bell-ring" : "bell-outline"}
            size={18}
            color={isNotified ? "#EA580C" : "#64748B"}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.bottomActionBtnText,
              isNotified && styles.bottomActionBtnTextActive,
            ]}
          >
            {isNotified ? "सूचना सुरू" : "सूचना मिळवा"}
          </Text>
        </TouchableOpacity>

        {/* 2. जतन करा (Save) */}
        <TouchableOpacity
          style={[
            styles.bottomActionBtn,
            isSaved && styles.bottomActionBtnActive,
          ]}
          onPress={() => {
            const next = !isSaved;
            setIsSaved(next);
            toast.show({
              type: next ? "success" : "info",
              title: next ? "जतन केले" : "काढून टाकले",
              message: next
                ? "ही समस्या आपल्या सेव्ह केलेल्या यादीत जतन करण्यात आली."
                : "समस्या सेव्ह यादीतून काढण्यात आली.",
            });
          }}
          activeOpacity={0.75}
        >
          <Icon
            source={isSaved ? "bookmark" : "bookmark-outline"}
            size={18}
            color={isSaved ? "#EA580C" : "#64748B"}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.bottomActionBtnText,
              isSaved && styles.bottomActionBtnTextActive,
            ]}
          >
            {isSaved ? "जतन केले" : "जतन करा"}
          </Text>
        </TouchableOpacity>

        {/* 3. समस्या शेअर करा (Share Issue) */}
        <TouchableOpacity
          style={styles.bottomShareBtn}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Icon source="share-variant" size={18} color="#FFFFFF" />
          <Text numberOfLines={1} style={styles.bottomShareBtnText}>
            {SCREEN_WIDTH > 390 ? "समस्या शेअर करा" : "शेअर करा"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  scrollContent: {
    paddingBottom: 90,
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
  headerRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    padding: 6,
  },

  // Header Info Card
  headerInfoCard: {
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
  headerInfoTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  roadIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerInfoTextCol: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EA580C",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  categoryBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  issueHeadline: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1C1917",
    lineHeight: 21,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1.5,
  },
  metaLocation: {
    fontSize: 11,
    color: "#57534E",
    fontWeight: "600",
  },
  metaDate: {
    fontSize: 10.5,
    color: "#78716C",
  },
  statusBox: {
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    marginLeft: 6,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#EA580C",
  },
  estLabel: {
    fontSize: 9.5,
    color: "#78716C",
    fontWeight: "600",
  },
  estDate: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#1C1917",
    marginTop: 1,
  },

  // Timeline Step Card
  timelineStepCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  timelineStepsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  stepItem: {
    alignItems: "center",
    width: 68,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  stepCircleCompleted: {
    backgroundColor: "#10B981",
  },
  stepCircleCurrent: {
    backgroundColor: "#FFF7ED",
    borderWidth: 2,
    borderColor: "#EA580C",
  },
  stepCirclePending: {
    backgroundColor: "#F1F5F9",
    borderWidth: 2,
    borderColor: "#94A3B8",
  },
  stepDotOrange: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EA580C",
  },
  stepDotGray: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#94A3B8",
  },
  stepLabel: {
    fontSize: 10,
    color: "#57534E",
    textAlign: "center",
    lineHeight: 13,
    fontWeight: "600",
  },
  stepLabelActive: {
    color: "#EA580C",
    fontWeight: "800",
  },
  stepDate: {
    fontSize: 9.5,
    color: "#78716C",
    marginTop: 2,
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginTop: 11,
  },
  stepLineActive: {
    backgroundColor: "#10B981",
  },
  stepLineInactive: {
    backgroundColor: "#CBD5E1",
  },

  // Section Card
  sectionCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionIconSquare: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeadingText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1C1917",
  },
  photosRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  photoCountText: {
    fontSize: 11.5,
    color: "#78716C",
    fontWeight: "600",
  },
  viewAllPhotosBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EA580C",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  viewAllPhotosText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  photosRow: {
    flexDirection: "row",
    gap: 8,
  },
  photoCol: {
    flex: 1,
    height: 90,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  photoImg: {
    width: "100%",
    height: "100%",
  },

  // Description
  descriptionParagraph: {
    fontSize: 13,
    color: "#44403C",
    lineHeight: 19,
    marginTop: 2,
  },

  // 4 Info Cards Grid
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 10,
  },
  infoGridCard: {
    width: (SCREEN_WIDTH - 32 - 10) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2.5,
    elevation: 2,
  },
  infoIconSquare: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 11,
    color: "#78716C",
    fontWeight: "600",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#1C1917",
    lineHeight: 17,
  },
  contactOfficerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFEDD5",
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  contactOfficerText: {
    fontSize: 11,
    color: "#EA580C",
    fontWeight: "800",
  },

  // Location & Map
  viewMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EA580C",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  viewMapBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  locationContentRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  mapWrap: {
    width: 140,
    height: 75,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  mapSnapshot: {
    width: "100%",
    height: "100%",
  },
  addressCol: {
    flex: 1,
  },
  addressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
  },
  addressFull: {
    fontSize: 12,
    color: "#1C1917",
    fontWeight: "700",
    lineHeight: 16,
  },
  googleMapsOpenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFEDD5",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  googleMapsOpenBtnText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#EA580C",
  },

  // Timeline
  verticalTimeline: {
    paddingLeft: 6,
    paddingTop: 6,
  },
  timelineRow: {
    flexDirection: "row",
  },
  timelineIndicatorCol: {
    width: 20,
    alignItems: "center",
  },
  tlDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tlVerticalLine: {
    width: 2,
    flex: 1,
    marginVertical: 3,
  },
  timelineContentCol: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 16,
  },
  tlTime: {
    fontSize: 11,
    color: "#78716C",
    fontWeight: "600",
  },
  tlTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#1C1917",
    marginTop: 1,
  },
  tlSubtitle: {
    fontSize: 11.5,
    color: "#57534E",
    marginTop: 1,
  },
  officerRemarkBox: {
    backgroundColor: "#EFF6FF",
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 6,
  },
  officerRemarkLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1E40AF",
  },
  officerRemarkText: {
    fontSize: 11,
    color: "#1E3A8A",
    marginTop: 2,
    lineHeight: 15,
  },
  adminRemarksCard: {
    marginTop: 14,
    padding: 12,
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  adminRemarksHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  adminRemarksTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#C2410C",
  },
  adminRemarkLine: {
    fontSize: 11.5,
    color: "#7C2D12",
    lineHeight: 16,
    marginTop: 2,
  },

  // Bottom Fixed Action Bar
  bottomBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomActionBtn: {
    flex: 1,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 6,
    gap: 5,
  },
  bottomActionBtnActive: {
    backgroundColor: "#FFF7ED",
    borderColor: "#EA580C",
  },
  bottomActionBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#334155",
    letterSpacing: 0.1,
  },
  bottomActionBtnTextActive: {
    color: "#EA580C",
    fontWeight: "800",
  },
  bottomShareBtn: {
    flex: 1.2,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EA580C",
    borderRadius: 14,
    paddingHorizontal: 8,
    gap: 6,
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 2.5 },
    shadowOpacity: 0.32,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomShareBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});
