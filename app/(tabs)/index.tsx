import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, useWindowDimensions,
  SafeAreaView, ActivityIndicator, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import LogEntryFeedItem from '@/components/LogEntryFeedItem';
import DevNewsFeed from '@/components/DevNewsFeed';
import NewsReader from '@/components/NewsReader';
import { NewsCardSkeleton } from '@/components/NewsCard';
import { LoadingScreen } from '@/components/ui/UI';
import { Feather } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { DesktopLayout } from '@/components/ui/DesktopLayout';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  interpolate,
  runOnJS 
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { trackPageView } from '@/services/analyticsService';

export default function FeedScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const width = Platform.OS === 'web' ? Math.min(windowWidth, 600) : windowWidth;
  const { theme, isDark } = useTheme();
  const s = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { userId } = useUserStore();
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'news'>('feed');
  const [newsRefreshing, setNewsRefreshing] = useState(false);
  
  const scrollX = useSharedValue(0);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchPosts(true);

    const channel = supabase
      .channel('feed-updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'posts' 
      }, async () => {
        fetchPosts(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (userId) {
      trackPageView(userId, 'feed');
    }
  }, [userId]);


  async function fetchPosts(reset = false) {
    if (reset) {
      if (!refreshing) setLoading(true);
      setPage(0);
      setHasMore(true);
    } else {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    }
    
    const currentPage = reset ? 0 : page;

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:author_id(username, avatar_url)')
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      
      if (data) {
        const mapped = data.map((p: any) => ({
          ...p,
          username: p.profiles?.username || p.username || 'builder',
          avatar_url: p.profiles?.avatar_url || p.avatar_url,
          userAvatar: p.profiles?.avatar_url || p.avatar_url,
          imageUrl: p.imageUrl || p.image_url, // Ensure it's explicitly mapped
          image_url: p.image_url || p.imageUrl,
          title: p.projectTitle || p.title || 'untitled project',
          description: p.caption || p.description || 'show',
          likes: p.likes_count ?? 0,
          comments: p.comments ?? 0,
        }));
        setPosts(prev => reset ? mapped : [...prev, ...mapped]);
        setHasMore(data.length === PAGE_SIZE);
        setPage(currentPage + 1);
      }
    } catch {
    } finally {
      if (reset) setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchPosts(true),
      triggerNewsRefresh()
    ]);
  }, []);

  const triggerNewsRefresh = async () => {
    setNewsRefreshing(true);
    // DevNewsFeed handles internal refresh logic usually
  };

  const handleLike = async (postId: string) => {
    if (!userId) return;
    setPosts(prev => prev.map(p => p.id === postId ? { 
      ...p, 
      likes: (p.likes || 0) + (p.isLiked ? -1 : 1), 
      isLiked: !p.isLiked 
    } : p));
    
    try {
      const post = posts.find(p => p.id === postId);
      if (post?.isLiked) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: userId });
      }
    } catch {
      fetchPosts(true);
    }
  };

  const handleComment = (id: string) => {
    router.push(`/post/${id}` as any);
  };

  const renderItem = useCallback(({ item }: { item: any }) => (
    <LogEntryFeedItem
      post={{ ...item, userAvatar: item.avatar_url }}
      onHypePress={() => handleLike(item.id)}
      onCommentPress={() => handleComment(item.id)}
      onSharePress={() => {}}
    />
  ), [handleLike]);

  // Swiping Logic
  const panoGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) 
    .failOffsetY([-10, 10]) 
    .onUpdate((e) => {
      const baseValue = activeTab === 'feed' ? 0 : -width;
      scrollX.value = baseValue + e.translationX;
      if (scrollX.value > 0) scrollX.value = 0;
      if (scrollX.value < -width) scrollX.value = -width;
    })
    .onEnd((e) => {
      if (activeTab === 'feed') {
        if (e.translationX < -50 || e.velocityX < -500) {
          scrollX.value = withTiming(-width, { duration: 300 });
          runOnJS(setActiveTab)('news');
        } else {
          scrollX.value = withTiming(0, { duration: 300 });
        }
      } else {
        if (e.translationX > 50 || e.velocityX > 500) {
          scrollX.value = withTiming(0, { duration: 300 });
          runOnJS(setActiveTab)('feed');
        } else {
          scrollX.value = withTiming(-width, { duration: 300 });
        }
      }
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      [0, -width],
      [0, 84] 
    );
    return {
      transform: [{ translateX }],
    };
  });

  const switchTab = (tab: 'feed' | 'news') => {
    setActiveTab(tab);
    scrollX.value = withTiming(tab === 'feed' ? 0 : -width, { duration: 300 });
  };

  const { isDesktop, isWide } = useResponsive();
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowSkeleton(false), 500);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
    }
  }, [loading]);

  if (showSkeleton && !refreshing) return <LoadingScreen type="feed" count={isDesktop ? 2 : 3} />;

  const renderRightPanel = () => (
    <View style={s.rightPanel}>
      <View style={s.sideCard}>
        <Text style={s.sideCardTitle}>🔥 TRENDING TAGS</Text>
        <View style={s.tagCloud}>
          {['React', 'TypeScript', 'Node.js', 'AI', 'Next.js', 'Python', 'WebDev'].map(t => (
            <TouchableOpacity key={t} style={s.sideTag}>
              <Text style={s.sideTagText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.sideCard}>
        <Text style={s.sideCardTitle}>👥 TOP BUILDERS</Text>
        {[
          { name: 'shantanu', hype: 45 },
          { name: 'alex_dev', hype: 32 },
          { name: 'karan_codes', hype: 28 },
        ].map((b, i) => (
          <View key={b.name} style={s.builderRow}>
            <Text style={s.builderRank}>{i + 1}.</Text>
            <Text style={s.builderName}>@{b.name}</Text>
            <Text style={s.builderHype}>🔥{b.hype}</Text>
          </View>
        ))}
      </View>

      <View style={s.sideCard}>
        <Text style={s.sideCardTitle}>🏫 YOUR CAMPUS</Text>
        <Text style={s.campusName}>Prof Ram Meghe</Text>
        <View style={s.campusOnlineRow}>
          <View style={s.onlineDot} />
          <Text style={s.onlineText}>45 members online</Text>
        </View>
      </View>
    </View>
  );

  return (
    <DesktopLayout scrollable={false}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.bg }}>
        <SafeAreaView style={s.container}>

          {/* Top Header - Only show if not on desktop desktop layout handles sidebar */}
          <View style={s.topBar}>
            <Text style={s.logo}>build<Text style={{ color: theme.purple }}>log</Text></Text>
            
            <View style={s.tabContainer}>
              <View style={s.tabsWrapper}>
                <TouchableOpacity onPress={() => switchTab('feed')} style={s.tabItem}>
                  <Text style={[s.tabText, activeTab === 'feed' && s.tabTextActive]}>Feed</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => switchTab('news')} style={s.tabItem}>
                  <Text style={[s.tabText, activeTab === 'news' && s.tabTextActive]}>News</Text>
                </TouchableOpacity>
                
                {/* Underline Indicator */}
                <Animated.View style={[s.underline, indicatorStyle]} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                style={s.iconBtn} 
                onPress={() => router.push('/(tabs)/search')}
              >
                <Feather name="search" size={20} color={theme.textMuted} />
              </TouchableOpacity>
              
              <TouchableOpacity style={s.iconBtn}>
                <Feather name="bell" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.mainRow}>
            {/* Center column constraint */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: width, flex: 1, overflow: 'hidden' }}>
                {Platform.OS === 'web' ? (
                  <Animated.View style={[s.contentWrapper, animatedContainerStyle, { width: 2 * width }]}>
                    
                    {/* Feed Screen */}
                    <View style={{ width: width, flex: 1 }}>
                      <FlatList
                        data={posts}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        ListHeaderComponent={
                          <DevNewsFeed 
                            onOpenReader={(items, status) => {
                              setNewsItems(items);
                              setNewsRefreshing(false);
                            }} 
                            onRefreshStart={() => setNewsRefreshing(true)}
                            onRefreshEnd={() => setNewsRefreshing(false)}
                            forceRefreshKey={refreshing ? Date.now() : 0}
                          />
                        }
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.purple} />
                        }
                        onEndReached={() => fetchPosts()}
                        onEndReachedThreshold={0.5}
                        initialNumToRender={5}
                        maxToRenderPerBatch={5}
                        windowSize={10}
                        removeClippedSubviews={Platform.OS !== 'ios'}
                        ListFooterComponent={loadingMore ? (
                          <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator color={theme.purple} />
                          </View>
                        ) : null}
                      />
                    </View>

                    {/* News Screen */}
                    <View style={{ width: width, flex: 1 }}>
                      {newsItems.length > 0 ? (
                        <NewsReader 
                          items={newsItems} 
                          onClose={() => switchTab('feed')} 
                        />
                      ) : newsRefreshing ? (
                        <View style={{ flex: 1 }}>
                          {[1, 2, 3].map(i => <NewsCardSkeleton key={i} />)}
                        </View>
                      ) : (
                        <View style={s.errorState}>
                          <Text style={s.errorIcon}>📡</Text>
                          <Text style={s.errorTitle}>Could not load dev news</Text>
                          <TouchableOpacity 
                            style={s.retryBtn} 
                            onPress={() => triggerNewsRefresh()}
                          >
                            <Text style={s.retryText}>Try Again</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                  </Animated.View>
                ) : (
                  <GestureDetector gesture={panoGesture}>
                    <Animated.View style={[s.contentWrapper, animatedContainerStyle, { width: 2 * width }]}>
                      
                      {/* Feed Screen */}
                      <View style={{ width: width, flex: 1 }}>
                        <FlatList
                          data={posts}
                          keyExtractor={item => item.id}
                          renderItem={renderItem}
                          ListHeaderComponent={
                            <DevNewsFeed 
                              onOpenReader={(items, status) => {
                                setNewsItems(items);
                                setNewsRefreshing(false);
                              }} 
                              onRefreshStart={() => setNewsRefreshing(true)}
                              onRefreshEnd={() => setNewsRefreshing(false)}
                              forceRefreshKey={refreshing ? Date.now() : 0}
                            />
                          }
                          showsVerticalScrollIndicator={false}
                          refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.purple} />
                          }
                          onEndReached={() => fetchPosts()}
                          onEndReachedThreshold={0.5}
                          initialNumToRender={5}
                          maxToRenderPerBatch={5}
                          windowSize={10}
                          removeClippedSubviews={Platform.OS !== 'ios'}
                          ListFooterComponent={loadingMore ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                              <ActivityIndicator color={theme.purple} />
                            </View>
                          ) : null}
                        />
                      </View>

                      {/* News Screen */}
                      <View style={{ width: width, flex: 1 }}>
                        {newsItems.length > 0 ? (
                          <NewsReader 
                            items={newsItems} 
                            onClose={() => switchTab('feed')} 
                          />
                        ) : newsRefreshing ? (
                          <View style={{ flex: 1 }}>
                            {[1, 2, 3].map(i => <NewsCardSkeleton key={i} />)}
                          </View>
                        ) : (
                          <View style={s.errorState}>
                            <Text style={s.errorIcon}>📡</Text>
                            <Text style={s.errorTitle}>Could not load dev news</Text>
                            <TouchableOpacity 
                              style={s.retryBtn} 
                              onPress={() => triggerNewsRefresh()}
                            >
                              <Text style={s.retryText}>Try Again</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>

                    </Animated.View>
                  </GestureDetector>
                )}
              </View>
            </View>

            {/* Right Side Panel - Desktop Only */}
            {isWide && renderRightPanel()}
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </DesktopLayout>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.bg,
    zIndex: 100,
  },
  logo: {
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: -1,
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsWrapper: {
    flexDirection: 'row',
    position: 'relative',
    gap: 24,
    paddingBottom: 4,
  },
  tabItem: {
    width: 60,
    alignItems: 'center',
  },
  tabText: {
    color: theme.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextActive: {
    color: theme.textPrimary,
  },
  underline: {
    position: 'absolute',
    bottom: -4,
    left: 10,
    width: 40,
    height: 2,
    backgroundColor: theme.purple,
    borderRadius: 1,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
    gap: 16,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorTitle: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: theme.bgInput,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  retryText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  mainRow: {
    flex: 1,
    flexDirection: 'row',
  },
  rightPanel: {
    width: 300,
    padding: 24,
    gap: 20,
    ...(Platform.OS === 'web' && {
      position: 'sticky' as any,
      top: 0,
    })
  },
  sideCard: {
    backgroundColor: theme.bgCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sideCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.textSecondary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  tagCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sideTag: {
    backgroundColor: theme.bgInput,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sideTagText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  builderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  builderRank: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.textMuted,
    width: 20,
  },
  builderName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  builderHype: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.purple,
  },
  campusName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  campusOnlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  onlineText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '600',
  },
});
