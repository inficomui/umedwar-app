import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Icon } from "react-native-paper";
import {
  CardItem,
  ModuleSettings,
  NewDevelopmentPlanService,
  SectionItem,
} from "../services/newDevelopmentPlanService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Card dimensions for attractive, readable preview cards in horizontal slider
const CARD_WIDTH = Math.min(Math.round(SCREEN_WIDTH * 0.68), 260);
const CARD_GAP = 12;

function toMarathiDigits(num?: number | string): string {
  if (num === undefined || num === null) return "";
  const marathiDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(num)
    .split("")
    .map((d) => marathiDigits[parseInt(d, 10)] || d)
    .join("");
}

function getSectionBadgeText(sectionNumber: number, count: number): string {
  const marathiCount = toMarathiDigits(count);
  if (sectionNumber === 1) return `${marathiCount} संकल्प`;
  if (sectionNumber === 2) return `${marathiCount} सेवा / Cards`;
  if (sectionNumber === 3) return `${marathiCount} विभाग`;
  if (sectionNumber === 4) return `${marathiCount} विभाग`;
  return `${marathiCount} उपक्रम`;
}

function getFormattedSectionTitle(sec: SectionItem, fallbackIdx: number): string {
  const num = toMarathiDigits(sec.section_number || fallbackIdx + 1);
  const title = sec.title.trim();
  if (/^[\d\u0966-\u096F]+[\.\s]/.test(title)) {
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
      {/* Main Section Header with Saffron Brand Accent */}
      <View style={styles.headerBlock}>
        <View style={styles.headerTitleRow}>
          <View style={styles.accentBar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.mainHeading}>
              {settings?.title || "माझे प्रमुख संकल्प – माझा विकास आराखडा"}
            </Text>
            {settings?.subtitle && !settings.subtitle.includes("Paper Note") ? (
              <Text style={styles.mainSubtitle}>{settings.subtitle}</Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* 4 Vertically Arranged Sections with Independent Sliders */}
      {sections.map((sec, secIdx) => {
        const secNumber = sec.section_number || secIdx + 1;
        const initiatives: CardItem[] = sec.initiatives || [];
        const publishedCount = sec.total_cards_count || initiatives.length || 0;
        const badgeLabel = getSectionBadgeText(secNumber, publishedCount);

        return (
          <View key={sec.id || sec.slug || secIdx} style={styles.sectionBlock}>
            {/* Section Header Row with Title & Green Count Badge */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>
                  {getFormattedSectionTitle(sec, secIdx)}
                </Text>
              </View>

              <View style={styles.greenCountBadge}>
                <Icon source="check-decagram" size={12} color="#059669" />
                <Text style={styles.greenCountText}>{badgeLabel}</Text>
              </View>
            </View>

            {/* Independent Horizontal Slider with Rich Attractive Cards */}
            {initiatives.length > 0 ? (
              <FlatList
                horizontal
                data={initiatives}
                keyExtractor={(card, cIdx) => String(card.id || card.slug || cIdx)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sliderContentContainer}
                ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
                renderItem={({ item: card, index: cardIdx }) => {
                  const displayNum = toMarathiDigits(card.display_order ?? (cardIdx + 1));
                  const shortDesc =
                    card.short_description ||
                    card.sankalp_text ||
                    card.service_details ||
                    "सविस्तर माहिती व विकास आराखडा.";

                  return (
                    <TouchableOpacity
                      style={styles.cardItem}
                      activeOpacity={0.85}
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
                      {/* Card Top Strip: Icon/Image + Number Badge */}
                      <View style={styles.cardTopRow}>
                        <View style={styles.cardIconWrap}>
                          {card.image_url ? (
                            <Image
                              source={{ uri: card.image_url }}
                              style={styles.cardImage}
                              contentFit="cover"
                            />
                          ) : (
                            <Text style={styles.cardEmoji}>
                              {card.icon || sec.icon || "🎯"}
                            </Text>
                          )}
                        </View>

                        <View style={styles.cardNumberBadge}>
                          <Text style={styles.cardNumberText}>#{displayNum}</Text>
                        </View>
                      </View>

                      {/* Card Main Title */}
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {card.title}
                      </Text>

                      {/* Card Short Description */}
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {shortDesc}
                      </Text>

                      {/* Card Bottom CTA Link */}
                      <View style={styles.cardBottomRow}>
                        <Text style={styles.cardCtaText}>सविस्तर माहिती</Text>
                        <View style={styles.arrowIconWrap}>
                          <Icon source="arrow-right" size={13} color="#E05300" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              <View style={styles.emptyCardRow}>
                <Text style={styles.emptyCardText}>उपक्रम लवकरच प्रसिद्ध केले जातील.</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    marginVertical: 14,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // 1. Clean, attractive light container
  mainContainer: {
    marginVertical: 12,
    backgroundColor: "#FDFCFB",
    paddingTop: 16,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },

  // 2. Main Header Block with Warm Saffron Accent
  headerBlock: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  accentBar: {
    width: 4,
    height: 42,
    borderRadius: 2,
    backgroundColor: "#E05300",
    marginTop: 2,
  },
  mainHeading: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1C1917",
    lineHeight: 24,
  },
  mainSubtitle: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#78716C",
    lineHeight: 18,
    marginTop: 2,
  },

  // 3. Section Block & Spacing
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 10,
  },
  sectionTitleWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F2937",
    lineHeight: 21,
  },

  // Green Count Badge (Attractive Pill)
  greenCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  greenCountText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#059669",
  },

  // 4. Horizontal Slider
  sliderContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },

  // Attractive Main Card Design
  cardItem: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 13,
    borderWidth: 1.2,
    borderColor: "#FED7AA",
    justifyContent: "space-between",
    ...Platform.select({
      ios: {
        shadowColor: "#E05300",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2.5,
      },
    }),
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  cardImage: {
    width: 26,
    height: 26,
  },
  cardEmoji: {
    fontSize: 22,
  },
  cardNumberBadge: {
    backgroundColor: "#FFF7ED",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  cardNumberText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#EA580C",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1C1917",
    lineHeight: 20,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12,
    fontWeight: "500",
    color: "#4B5563",
    lineHeight: 17,
    marginBottom: 12,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  cardCtaText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E05300",
  },
  arrowIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCardRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyCardText: {
    fontSize: 12.5,
    color: "#9CA3AF",
  },
});
