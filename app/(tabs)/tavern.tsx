import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Keyboard,
  Animated,
  Pressable,
  Image as RNImage
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { Spacing } from '@/constants/theme';
import { AvatarBlock } from '@/components/AvatarBlock';

type Message = {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
    level: string;
  };
};

const TIER_COLORS: Record<string, string> = {
  Architect: '#00E5FF',
  Legend: '#FFD700',
  Default: '#55FF55',
};

export default function TavernScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeHackers, setActiveHackers] = useState(1);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const { userProfile, fetchUserProfile } = useUserStore();
  const currentUserId = userProfile?.id || null;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    if (!currentUserId) {
      await fetchUserProfile();
    }
    
    const { data, error } = await supabase
      .from('campus_chat')
      .select(`
        id, 
        message, 
        created_at, 
        user_id, 
        profiles:user_id(username, avatar_url, level)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      // Data is descending (latest first), reverse for chronological display
      setMessages(data.reverse() as any);
      setHasMore(data.length === 50);
    }
    setLoading(false);
    
    // Auto-scroll to bottom after initial load
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
  }, [currentUserId, fetchUserProfile]);

  const loadOlderMessages = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    
    setLoadingMore(true);
    const oldestMessage = messages[0];

    try {
      const { data, error } = await supabase
        .from('campus_chat')
        .select(`
          id, 
          message, 
          created_at, 
          user_id, 
          profiles:user_id(username, avatar_url, level)
        `)
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        if (data.length === 0) {
          setHasMore(false);
        } else {
          // data is newest to oldest, reverse to oldest to newest for prepending
          const older = data.reverse() as any;
          setMessages(prev => [...older, ...prev]);
          setHasMore(data.length === 50);
        }
      }
    } catch (err) {
      console.error('📡 TAVERN_PAGINATION_ERROR:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, messages]);

  useEffect(() => {
    fetchMessages();

    // Combined Real-time channel
    const channel = supabase.channel('tavern_main', {
      config: {
        presence: {
          key: currentUserId || 'anonymous',
        },
      },
    });

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'campus_chat' }, async (payload) => {
        // Fetch profile for the new message
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url, level')
          .eq('id', payload.new.user_id)
          .maybeSingle();

        const incoming: Message = { 
          id: payload.new.id,
          user_id: payload.new.user_id,
          message: payload.new.message,
          created_at: payload.new.created_at,
          profiles: profile as any
        };
        
        setMessages(prev => [...prev, incoming]);
        // Only scroll to bottom if user is already near bottom (optional, basic impl always scrolls)
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setActiveHackers(Object.keys(state).length);
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { username, isTyping } = payload.payload;
        if (username === userProfile?.username) return;

        setTypingUsers((current) => {
          if (isTyping && !current.includes(username)) return [...current, username];
          if (!isTyping) return current.filter((u) => u !== username);
          return current;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    // Blinking animation for typing indicator
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    blink.start();

    const keyboardListener = Keyboard.addListener('keyboardDidShow', () => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });

    return () => {
      supabase.removeChannel(channel);
      keyboardListener.remove();
      blink.stop();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [currentUserId, userProfile?.username, fetchMessages]);

  const handleInputChange = (text: string) => {
    setNewMessage(text);
    
    if (!userProfile?.username) return;

    const channel = supabase.channel('tavern_main');
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { username: userProfile.username, isTyping: true },
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { username: userProfile.username, isTyping: false },
      });
    }, 2000) as any;
  };

  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !currentUserId || sending) return;

    setSending(true);
    setNewMessage('');

    const { error } = await supabase.from('campus_chat').insert({
      user_id: currentUserId,
      message: text
    });

    if (error) {
      console.error('Send error:', error);
    }
    setSending(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.user_id === currentUserId;
    
    // Defensive check: Supabase sometimes returns joins as arrays
    const rawProfile = isMe ? userProfile : item.profiles;
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

    if (!isMe && !profile) {
      console.warn('⚠️ TAVERN_DEBUG: Missing profile for message:', item.id, 'from user:', item.user_id);
    }
    
    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        <Pressable 
          style={styles.avatarContainer}
          onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.user_id } })}
        >
          <AvatarBlock 
            key={`${item.id}-${profile?.avatar_url || 'no-img'}`}
            url={profile?.avatar_url} 
            username={profile?.username} 
            size={32}
            tier={profile?.level || 'Default'}
          />
        </Pressable>
        
        <View style={styles.messageContent}>
          {!isMe && (
            <Pressable onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.user_id } })}>
              <Text style={[styles.nametag, { color: '#55FF55' }]}>
                {profile?.username?.toUpperCase() || 'BUILDER'}
              </Text>
            </Pressable>
          )}
          
          <View style={[
            styles.bubble, 
            isMe ? styles.bubbleMe : styles.bubbleOther,
            !isMe && { borderColor: '#555' }
          ]}>
            <Text style={[styles.messageText, !isMe && { color: '#AAA' }]}>{item.message}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#55FF55" />
        <Text style={styles.loadingText}> {'> RETRIEVING_CHAT_LOGS...'} </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Image 
            source={require('../../assets/developer_emblem.png')}
            style={{ width: 16, height: 16, marginRight: 8 }}
          />
          <Text style={styles.headerTitle}>{'< THE_TAVERN / GLOBAL_SERVER >'}</Text>
        </View>
        <View style={styles.presenceBadge}>
          <Text style={styles.presenceText}>[ 🟢 ONLINE: {activeHackers} ]</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          ListHeaderComponent={
            hasMore ? (
              <TouchableOpacity 
                style={styles.loadMoreBtn} 
                onPress={loadOlderMessages}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator color="#55FF55" size="small" />
                ) : (
                  <Text style={styles.loadMoreText}>{'> ACCESS_OLDER_LOGS...'}</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <Animated.View style={[styles.typingContainer, { opacity: blinkAnim }]}>
            <Text style={styles.typingText}>
              {typingUsers.length > 1 
                ? '[ MULTIPLE_HACKERS_ARE_TYPING... ]' 
                : `[ ${typingUsers[0].toUpperCase()}_IS_TYPING... ]`}
            </Text>
          </Animated.View>
        )}

        {/* Input Terminal */}
        <View style={styles.inputArea}>
          <View style={styles.inputBevel}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={handleInputChange}
              placeholder="> BROADCAST_MESSAGE..."
              placeholderTextColor="#444"
              multiline={false}
            />
          </View>
          <TouchableOpacity 
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]} 
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Text style={styles.sendButtonText}>{sending ? '...' : '[ SEND ]'}</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    fontFamily: 'monospace',
    color: '#55FF55',
    marginTop: 16,
    fontSize: 12,
    letterSpacing: 1,
  },
  header: {
    paddingVertical: 18,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#222',
    backgroundColor: '#000',
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#55FF55', // Matrix Green
    letterSpacing: 1,
    marginBottom: 8,
  },
  presenceBadge: {
    backgroundColor: '#111',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 2,
    borderTopColor: '#333',
    borderLeftColor: '#333',
    borderBottomColor: '#000',
    borderRightColor: '#000',
  },
  presenceText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#55FF55',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  messageRowMe: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    gap: 8,
  },
  messageRowOther: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  avatarContainer: {
    marginTop: 14, // Aligns with the middle of the first line approx
  },
  messageContent: {
    flex: 1,
  },
  nametag: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    padding: 12,
    borderWidth: 4,
  },
  bubbleMe: {
    backgroundColor: '#222',
    borderTopColor: '#555',
    borderLeftColor: '#555',
    borderBottomColor: '#000',
    borderRightColor: '#000',
  },
  bubbleOther: {
    backgroundColor: '#000',
    borderWidth: 4,
    borderColor: '#555',
  },
  messageText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#000',
    borderTopWidth: 4,
    borderTopColor: '#222',
    alignItems: 'center',
  },
  inputBevel: {
    flex: 1,
    backgroundColor: '#000',
    borderWidth: 4,
    borderTopColor: '#555',
    borderLeftColor: '#555',
    borderBottomColor: '#AAA',
    borderRightColor: '#AAA',
    marginRight: 10,
  },
  input: {
    color: '#FFF',
    fontFamily: 'monospace',
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#00E5FF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 4,
    borderTopColor: '#FFF',
    borderLeftColor: '#FFF',
    borderBottomColor: 'rgba(0,0,0,0.5)',
    borderRightColor: 'rgba(0,0,0,0.5)',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontFamily: 'monospace',
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typingText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#FFD700', // Neon Yellow
    fontWeight: 'bold',
  },
  loadMoreBtn: {
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  loadMoreText: {
    fontFamily: 'monospace',
    color: '#55FF55',
    fontSize: 10,
    letterSpacing: 1,
  },
});
