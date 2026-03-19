import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing } from '@/constants/theme';
import { LoadingScreen } from '@/components/ui/UI';
import { Feather } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────
interface DMRoom {
  id: string;
  participant_id: string;
  participant_username: string;
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
  is_online: boolean;
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_username: string;
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
        <Feather name="user" size={24} color={Colors.accent.glow} />
      </View>

      <View style={s.dmInfo}>
        <View style={s.dmTitleRow}>
          <Text style={s.dmUsername}>{room.participant_username.toUpperCase()}</Text>
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
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  function handleSend() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }

  return (
    <View style={s.chatPanel}>
      <View style={s.chatHeader}>
        <TouchableOpacity onPress={onBack} style={s.chatBackBtn}>
          <Feather name="arrow-left" size={20} color={Colors.accent.glow} />
        </TouchableOpacity>
        <Text style={s.userNameTitle}>{room.participant_username.toUpperCase()}</Text>
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
  const [rooms, setRooms] = useState<DMRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<DMRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initScreen();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  async function initScreen() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { router.replace('/(auth)/login' as any); return; }
    setUser(authUser);
    await fetchRooms(authUser.id);
    setLoading(false);
  }

  async function fetchRooms(userId: string) {
    const { data, error } = await supabase
      .from('dm_rooms')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (!error && data) {
      const mapped: DMRoom[] = data.map((r: any) => ({
        id: r.id,
        participant_id: r.user1_id === userId ? r.user2_id : r.user1_id,
        participant_username: r.user1_id === userId ? r.user2_username : r.user1_username,
        last_message_preview: r.last_message_preview ?? '',
        last_message_at: r.last_message_at ?? r.created_at,
        unread_count: r.unread_count ?? 0,
        is_online: r.is_online ?? false,
      }));
      setRooms(mapped);
    }
  }

  const openRoom = useCallback(async (room: DMRoom) => {
    setSelectedRoom(room);
    setMobileView('chat');
    setChatLoading(true);
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const { data } = await supabase.from('dm_messages').select('*').eq('room_id', room.id).order('created_at', { ascending: true }).limit(100);
    setMessages(data ?? []);
    setChatLoading(false);

    channelRef.current = supabase
      .channel(`dm:${room.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_messages', filter: `room_id=eq.${room.id}` },
        p => setMessages(prev => [...prev, p.new as Message])
      ).subscribe();
  }, []);

  async function handleSend(text: string) {
    if (!user || !selectedRoom) return;
    const newMsg = {
      room_id: selectedRoom.id,
      sender_id: user.id,
      sender_username: user.email?.split('@')[0] ?? 'builder',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, { ...newMsg, id: `temp_${Date.now()}` } as Message]);
    await supabase.from('dm_messages').insert(newMsg);
    await supabase.from('dm_rooms').update({ last_message_at: new Date().toISOString() }).eq('id', selectedRoom.id);
  }

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
            <Text style={s.title}>SECRET_SCROLL</Text>
            <Text style={s.subtitle}>SECURE_VOICE_INBOX</Text>
            <View style={s.divider} />
          </View>

          <FlatList
            data={rooms}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            renderItem={({ item }) => <DMListItem room={item} onPress={() => openRoom(item)} />}
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
            onBack={() => { setMobileView('list'); setSelectedRoom(null); }}
          />
        )
      )}
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
});
