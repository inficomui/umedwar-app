import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Share,
  Linking,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Icon } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { VideoView, useVideoPlayer } from 'expo-video';

import { VideoItem } from '../types/video.types';
import { VideoService, DEFAULT_CAMPAIGN_VIDEOS } from '../services/videoService';
import { parseVideoUrl } from '../utils/videoUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLAYER_HEIGHT = Math.round((SCREEN_WIDTH * 9) / 16);

// Category filter tabs matching live backend
const CATEGORIES = [
  { key: 'all', label: 'सर्व व्हिडिओ', enLabel: 'All' },
  { key: 'speeches', label: 'भाषणे व सभा', enLabel: 'Speeches' },
  { key: 'dialogue', label: 'जनसंवाद', enLabel: 'Dialogue' },
  { key: 'events', label: 'कार्यक्रम', enLabel: 'Events' },
  { key: 'development', label: 'विकासकामे', enLabel: 'Progress' },
  { key: 'interviews', label: 'मुलाखती', enLabel: 'Interviews' },
];

const LOCAL_FALLBACKS = [
  require('../../assets/images/banner_rally.jpg'),
  require('../../assets/images/banner_development.jpg'),
  require('../../assets/images/banner_welfare.jpg'),
  require('../../assets/images/home_hero_banner.jpg'),
];

function getThumbnailSource(url?: string, fallbackIndex: number = 0) {
  const fallback = LOCAL_FALLBACKS[fallbackIndex % LOCAL_FALLBACKS.length];
  if (!url || typeof url !== 'string') return fallback;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return { uri: url };
  }
  return fallback;
}

/**
 * Direct video stream player using expo-video
 */
const DirectStreamPlayer: React.FC<{ url: string }> = ({ url }) => {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.play();
  });

  return (
    <VideoView
      style={styles.directVideoPlayer}
      player={player}
      nativeControls={true}
      contentFit="contain"
    />
  );
};

