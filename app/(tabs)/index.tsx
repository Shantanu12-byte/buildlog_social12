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
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  interpolate,
  runOnJS 
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

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

  // Swiping Logic
  const panoGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) 
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

  if (loading && !refreshing) return <LoadingScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaView style={s.container}>

        {/* Top Header */}
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

        <GestureDetector gesture={panoGesture}>
          <Animated.View style={[s.contentWrapper, animatedContainerStyle, { width: width * 2 }]}>
            
            {/* Feed Screen */}
            <View style={{ width }}>
              <FlatList
                data={posts}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <LogEntryFeedItem
                    post={{ ...item, userAvatar: item.avatar_url }}
                    onHypePress={() => handleLike(item.id)}
                    onCommentPress={() => handleComment(item.id)}
                    onSharePress={() => {}}
                  />
                )}
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
                ListFooterComponent={loadingMore ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator color={theme.purple} />
                  </View>
                ) : null}
              />
            </View>

            {/* News Screen */}
            <View style={{ width }}>
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
      </SafeAreaView>
    </GestureHandlerRootView>
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
});
