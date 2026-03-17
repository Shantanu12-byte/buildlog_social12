import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { AuroraBackground } from '@/components/AuroraBackground';

type ProfileRow = { username: string | null; avatar_url: string | null } | null;

export type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles: ProfileRow;
};

const BUBBLE_ME = '#00F0FF';
const BUBBLE_ME_BG = 'rgba(0, 240, 255, 0.25)';
const BUBBLE_OTHER = 'rgba(42, 42, 42, 0.85)';
const glassBorder = { borderWidth: 1, borderColor: Colors.border };

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ChatRoomScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const { data: rows, error } = await supabase
        .from('campus_chat')
        .select(`
          id,
          user_id,
          message,
          created_at,
          profiles (username, avatar_url)
        `)
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error && rows) {
        setMessages((rows as unknown as ChatMessage[]) ?? []);
      }
      setLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('public:campus_chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'campus_chat' },
        async (payload) => {
          const newRow = payload.new as { id: string; user_id: string; message: string; created_at: string };
          const { data } = await supabase
            .from('campus_chat')
            .select(`
              id,
              user_id,
              message,
              created_at,
              profiles (username, avatar_url)
            `)
            .eq('id', newRow.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as unknown as ChatMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !currentUserId || sending) return;

    setSending(true);
    setInputText('');

    await supabase.from('campus_chat').insert({
      user_id: currentUserId,
      message: text,
    });

    setSending(false);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.user_id === currentUserId;
    const username = item.profiles?.username ?? 'Unknown';
    const avatarUrl = item.profiles?.avatar_url ?? null;

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        {!isMe && (
          <View style={styles.otherMeta}>
            <View style={[styles.avatarWrap, glassBorder]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <Text style={styles.otherUsername}>{username}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={styles.bubbleText}>{item.message}</Text>
          <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextOther]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingLabel}>LOADING_CHAT...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Campus Chat</Text>
            <Text style={styles.headerSubtitle}>Group · Realtime</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <Feather name="message-circle" size={48} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Say hi and start the conversation!</Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={styles.inputBarWrap}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={2000}
              editable={!sending}
            />
            <Pressable
              style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              <Feather name="send" size={20} color="#000000" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingLabel: {
    fontFamily: 'monospace',
    marginTop: Spacing.md,
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
  },
  headerWrap: {
    backgroundColor: '#111111',
    borderBottomWidth: 4,
    borderBottomColor: '#222222',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderWidth: 2,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#000000',
    borderRightColor: '#000000',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontFamily: 'monospace',
    color: '#888888',
    fontSize: 10,
    marginTop: 2,
  },
  keyboard: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#000000',
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyIconWrap: {
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontFamily: 'monospace',
    color: '#666666',
    fontSize: FontSizes.sm,
  },
  messageRow: {
    marginBottom: Spacing.lg,
    maxWidth: '85%',
  },
  messageRowMe: {
    alignSelf: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
  },
  otherMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  avatarWrap: {
    marginRight: Spacing.sm,
    borderWidth: 2,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#555555',
    borderRightColor: '#555555',
  },
  avatar: {
    width: 24,
    height: 24,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    backgroundColor: '#8B8B8B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  otherUsername: {
    fontFamily: 'monospace',
    color: '#AAAAAA',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 4,
  },
  bubbleMe: {
    backgroundColor: '#444444',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#111111',
    borderRightColor: '#111111',
  },
  bubbleOther: {
    backgroundColor: '#222222',
    borderTopColor: '#888888',
    borderLeftColor: '#888888',
    borderBottomColor: '#000000',
    borderRightColor: '#000000',
  },
  bubbleText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  timeText: {
    fontFamily: 'monospace',
    fontSize: 8,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
  },
  timeTextMe: {
    color: '#AAAAAA',
  },
  timeTextOther: {
    color: '#666666',
  },
  inputBarWrap: {
    padding: Spacing.md,
    backgroundColor: '#111111',
    borderTopWidth: 4,
    borderTopColor: '#222222',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#333333',
    borderWidth: 2,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#111111',
    borderRightColor: '#111111',
    padding: 2,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: FontSizes.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#8B8B8B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#333333',
    borderRightColor: '#333333',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
