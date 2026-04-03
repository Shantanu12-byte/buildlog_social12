import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import LogEntryFeedItem from '@/components/LogEntryFeedItem';
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
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  
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
      .from('trending_posts')
      .select('*, users:user_id(username, avatar_url)')
      .eq('id', id)
      .single();

    if (postData) {
      setPost({
        ...postData,
        username: postData.users?.username || postData.username || 'builder',
        userAvatar: postData.users?.avatar_url,
        title: postData.projectTitle || postData.title || 'untitled project',
        description: postData.caption || postData.description || 'show',
        likes: postData.likes_count ?? 0,
        comments: postData.comments ?? 0,
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

  const handleLike = async () => {
    if (!post || !user) return;
    const postId = id as string;

    setPost({ 
      ...post, 
      likes: (post.likes || 0) + (post.isLiked ? -1 : 1), 
      isLiked: !post.isLiked 
    });

    try {
      if (post.isLiked) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      }
    } catch (err) { }
  };

  async function handleSend() {
    const trimmed = comment.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Message cannot be empty');
      return;
    }
    if (!user || !id) return;

    if (!post?.project_id) {
      Alert.alert('Error', 'Discussions are limited to project-linked logs.');
      return;
    }

    setSending(true);
    setComment('');

    const { error } = await supabase.from('discussions').insert({
      content: trimmed,
      message: trimmed, 
      post_id: id,
      project_id: post.project_id,
      user_id: user.id,
    });

    if (error) { Alert.alert('Error', 'Failed to send comment. Please try again.');
      setComment(trimmed);
    } else if (post) {
      setPost({ ...post, comments: (post.comments || 0) + 1 });
    }
    setSending(false);
  }

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>DISCUSSIONS</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatRef}
          data={discussions}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            post && <LogEntryFeedItem post={post} onHypePress={handleLike} />
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
              <Feather name="message-circle" size={40} color={theme.textMuted} />
              <Text style={s.emptyText}>NO_DISCUSSIONS_YET</Text>
              <Text style={s.emptySub}>BE_THE_FIRST_TO_WEIGH_IN</Text>
            </View>
          }
        />

        <View style={s.inputArea}>
          <TextInput
            style={[s.input, { maxHeight: 100 }]}
            placeholder="ADD_A_LOG_ENTRY..."
            placeholderTextColor={theme.textMuted}
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
              <ActivityIndicator size="small" color={isDark ? "#FFF" : theme.purple} />
            ) : (
              <Feather name="send" size={20} color={comment.trim() ? (isDark ? "#000" : "#FFF") : theme.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    color: theme.textPrimary,
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
    borderBottomColor: theme.border,
    gap: Spacing.md,
  },
  commentContent: { flex: 1 },
  commentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: { color: theme.purple, fontSize: 13, fontWeight: '700' },
  commentTime: { color: theme.textMuted, fontSize: 10, fontFamily: 'monospace' },
  commentText: { color: theme.textPrimary, fontSize: 14, lineHeight: 20 },
  empty: { padding: 60, alignItems: 'center', gap: 12 },
  emptyText: { color: theme.textSecondary, fontSize: 14, fontWeight: '800' },
  emptySub: { color: theme.textMuted, fontSize: 10, textAlign: 'center' },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.lg,
    backgroundColor: theme.bg,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: theme.bgInput,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: theme.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  sendBtnActive: {
    backgroundColor: theme.purple,
    borderColor: theme.purple,
  },
});
