/**
 * app/(tabs)/tavern.tsx — Campus Chat / Global Server
 *
 * ✅ Preserved: Supabase Realtime listeners, useEffect, messages/rooms/selectedRoom state
 * ✅ Routes: router.push('/tavern'), router.replace('/(auth)/login')
 * 🎨 Theme: Deep navy with campus blue and global purple accents
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator, Modal, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Avatar, LoadingScreen } from '@/components/ui/UI';

// ─── Types ────────────────────────────────────────────────────
interface Room {
  id: string;
  name: string;
  type: 'campus' | 'global' | 'project';
  college?: string;
  description?: string;
  online_count?: number;
  member_count?: number;
  last_message?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_username: string;
  sender_college?: string;
  content: string;
  created_at: string;
}

type TabType = 'campus' | 'global';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function OnlineBar({ count, roomName }: { count: number; roomName: string }) {
  return (
    <View style={s.onlineBar}>
      <View style={s.onlineDot} />
      <Text style={s.onlineText}>[ ONLINE: {count} ] · {roomName}</Text>
    </View>
  );
}

function RoomCard({ room, isActive, onPress }: { room: Room; isActive: boolean; onPress: () => void }) {
  const isGlobal = room.type === 'global';
  return (
    <TouchableOpacity style={[s.roomCard, isActive && s.roomCardActive]} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.roomIcon, isGlobal ? s.roomIconGlobal : s.roomIconCampus]}>
        <Text style={s.roomIconText}>{isGlobal ? '🌐' : '🎓'}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <View style={s.roomNameRow}>
          <Text style={s.roomName} numberOfLines={1}>{room.name}</Text>
          {room.online_count !== undefined && (
            <View style={s.onlinePill}>
              <View style={[s.onlineDot, { width: 5, height: 5 }]} />
              <Text style={s.onlinePillText}>{room.online_count}</Text>
            </View>
          )}
        </View>
        {room.description && <Text style={s.roomDesc} numberOfLines={1}>{room.description}</Text>}
        {room.last_message && <Text style={s.roomLastMsg} numberOfLines={1}>{room.last_message}</Text>}
      </View>
      {!!room.unread_count && room.unread_count > 0 && (
        <View style={s.unreadBadge}>
          <Text style={s.unreadText}>{room.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function MessageBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  return (
    <View style={[s.msgRow, isMe && s.msgRowMe]}>
      {!isMe && <Avatar username={msg.sender_username} size={28} style={{ marginRight: 8 }} />}
      <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
        {!isMe && (
          <View style={s.senderRow}>
            <Text style={s.senderName}>{msg.sender_username}</Text>
            {msg.sender_college && <Text style={s.senderCollege}> · {msg.sender_college}</Text>}
          </View>
        )}
        <Text style={[s.bubbleText, isMe && s.bubbleTextMe]}>{msg.content}</Text>
        <Text style={[s.bubbleTime, isMe && { color: 'rgba(255,255,255,0.4)' }]}>{formatTime(msg.created_at)}</Text>
      </View>
    </View>
  );
}

function ChatView({ room, messages, loading, userId, onSend, onBack }: {
  room: Room; messages: Message[]; loading: boolean;
  userId: string; onSend: (t: string) => void; onBack: () => void;
}) {
  const [text, setText] = useState('');
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  function handleSend() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }

  return (
    <View style={s.chatView}>
      <View style={s.chatHeader}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.breadcrumb}>
          <Text style={s.breadcrumbInactive}>{room.type === 'campus' ? 'Campus Chat' : 'Global Server'}</Text>
          <Text style={s.breadcrumbSep}> / </Text>
          <Text style={s.breadcrumbActive}>{room.name}</Text>
        </View>
        <TouchableOpacity style={s.infoBtn}>
          <Text style={s.infoBtnText}>ℹ</Text>
        </TouchableOpacity>
      </View>

      <OnlineBar count={room.online_count ?? 0} roomName={room.name} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {loading ? (
          <View style={s.chatLoading}><ActivityIndicator color={Colors.accent.primary} /></View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.msgList}
            onContentSizeChange={() => flatRef.current?.scrollToEnd()}
            ListEmptyComponent={
              <View style={s.emptyChatWrap}>
                <Text style={s.emptyChatIcon}>💬</Text>
                <Text style={s.emptyChatTitle}>No messages yet</Text>
                <Text style={s.emptyChatSub}>Be the first to broadcast a message</Text>
              </View>
            }
            renderItem={({ item }) => <MessageBubble msg={item} isMe={item.sender_id === userId} />}
          />
        )}
        <View style={s.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={room.type === 'global' ? 'Broadcast message...' : 'Message campus...'}
            placeholderTextColor={Colors.text.tertiary}
            style={s.msgInput}
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={[s.sendBtn, !!text.trim() && s.sendBtnActive]} onPress={handleSend} disabled={!text.trim()} activeOpacity={0.75}>
            <Text style={[s.sendBtnText, !!text.trim() && { color: Colors.pills.campus.text }]}>SEND</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function TavernScreen() {
  const router = useRouter();

  // ── State (preserved) ─────────────────────────────────────
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('campus');
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initScreen();
    return () => { 
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).then(() => {
          channelRef.current = null;
        });
      }
    };
  }, []);

  async function initScreen() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/(auth)/login' as any); return; }
    setUser(user);
    await fetchRooms();
    setLoading(false);
  }

  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  async function fetchRooms() {
    const { data, error } = await supabase.from('chat_rooms').select('*').order('online_count', { ascending: false });
    if (!error) setRooms(data ?? []);
  }

  async function handleCreateCommunity() {
    if (!newRoomName.trim() || !user) return;
    const newRoom = {
      name: newRoomName.trim(),
      description: newRoomDesc.trim(),
      type: 'campus',
      online_count: 1,
      member_count: 1,
    };
    
    // We explicitly name columns here to be safe and catch errors early
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert([newRoom])
      .select()
      .single();

    if (error) {
      console.error('Error creating community:', error);
      Alert.alert('Error', `Could not create community: ${error.message}`);
      return;
    }

    if (data) {
      setRooms(prev => [data, ...prev]);
      setIsCreating(false);
      setNewRoomName('');
      setNewRoomDesc('');
      openRoom(data);
    }
  }

  const openRoom = useCallback(async (room: Room) => {
    setSelectedRoom(room);
    setChatLoading(true);
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const { data } = await supabase.from('messages').select('*').eq('room_id', room.id).order('created_at', { ascending: true }).limit(100);
    setMessages(data ?? []);
    setChatLoading(false);

    // Realtime (preserved)
    channelRef.current = supabase
      .channel(`room:${room.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `room_id=eq.${room.id}` 
      },
        payload => setMessages(prev => [...prev, payload.new as Message])
      ).subscribe();

    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unread_count: 0 } : r));
  }, []);

  async function handleSend(text: string) {
    if (!user || !selectedRoom) return;
    const newMsg = {
      room_id: selectedRoom.id,
      sender_id: user.id,
      sender_username: user.email?.split('@')[0] ?? 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    // Removed optimistic update to prevent double-messaging when subscription is active
    // setMessages(prev => [...prev, { ...newMsg, id: `temp_${Date.now()}` }]);
    await supabase.from('messages').insert(newMsg);
    setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, last_message: text.slice(0, 50) } : r));
  }

  if (loading) return <LoadingScreen />;

  if (selectedRoom) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content" />
        <ChatView room={selectedRoom} messages={messages} loading={chatLoading} userId={user?.id ?? ''} onSend={handleSend}
          onBack={() => { setSelectedRoom(null); if (channelRef.current) supabase.removeChannel(channelRef.current); }} />
      </SafeAreaView>
    );
  }

  const filteredRooms = rooms.filter(r => activeTab === 'campus' ? (!r.type || r.type === 'campus' || r.type === 'project') : r.type === 'global');

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <Text style={s.screenTitle}>The Tavern</Text>
        <View style={s.liveIndicator}>
          <View style={s.onlineDot} />
          <Text style={s.liveText}>LIVE</Text>
        </View>
      </View>
      <View style={s.tabs}>
        {(['campus', 'global'] as TabType[]).map(tab => (
          <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)} activeOpacity={0.7}>
            <Text style={s.tabIcon}>{tab === 'campus' ? '🎓' : '🌐'}</Text>
            <Text style={[s.tabLabel, activeTab === tab && s.tabLabelActive]}>{tab === 'campus' ? 'Campus Chat' : 'Global Server'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filteredRooms}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={s.emptyList}>
            <Text style={s.emptyIcon}>{activeTab === 'campus' ? '🎓' : '🌐'}</Text>
            <Text style={s.emptyTitle}>{activeTab === 'campus' ? 'No campus chats yet' : 'No global servers yet'}</Text>
            <Text style={s.emptySub}>{activeTab === 'campus' ? 'Join your college community or create one!' : 'Global servers coming soon'}</Text>
          </View>
        }
        renderItem={({ item }) => <RoomCard room={item} isActive={false} onPress={() => openRoom(item)} />}
      />

      {activeTab === 'campus' && !selectedRoom && (
        <TouchableOpacity style={s.fab} onPress={() => setIsCreating(true)} activeOpacity={0.8}>
          <Text style={s.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      {/* Create Community Modal */}
      <Modal visible={isCreating} transparent animationType="slide">
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Create Community</Text>
            
            <TextInput
              style={s.modalInput}
              placeholder="Community Name (e.g. CS 101)"
              placeholderTextColor={Colors.text.tertiary}
              value={newRoomName}
              onChangeText={setNewRoomName}
              autoFocus
            />
            
            <TextInput
              style={[s.modalInput, { height: 80 }]}
              placeholder="Description (optional)"
              placeholderTextColor={Colors.text.tertiary}
              value={newRoomDesc}
              onChangeText={setNewRoomDesc}
              multiline
            />

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalBtnCancel} onPress={() => setIsCreating(false)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtnCreate, !newRoomName.trim() && { opacity: 0.5 }]} disabled={!newRoomName.trim()} onPress={handleCreateCommunity}>
                <Text style={s.modalCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border.subtle },
  screenTitle: { color: Colors.text.primary, fontSize: Typography.sizes.xl, fontWeight: '600', letterSpacing: -0.3 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(6,78,59,0.3)', borderWidth: 0.5, borderColor: 'rgba(6,95,70,0.5)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  liveText: { color: '#6EE7B7', fontSize: Typography.sizes.xs, fontWeight: '600' },
  tabs: { flexDirection: 'row', padding: Spacing.lg, paddingBottom: Spacing.sm, gap: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.border.subtle },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: Radius.md, borderWidth: 0.5, borderColor: Colors.border.default, backgroundColor: Colors.bg.secondary },
  tabActive: { backgroundColor: Colors.accent.muted, borderColor: Colors.border.accent },
  tabIcon: { fontSize: 14 },
  tabLabel: { color: Colors.text.secondary, fontSize: Typography.sizes.sm, fontWeight: '500' },
  tabLabelActive: { color: Colors.accent.glow },
  roomCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 0.5, borderBottomColor: Colors.border.subtle },
  roomCardActive: { backgroundColor: Colors.accent.muted },
  roomIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5 },
  roomIconCampus: { backgroundColor: Colors.pills.campus.bg, borderColor: Colors.pills.campus.border },
  roomIconGlobal: { backgroundColor: Colors.accent.muted, borderColor: Colors.border.accent },
  roomIconText: { fontSize: 20 },
  roomNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  roomName: { color: Colors.text.primary, fontSize: Typography.sizes.base, fontWeight: '500', flex: 1 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(6,78,59,0.3)', borderWidth: 0.5, borderColor: 'rgba(6,95,70,0.5)', borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  onlinePillText: { color: '#6EE7B7', fontSize: Typography.sizes.xs, fontWeight: '500' },
  roomDesc: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs, marginBottom: 2 },
  roomLastMsg: { color: Colors.text.tertiary, fontSize: Typography.sizes.sm },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: Colors.accent.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadText: { color: '#fff', fontSize: Typography.sizes.xs, fontWeight: '600' },
  emptyList: { alignItems: 'center', padding: Spacing.xxxl, gap: 8 },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { color: Colors.text.secondary, fontSize: Typography.sizes.base, fontWeight: '500' },
  emptySub: { color: Colors.text.tertiary, fontSize: Typography.sizes.sm, textAlign: 'center' },
  chatView: { flex: 1, backgroundColor: Colors.bg.primary },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border.subtle, gap: Spacing.sm },
  backBtn: { padding: 4 },
  backIcon: { color: Colors.text.primary, fontSize: 20 },
  breadcrumb: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  breadcrumbInactive: { color: Colors.text.tertiary, fontSize: Typography.sizes.sm },
  breadcrumbSep: { color: Colors.border.strong, fontSize: Typography.sizes.sm },
  breadcrumbActive: { color: Colors.text.primary, fontSize: Typography.sizes.sm, fontWeight: '500' },
  infoBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.bg.tertiary, borderWidth: 0.5, borderColor: Colors.border.default, alignItems: 'center', justifyContent: 'center' },
  infoBtnText: { color: Colors.text.secondary, fontSize: 13 },
  onlineBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 7, backgroundColor: 'rgba(6,78,59,0.2)', borderBottomWidth: 0.5, borderBottomColor: 'rgba(6,95,70,0.4)' },
  onlineText: { color: '#6EE7B7', fontSize: Typography.sizes.xs, fontWeight: '500', fontFamily: 'Courier New' },
  msgList: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.md },
  chatLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyChatWrap: { alignItems: 'center', padding: Spacing.xxxl, gap: 8 },
  emptyChatIcon: { fontSize: 32 },
  emptyChatTitle: { color: Colors.text.secondary, fontSize: Typography.sizes.base, fontWeight: '500' },
  emptyChatSub: { color: Colors.text.tertiary, fontSize: Typography.sizes.sm, textAlign: 'center' },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end' },
  msgRowMe: { flexDirection: 'row-reverse' },
  bubble: { maxWidth: '80%', padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 0.5 },
  bubbleThem: { backgroundColor: Colors.bg.secondary, borderColor: Colors.border.default, borderBottomLeftRadius: 4 },
  bubbleMe: { backgroundColor: Colors.accent.soft, borderColor: Colors.border.accent, borderBottomRightRadius: 4, marginRight: 8 },
  senderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  senderName: { color: Colors.pills.campus.text, fontSize: Typography.sizes.xs, fontWeight: '500' },
  senderCollege: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs },
  bubbleText: { color: Colors.text.primary, fontSize: Typography.sizes.base, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTime: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs, marginTop: 4, textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.md, paddingHorizontal: Spacing.lg, borderTopWidth: 0.5, borderTopColor: Colors.border.subtle, backgroundColor: Colors.bg.primary },
  msgInput: { flex: 1, backgroundColor: Colors.bg.secondary, borderWidth: 0.5, borderColor: Colors.border.default, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, color: Colors.text.primary, fontSize: Typography.sizes.base, maxHeight: 100 },
  sendBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.bg.tertiary, borderWidth: 0.5, borderColor: Colors.border.default, alignItems: 'center', justifyContent: 'center', height: 40 },
  sendBtnActive: { backgroundColor: Colors.pills.campus.bg, borderColor: Colors.pills.campus.border },
  sendBtnText: { color: Colors.text.tertiary, fontSize: Typography.sizes.sm, fontWeight: '600', fontFamily: 'Courier New' },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accent.primary, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  fabIcon: { color: '#fff', fontSize: 28, lineHeight: 30, fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bg.secondary, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalTitle: { color: Colors.text.primary, fontSize: Typography.sizes.lg, fontWeight: '600', marginBottom: 20 },
  modalInput: { backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.border.subtle, borderRadius: Radius.md, padding: 16, color: Colors.text.primary, fontSize: Typography.sizes.base, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  modalBtnCancel: { flex: 1, padding: 16, borderRadius: Radius.md, backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.border.subtle, alignItems: 'center' },
  modalCancelText: { color: Colors.text.secondary, fontWeight: '600', fontSize: Typography.sizes.base },
  modalBtnCreate: { flex: 1, padding: 16, borderRadius: Radius.md, backgroundColor: Colors.accent.primary, alignItems: 'center' },
  modalCreateText: { color: '#fff', fontWeight: '600', fontSize: Typography.sizes.base },
});
