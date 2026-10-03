import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCampaign } from "../context/CampaignContext";
import {
  getPendingNotificationRoute,
  clearPendingNotificationRoute,
} from "../services/notificationPushService";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const { candidate, party, partyLeader, splashDurationMs } = useCampaign();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const headerSlide = useRef(new Animated.Value(-30)).current;
  const contentSlide = useRef(new Animated.Value(40)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);

  const navigateToHome = () => {
    if (!hasNavigated.current) {
      hasNavigated.current = true;
      const pending = getPendingNotificationRoute();
      if (pending) {
        clearPendingNotificationRoute();
        router.replace("/home");
        setTimeout(() => {
          try {
            router.push(pending as any);
          } catch {
            router.replace(pending as any);
          }
        }, 120);
      } else {
        router.replace("/home");
      }
    }
  };

  useEffect(() => {
    // Parallel entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(contentSlide, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: splashDurationMs,
        useNativeDriver: false,
      }),
    ]).start();

    // Auto navigate to home after splashDurationMs
    const timer = setTimeout(() => {
      navigateToHome();
    }, splashDurationMs);

    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#C2410C" />

      {/* Decorative Warm Ambient Saffron/Orange Glows */}
      <View style={styles.bgContainer}>
        <View style={styles.topGlowCircle} />
        <View style={styles.centerGlowCircle} />
        <View style={styles.bottomGlowCircle} />
      </View>

      <View style={styles.container}>
        {/* Top Header: Party Leader / Owner with Photo */}
        <Animated.View
          style={[
            styles.headerCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <View style={styles.partyLeaderRow}>
            {/* Party Leader Photo Frame */}
            <View style={styles.leaderAvatarRing}>
              <Image
                source={
                  typeof partyLeader.photo === "string"
                    ? { uri: partyLeader.photo }
                    : partyLeader.photo
                }
                style={styles.leaderAvatarImage}
                contentFit="cover"
              />
            </View>

            <View style={styles.leaderTextGroup}>
              <Text style={styles.leaderPrefix}>{partyLeader.prefix}</Text>
              <Text style={styles.leaderName}>{partyLeader.name}</Text>
              <Text style={styles.leaderTitle}>{partyLeader.title}</Text>
            </View>

            {/* Shiv Sena Badge */}
            <View style={styles.partyBadgeBox}>
              <Text style={styles.partyBadgeBow}>🏹</Text>
              <Text style={styles.partyBadgeText}>{party.shortName}</Text>
            </View>
          </View>

          <View style={styles.partyDivider} />

          <View style={styles.taglineRow}>
            <Text style={styles.taglineText} numberOfLines={1}>
              🚩 {party.tagline}
            </Text>
          </View>
        </Animated.View>

        {/* Center Hero Section: Candidate (Umedwar) Portrait & Name */}
        <View style={styles.centerContent}>
          {/* Circular Portrait Frame with Golden Saffron Glow */}
          <Animated.View
            style={[
              styles.avatarWrapper,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.avatarOuterPulse}>
              <View style={styles.avatarGoldBorder}>
                <Image
                  source={
                    typeof candidate.photo === "string"
                      ? { uri: candidate.photo }
                      : candidate.photo
                  }
                  style={styles.avatarImage}
                  contentFit="cover"
                  transition={300}
                />
              </View>
            </View>

            {/* Honorific Ribbon */}
            <View style={styles.honorificRibbon}>
              <Text style={styles.honorificRibbonText}>★ {candidate.honorific} ★</Text>
            </View>
          </Animated.View>

          {/* Candidate Name & Designation */}
          <Animated.View
            style={[
              styles.candidateDetails,
              {
                opacity: fadeAnim,
                transform: [{ translateY: contentSlide }],
              },
            ]}
          >
            <View style={styles.candidateDesignationRow}>
              <Text style={styles.candidateDesignationBadge}>
                {candidate.designation}
              </Text>
            </View>

            <Text style={styles.candidateMarathiName}>{candidate.name}</Text>
            <Text style={styles.candidateEnglishName}>{candidate.englishName}</Text>

            <View style={styles.constituencyPill}>
              <Text style={styles.constituencyText}>
                📍 {candidate.constituency}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Bottom Section: Slogan, Progress Bar & Skip Button */}
        <Animated.View
          style={[
            styles.bottomContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: contentSlide }],
            },
          ]}
        >
          {/* Election Slogan Card */}
          <View style={styles.sloganCard}>
            <Text style={styles.sloganText}>“{candidate.slogan}”</Text>
            <View style={styles.symbolChip}>
              <Text style={styles.partySymbolText}>{party.symbolName}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { width: progressWidth, backgroundColor: "#FDE047" },
              ]}
            />
          </View>

          {/* Footer Row */}
          <View style={styles.footerRow}>
            <Text style={styles.versionText}>अधिकृत निवडणूक प्रचार ॲप • {candidate.electionYear}</Text>
            <TouchableOpacity
              onPress={navigateToHome}
              style={styles.continueButton}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>पुढे जा ➔</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#C2410C",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  bgContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#EA580C",
    overflow: "hidden",
  },
  topGlowCircle: {
    position: "absolute",
    top: -90,
    right: -70,
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: "#F97316",
    opacity: 0.75,
  },
  centerGlowCircle: {
    position: "absolute",
    top: "32%",
    left: -110,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "#C2410C",
    opacity: 0.85,
  },
  bottomGlowCircle: {
    position: "absolute",
    bottom: -70,
    right: -50,
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: "#FB923C",
    opacity: 0.45,
  },

  // Party Leader Header
  headerCard: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.35)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    backdropFilter: "blur(10px)",
  },
  partyLeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  leaderAvatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#FDE047",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  leaderAvatarImage: {
    width: "100%",
    height: "100%",
  },
  leaderTextGroup: {
    flex: 1,
  },
  leaderPrefix: {
    fontSize: 10.5,
    color: "#FEF08A",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  leaderName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 19,
  },
  leaderTitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.92)",
    fontWeight: "600",
    marginTop: 1,
  },
  partyBadgeBox: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  partyBadgeBow: {
    fontSize: 14,
    lineHeight: 16,
  },
  partyBadgeText: {
    color: "#EA580C",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 1,
  },
  partyDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    marginVertical: 8,
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  taglineText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FEF3C7",
  },

  // Center Umedwar Section
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 14,
  },
  avatarOuterPulse: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FDE047",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 22,
    elevation: 12,
  },
  avatarGoldBorder: {
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 4,
    borderColor: "#FDE047",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  honorificRibbon: {
    backgroundColor: "#FEF08A",
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: -14,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  honorificRibbonText: {
    color: "#92400E",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Candidate Details
  candidateDetails: {
    alignItems: "center",
  },
  candidateDesignationRow: {
    marginBottom: 6,
  },
  candidateDesignationBadge: {
    fontSize: 12,
    color: "#FFFFFF",
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: "800",
  },
  candidateMarathiName: {
    fontSize: 25,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    lineHeight: 32,
  },
  candidateEnglishName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FEF3C7",
    marginTop: 2,
    letterSpacing: 0.4,
  },
  constituencyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  constituencyText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12.5,
  },

  // Bottom Content
  bottomContainer: {
    width: "100%",
  },
  sloganCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  sloganText: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#9A3412",
    textAlign: "center",
    lineHeight: 20,
  },
  symbolChip: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 5,
  },
  partySymbolText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#EA580C",
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.32)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  versionText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 11,
    fontWeight: "600",
  },
  continueButton: {
    backgroundColor: "rgba(255, 255, 255, 0.28)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.55)",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
  },
});
