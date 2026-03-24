import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, useWindowDimensions,
  SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import LogEntryFeedItem from '@/components/LogEntryFeedItem';
import { LoadingScreen } from '@/components/ui/UI';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FeedScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const [posts, setPosts] = useState<any[]>([]);
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
        .select('*, users:user_id(username, avatar_url)')
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      
      if (data) {
        const mapped = data.map((p: any) => ({
          ...p,
          username: p.users?.username || p.username || 'builder',
          avatar_url: p.users?.avatar_url,
          // Map schema fields to component props
          title: p.projectTitle || p.title || 'untitled project',
          description: p.caption || p.description || 'show',
          likes: p.likes_count ?? 0,
          comments: p.comments ?? 0, // Using p.comments from schema
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
    await fetchPosts(true);
  }, []);

  const handleLike = async (postId: string) => {
    if (!user) return;

    // Optimistic UI update
    setPosts(prev => prev.map(p => p.id === postId ? { 
      ...p, 
      likes: (p.likes || 0) + (p.isLiked ? -1 : 1), 
      isLiked: !p.isLiked 
    } : p));
    
    try {
      const isCurrentlyLiked = posts.find(p => p.id === postId)?.isLiked;
      
      if (isCurrentlyLiked) {
        // Unlike: Remove from likes table
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        // Like: Insert into likes table
        await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
      }
    } catch (err) {
      console.error('handleLike error:', err);
      // Revert optimistic update on error
      fetchPosts(true);
    }
  };

  const handleComment = (id: string) => {
    router.push(`/post/${id}` as any);
  };

  if (loading && !refreshing) return <LoadingScreen />;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090909" />

      {/* Professional Header */}
      <View style={s.topBar}>
        <Text style={s.logo}>build<Text style={{ color: Colors.accent.primary }}>log</Text></Text>
        <View style={s.topBarRight}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => router.push('/(tabs)/search' as any)}
          >
            <Feather name="search" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => router.push('/(stack)/messages' as any)}
          >
            <Feather name="lock" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <LogEntryFeedItem
            post={{
              ...item,
              userAvatar: item.avatar_url // Map avatar_url to userAvatar for the component
            }}
            onHypePress={() => handleLike(item.id)}
            onCommentPress={() => handleComment(item.id)}
            onSharePress={() => {}}
          />
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent.primary} />
        }
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
    </SafeAreaView>
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
    borderBottomColor: '#1A1A1A',
    backgroundColor: '#090909',
  },
  logo: {
    fontSize: Typography.sizes.xl,
    fontWeight: '900',
    color: Colors.text.primary,
    letterSpacing: -1,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
});
