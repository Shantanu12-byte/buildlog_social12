import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  Alert,
  Platform,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const PostItem = React.memo(({ item, onLike }) => (
  <View style={styles.postCard}>
    <Text style={styles.postCategory}>{item.category || 'Uncategorized'}</Text>
    <Text style={styles.postTitle}>{item.title || 'Untitled Post'}</Text>
    {item.content ? <Text style={styles.postContent}>{item.content}</Text> : null}
    
    <View style={styles.postFooter}>
      <Text style={styles.postDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
      
      <TouchableOpacity 
        style={styles.likeButton}
        onPress={() => onLike(item.id)}
        activeOpacity={0.7}
      >
        <Feather name="arrow-up" size={16} color="#007AFF" />
        <Text style={styles.likeText}>{item.likes_count || 0}</Text>
      </TouchableOpacity>
    </View>
  </View>
));

PostItem.displayName = 'PostItem';

export default function MainFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchFeed = async () => {
    try {
      setFetchError(null);
      const { data, error } = await supabase
        .from('trending_posts')
        .select('id, category, title, content, created_at, likes_count, gravity_score, user_id')
        .order('gravity_score', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) { 
      setFetchError(error.message);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    await fetchFeed();
    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  }, []);

  const handleLike = useCallback(async (postId) => {
    try {
      setPosts(currentPosts => 
        currentPosts.map(p => 
          p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p
        )
      );

      const post = posts.find(p => p.id === postId);
      const newLikes = (post?.likes_count || 0) + 1;

      const { error } = await supabase
        .from('posts')
        .update({ likes_count: newLikes })
        .eq('id', postId);

      if (error) throw error;
      
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (currentUser && Platform.OS === 'web') {
        const { data: { session } } = await supabase.auth.getSession();
        fetch(`${BACKEND_URL}/api/user/push/notify/hype`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            targetUserId: post.user_id,
            hypedByUsername: currentUser.user_metadata?.username || 'Someone',
            postTitle: post.title || 'a post',
          }),
        }).catch(() => {});
      }
      
    } catch (error) { 
      fetchFeed();
    }
  }, [posts]);

  const renderPost = useCallback(({ item }) => (
    <PostItem item={item} onLike={handleLike} />
  ), [handleLike]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{color: 'red', margin: 20, textAlign: 'center', fontSize: 16}}>{fetchError}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Feed</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'ios'}
        updateCellsBatchingPeriod={50}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No data found in trending_posts view</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        }
    ),
    elevation: 3,
  },
  postCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF', // Modern blue for category tags
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 14,
  },
  postDate: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF', // Very light blue
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D0E8FF',
  },
  likeText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
});
