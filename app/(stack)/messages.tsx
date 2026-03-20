import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { LoadingScreen, Avatar, Input, Button } from '@/components/ui/UI';
import { Feather } from '@expo/vector-icons';
import { Modal, FlatList as RNFlatList } from 'react-native';
import { getOrCreateKeyPair, encryptMessage, decryptMessage, KeyPair } from '@/lib/crypto';
import { checkRateLimit } from '@/lib/rateLimit';

// ─── Types ────────────────────────────────────────────────────
interface DMRoom {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message?: string;
  last_message_at: string;
  other_user?: {
    id: string;
    username: string;
    public_key?: string;
  };
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

type MobileView = 'list' | 'chat';

// ─── Helpers ──────────────────────────────────────────────────
function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// ─── DM List Item ─────────────────────────────────────────────
function DMListItem({
  room,
  onPress,
}: {
  room: DMRoom;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={s.dmCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={s.avatarSquare}>
        <Avatar username={room.other_user?.username || 'u'} size={32} />
      </View>

      <View style={s.dmInfo}>
        <View style={s.dmTitleRow}>
          <Text style={s.dmUsername}>{(room.other_user?.username || 'unknown').toUpperCase()}</Text>
          <Feather name="lock" size={14} color={Colors.accent.glow} style={{ marginLeft: 6 }} />
        </View>
        <View style={s.dmMetaRow}>
          <Feather name="lock" size={12} color="#FFA500" />
          <Text style={s.dmDate}>{formatDate(room.last_message_at)}</Text>
        </View>
      </View>

      <View style={s.dmRight}>
        <Text style={s.dmTime}>{formatTime(room.last_message_at).toLowerCase()}</Text>
        <Feather name="chevron-right" size={20} color={Colors.accent.glow} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Chat View ────────────────────────────────────────────────
function ChatPanel({
  room,
  messages,
  loading,
  userId,
  onSend,
  onBack,
}: {
  room: DMRoom;
  messages: Message[];
  loading: boolean;
  userId: string;
  onSend: (text: string) => void;
  onBack: () => void;
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  function handleSend() {
    if (!text.trim() || sending) return;
    
    if (!checkRateLimit('message', 3, 5000)) {
      return;
    }

    onSend(text.trim());
    setText('');
  }

  return (
    <View style={s.chatPanel}>
      <View style={s.chatHeader}>
        <TouchableOpacity onPress={onBack} style={s.chatBackBtn}>
          <Feather name="arrow-left" size={20} color={Colors.accent.glow} />
        </TouchableOpacity>
        <Avatar username={room.other_user?.username || 'u'} size={28} />
        <Text style={s.userNameTitle}>{(room.other_user?.username || 'unknown').toUpperCase()}</Text>
      </View>
      
      <View style={s.e2eeBanner}>
        <Text style={s.e2eeText}>- SECURE_TRANSMISSION_ACTIVE -</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={s.center}><ActivityIndicator color={Colors.accent.glow} /></View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={s.messageList}
            renderItem={({ item }) => {
              const isMe = item.sender_id === userId;
              return (
                <View style={[s.msgRow, isMe && s.msgRowMe]}>
                  <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
                    <Text style={s.bubbleText}>{item.content}</Text>
                    <Text style={s.bubbleTime}>{formatTime(item.created_at)}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={s.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="TYPE_MESSAGE..."
            placeholderTextColor="#333"
            style={[s.msgInput, { maxHeight: 100 }]}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim()}
            style={s.sendBtn}
          >
            <Feather name="send" size={18} color={text.trim() ? Colors.accent.glow : '#222'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function MessagesScreen() {
  const router = useRouter();
  const { roomId, targetUserId } = useLocalSearchParams<{ roomId?: string, targetUserId?: string }>();
  
  const [rooms, setRooms] = useState<DMRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<DMRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [canChat, setCanChat] = useState(true);
  const [followError, setFollowError] = useState('');
  const [myKeys, setMyKeys] = useState<KeyPair | null>(null);
  const [isSending, setIsSending] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initScreen();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  async function initScreen() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { router.replace('/(auth)/login' as any); return; }
    setUser(authUser);
    
    // Key setup
    const keys = await getOrCreateKeyPair();
    setMyKeys(keys);
    
    // Fetch rooms first
    const fetchedRooms = await fetchRooms(authUser.id);
    
    // Handle params
    if (roomId) {
      const room = fetchedRooms?.find(r => r.id === roomId);
      if (room) openRoom(room);
    } else if (targetUserId) {
      // Find user first
      const { data: targetProfile } = await supabase.from('profiles').select('id, username, public_key').eq('id', targetUserId).single();
      if (targetProfile) {
        const isFollowed = await checkFollow(authUser.id, targetProfile.id);
        if (isFollowed) {
          handleStartChat(targetProfile);
        } else {
          setFollowError(`FOLLOW_REQUIRED: You must follow @${targetProfile.username} to chat.`);
        }
      }
    }
    
    setLoading(false);
  }

  async function fetchRooms(userId: string) {
    const { data: roomData, error: roomError } = await supabase
      .from('dm_rooms')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (roomError) {
      console.error('Fetch rooms error:', roomError);
      return [];
    }

    if (!roomData || roomData.length === 0) {
      setRooms([]);
      return [];
    }

    // Manual Join: Collect all unique user IDs
    const userIds = new Set<string>();
    roomData.forEach(r => {
      userIds.add(r.user1_id);
      userIds.add(r.user2_id);
    });

    // Fetch all profiles involved
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, public_key')
      .in('id', Array.from(userIds));

    const profileMap = new Map(profileData?.map(p => [p.id, p]));

    const mapped: DMRoom[] = roomData.map((r: any) => ({
      ...r,
      other_user: r.user1_id === userId ? profileMap.get(r.user2_id) : profileMap.get(r.user1_id),
      last_message_at: r.last_message_at || r.created_at,
    }));

    mapped.sort((a,b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    setRooms(mapped);
    return mapped;
  }

  async function performSearch(q: string) {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, public_key')
      .ilike('username', `%${q}%`)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  }

  async function handleStartChat(otherUser: { id: string, username: string }) {
    if (!user) return;
    setSearchModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);

    // 0. Check Follow
    const isFollowing = await checkFollow(user.id, otherUser.id);
    if (!isFollowing) {
      alert(`FOLLOW_REQUIRED: You must follow @${otherUser.username} to initiate contact.`);
      return;
    }

    // 1. Check if room exists using a simpler query to find ANY room for this user
    const { data: allRooms } = await supabase
      .from('dm_rooms')
      .select('id, user1_id, user2_id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    
    const existing = allRooms?.find(r => 
      (r.user1_id === user.id && r.user2_id === otherUser.id) || 
      (r.user1_id === otherUser.id && r.user2_id === user.id)
    );

    if (existing) {
      // Re-fetch full room data for the existing room (manual join)
      const { data: fullRoom } = await supabase.from('dm_rooms').select('*').eq('id', existing.id).single();
      if (fullRoom) {
        const { data: pData } = await supabase
          .from('profiles')
          .select('id, username, public_key')
          .in('id', [fullRoom.user1_id, fullRoom.user2_id]);
        const map = new Map(pData?.map(p => [p.id, p]));
        const room: DMRoom = { 
          ...fullRoom, 
          other_user: fullRoom.user1_id === user.id ? map.get(fullRoom.user2_id) : map.get(fullRoom.user1_id) 
        };
        openRoom(room);
        return;
      }
    }

    // 2. Create room - User1 = Me, User2 = Operative (per user instructions for RLS)
    const { data: myProf } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    const { data: theirProf } = await supabase.from('profiles').select('username').eq('id', otherUser.id).single();

    const { data: created, error: createError } = await supabase
      .from('dm_rooms')
      .insert({ 
        user1_id: user.id, 
        user1_username: myProf?.username || 'user',
        user2_id: otherUser.id, 
        user2_username: theirProf?.username || 'user',
        last_message_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (created && !createError) {
      // Manual Fetch room data
      const { data: freshRoom } = await supabase
        .from('dm_rooms')
        .select('*')
        .eq('id', created.id)
        .single();

      if (freshRoom) {
        const { data: pData } = await supabase
          .from('profiles')
          .select('id, username, public_key')
          .in('id', [freshRoom.user1_id, freshRoom.user2_id]);
        
        const map = new Map(pData?.map(p => [p.id, p]));
        const room: DMRoom = {
          ...freshRoom,
          other_user: freshRoom.user1_id === user.id ? map.get(freshRoom.user2_id) : map.get(freshRoom.user1_id)
        };
        openRoom(room);
      }
    } else {
      console.error('Room creation error:', createError);
      // Detailed error logic for RLS permission issues
      const isForbidden = (createError as any)?.status === 403 || createError?.code === '42501';
      if (isForbidden) {
        alert("ACCESS_DENIED: Supabase RLS policies block this insertion. IMPORTANT: Make sure you follow the user first OR check if dm_rooms allows inserts.");
      } else {
        alert(`CONNECTION_ERROR: ${createError?.message || 'Unable to establish secure channel'}`);
      }
    }
  }

  const openRoom = useCallback(async (room: DMRoom) => {
    if (channelRef.current) {
      const c = channelRef.current;
      channelRef.current = null;
      supabase.removeChannel(c).catch(e => console.error('CHANNEL_REMOVE_ERROR:', e));
    }

    setMessages([]); // BUG-018: Clear old room's messages immediately
    setSelectedRoom(room);
    setMobileView('chat');
    setChatLoading(true);

    const { data } = await supabase.from('messages').select('*').eq('room_id', room.id).order('created_at', { ascending: true }).limit(100);
    
    // Decrypt messages
    const keys = myKeys || await getOrCreateKeyPair();
    const decryptedDocs = (data ?? []).map(m => ({
      ...m,
      content: decryptMessage(m.content, room.other_user?.public_key || '', keys.privateKey)
    }));
    
    setMessages(decryptedDocs);
    setChatLoading(false);

    channelRef.current = supabase
      .channel(`dm:${room.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${room.id}` },
        p => {
          const m = p.new as Message;
          const decrypted = decryptMessage(m.content, room.other_user?.public_key || '', keys.privateKey);
          setMessages(prev => [...prev, { ...m, content: decrypted }]);
        }
      ).subscribe();
  }, []);

  async function handleSend(text: string) {
    if (!selectedRoom || isSending) return;
    const otherUser = selectedRoom.other_user;
    if (!user || !selectedRoom || !myKeys || !otherUser?.public_key) {
      if (selectedRoom && !otherUser?.public_key) alert("ENCRYPTION_ERROR: Recipient has no public key. They must log in once to generate keys.");
      return;
    }

    setIsSending(true);
    try {
      const encrypted = encryptMessage(text, otherUser.public_key, myKeys.privateKey);

      const newMsg = {
        room_id: selectedRoom.id,
        sender_id: user.id,
        content: encrypted,
      };

      const { error } = await supabase.from('messages').insert(newMsg);
      if (!error) {
        await supabase.from('dm_rooms').update({ 
          last_message: encrypted,
          last_message_at: new Date().toISOString() 
        }).eq('id', selectedRoom.id);
      }
    } catch (e: any) {
      alert(`ENCRYPTION_FAILED: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  }

  const checkFollow = useCallback(async (meId: string, themId: string) => {
    const { data, error } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', meId)
      .eq('following_id', themId)
      .single();
    
    return !!data && !error;
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" />
      {mobileView === 'list' ? (
        <View style={{ flex: 1 }}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
              <Feather name="arrow-left" size={24} color={Colors.accent.glow} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={s.title}>SECRET_SCROLL</Text>
                <Text style={s.subtitle}>SECURE_VOICE_INBOX</Text>
              </View>
              <TouchableOpacity style={s.newMsgBtn} onPress={() => setSearchModalVisible(true)}>
                <Feather name="plus" size={24} color={Colors.accent.glow} />
              </TouchableOpacity>
            </View>
            <View style={s.divider} />
          </View>

          <FlatList
            data={rooms}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            renderItem={({ item }) => <DMListItem room={item} onPress={() => openRoom(item)} />}
            ListHeaderComponent={
              followError ? (
                <View style={s.errorBanner}>
                  <Text style={s.errorText}>{followError}</Text>
                  <TouchableOpacity onPress={() => setFollowError('')}>
                    <Feather name="x" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={s.center}>
                <Text style={s.emptyText}>NO_SCROLLS_FOUND</Text>
              </View>
            }
          />
        </View>
      ) : (
        selectedRoom && (
          <ChatPanel
            room={selectedRoom}
            messages={messages}
            loading={chatLoading}
            userId={user?.id ?? ''}
            onSend={handleSend}
            onBack={() => { setMobileView('list'); setSelectedRoom(null); fetchRooms(user.id); }}
          />
        )
      )}

      {/* NEW MESSAGE MODAL */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <SafeAreaView style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>NEW_TRANSMISSION</Text>
              <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                <Feather name="x" size={24} color={Colors.accent.glow} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: Spacing.lg }}>
              <Input
                placeholder="SEARCH_USERNAME..."
                value={searchQuery}
                onChangeText={(t) => { setSearchQuery(t); performSearch(t); }}
                autoCapitalize="none"
              />

              {searching ? (
                <ActivityIndicator color={Colors.accent.glow} style={{ marginTop: 20 }} />
              ) : (
                <RNFlatList
                  data={searchResults}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={s.searchResult} 
                      onPress={() => handleStartChat(item)}
                    >
                      <Avatar username={item.username} size={32} />
                      <Text style={s.searchResultText}>{item.username.toUpperCase()}</Text>
                      <Feather name="send" size={16} color={Colors.accent.glow} />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    searchQuery.length >= 2 ? (
                      <Text style={s.emptyText}>NO_OPERATIVES_FOUND</Text>
                    ) : null
                  }
                />
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: { padding: Spacing.xl, paddingTop: 10 },
  title: {
    color: Colors.accent.glow,
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  subtitle: {
    color: Colors.accent.glow,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 4,
    opacity: 0.8,
  },
  divider: { height: 1, backgroundColor: '#111', marginTop: 20 },
  list: { padding: Spacing.lg, gap: 16 },
  dmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.accent.glow,
    backgroundColor: '#000',
  },
  avatarSquare: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.accent.glow,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
  },
  dmInfo: { flex: 1, marginLeft: 16 },
  dmTitleRow: { flexDirection: 'row', alignItems: 'center' },
  dmUsername: { color: Colors.accent.glow, fontSize: 16, fontWeight: '700', fontFamily: 'monospace' },
  dmMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  dmDate: { color: '#888', fontSize: 10, fontFamily: 'monospace' },
  dmRight: { alignItems: 'flex-end', gap: 4 },
  dmTime: { color: '#888', fontSize: 10, fontFamily: 'monospace' },
  emptyText: { color: '#222', fontSize: 14, fontFamily: 'monospace', marginTop: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  chatPanel: { flex: 1, backgroundColor: '#000' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: 12,
  },
  chatBackBtn: { padding: 4 },
  userNameTitle: { color: Colors.accent.glow, fontSize: 18, fontWeight: '800', fontFamily: 'monospace' },
  e2eeBanner: { paddingVertical: 8, alignItems: 'center', backgroundColor: '#050505', borderBottomWidth: 1, borderBottomColor: '#111' },
  e2eeText: { color: Colors.accent.glow, fontSize: 9, fontFamily: 'monospace', opacity: 0.5 },
  messageList: { padding: Spacing.lg, gap: 16 },
  msgRow: { flexDirection: 'row', marginBottom: 4 },
  msgRowMe: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', padding: 12, borderWidth: 1, borderColor: '#333' },
  bubbleMe: { backgroundColor: '#111', borderColor: Colors.accent.glow },
  bubbleThem: { backgroundColor: '#080808' },
  bubbleText: { color: '#FFF', fontSize: 14, fontFamily: 'monospace' },
  bubbleTime: { color: '#555', fontSize: 8, fontFamily: 'monospace', marginTop: 4, textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 16, borderTopWidth: 1, borderTopColor: '#222', gap: 12 },
  msgInput: { flex: 1, backgroundColor: '#080808', borderWidth: 1, borderColor: '#333', color: '#FFF', padding: 12, fontFamily: 'monospace', fontSize: 14 },
  sendBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333' },

  newMsgBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.accent.glow,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 0.9,
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accent.glow,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  modalTitle: {
    color: Colors.accent.glow,
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#111',
    gap: 12,
  },
  searchResultText: {
    flex: 1,
    color: '#FFF',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  errorBanner: {
    backgroundColor: 'rgba(218, 54, 51, 0.15)',
    borderColor: '#DA3633',
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#DA3633',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
});
