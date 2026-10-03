import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { useCampaign, IssueItem } from "../context/CampaignContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MAP_CATEGORIES = [
  { id: "all", label: "सर्व" },
  { id: "roads", label: "रस्ते" },
  { id: "water", label: "पाणीपुरवठा" },
  { id: "electricity", label: "वीज" },
  { id: "cleanliness", label: "स्वच्छता" },
  { id: "drain", label: "गटार / ड्रेनेज" },
  { id: "health", label: "आरोग्य" },
  { id: "education", label: "शिक्षण" },
];

export interface LocationGroup {
  locationKey: string;
  areaName: string;
  fullLocation: string;
  issues: IssueItem[];
  top: number;
  left: number;
  total: number;
  pendingCount: number;
  inProgressCount: number;
  resolvedCount: number;
  primaryColor: string;
}

// Deterministic coordinates for known areas in Aurangabad Central constituency
const PRESET_COORDS: Record<string, { top: number; left: number }> = {
  "गजानन नगर": { top: 26, left: 24 },
  "शांतीनगर": { top: 28, left: 70 },
  "सिडको एन-४": { top: 56, left: 28 },
  "सिडको": { top: 56, left: 28 },
  "उस्मानपुरा": { top: 68, left: 66 },
  "क्रांती चौक": { top: 46, left: 48 },
  "समर्थ नगर": { top: 36, left: 52 },
  "बेगमपुरा": { top: 76, left: 38 },
  "गारखेडा": { top: 62, left: 54 },
  "मुकुंदवाडी": { top: 34, left: 80 },
  "शहानूरवाडी": { top: 50, left: 72 },
  "चिकलठाणा": { top: 18, left: 78 },
  "रेल्वे स्टेशन परिसर": { top: 74, left: 50 },
  "हडको": { top: 20, left: 36 },
  "औरंगाबाद": { top: 48, left: 48 },
};

function extractAreaName(location?: string): string {
  if (!location || !location.trim()) return "औरंगाबाद शहर";
  const clean = location.trim();
  const commaIdx = clean.indexOf(",");
  if (commaIdx > 0) {
    return clean.slice(0, commaIdx).trim();
  }
  const dashIdx = clean.indexOf("-");
  if (dashIdx > 0) {
    return clean.slice(0, dashIdx).trim();
  }
  return clean;
}

function getLocationCoords(areaName: string, index: number): { top: number; left: number } {
  for (const [key, coords] of Object.entries(PRESET_COORDS)) {
    if (
      areaName.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(areaName.toLowerCase())
    ) {
      return coords;
    }
  }
  const proceduralSlots = [
    { top: 26, left: 45 },
    { top: 40, left: 74 },
    { top: 64, left: 38 },
    { top: 50, left: 22 },
    { top: 34, left: 58 },
    { top: 72, left: 62 },
    { top: 18, left: 52 },
    { top: 80, left: 28 },
  ];
  return proceduralSlots[index % proceduralSlots.length];
}

function getSafeImageSource(item: IssueItem) {
  let cardImageSource: any = require("../../assets/images/issue_pothole.png");
  if (typeof item.image === "string" && item.image.trim().length > 0) {
    cardImageSource = { uri: item.image.trim() };
  } else if (
    item.image &&
    typeof item.image === "object" &&
    item.image.uri &&
    typeof item.image.uri === "string" &&
    item.image.uri.trim().length > 0
  ) {
    cardImageSource = { uri: item.image.uri.trim() };
  } else if (typeof item.image === "number") {
    cardImageSource = item.image;
  } else if (Array.isArray(item.images) && item.images.length > 0) {
    const first = item.images[0];
    if (typeof first === "string" && first.trim().length > 0) {
      cardImageSource = { uri: first.trim() };
    } else if (
      first &&
      typeof first === "object" &&
      first.uri &&
      typeof first.uri === "string" &&
      first.uri.trim().length > 0
    ) {
      cardImageSource = { uri: first.uri.trim() };
    } else if (typeof first === "number") {
      cardImageSource = first;
    }
  }
  return cardImageSource;
}

