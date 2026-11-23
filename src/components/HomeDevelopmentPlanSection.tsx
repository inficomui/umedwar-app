import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Icon } from "react-native-paper";
import { useRouter } from "expo-router";
import {
  NewDevelopmentPlanService,
  SectionItem,
  CardItem,
  ModuleSettings,
} from "../services/newDevelopmentPlanService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.72, 280);

function toMarathiDigits(num?: number | string): string {
  if (num === undefined || num === null) return "";
  const marathiDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(num)
    .split("")
    .map((d) => marathiDigits[parseInt(d, 10)] || d)
    .join("");
}

export function HomeDevelopmentPlanSection() {
  const router = useRouter();
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [settings, setSettings] = useState<ModuleSettings | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    NewDevelopmentPlanService.getOverview()
      .then((data) => {
        if (!isMounted || !data) return;
        if (data.settings) setSettings(data.settings);
        if (data.sections && data.sections.length > 0) {
          setSections(data.sections);
          setSelectedSectionId(data.sections[0].id);
        }
      })
      .catch((err) => console.warn("Error loading dev plan overview:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeSection = sections.find((s) => s.id === selectedSectionId) || sections[0];
  const initiatives: CardItem[] = activeSection?.initiatives || [];

  const totalCardsCount = sections.reduce(
    (acc, s) => acc + (s.total_cards_count || s.initiatives?.length || 0),
    0
  );

  if (loading && sections.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#E05300" />
      </View>
    );
  }

  if (sections.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithUnderline}>
          <View style={styles.titleBadgeRow}>
            <Text style={styles.sectionHeaderTitle}>
              {settings?.title || "🎯 माझे प्रमुख संकल्प – माझा विकास आराखडा"}
            </Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            {settings?.subtitle || "समृद्ध कोपरगाव – विकसित कोपरगाव"}
          </Text>
          <View style={styles.titleUnderline} />
        </View>

        <TouchableOpacity
          style={styles.viewAllTopButton}
          activeOpacity={0.8}
          onPress={() => router.push("/resolutions")}
        >
          <Text style={styles.viewAllTopText}>सर्व पहा</Text>
          <Icon source="arrow-right" size={15} color="#E05300" />
        </TouchableOpacity>
      </View>

      {/* Section Navigation Tabs (Section 1, 2, 3, 4) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
      >
        {sections.map((sec) => {
          const isSelected = sec.id === selectedSectionId;
          const count = sec.total_cards_count || sec.initiatives?.length || 0;

          // Short label for tab
          let shortLabel = sec.title;
          if (sec.section_number === 1) shortLabel = "🎯 संकल्प";
          else if (sec.section_number === 2) shortLabel = "🏛️ नागरी सेवा";
          else if (sec.section_number === 3) shortLabel = "🎓 करिअर";
          else if (sec.section_number === 4) shortLabel = "📑 योजना";

          return (
            <TouchableOpacity
              key={sec.id}
              style={[styles.tabButton, isSelected && styles.tabButtonActive]}
              activeOpacity={0.85}
              onPress={() => setSelectedSectionId(sec.id)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  isSelected && styles.tabButtonTextActive,
                ]}
              >
                {shortLabel} ({toMarathiDigits(count)})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Cards Horizontal Slider */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsScrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 14}
      >
        {initiatives.map((card, idx) => (
          <TouchableOpacity
            key={card.id || idx}
            style={styles.cardItem}
            activeOpacity={0.88}
            onPress={() =>
              router.push({
                pathname: "/resolution-detail",
                params: {
                  id: String(card.id),
                  slug: card.slug || String(card.id),
                },
              })
            }
          >
            {/* Top Row: Icon Badge & Section Tag */}
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconBadge}>
                {card.image_url ? (
                  <Image
                    source={{ uri: card.image_url }}
                    style={styles.cardImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.cardEmojiIcon}>
                    {card.icon || activeSection.icon || "🎯"}
                  </Text>
                )}
              </View>

              <View style={styles.cardNumberPill}>
                <Text style={styles.cardNumberPillText}>
                  #{toMarathiDigits(card.display_order || idx + 1)}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.cardTitle} numberOfLines={2}>
              {card.title}
            </Text>

            {/* Short Description */}
            <Text style={styles.cardDescription} numberOfLines={2}>
              {card.short_description || card.sankalp_text || "सविस्तर माहिती व विकास धोरण."}
            </Text>

            {/* Card Footer: Action Link */}
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>सविस्तर माहिती</Text>
              <View style={styles.cardFooterArrowWrap}>
                <Icon source="arrow-right" size={14} color="#E05300" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Full View All CTA Button */}
      <View style={styles.bottomCtaContainer}>
        <TouchableOpacity
          style={styles.bottomCtaButton}
          activeOpacity={0.85}
          onPress={() => router.push("/resolutions")}
        >
          <Text style={styles.bottomCtaText}>
            सर्व {toMarathiDigits(totalCardsCount || 57)} उपक्रम व नागरी सेवा पहा (View All)
          </Text>
          <Icon source="arrow-right-circle" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleWithUnderline: {
    flex: 1,
    marginRight: 10,
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1C1917",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#78716C",
    marginTop: 3,
    lineHeight: 16,
  },
  titleUnderline: {
    width: 44,
    height: 3,
    backgroundColor: "#E05300",
    borderRadius: 2,
    marginTop: 6,
  },
  viewAllTopButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllTopText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#E05300",
  },

  // Tabs
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  tabButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F5F5F4",
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  tabButtonActive: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#57534E",
  },
  tabButtonTextActive: {
    color: "#E05300",
    fontWeight: "900",
  },

  // Cards
  cardsScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 14,
  },
  cardItem: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    shadowColor: "#E05300",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
    justifyContent: "space-between",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    justifyContent: "center",
    alignItems: "center",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  cardEmojiIcon: {
    fontSize: 22,
  },
  cardNumberPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#FAFAF9",
    borderWidth: 1,
    borderColor: "#E7E5E4",
  },
  cardNumberPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#78716C",
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: "900",
    color: "#1C1917",
    lineHeight: 20,
    minHeight: 40,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12.5,
    fontWeight: "500",
    color: "#57534E",
    lineHeight: 18,
    minHeight: 36,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#FFF1E6",
    paddingTop: 10,
  },
  cardFooterText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#E05300",
  },
  cardFooterArrowWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
  },

  // Bottom CTA
  bottomCtaContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  bottomCtaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E05300",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: "#E05300",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomCtaText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
  },
});
