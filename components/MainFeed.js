import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function MainFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = async () => {
    try {
      // 1. Fetch authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      // 2. Fetch user profile for interests array
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('interests')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const interests = profileData?.interests || [];

      // 3 & 5. Build posts query, order by newest first
      // 3 & 5. Build posts query, fetching from trending_posts view
      let query = supabase
        .from('trending_posts')
        .select('*')
        .order('score', { ascending: false });

      // 4. Algorithm Logic: Apply category filter if interests exist
      if (interests.length > 0) {
        query = query.in('category', interests);
      }

      // Execute query
      const { data: postsData, error: postsError } = await query;

      if (postsError) throw postsError;

      // 6. Store posts
      setPosts(postsData || []);
    } catch (error) {
      Alert.alert('Error loading feed', error.message);
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

  // 7. Pull-to-refresh control function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  }, []);

  const handleLike = async (postId) => {
    try {
      // Optimistic UI update
      setPosts(currentPosts => 
        currentPosts.map(p => 
          p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p
        )
      );

      // We'll try to use an RPC if available, otherwise direct update
      // It's safer to use RPC for atomic increments, but for now we'll do a simple update
      // based on the current post's known likes if RPC is not defined by user
      const post = posts.find(p => p.id === postId);
      const newLikes = (post?.likes_count || 0) + 1;

      const { error } = await supabase
        .from('posts')
        .update({ likes_count: newLikes })
        .eq('id', postId);

      if (error) throw error;
      
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update on error
      fetchFeed();
    }
  };

  const renderPost = ({ item }) => (
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
          onPress={() => handleLike(item.id)}
          activeOpacity={0.7}
        >
          <Feather name="arrow-up" size={16} color="#007AFF" />
          <Text style={styles.likeText}>{item.likes_count || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
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
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
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
            <Text style={styles.emptyText}>No posts found matching your interests.</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
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