function getStatusBadge(item: IssueItem) {
  let badgeBg = "#FEE2E2";
  let badgeColor = "#DC2626";
  let statusLabel = item.statusText || "प्रलंबित";

  if (item.status === "resolved") {
    badgeBg = "#DCFCE7";
    badgeColor = "#16A34A";
    statusLabel = item.statusText || "निकाली";
  } else if (item.status === "in_progress") {
    badgeBg = "#FFEDD5";
    badgeColor = "#EA580C";
    statusLabel = item.statusText || "काम प्रगतीपथावर";
  } else if (item.status === "forwarded") {
    badgeBg = "#DBEAFE";
    badgeColor = "#2563EB";
    statusLabel = item.statusText || "अधिकाऱ्यांकडे पाठवली";
  }

  return { badgeBg, badgeColor, statusLabel };
}

interface DynamicIssueMapProps {
  isEmbedded?: boolean;
}

export default function DynamicIssueMap({ isEmbedded = false }: DynamicIssueMapProps) {
  const router = useRouter();
  const { issues } = useCampaign();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  // Dynamic filter by category
  const filteredIssues = useMemo(() => {
    if (selectedCategory === "all") return issues;
    return issues.filter((i) => i.category === selectedCategory);
  }, [issues, selectedCategory]);

  // Overall status counters dynamically calculated from issues
  const pendingCount = useMemo(
    () => filteredIssues.filter((i) => i.status === "pending").length,
    [filteredIssues]
  );
  const inProgressCount = useMemo(
    () =>
      filteredIssues.filter(
        (i) => i.status === "in_progress" || i.status === "forwarded"
      ).length,
    [filteredIssues]
  );
  const resolvedCount = useMemo(
    () => filteredIssues.filter((i) => i.status === "resolved").length,
    [filteredIssues]
  );

  // Dynamic Location Groups: Groups issues dynamically by their area/location
  const locationGroups = useMemo(() => {
    const map = new Map<string, IssueItem[]>();

    filteredIssues.forEach((issue) => {
      const area = extractAreaName(issue.location);
      const list = map.get(area) || [];
      list.push(issue);
      map.set(area, list);
    });

    let index = 0;
    const groups: LocationGroup[] = [];
    map.forEach((grpIssues, area) => {
      const coords = getLocationCoords(area, index++);
      const pending = grpIssues.filter((i) => i.status === "pending").length;
      const inProgress = grpIssues.filter(
        (i) => i.status === "in_progress" || i.status === "forwarded"
      ).length;
      const resolved = grpIssues.filter((i) => i.status === "resolved").length;

      let primaryColor = "#DC2626";
      if (pending > 0) {
        primaryColor = "#DC2626";
      } else if (inProgress > 0) {
        primaryColor = "#EA580C";
      } else if (resolved > 0) {
        primaryColor = "#16A34A";
      }

      groups.push({
        locationKey: `loc-${index}-${area}`,
        areaName: area,
        fullLocation: grpIssues[0]?.location || area,
        issues: grpIssues,
        top: coords.top,
        left: coords.left,
        total: grpIssues.length,
        pendingCount: pending,
        inProgressCount: inProgress,
        resolvedCount: resolved,
        primaryColor,
      });
    });

    return groups;
  }, [filteredIssues]);

  // Selected Location group
  const activeLocationGroup = useMemo(() => {
    if (selectedLocation === "all") return null;
    return locationGroups.find((g) => g.areaName === selectedLocation) || null;
  }, [locationGroups, selectedLocation]);

  const handleOpenGoogleMaps = (locationName: string, mapUrl?: string) => {
    if (mapUrl && mapUrl.trim().length > 0) {
      Linking.openURL(mapUrl.trim()).catch(() => {
        const query = encodeURIComponent(`${locationName}, औरंगाबाद, महाराष्ट्र`);
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      });
      return;
    }
    const query = encodeURIComponent(`${locationName}, औरंगाबाद, महाराष्ट्र`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  return (
    <View style={styles.container}>
      {/* Category Filter Pills (Horizontal Scroll) */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {MAP_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  isActive ? styles.categoryPillActive : styles.categoryPillInactive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Dynamic Status Counter Strip */}
      <View style={styles.counterStrip}>
        <View style={styles.counterItem}>
          <View style={styles.counterNumberRow}>
            <View style={[styles.counterDot, { backgroundColor: "#DC2626" }]} />
            <Text style={styles.counterNumber}>{pendingCount}</Text>
          </View>
          <Text style={styles.counterLabel}>प्रलंबित समस्या</Text>
        </View>

        <View style={styles.counterDivider} />

        <View style={styles.counterItem}>
          <View style={styles.counterNumberRow}>
            <View style={[styles.counterDot, { backgroundColor: "#EA580C" }]} />
            <Text style={styles.counterNumber}>{inProgressCount}</Text>
          </View>
          <Text style={styles.counterLabel}>काम प्रगतीपथावर</Text>
        </View>

        <View style={styles.counterDivider} />

        <View style={styles.counterItem}>
          <View style={styles.counterNumberRow}>
            <View style={[styles.counterDot, { backgroundColor: "#16A34A" }]} />
            <Text style={styles.counterNumber}>{resolvedCount}</Text>
          </View>
          <Text style={styles.counterLabel}>निकाली समस्या</Text>
        </View>

        <View style={styles.counterDivider} />

        <View style={styles.counterItem}>
          <View style={styles.counterNumberRow}>
            <View style={[styles.counterDot, { backgroundColor: "#2563EB" }]} />
            <Text style={styles.counterNumber}>{locationGroups.length}</Text>
          </View>
          <Text style={styles.counterLabel}>एकूण परिसर</Text>
        </View>
      </View>

      {/* Interactive Digital Constituency Map Canvas (No static images) */}
      <View style={[styles.mapCanvasWrapper, isEmbedded && styles.mapCanvasEmbedded]}>
        {/* Subtle Map Grid Background Lines */}
        <View style={styles.gridOverlay}>
          <View style={[styles.gridAxisH, { top: "33%" }]} />
          <View style={[styles.gridAxisH, { top: "66%" }]} />
          <View style={[styles.gridAxisV, { left: "33%" }]} />
          <View style={[styles.gridAxisV, { left: "66%" }]} />
          <View style={styles.zoneCircleOuter} />
          <View style={styles.zoneCircleInner} />
          <View style={styles.arterialRoadH} />
          <View style={styles.arterialRoadV} />
        </View>

        {/* Map Top Overlay Badges */}
        <View style={styles.mapTopOverlay}>
          <View style={styles.constituencyBadge}>
            <Icon source="crosshairs-gps" size={13} color="#E05300" />
            <Text style={styles.constituencyBadgeText}>
              औरंगाबाद मध्य मतदारसंघ • डिजिटल समस्या नकाशा
            </Text>
          </View>
          <View style={styles.compassBadge}>
            <Text style={styles.compassText}>उत्तर ↑ N</Text>
          </View>
        </View>

        {/* Dynamic Location Pins */}
        {locationGroups.map((loc) => {
          const isSelected = selectedLocation === loc.areaName;

          return (
            <View
              key={loc.locationKey}
              style={[styles.pinAnchor, { top: `${loc.top}%`, left: `${loc.left}%` }]}
            >
              {/* Active Callout Bubble */}
              {isSelected && (
                <View style={styles.activeCallout}>
                  <View style={styles.calloutTitleRow}>
                    <Icon source="map-marker" size={13} color={loc.primaryColor} />
                    <Text style={styles.calloutAreaTitle} numberOfLines={1}>
                      {loc.areaName}
                    </Text>
                  </View>
                  <Text style={styles.calloutStatsText}>
                    {loc.total} तक्रारी ({loc.pendingCount} प्रलंबित, {loc.inProgressCount} प्रगतीत)
                  </Text>
                  <View style={styles.calloutArrow} />
                </View>
              )}

              {/* Pin Touchable Marker */}
              <TouchableOpacity
                style={[
                  styles.pinMarkerBtn,
                  isSelected && styles.pinMarkerBtnActive,
                ]}
                onPress={() => setSelectedLocation(isSelected ? "all" : loc.areaName)}
                activeOpacity={0.85}
              >
                {/* Glow ring if selected */}
                {isSelected && (
                  <View
                    style={[
                      styles.pinPulseRing,
                      { borderColor: loc.primaryColor, backgroundColor: `${loc.primaryColor}22` },
                    ]}
                  />
                )}

                <View style={[styles.pinHead, { backgroundColor: loc.primaryColor }]}>
                  <Icon source="map-marker" size={14} color="#FFFFFF" />
                  <Text style={styles.pinCountBadge}>{loc.total}</Text>
                </View>
                <View style={[styles.pinTail, { borderTopColor: loc.primaryColor }]} />

                {/* Location Label Chip */}
                <View
                  style={[
                    styles.pinLabelWrap,
                    isSelected && styles.pinLabelWrapActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pinLabelText,
                      isSelected && styles.pinLabelTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {loc.areaName}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Bottom Hint on Map */}
        <View style={styles.mapBottomHint}>
          <Icon source="gesture-tap" size={14} color="#57534E" />
          <Text style={styles.mapBottomHintText}>
            परिसरावर टॅप करा आणि खाली त्या परिसरातील तक्रारी स्वतंत्रपणे पहा
          </Text>
        </View>
      </View>

      {/* Location Filter Selector Chips */}
      <View style={styles.locationSelectorSection}>
        <Text style={styles.locationSelectorHeading}>
          परिसर निवडा (Location-wise filter):
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.locationSelectorScroll}
        >
          <TouchableOpacity
            style={[
              styles.locChip,
              selectedLocation === "all" ? styles.locChipActive : styles.locChipInactive,
            ]}
            onPress={() => setSelectedLocation("all")}
            activeOpacity={0.8}
          >
            <Icon
              source="map"
              size={14}
              color={selectedLocation === "all" ? "#FFFFFF" : "#E05300"}
            />
            <Text
              style={[
                styles.locChipText,
                selectedLocation === "all" && styles.locChipTextActive,
              ]}
            >
              सर्व ठिकाणे ({filteredIssues.length})
            </Text>
          </TouchableOpacity>

          {locationGroups.map((grp) => {
            const isSelected = selectedLocation === grp.areaName;
            return (
              <TouchableOpacity
                key={`chip-${grp.locationKey}`}
                style={[
                  styles.locChip,
                  isSelected ? styles.locChipActive : styles.locChipInactive,
                ]}
                onPress={() => setSelectedLocation(grp.areaName)}
                activeOpacity={0.8}
              >
                <View style={[styles.locChipDot, { backgroundColor: grp.primaryColor }]} />
                <Text
                  style={[
                    styles.locChipText,
                    isSelected && styles.locChipTextActive,
                  ]}
                >
                  {grp.areaName} ({grp.total})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Location-wise Dynamic Issues Shown Separately */}
      <View style={styles.issuesContainer}>
        {activeLocationGroup ? (
          /* Single Location Selected: Show issues specifically for that location */
          <View style={styles.locationBlock}>
            <View style={styles.locationBlockHeader}>
              <View style={styles.locationBlockTitleRow}>
                <View
                  style={[
                    styles.locationHeaderBadge,
                    { backgroundColor: `${activeLocationGroup.primaryColor}18` },
                  ]}
                >
                  <Icon
                    source="map-marker-radius"
                    size={20}
                    color={activeLocationGroup.primaryColor}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationHeaderTitle}>
                    {activeLocationGroup.areaName} मधील समस्या
                  </Text>
                  <Text style={styles.locationHeaderSubtitle}>
                    {activeLocationGroup.total} तक्रारी • {activeLocationGroup.pendingCount} प्रलंबित • {activeLocationGroup.inProgressCount} प्रगतीत
                  </Text>
                </View>
              </View>

              {/* Google Live Location Action */}
              <TouchableOpacity
                style={styles.openGoogleMapsBtn}
                onPress={() =>
                  handleOpenGoogleMaps(
                    activeLocationGroup.areaName,
                    activeLocationGroup.issues[0]?.googleMapsUrl
                  )
                }
                activeOpacity={0.85}
              >
                <Icon source="google-maps" size={16} color="#EA580C" />
                <Text style={styles.openGoogleMapsText}>Google Maps वर उघडा</Text>
                <Icon source="open-in-new" size={13} color="#EA580C" />
              </TouchableOpacity>
            </View>

            {/* List of issues for this specific location */}
            <View style={styles.issueListWrapper}>
              {activeLocationGroup.issues.map((issue, idx) => {
                const imgSource = getSafeImageSource(issue);
                const { badgeBg, badgeColor, statusLabel } = getStatusBadge(issue);

                return (
                  <TouchableOpacity
                    key={issue.id ? `issue-${issue.id}` : `iss-${idx}`}
                    style={styles.issueCard}
                    onPress={() =>
                      router.push({
                        pathname: "/issue-detail",
                        params: { id: String(issue.id || ""), title: String(issue.title || "") },
                      })
                    }
                    activeOpacity={0.88}
                  >
                    <Image source={imgSource} style={styles.issueThumb} contentFit="cover" />

                    <View style={styles.issueDetailsCol}>
                      {issue.trackingId ? (
                        <View style={styles.trackingPill}>
                          <Text style={styles.trackingPillText}>#{issue.trackingId}</Text>
                        </View>
                      ) : null}

                      <Text style={styles.issueTitle} numberOfLines={1}>
                        {issue.title || "नागरी तक्रार"}
                      </Text>

                      <View style={styles.issueMetaRow}>
                        <Icon source="map-marker" size={12} color="#EA580C" />
                        <Text style={styles.issueLocation} numberOfLines={1}>
                          {issue.location || activeLocationGroup.areaName}
                        </Text>
                      </View>

                      <View style={styles.issueMetaRow}>
                        <Icon source="calendar" size={12} color="#78716C" />
                        <Text style={styles.issueDate}>{issue.date || "आजच"}</Text>
                      </View>
                    </View>

                    <View style={styles.issueRightCol}>
                      <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                        <View style={[styles.statusDot, { backgroundColor: badgeColor }]} />
                        <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
                          {statusLabel}
                        </Text>
                      </View>
                      <View style={styles.chevronWrap}>
                        <Icon source="chevron-right" size={20} color="#EA580C" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          /* All Locations Selected: Group and display separately by each location */
          <View style={styles.allLocationsList}>
            <View style={styles.allLocationsBanner}>
              <Text style={styles.allLocationsBannerTitle}>
                मतदारसंघातील सर्व परिसरांनुसार समस्यांची यादी
              </Text>
              <Text style={styles.allLocationsBannerSub}>
                प्रत्येक परिसराच्या नावानुसार तक्रारी स्वतंत्रपणे खाली दर्शवल्या आहेत:
              </Text>
            </View>

            {locationGroups.map((grp) => (
              <View key={`group-sec-${grp.locationKey}`} style={styles.locationSectionCard}>
                {/* Location Heading Bar */}
                <View style={styles.locSectionHeader}>
                  <View style={styles.locSectionHeaderLeft}>
                    <View
                      style={[
                        styles.locSectionDot,
                        { backgroundColor: grp.primaryColor },
                      ]}
                    />
                    <Text style={styles.locSectionTitle}>{grp.areaName}</Text>
                    <View style={styles.locSectionCountPill}>
                      <Text style={styles.locSectionCountText}>{grp.total} तक्रारी</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.locSectionFilterBtn}
                    onPress={() => setSelectedLocation(grp.areaName)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.locSectionFilterText}>फक्त हा परिसर पहा</Text>
                    <Icon source="chevron-right" size={14} color="#EA580C" />
                  </TouchableOpacity>
                </View>

                {/* Issues under this location */}
                <View style={styles.locSectionIssuesList}>
                  {grp.issues.map((issue, iIdx) => {
                    const imgSource = getSafeImageSource(issue);
                    const { badgeBg, badgeColor, statusLabel } = getStatusBadge(issue);

                    return (
                      <TouchableOpacity
                        key={`grp-${grp.areaName}-${issue.id || iIdx}`}
                        style={styles.issueCard}
                        onPress={() =>
                          router.push({
                            pathname: "/issue-detail",
                            params: { id: String(issue.id || ""), title: String(issue.title || "") },
                          })
                        }
                        activeOpacity={0.88}
                      >
                        <Image source={imgSource} style={styles.issueThumb} contentFit="cover" />

                        <View style={styles.issueDetailsCol}>
                          {issue.trackingId ? (
                            <View style={styles.trackingPill}>
                              <Text style={styles.trackingPillText}>#{issue.trackingId}</Text>
                            </View>
                          ) : null}

                          <Text style={styles.issueTitle} numberOfLines={1}>
                            {issue.title || "नागरी तक्रार"}
                          </Text>

                          <View style={styles.issueMetaRow}>
                            <Icon source="map-marker" size={12} color="#EA580C" />
                            <Text style={styles.issueLocation} numberOfLines={1}>
                              {issue.location || grp.areaName}
                            </Text>
                          </View>

                          <View style={styles.issueMetaRow}>
                            <Icon source="calendar" size={12} color="#78716C" />
                            <Text style={styles.issueDate}>{issue.date || "आजच"}</Text>
                          </View>
                        </View>

                        <View style={styles.issueRightCol}>
                          <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                            <View style={[styles.statusDot, { backgroundColor: badgeColor }]} />
                            <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
                              {statusLabel}
                            </Text>
                          </View>
                          <View style={styles.chevronWrap}>
                            <Icon source="chevron-right" size={20} color="#EA580C" />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  // Category filter
  categoryBar: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  categoryPillInactive: {
    backgroundColor: "#F1F5F9",
  },
  categoryPillActive: {
    backgroundColor: "#EA580C",
  },
  categoryPillText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#475569",
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
  },

  // Counters
  counterStrip: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  counterItem: {
    alignItems: "center",
  },
  counterNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  counterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  counterNumber: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E293B",
  },
  counterLabel: {
    fontSize: 10.5,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 1,
  },
  counterDivider: {
    width: 1,
    height: 22,
    backgroundColor: "#E2E8F0",
  },

  // Interactive Digital Map Canvas (NO static images)
  mapCanvasWrapper: {
    height: 320,
    backgroundColor: "#EFF6FF",
    position: "relative",
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
  },
  mapCanvasEmbedded: {
    height: 290,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#F8FAFC",
  },
  gridAxisH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  gridAxisV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#E2E8F0",
  },
  zoneCircleOuter: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    top: "15%",
    left: "20%",
    borderStyle: "dashed",
  },
  zoneCircleInner: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    top: "30%",
    left: "35%",
  },
  arterialRoadH: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 6,
    backgroundColor: "#E2E8F0",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#CBD5E1",
  },
  arterialRoadV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 6,
    backgroundColor: "#E2E8F0",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#CBD5E1",
  },

  // Map Top Overlay
  mapTopOverlay: {
    position: "absolute",
    top: 10,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
  },
  constituencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: "#FED7AA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  constituencyBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#C2410C",
  },
  compassBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  compassText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#475569",
  },

  // Pins
  pinAnchor: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  pinMarkerBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  pinMarkerBtnActive: {
    transform: [{ scale: 1.15 }],
  },
  pinPulseRing: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    top: -6,
  },
  pinHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 12,
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  pinCountBadge: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "900",
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderStyle: "solid",
    backgroundColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },
  pinLabelWrap: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 2,
    borderWidth: 0.5,
    borderColor: "#CBD5E1",
  },
  pinLabelWrapActive: {
    backgroundColor: "#1E293B",
    borderColor: "#1E293B",
  },
  pinLabelText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#1E293B",
  },
  pinLabelTextActive: {
    color: "#FFFFFF",
  },

  // Active Pin Callout
  activeCallout: {
    position: "absolute",
    bottom: 38,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 6,
    minWidth: 150,
    alignItems: "center",
    zIndex: 30,
  },
  calloutTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  calloutAreaTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#1E293B",
  },
  calloutStatsText: {
    fontSize: 9.5,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "600",
  },
  calloutArrow: {
    position: "absolute",
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderStyle: "solid",
    backgroundColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
  },

  // Map Bottom Hint
  mapBottomHint: {
    position: "absolute",
    bottom: 8,
    left: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
  },
  mapBottomHintText: {
    fontSize: 10.5,
    color: "#475569",
    fontWeight: "600",
  },

  // Location Selector section
  locationSelectorSection: {
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  locationSelectorHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  locationSelectorScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  locChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  locChipInactive: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  locChipActive: {
    backgroundColor: "#EA580C",
    borderColor: "#EA580C",
  },
  locChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  locChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  locChipTextActive: {
    color: "#FFFFFF",
  },

  // Issues Container
  issuesContainer: {
    padding: 16,
  },

  // Single Location Selected Block
  locationBlock: {},
  locationBlockHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  locationBlockTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locationHeaderBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  locationHeaderTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E293B",
  },
  locationHeaderSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  openGoogleMapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFEDD5",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  openGoogleMapsText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#EA580C",
  },

  // All Locations Grouped List
  allLocationsList: {},
  allLocationsBanner: {
    marginBottom: 12,
  },
  allLocationsBannerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1E293B",
  },
  allLocationsBannerSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  locationSectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 10,
  },
  locSectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locSectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locSectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1E293B",
  },
  locSectionCountPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  locSectionCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  locSectionFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  locSectionFilterText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EA580C",
  },
  locSectionIssuesList: {
    gap: 8,
  },
  issueListWrapper: {
    gap: 10,
  },

  // Issue Card
  issueCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    gap: 10,
  },
  issueThumb: {
    width: 70,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
  },
  issueDetailsCol: {
    flex: 1,
  },
  trackingPill: {
    alignSelf: "flex-start",
    backgroundColor: "#FFEDD5",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginBottom: 2,
  },
  trackingPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#EA580C",
  },
  issueTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 2,
  },
  issueMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  issueLocation: {
    fontSize: 10.5,
    color: "#64748B",
    fontWeight: "600",
  },
  issueDate: {
    fontSize: 10,
    color: "#94A3B8",
  },
  issueRightCol: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 56,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  chevronWrap: {
    justifyContent: "center",
  },
});