export default function VideosScreen() {
  const router = useRouter();
  const mainScrollRef = useRef<ScrollView>(null);

  const [videos, setVideos] = useState<VideoItem[]>(DEFAULT_CAMPAIGN_VIDEOS);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState<boolean>(false);

  // Active selected video for top YouTube player (defaults to first video)
  const [activeVideo, setActiveVideo] = useState<VideoItem>(DEFAULT_CAMPAIGN_VIDEOS[0]);

  // YouTube action state interactions
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set());
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [descExpanded, setDescExpanded] = useState<boolean>(false);

  // ── 1. Fetch & Hydrate Videos ──────────────────────────────────────────
  const loadVideos = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cached = await VideoService.getCachedVideos();
        if (cached && cached.length > 0) {
          setVideos(cached);
          if (!activeVideo || !cached.some((c) => String(c.id) === String(activeVideo.id))) {
            setActiveVideo(cached[0]);
          }
        }
      }

      const freshVideos = await VideoService.getVideos();
      if (freshVideos && freshVideos.length > 0) {
        setVideos(freshVideos);
        // If current active video not found or first load, pick fresh first item
        if (!activeVideo || !freshVideos.some((f) => String(f.id) === String(activeVideo.id))) {
          setActiveVideo(freshVideos[0]);
        }
      }
    } catch (err) {
      console.warn('[VideosScreen] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadVideos(true);
  }, []);

  // ── 2. Filter & Search Logic for Up Next Feed ──────────────────────────
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const catSlug = (v.category || '').toLowerCase();
      const catName = (v.categoryName || v.category_name || '').toLowerCase();

      let matchesCategory = selectedCategory === 'all';
      if (!matchesCategory) {
        if (selectedCategory === 'speeches') {
          matchesCategory = catSlug.includes('speech') || catName.includes('भाषण') || catSlug === 'speeches';
        } else if (selectedCategory === 'dialogue') {
          matchesCategory = catSlug.includes('dialogue') || catSlug.includes('संवाद') || catName.includes('संवाद');
        } else if (selectedCategory === 'events') {
          matchesCategory = catSlug.includes('event') || catSlug.includes('कार्यक्रम') || catName.includes('कार्यक्रम') || catSlug.includes('rall') || catName.includes('मेळावा');
        } else if (selectedCategory === 'development') {
          matchesCategory = catSlug.includes('dev') || catSlug.includes('विकास') || catName.includes('विकास');
        } else if (selectedCategory === 'interviews') {
          matchesCategory = catSlug.includes('interview') || catName.includes('मुलाखत');
        } else {
          matchesCategory = catSlug === selectedCategory.toLowerCase() || catName.includes(selectedCategory.toLowerCase());
        }
      }

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        (v.title || '').toLowerCase().includes(query) ||
        (v.description || '').toLowerCase().includes(query) ||
        catName.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [videos, selectedCategory, searchQuery]);

  // Exclude the current active playing video from the recommended list
  const upNextVideos = useMemo(() => {
    if (!activeVideo) return filteredVideos;
    return filteredVideos.filter((v) => String(v.id) !== String(activeVideo.id));
  }, [filteredVideos, activeVideo]);

  // ── 3. Switch Video in YouTube Player ───────────────────────────────────
  const handleSelectVideo = (video: VideoItem) => {
    setActiveVideo(video);
    setDescExpanded(false);
    mainScrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleLaunchPlayback = async (video: VideoItem) => {
    const rawUrl = video.videoUrl || video.video_url || '';
    if (!rawUrl) return;

    try {
      await WebBrowser.openBrowserAsync(rawUrl, {
        toolbarColor: '#0F0F0F',
        secondaryToolbarColor: '#282828',
        enableBarCollapsing: true,
        showTitle: true,
      });
    } catch {
      Linking.openURL(rawUrl).catch(() => {});
    }
  };

  const handleShareVideo = async (video: VideoItem) => {
    try {
      const url = video.videoUrl || video.video_url || 'https://backend.misachinmalik.in';
      await Share.share({
        title: video.title,
        message: `🎥 *श्री. सचिन मलिक - अधिकृत व्हिडिओ*\n\n${video.title}\n\nयेथे पहा: ${url}\n\n#SachinMalik #Kopargaon #Shivsena`,
      });
    } catch (err) {
      console.warn('[Share] Error sharing video:', err);
    }
  };

  const toggleLike = (id: string | number) => {
    const idStr = String(id);
    setLikedVideos((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) {
        next.delete(idStr);
      } else {
        next.add(idStr);
      }
      return next;
    });
  };

  const toggleSave = (id: string | number) => {
    const idStr = String(id);
    setSavedVideos((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) {
        next.delete(idStr);
      } else {
        next.add(idStr);
      }
      return next;
    });
  };

  const isLiked = activeVideo ? likedVideos.has(String(activeVideo.id)) : false;
  const isSaved = activeVideo ? savedVideos.has(String(activeVideo.id)) : false;
  const currentThumbUrl = activeVideo?.thumbnailUrl || activeVideo?.thumbnail_url;
  const currentVideoUrl = activeVideo?.videoUrl || activeVideo?.video_url || '';
  const parsedVideo = parseVideoUrl(currentVideoUrl);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* ── 1. Top YouTube 16:9 Cinema Player (Fixed at top) ───────────── */}
      <View style={styles.ytPlayerContainer}>
        {parsedVideo.type === 'direct' ? (
          <DirectStreamPlayer url={currentVideoUrl} />
        ) : (
          <TouchableOpacity
            style={styles.ytPlayerTouchable}
            activeOpacity={0.96}
            onPress={() => activeVideo && handleLaunchPlayback(activeVideo)}
          >
            <Image
              source={getThumbnailSource(currentThumbUrl, 0)}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.ytPlayerDarkOverlay} />

            {/* Top Player Chrome */}
            <View style={styles.ytTopChromeRow}>
              <TouchableOpacity
                style={styles.ytBackIconBtn}
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/home');
                  }
                }}
                activeOpacity={0.8}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Icon source="arrow-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.ytTopChromeRight}>
                <TouchableOpacity
                  style={styles.ytChromeIcon}
                  onPress={() => setSearchOpen(!searchOpen)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon source="magnify" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ytChromeIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => activeVideo && handleShareVideo(activeVideo)}
                >
                  <Icon source="cast" size={21} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ytChromeIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon source="closed-caption-outline" size={21} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ytChromeIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon source="cog-outline" size={21} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Center YouTube Play Button */}
            <View style={styles.ytCenterPlayGroup}>
              <View style={styles.ytRedPlayCard}>
                <Icon source="youtube" size={48} color="#FF0000" />
              </View>
              <Text style={styles.ytTapToPlayLabel}>व्हिडिओ प्ले करण्यासाठी स्पर्श करा ▶</Text>
            </View>

            {/* Bottom YouTube Controls & Red Scrubber */}
            <View style={styles.ytBottomControlsRow}>
              <View style={styles.ytTimeRow}>
                <Icon source="play" size={16} color="#FFFFFF" />
                <Text style={styles.ytTimeText}>
                  0:00 / {activeVideo?.duration || '12:35'}
                </Text>
              </View>

              <View style={styles.ytBottomRightControls}>
                <View style={styles.hdBadge}>
                  <Text style={styles.hdBadgeText}>HD</Text>
                </View>
                <TouchableOpacity
                  style={styles.ytFullscreenBtn}
                  onPress={() => activeVideo && handleLaunchPlayback(activeVideo)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon source="fullscreen" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* YouTube Red Scrubber Line */}
            <View style={styles.ytScrubberTrack}>
              <View style={[styles.ytScrubberFilled, { width: '38%' }]}>
                <View style={styles.ytScrubberThumb} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* ── 2. Collapsible Search Bar (if search icon clicked) ─────────── */}
      {searchOpen && (
        <View style={styles.searchBarRow}>
          <Icon source="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="व्हिडिओ किंवा भाषण शोधा (Search)..."
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon source="close-circle" size={18} color="#A1A1AA" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── 3. Scrollable YouTube Details & Up Next Feed ───────────────── */}
      <ScrollView
        ref={mainScrollRef}
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF0000']}
            tintColor="#FF0000"
          />
        }
      >
        {activeVideo && (
          <View style={styles.videoMetaContainer}>
            {/* Video Title */}
            <Text style={styles.videoTitle}>{activeVideo.title}</Text>

            {/* Views, Date & Category */}
            <Text style={styles.videoSubMeta}>
              {activeVideo.views || '१.२K Views'} • {activeVideo.date || '२०२६'} •{' '}
              <Text style={styles.categoryHash}>
                #{activeVideo.categoryName || activeVideo.category_name || 'कोपरगाव'}
              </Text>
            </Text>

            {/* Channel Bar (Avatar, Name, Verification, Subscribe Button) */}
            <View style={styles.channelBar}>
              <Image
                source={require('../../assets/images/shivsena_logo.png')}
                style={styles.channelAvatar}
                contentFit="cover"
              />
              <View style={styles.channelInfo}>
                <View style={styles.channelNameRow}>
                  <Text style={styles.channelName}>श्री. सचिन मलिक</Text>
                  <Icon source="check-decagram" size={15} color="#3B82F6" />
                </View>
                <Text style={styles.channelSubscribers}>
                  अधिकृत जनसंपर्क कार्यालय • ५०K+ नागरिक
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.subscribeBtn, isSubscribed && styles.subscribedBtn]}
                activeOpacity={0.85}
                onPress={() => setIsSubscribed(!isSubscribed)}
              >
                <Icon
                  source={isSubscribed ? 'bell-ring' : 'bell-outline'}
                  size={15}
                  color={isSubscribed ? '#FFFFFF' : '#0F0F0F'}
                />
                <Text
                  style={[
                    styles.subscribeBtnText,
                    isSubscribed && styles.subscribedBtnText,
                  ]}
                >
                  {isSubscribed ? 'सामील आहात' : 'सहभागी व्हा'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* YouTube Action Buttons Strip (Like, Share, Watch on YouTube, Save) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.actionsScroll}
            >
              {/* Like Button */}
              <TouchableOpacity
                style={[styles.actionPill, isLiked && styles.actionPillActive]}
                activeOpacity={0.8}
                onPress={() => toggleLike(activeVideo.id)}
              >
                <Icon
                  source={isLiked ? 'thumb-up' : 'thumb-up-outline'}
                  size={18}
                  color={isLiked ? '#3B82F6' : '#FFFFFF'}
                />
                <Text style={[styles.actionPillText, isLiked && styles.actionPillTextActive]}>
                  {isLiked ? 'पसंत केले' : 'पसंत (Like)'}
                </Text>
              </TouchableOpacity>

              {/* Share on WhatsApp */}
              <TouchableOpacity
                style={styles.actionPill}
                activeOpacity={0.8}
                onPress={() => handleShareVideo(activeVideo)}
              >
                <Icon source="share" size={18} color="#FFFFFF" />
                <Text style={styles.actionPillText}>शेअर (Share)</Text>
              </TouchableOpacity>

              {/* Open in YouTube App */}
              <TouchableOpacity
                style={[styles.actionPill, styles.ytWatchFullPill]}
                activeOpacity={0.8}
                onPress={() => handleLaunchPlayback(activeVideo)}
              >
                <Icon source="youtube" size={19} color="#FF0000" />
                <Text style={styles.ytWatchFullText}>यूट्यूब वर पहा</Text>
              </TouchableOpacity>

              {/* Save to Playlist */}
              <TouchableOpacity
                style={[styles.actionPill, isSaved && styles.actionPillActive]}
                activeOpacity={0.8}
                onPress={() => toggleSave(activeVideo.id)}
              >
                <Icon
                  source={isSaved ? 'bookmark-check' : 'playlist-plus'}
                  size={18}
                  color={isSaved ? '#3B82F6' : '#FFFFFF'}
                />
                <Text style={styles.actionPillText}>
                  {isSaved ? 'जतन केले' : 'जतन करा'}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Collapsible Description Box (YouTube Style) */}
            <TouchableOpacity
              style={styles.descriptionBox}
              activeOpacity={0.9}
              onPress={() => setDescExpanded(!descExpanded)}
            >
              <Text style={styles.descHeader}>
                {activeVideo.views || '१,२००+ पाहिले'} • {activeVideo.date || '२०२६'}
              </Text>
              <Text
                style={styles.descText}
                numberOfLines={descExpanded ? undefined : 2}
              >
                {activeVideo.description ||
                  `${activeVideo.title} — कोपरगाव विधानसभा मतदारसंघातील नागरिकांशी थेट संवाद, विकासकामे, जनसंवाद आणि शिवविचार.`}
              </Text>
              <Text style={styles.descToggle}>
                {descExpanded ? 'कमी माहिती पहा ▲' : 'अधिक माहिती वाचा...'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── 4. YouTube Category Filter Chips ─────────────────────────── */}
        <View style={styles.categoryBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryListContent}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 5. Up Next / Recommendations Feed ────────────────────────── */}
        <View style={styles.upNextSection}>
          <View style={styles.upNextHeader}>
            <Text style={styles.upNextTitle}>पुढील व्हिडिओ (Up Next)</Text>
            <View style={styles.autoplayRow}>
              <Text style={styles.autoplayText}>ऑटोप्ले</Text>
              <Icon source="toggle-switch" size={26} color="#3B82F6" />
            </View>
          </View>

          {loading && videos.length === 0 ? (
            <View style={styles.loaderCenter}>
              <ActivityIndicator size="large" color="#FF0000" />
              <Text style={styles.loaderText}>व्हिडिओ लोड होत आहेत...</Text>
            </View>
          ) : upNextVideos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎬</Text>
              <Text style={styles.emptyTitle}>व्हिडिओ उपलब्ध नाहीत</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `"${searchQuery}" साठी कोणताही व्हिडिओ सापडला नाही.`
                  : 'या श्रेणीमध्ये सध्या इतर व्हिडिओ उपलब्ध नाहीत.'}
              </Text>
            </View>
          ) : (
            upNextVideos.map((relItem, relIndex) => {
              const thumb = relItem.thumbnailUrl || relItem.thumbnail_url;
              return (
                <TouchableOpacity
                  key={String(relItem.id || relIndex)}
                  style={styles.upNextCard}
                  activeOpacity={0.82}
                  onPress={() => handleSelectVideo(relItem)}
                >
                  {/* Left 16:9 Thumbnail */}
                  <View style={styles.upNextThumbWrap}>
                    <Image
                      source={getThumbnailSource(thumb, relIndex + 1)}
                      style={styles.upNextThumb}
                      contentFit="cover"
                      transition={150}
                    />
                    <View style={styles.miniPlayIconWrap}>
                      <Icon source="play" size={14} color="#FFFFFF" />
                    </View>
                    {relItem.duration ? (
                      <View style={styles.upNextDuration}>
                        <Text style={styles.upNextDurationText}>{relItem.duration}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Right Metadata */}
                  <View style={styles.upNextInfo}>
                    <Text style={styles.upNextTitleText} numberOfLines={2}>
                      {relItem.title}
                    </Text>
                    <Text style={styles.upNextChannel}>श्री. सचिन मलिक</Text>
                    <Text style={styles.upNextMeta}>
                      {relItem.views || '१K+ Views'} • {relItem.date || '२०२६'}
                    </Text>
                  </View>

                  {/* 3 dots menu */}
                  <TouchableOpacity
                    style={styles.upNextMenuBtn}
                    onPress={() => handleShareVideo(relItem)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon source="dots-vertical" size={18} color="#71717A" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Stylesheet ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },

  // ── YouTube Cinema Player ────────────────────────────────────────────────
  ytPlayerContainer: {
    width: SCREEN_WIDTH,
    height: PLAYER_HEIGHT,
    backgroundColor: '#000000',
    position: 'relative',
  },
  ytPlayerTouchable: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  ytPlayerDarkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  directVideoPlayer: {
    width: '100%',
    height: '100%',
  },

  // Top Chrome on Player
  ytTopChromeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 10 : 6,
  },
  ytBackIconBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  ytTopChromeRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ytChromeIcon: {
    padding: 6,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  // Center Play Card
  ytCenterPlayGroup: {
    position: 'absolute',
    top: '32%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -28 }],
    alignItems: 'center',
    width: 200,
  },
  ytRedPlayCard: {
    width: 68,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  ytTapToPlayLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Bottom Controls
  ytBottomControlsRow: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  ytTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ytTimeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  ytBottomRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hdBadge: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  hdBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  ytFullscreenBtn: {
    padding: 4,
  },

  // Red Scrubber Line
  ytScrubberTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  ytScrubberFilled: {
    height: '100%',
    backgroundColor: '#FF0000',
    position: 'relative',
  },
  ytScrubberThumb: {
    position: 'absolute',
    right: -5,
    top: -3.5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF0000',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Search Bar
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#212121',
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 8,
    paddingVertical: 0,
  },

  // ── Scroll Content ───────────────────────────────────────────────────────
  scrollContent: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scrollContainer: {
    paddingBottom: 40,
  },

  // ── Video Meta Section ───────────────────────────────────────────────────
  videoMetaContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
  },
  videoSubMeta: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 6,
  },
  categoryHash: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  // Channel Bar
  channelBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 12,
  },
  channelAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EA580C',
  },
  channelInfo: {
    flex: 1,
  },
  channelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  channelName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  channelSubscribers: {
    color: '#AAAAAA',
    fontSize: 11,
    marginTop: 2,
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  subscribedBtn: {
    backgroundColor: '#272727',
  },
  subscribeBtnText: {
    color: '#0F0F0F',
    fontSize: 12,
    fontWeight: '700',
  },
  subscribedBtnText: {
    color: '#FFFFFF',
  },

  // Action Pills Strip
  actionsScroll: {
    paddingVertical: 6,
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#272727',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  actionPillActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  actionPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionPillTextActive: {
    color: '#3B82F6',
  },
  ytWatchFullPill: {
    backgroundColor: '#2A1208',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  ytWatchFullText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Description Box
  descriptionBox: {
    backgroundColor: '#212121',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  descHeader: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  descText: {
    color: '#CCCCCC',
    fontSize: 12,
    lineHeight: 18,
  },
  descToggle: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },

  // ── YouTube Category Filter Chips ────────────────────────────────────────
  categoryBar: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#212121',
    marginTop: 6,
  },
  categoryListContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#272727',
  },
  categoryChipActive: {
    backgroundColor: '#FFFFFF',
  },
  categoryChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#0F0F0F',
    fontWeight: '700',
  },

  // ── Up Next / Recommendations Feed ───────────────────────────────────────
  upNextSection: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  upNextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  upNextTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  autoplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autoplayText: {
    color: '#AAAAAA',
    fontSize: 11,
  },
  upNextCard: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'center',
  },
  upNextThumbWrap: {
    width: 124,
    height: 74,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  upNextThumb: {
    width: '100%',
    height: '100%',
  },
  miniPlayIconWrap: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upNextDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  upNextDurationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  upNextInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  upNextTitleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  upNextChannel: {
    color: '#AAAAAA',
    fontSize: 11,
    marginTop: 3,
  },
  upNextMeta: {
    color: '#71717A',
    fontSize: 10,
    marginTop: 2,
  },
  upNextMenuBtn: {
    padding: 4,
  },

  // Loaders & Empty States
  loaderCenter: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#71717A',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
