import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Image } from "expo-image";
import { useCampaign, CarouselBanner } from "../context/CampaignContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_HEIGHT = 210;

interface HomeCarouselProps {
  banners?: CarouselBanner[];
  onBannerPress?: (banner: CarouselBanner) => void;
}

export default function HomeCarousel({ banners, onBannerPress }: HomeCarouselProps) {
  const { carouselBanners, carouselIntervalMs } = useCampaign();
  const activeBanners = banners && banners.length > 0 ? banners : carouselBanners;

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<CarouselBanner>>(null);
  const isAutoScrolling = useRef(false);

  // Auto-scroll effect
  useEffect(() => {
    if (!activeBanners || activeBanners.length === 0) return;
    const interval = carouselIntervalMs || 4000;
    const timer = setInterval(() => {
      if (activeBanners.length === 0) return;
      const nextIndex = (activeIndex + 1) % activeBanners.length;
      isAutoScrolling.current = true;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, interval);

    return () => clearInterval(timer);
  }, [activeIndex, activeBanners, carouselIntervalMs]);

  if (!activeBanners || activeBanners.length === 0) {
    return null;
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / SCREEN_WIDTH);
    if (index !== activeIndex && index >= 0 && index < activeBanners.length) {
      setActiveIndex(index);
    }
  };

  const renderBannerItem = ({ item }: { item: CarouselBanner }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.bannerItem}
        onPress={() => onBannerPress && onBannerPress(item)}
      >
        {/* Banner Background Image */}
        <Image
          source={item.image}
          style={styles.bannerImage}
          contentFit="cover"
          transition={300}
        />

        {/* Semi-transparent Dark Gradient Overlay for Readability */}
        <View style={styles.overlayContainer}>
          {/* Top Tag & Counter */}
          <View style={styles.bannerTopRow}>
            <View style={[styles.tagBadge, { backgroundColor: item.badgeBg }]}>
              <Text style={styles.tagText}>{item.tag}</Text>
            </View>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                {activeIndex + 1} / {activeBanners.length}
              </Text>
            </View>
          </View>

          {/* Bottom Text Content */}
          <View style={styles.bannerBottomContent}>
            <Text style={styles.bannerTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.bannerSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={activeBanners}
        renderItem={renderBannerItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Modern Pagination Dots */}
      <View style={styles.paginationRow}>
        {activeBanners.map((_, idx) => {
          const isActive = idx === activeIndex;
          return (
            <TouchableOpacity
              key={idx.toString()}
              activeOpacity={0.7}
              onPress={() => {
                flatListRef.current?.scrollToIndex({ index: idx, animated: true });
                setActiveIndex(idx);
              }}
              style={[
                styles.dot,
                isActive ? styles.dotActive : styles.dotInactive,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    marginBottom: 16,
  },
  bannerItem: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
    position: "relative",
    backgroundColor: "#1E293B",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.38)",
    justifyContent: "space-between",
    padding: 16,
  },
  bannerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  counterBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  bannerBottomContent: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
    lineHeight: 22,
  },
  bannerSubtitle: {
    color: "#FEF08A",
    fontSize: 12.5,
    fontWeight: "700",
    marginTop: 3,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: "#EA580C",
  },
  dotInactive: {
    width: 8,
    backgroundColor: "#D1D5DB",
  },
});
