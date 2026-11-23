import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  NewDevelopmentPlanService,
  SectionItem,
  CardItem,
  ModuleSettings,
} from "../services/newDevelopmentPlanService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Container layout metrics
const CONTAINER_HORIZONTAL_MARGIN = 12;
const CONTAINER_HORIZONTAL_PADDING = 16;
const CARD_GAP = 8;

// Available inner width for the cards
const INNER_WIDTH = Math.max(
  SCREEN_WIDTH - 2 * CONTAINER_HORIZONTAL_MARGIN - 2 * CONTAINER_HORIZONTAL_PADDING,
  280
);

// Widths: 4 cards visible per row for sections with >2 cards; 2 cards for sections with <=2 cards
const CARD_WIDTH_4 = Math.max(70, Math.floor((INNER_WIDTH - 3 * CARD_GAP) / 4));
const CARD_WIDTH_2 = Math.floor((INNER_WIDTH - CARD_GAP) / 2);

function getSectionBadgeText(sectionNumber: number, count: number): string {
  if (sectionNumber === 1) return `${count} संकल्प`;
  if (sectionNumber === 2) return `${count} सेवा / Cards`;
  if (sectionNumber === 3) return `${count} विभाग`;
  if (sectionNumber === 4) return `${count} विभाग`;
  return `${count} उपक्रम`;
}

function getFormattedSectionTitle(sec: SectionItem, fallbackIdx: number): string {
  const num = sec.section_number || fallbackIdx + 1;
  const title = sec.title.trim();
  if (/^\d+[\.\s]/.test(title)) {
    return title;
  }
  return `${num}. ${title}`;
}

export function HomeDevelopmentPlanSection() {
  const router = useRouter();
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [settings, setSettings] = useState<ModuleSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    NewDevelopmentPlanService.getOverview()
      .then((data) => {
        if (!isMounted || !data) return;
        if (data.settings) setSettings(data.settings);
        if (data.sections && data.sections.length > 0) {
          // Keep sections strictly ordered by section_number / display_order
          const sorted = [...data.sections].sort(
            (a, b) => (a.section_number || a.display_order) - (b.section_number || b.display_order)
          );
          setSections(sorted);
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
    <View style={styles.mainContainer}>
      {/* Main Section Heading */}
      <View style={styles.headerBlock}>
        <Text style={styles.mainHeading}>
          {settings?.title || "माझे प्रमुख संकल्प – माझा विकास आराखडा"}
        </Text>
        <Text style={styles.mainSubtitle}>
          Paper Note मधील चार मुख्य विभागांचा क्रम कायम
        </Text>
      </View>

      {/* 4 Vertically Arranged Sections */}
      {sections.map((sec, secIdx) => {
        const secNumber = sec.section_number || secIdx + 1;
        const initiatives: CardItem[] = sec.initiatives || [];
        const publishedCount = sec.total_cards_count || initiatives.length || 0;
        const isTwoCards = initiatives.length <= 2;
        const currentCardWidth = isTwoCards ? CARD_WIDTH_2 : CARD_WIDTH_4;
        const badgeLabel = getSectionBadgeText(secNumber, publishedCount);

        return (
          <View key={sec.id || sec.slug || secIdx} style={styles.sectionBlock}>
            {/* Section Title */}
            <Text style={styles.sectionTitle}>
              {getFormattedSectionTitle(sec, secIdx)}
            </Text>

            {/* Independent Horizontal Slider for each Section */}
            {initiatives.length > 0 ? (
              <FlatList
                horizontal
                data={initiatives}
                keyExtractor={(card, cIdx) => String(card.id || card.slug || cIdx)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sliderContentContainer}
                ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
                renderItem={({ item: card, index: cardIdx }) => {
                  const displayNum = card.display_order ?? (cardIdx + 1);
                  return (
                    <TouchableOpacity
                      style={[styles.sliderCard, { width: currentCardWidth }]}
                      activeOpacity={0.8}
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
                      <Text style={styles.sliderCardNumber}>{displayNum}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              <View style={styles.emptyCardRow}>
                <Text style={styles.emptyCardText}>उपक्रम लवकरच उपलब्ध होतील.</Text>
              </View>
            )}

            {/* Green Count Badge */}
            <View style={styles.badgeContainer}>
              <View style={styles.greenCountBadge}>
                <Text style={styles.greenCountText}>{badgeLabel}</Text>
              </View>
            </View>
          </View>
        );
      })}

      {/* Informational Footer Message */}
      <View style={styles.footerBlock}>
        <Text style={styles.footerText}>
          ही रचना Paper Note च्या उपलब्ध माहितीवर आधारित आहे. अस्पष्ट हस्तलिखित उपशीर्षके Admin कडून भरता येतील.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    marginVertical: 14,
    marginHorizontal: CONTAINER_HORIZONTAL_MARGIN,
    backgroundColor: "#0A0A0A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#262626",
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  // 1. Main Section Container (Full-width / padded dark container)
  mainContainer: {
    marginVertical: 14,
    marginHorizontal: CONTAINER_HORIZONTAL_MARGIN,
    backgroundColor: "#000000",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#262626",
    padding: CONTAINER_HORIZONTAL_PADDING,
  },

  // 2. Main Heading Block
  headerBlock: {
    marginBottom: 20,
  },
  mainHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 25,
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9CA3AF",
    lineHeight: 18,
  },

  // 3 & 6. Section Block & Spacing
  sectionBlock: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 22,
    marginBottom: 10,
  },

  // 4. Horizontal Slider & Cards
  sliderContentContainer: {
    paddingVertical: 2,
  },
  sliderCard: {
    height: 52,
    backgroundColor: "#2E3035",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3D4148",
    justifyContent: "center",
    alignItems: "center",
  },
  sliderCardNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  emptyCardRow: {
    paddingVertical: 12,
  },
  emptyCardText: {
    fontSize: 12,
    color: "#71717A",
  },

  // 5. Green Count Badge
  badgeContainer: {
    marginTop: 8,
    alignItems: "flex-start",
  },
  greenCountBadge: {
    backgroundColor: "#064E3B",
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#065F46",
  },
  greenCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#34D399",
  },

  // 8. Informational Footer Block
  footerBlock: {
    marginTop: 2,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#9CA3AF",
    lineHeight: 18,
  },
});
