import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, useWindowDimensions,
  SafeAreaView, StatusBar, ActivityIndicator, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import LogEntryFeedItem from '@/components/LogEntryFeedItem';
import DevNewsFeed from '@/components/DevNewsFeed';
import NewsReader from '@/components/NewsReader';
import { NewsCardSkeleton } from '@/components/NewsCard';
import { LoadingScreen } from '@/components/ui/UI';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  runOnJS 
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

export default function FeedScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'news'>('feed');
  const [newsStatus, setNewsStatus] = useState('');
  const [newsRefreshing, setNewsRefreshing] = useState(false);
  
  const scrollX = useSharedValue(0);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchUser();
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

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

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
        .from('trending_posts')
        .select('*, profiles:author_id(username, avatar_url)')
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
    } catch (err) {
      console.error('fetchPosts error:', err);
    } finally {
      if (reset) setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh both posts and news
    await Promise.all([
      fetchPosts(true),
      triggerNewsRefresh()
    ]);
  }, []);

  const triggerNewsRefresh = async () => {
    // This will be handled by DevNewsFeed if we pass it a refresh trigger
    setNewsRefreshing(true);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    setPosts(prev => prev.map(p => p.id === postId ? { 
      ...p, 
      likes: (p.likes || 0) + (p.isLiked ? -1 : 1), 
      isLiked: !p.isLiked 
    } : p));
    
    try {
      const post = posts.find(p => p.id === postId);
      if (post?.isLiked) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      }
    } catch (err) {
      console.error('handleLike error:', err);
      fetchPosts(true);
    }
  };

  const handleComment = (id: string) => {
    router.push(`/post/${id}` as any);
  };

  // Swiping Logic
  const panoGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Sensitivity
    .onUpdate((e) => {
      const baseValue = activeTab === 'feed' ? 0 : -width;
      scrollX.value = baseValue + e.translationX;
      // Clamp values
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
      [0, 80] // Roughly the distance between labels
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor="#090909" />

        {/* Top Header */}
        <View style={s.topBar}>
          <Text style={s.logo}>build<Text style={{ color: Colors.accent.primary }}>log</Text></Text>
          
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

          <TouchableOpacity style={s.iconBtn}>
            <Feather name="bell" size={20} color="#666" />
          </TouchableOpacity>
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
                      if (status) setNewsStatus(status);
                      setNewsRefreshing(false);
                    }} 
                    onRefreshStart={() => setNewsRefreshing(true)}
                    onRefreshEnd={() => setNewsRefreshing(false)}
                    // We can use a key or a prop to force refresh if needed, 
                    // but loadAllNews is already called in useEffect.
                    // For manual refresh, we can use a timestamp prop.
                    forceRefreshKey={refreshing ? Date.now() : 0}
                  />
                }
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent.primary} />
                }
                onEndReached={() => fetchPosts()}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loadingMore ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator color={Colors.accent.primary} />
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

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090909',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
    backgroundColor: '#090909',
    zIndex: 100,
  },
  logo: {
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
    color: Colors.text.primary,
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
    color: '#666',
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFF',
  },
  underline: {
    position: 'absolute',
    bottom: -4,
    left: 10,
    width: 40,
    height: 2,
    backgroundColor: '#FFF',
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#444',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  newsStatusBanner: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2000,
  },
  newsStatusText: {
    color: '#9ca3af',
    fontSize: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newsLoadingOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2000,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    gap: 16,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
