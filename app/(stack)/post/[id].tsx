import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { FeedPostCard as PostCard } from '@/components/FeedPostCard';
import { Avatar, LoadingScreen } from '@/components/ui/UI';
import { Feather } from '@expo/vector-icons';

interface Discussion {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  users: {
    username: string;
    avatar_url?: string;
  };
}

export default function DiscussionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [comment, setComment] = useState('');
  const [user, setUser] = useState<any>(null);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    init();
  }, [id]);

  async function init() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    setUser(authUser);

    // Fetch Post
    const { data: postData } = await supabase
      .from('posts')
      .select('*, users:author_id(username, avatar_url)')
      .eq('id', id)
      .single();

    if (postData) {
      setPost({
        ...postData,
        username: postData.users?.username || postData.username || 'builder',
        userAvatar: postData.users?.avatar_url,
        cheers: postData.likes_count ?? 0,
      });
    }

    // Fetch Discussions
    const { data: discData } = await supabase
      .from('discussions')
      .select('*, users:user_id(username, avatar_url)')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    setDiscussions(discData || []);
    setLoading(false);

    // Subscribe to new discussions
    const channel = supabase
      .channel(`discussions:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'discussions',
        filter: `post_id=eq.${id}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('discussions')
          .select('*, users:user_id(username, avatar_url)')
          .eq('id', payload.new.id)
          .single();
        if (data) {
          setDiscussions(prev => [...prev, data]);
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function handleSend() {
    const trimmed = comment.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Message cannot be empty');
      return;
    }
    if (!user || !id) return;

    setSending(true);
    setComment('');

    const { error } = await supabase.from('discussions').insert({
      content: trimmed,
      message: trimmed, // Legacy schema support
      post_id: id,
      project_id: post?.project_id, // Satisfy NOT NULL constraint
      user_id: user.id,
    });

    if (error) {
      console.error('Error sending comment:', error);
      Alert.alert('Error', 'Failed to send comment. Please try again.');
      setComment(trimmed);
    } else if (post) {
      // Opt to update using the app code since RLS is disabled, 
      // preventing the need for more SQL scripts explicitly!
      try {
        await supabase
          .from('posts')
          .update({ comments: (post.comments || 0) + 1 })
          .eq('id', id);
        
        // Optimistically update local state if needed
        setPost({ ...post, comments: (post.comments || 0) + 1 });
      } catch (updateErr) {
        console.error('Error updating comment count:', updateErr);
      }
    }
    setSending(false);
  }

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>DISCUSSIONS</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatRef}
          data={discussions}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            post && <PostCard post={post} />
          }
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <View style={s.commentRow}>
              <Avatar username={item.users?.username} size={32} />
              <View style={s.commentContent}>
                <View style={s.commentMeta}>
                  <Text style={s.commentUser}>{item.users?.username || 'builder'}</Text>
                  <Text style={s.commentTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={s.commentText}>{item.content}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="message-circle" size={40} color="#333" />
              <Text style={s.emptyText}>NO_DISCUSSIONS_YET</Text>
              <Text style={s.emptySub}>BE_THE_FIRST_TO_WEIGH_IN</Text>
            </View>
          }
        />

        <View style={s.inputArea}>
          <TextInput
            style={[s.input, { maxHeight: 100 }]}
            placeholder="ADD_A_LOG_ENTRY..."
            placeholderTextColor="#555"
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <TouchableOpacity
            style={[s.sendBtn, !!comment.trim() && s.sendBtnActive]}
            onPress={handleSend}
            disabled={!comment.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Feather name="send" size={20} color={comment.trim() ? "#FFF" : "#333"} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0B' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: { padding: 4 },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'monospace',
  },
  list: { paddingBottom: 100 },
  commentRow: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1A1A1A',
    gap: Spacing.md,
  },
  commentContent: { flex: 1 },
  commentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: { color: Colors.accent.glow, fontSize: 13, fontWeight: '700' },
  commentTime: { color: '#555', fontSize: 10, fontFamily: 'monospace' },
  commentText: { color: '#EEE', fontSize: 14, lineHeight: 20 },
  empty: { padding: 60, alignItems: 'center', gap: 12 },
  emptyText: { color: '#333', fontSize: 14, fontWeight: '800' },
  emptySub: { color: '#222', fontSize: 10, textAlign: 'center' },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.lg,
    backgroundColor: '#0F0F0B',
    borderTopWidth: 1,
    borderTopColor: '#222',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  sendBtnActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.glow,
  },
});
