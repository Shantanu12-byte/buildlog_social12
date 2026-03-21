import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, useWindowDimensions,
  SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { FeedPostCard as PostCard, FeedPost as Post } from '@/components/FeedPostCard';
import { LoadingScreen, EmptyState } from '@/components/ui/UI';
import { Feather } from '@expo/vector-icons';
import { checkRateLimit } from '@/lib/rateLimit';

export default function FeedScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  
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
      }, async (payload) => {
        // Fetch full profile info for the new post
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', payload.new.user_id)
          .single();
          
        const newPost = {
          ...payload.new,
          username: payload.new.username || profile?.username || 'builder',
          userAvatar: profile?.avatar_url,
        } as Post;
        
        setPosts(prev => [newPost, ...prev]);
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
      if (!refreshing) setLoading(true); // Don't show full loading screen on pull-to-refresh
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
        .select('*, users:user_id(username, avatar_url)')
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      
      if (data) {
        const mapped = data.map((p: any) => ({
          ...p,
          username: p.users?.username || p.username || 'builder',
          userAvatar: p.users?.avatar_url,
          cheers: p.likes_count ?? 0,
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
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts(true);
    setRefreshing(false);
  }, []);

  async function handleLike(postId: string) {
    if (!user) return;
    if (!checkRateLimit('like', 5, 10000)) { // 5 likes per 10 seconds
      return;
    }
    const post = posts.find(p => p.id === postId) as any;
    if (!post) return;

    const alreadyLiked = post.liked_by_user;

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { 
          ...p, 
          liked_by_user: !alreadyLiked, 
          cheers: (p.cheers ?? 0) + (alreadyLiked ? -1 : 1) 
        } as any;
      }
      return p;
    }));

    if (alreadyLiked) {
      await supabase
        .from('likes')
        .delete()
        .match({ post_id: postId, user_id: user.id });
    } else {
      await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: user.id });
    }
  }

  function handleComment(postId: string) {
    router.push(`/post/${postId}` as any);
  }

  if (loading) return <LoadingScreen />;

  const renderFeed = () => (
    <FlatList
      data={posts}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent.primary}
          colors={[Colors.accent.primary]}
        />
      }
      ListHeaderComponent={() => (
        <View>
          {/* Trending Challenges Strip */}
          <View style={s.challengeStrip}>
            <Text style={s.stripTitle}>TRENDING CHALLENGES</Text>
            <View style={s.challengeCards}>
              {[
                { title: 'Build REST API', count: 142, level: 'Beginner', color: Colors.pills.campus },
                { title: 'Clone Netflix', count: 89, level: 'Mid', color: Colors.pills.challenge },
                { title: 'E2EE Chat', count: 34, level: 'Hard', color: Colors.pills.building },
              ].map((ch, i) => (
                <TouchableOpacity key={i} style={s.challengeCard} activeOpacity={0.75}>
                  <Text style={s.challengeTitle} numberOfLines={1}>{ch.title}</Text>
                  <Text style={s.challengeCount}>{ch.count} building</Text>
                  <View style={[s.levelPill, { backgroundColor: ch.color.bg, borderColor: ch.color.border }]}>
                    <Text style={[s.levelText, { color: ch.color.text }]}>{ch.level}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          title="No posts yet"
          subtitle="Be the first to share what you're building"
        />
      }
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onLikePress={handleLike}
          onCommentPress={handleComment}
        />
      )}
      onEndReached={() => fetchPosts()}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loadingMore ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.accent.primary} />
          </View>
        ) : null
      }
    />
  );

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.primary} />

      {!isWeb && (
        <View style={s.topBar}>
          <Text style={s.logo}>build<Text style={{ color: Colors.accent.primary }}>log</Text></Text>
          <View style={s.topBarRight}>
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => router.push('/search' as any)}
            >
              <Feather name="search" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => router.push('/(stack)/messages' as any)}
            >
              <Feather name="message-square" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {renderFeed()}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border.subtle,
    backgroundColor: Colors.bg.primary,
  },
  logo: {
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bg.secondary,
    borderWidth: 0.5,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stories
  storiesContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border.subtle,
    backgroundColor: Colors.bg.primary,
  },
  storiesList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  storyItem: {
    alignItems: 'center',
    gap: 5,
    width: 52,
  },
  storyRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRingActive: {
    borderColor: Colors.accent.primary,
  },
  storyName: {
    color: Colors.text.tertiary,
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
  },

  // Challenge strip
  challengeStrip: {
    padding: Spacing.lg,
    backgroundColor: Colors.bg.primary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border.subtle,
    marginBottom: 6,
  },
  stripTitle: {
    color: Colors.text.tertiary,
    fontSize: Typography.sizes.xs,
    fontWeight: '500',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  challengeCards: {
    flexDirection: 'row',
    gap: 8,
  },
  challengeCard: {
    flex: 1,
    backgroundColor: Colors.bg.secondary,
    borderWidth: 0.5,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  challengeTitle: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    marginBottom: 3,
  },
  challengeCount: {
    color: Colors.text.tertiary,
    fontSize: Typography.sizes.xs,
    marginBottom: 6,
  },
  levelPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 0.5,
  },
  levelText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '500',
  },

  // Web layout
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.bg.primary,
  },
  sidebar: {
    width: 220,
    backgroundColor: Colors.bg.primary,
    borderRightWidth: 0.5,
    borderRightColor: Colors.border.subtle,
    padding: Spacing.xl,
    paddingTop: 48,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: 4,
  },
  sidebarIcon: {
    fontSize: 18,
    color: Colors.text.secondary,
    width: 24,
    textAlign: 'center',
  },
  sidebarLabel: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.base,
  },
  sidebarUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 'auto',
    paddingTop: Spacing.xl,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border.subtle,
  },
  sidebarUserName: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
    flex: 1,
  },
  webMain: {
    flex: 1,
    maxWidth: 680,
  },
});
