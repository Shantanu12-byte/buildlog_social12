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
import { LoadingScreen } from '@/components/ui/UI';
import { useUserStore } from '@/store/userStore';
import CampusLeaderboard from '@/components/CampusLeaderboard';
import CampusPicker from '@/components/CampusPicker';

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



function RoomCard({ room, isActive, onPress }: { room: Room; isActive: boolean; onPress: () => void }) {
  const isGlobal = room.type === 'global';
  return (
    <TouchableOpacity style={[s.roomCard, isActive && s.roomCardActive]} onPress={onPress} activeOpacity={0.75}>
      <View style={s.roomIcon}>
        <Text style={s.roomIconText}>{isGlobal ? '🌐' : '🏛️'}</Text>
        {!!room.unread_count && room.unread_count > 0 && (
          <View style={s.unreadBadge}>
            <Text style={s.unreadText}>{room.unread_count}</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <View style={s.roomNameRow}>
          <Text style={s.roomName} numberOfLines={1}>{room.name}</Text>
          <Text style={s.onlinePillText}>● {room.online_count ?? 0} live</Text>
        </View>
        <Text style={s.roomDesc} numberOfLines={1}>
          {room.description || (isGlobal ? 'Global public server' : 'Your campus community')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function MessageBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  const initials = msg.sender_username.slice(0, 2).toUpperCase();
  
  // FIX - Flagging Logic (URLs + Promotional keywords)
  const isFlagged = msg.content.match(/https?:\/\//) && 
                    msg.content.toLowerCase().match(/buy|sale|offer|win|free|promo|discount/);

  return (
    <View style={[s.msgRow, isMe && s.msgRowMe]}>
      {!isMe && <Text style={s.senderName}>{msg.sender_username}</Text>}
      <View style={[s.bubbleRow, isMe && s.bubbleRowMe]}>
        {!isMe && (
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={{ flex: 1, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
          <View style={[
            s.bubble, 
            isMe ? s.bubbleMe : s.bubbleThem,
            isFlagged && s.bubbleFlagged
          ]}>
            <Text style={[s.bubbleText, isMe && s.bubbleTextMe]}>{msg.content}</Text>
          </View>
          <Text style={[s.bubbleTime, isMe && s.bubbleTimeMe]}>
            {formatTime(msg.created_at)}
          </Text>
          {isFlagged && <Text style={s.flaggedText}>🚨 Flagged</Text>}
        </View>
      </View>
    </View>
  );
}

function DateSeparator({ date }: { date: string }) {
  const label = new Date(date).toDateString() === new Date().toDateString() ? 'Today' : 
                new Date(date).toDateString() === new Date(Date.now() - 86400000).toDateString() ? 'Yesterday' :
                new Date(date).toLocaleDateString();
  return (
    <View style={s.dateSeparator}>
      <View style={s.dateLine} />
      <Text style={s.dateLabel}>{label}</Text>
      <View style={s.dateLine} />
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

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showDate = !prevMsg || new Date(item.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

    return (
      <View>
        {showDate && <DateSeparator date={item.created_at} />}
        <MessageBubble msg={item} isMe={item.sender_id === userId} />
      </View>
    );
  };

  return (
    <View style={s.chatView}>
      <View style={s.chatHeader}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.chatTitle}>{room.name}</Text>
        <TouchableOpacity style={s.infoBtn}>
          <Text style={s.infoBtnText}>⋮</Text>
        </TouchableOpacity>
      </View>

      <View style={s.onlineStrip}>
        <View style={s.onlineDot} />
        <Text style={s.onlineStripText}>ONLINE: {room.online_count ?? 0} · {room.name}</Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={s.chatLoading}><ActivityIndicator color="#7c3aed" /></View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.msgList}
            onContentSizeChange={() => flatRef.current?.scrollToEnd()}
            ListEmptyComponent={
              <View style={s.emptyList}>
                <Text style={s.emptyIcon}>💬</Text>
                <Text style={s.emptyTitle}>No messages yet</Text>
                <Text style={s.emptySub}>Be the first to broadcast a message</Text>
              </View>
            }
            renderItem={renderItem}
          />
        )}
        <View style={s.inputBarContainer}>
          <View style={s.inputPill}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={room.type === 'global' ? 'Broadcast message...' : 'Message campus...'}
              placeholderTextColor="#4b5563"
              style={s.msgInput}
              multiline
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity 
              style={[s.sendBtn, !!text.trim() && s.sendBtnActive]} 
              onPress={handleSend} 
              disabled={!text.trim()} 
              activeOpacity={0.75}
            >
              <Text style={s.sendBtnText}>SEND</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function TavernScreen() {
  const router = useRouter();
  const { userProfile, userId, updateUserProfile, profileFetched } = useUserStore();

  // ── State (preserved) ─────────────────────────────────────
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('campus');
  const [campusSubTab, setCampusSubTab] = useState<'community' | 'leaderboard'>('community');
  const [isCampusPicking, setIsCampusPicking] = useState(false);
  const [isJoinLoading, setIsJoinLoading] = useState(false);
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
    if (!profileFetched) return;
    if (!userId) { router.replace('/(auth)/login' as any); return; }

    // One-Time Campus Selection Flow
    if (!userProfile?.campus_id) {
      setIsCampusPicking(true);
    }

    await fetchRooms();
    setLoading(false);
  }

  async function handleSetCampus(campusId: string, campusName: string) {
    if (!userId) return;
    setIsJoinLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/user/profile/set-campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          campusId,
          campusName
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to set campus');
      }

      // Update local store for immediate UI feedback
      await updateUserProfile({
        campus_id: campusId,
        campus_name: campusName,
        is_joined_to_campus: true
      });

      setIsCampusPicking(false);
      Alert.alert('Welcome!', `You are now a verified member of ${campusName}.`);
      
      // Refresh rooms to include campus-specific ones
      await fetchRooms();

    } catch (err: any) {
      console.error('Set campus error:', err);
      Alert.alert('Lock Failed', err.message);
    } finally {
      setIsJoinLoading(false);
    }
  }

  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  async function fetchRooms() {
    const { data, error } = await supabase.from('chat_rooms').select('*').order('online_count', { ascending: false });
    if (!error) setRooms(data ?? []);
  }

  async function handleCreateCommunity() {
    if (!newRoomName.trim() || !userId) return;
    const newRoom = {
      name: newRoomName.trim(),
      description: newRoomDesc.trim(),
      type: 'campus',
      college: userProfile?.campus_id || 'Global',
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
      Alert.alert('Error', `Could not create community: ${error.message}${error.details ? ` (${error.details})` : ''}\n\nHint: Check if the chat_rooms table has all required columns.`);
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
    if (!userId || !selectedRoom) return;
    
    let processedText = text;
    let wasFiltered = false;

    // Zero-Cost Profanity Filter Bridge (Local Node Backend)
    try {
      const response = await fetch('http://localhost:5000/api/chat/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      if (data.wasFiltered) {
        processedText = data.cleaned;
        wasFiltered = true;
      }
    } catch (e) {
      console.warn('Content filter service unavailable, sending raw text.');
    }

    const newMsg = {
      room_id: selectedRoom.id,
      sender_id: userId,
      sender_username: userProfile?.username || 'user',
      content: processedText,
      created_at: new Date().toISOString(),
    };
    
    await supabase.from('messages').insert(newMsg);
    setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, last_message: processedText.slice(0, 50) } : r));

    if (wasFiltered) {
      Alert.alert(
        'Community Guidelines',
        'Keep it professional, Builder! Your message was filtered to follow community guidelines.',
        [{ text: 'Got it' }]
      );
    }
  }

  if (loading) return <LoadingScreen />;

  if (selectedRoom) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content" />
        <ChatView 
          room={selectedRoom} 
          messages={messages} 
          loading={chatLoading} 
          userId={userId || ''} 
          onSend={handleSend}
          onBack={() => { setSelectedRoom(null); if (channelRef.current) supabase.removeChannel(channelRef.current); }} 
        />
      </SafeAreaView>
    );
  }

  const filteredRooms = rooms.filter(r => {
    if (activeTab === 'campus') {
      return r.type === 'campus' && r.college === userProfile?.campus_id;
    }
    return r.type === 'global';
  });

  const isJoinedToCampus = userProfile?.is_joined_to_campus;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={s.header}>
        <Text style={s.screenTitle}>The Tavern</Text>
        <View style={s.liveIndicator}>
          <View style={s.onlineDot} />
          <Text style={s.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Main Pill Toggle */}
      <View style={s.tabs}>
        {(['campus', 'global'] as TabType[]).map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[s.tab, activeTab === tab && s.tabActive]} 
            onPress={() => setActiveTab(tab)} 
            activeOpacity={0.8}
          >
            <Text style={s.tabIcon}>{tab === 'campus' ? '🏫' : '🌐'}</Text>
            <Text style={[s.tabLabel, activeTab === tab && s.tabLabelActive]}>
              {tab === 'campus' ? 'Campus' : 'Global'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sub-tabs (Underlined) */}
      {activeTab === 'campus' && (
        <View style={s.subTabs}>
          <TouchableOpacity 
            style={[s.subTab, campusSubTab === 'community' && s.subTabActive]} 
            onPress={() => setCampusSubTab('community')}
          >
            <Text style={[s.subTabText, campusSubTab === 'community' && s.subTabTextActive]}>Community</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.subTab, campusSubTab === 'leaderboard' && s.subTabActive]} 
            onPress={() => setCampusSubTab('leaderboard')}
          >
            <Text style={[s.subTabText, campusSubTab === 'leaderboard' && s.subTabTextActive]}>Leaderboard</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'campus' && campusSubTab === 'leaderboard' ? (
        <CampusLeaderboard />
      ) : activeTab === 'campus' && !isJoinedToCampus ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#111111', padding: 30, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#1f2937', width: '100%' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🎓</Text>
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Campus Hub Locked</Text>
            <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              You must select and officially join a campus community to access chat groups and projects.
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#7c3aed', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
              onPress={() => router.push('/(auth)/CampusOnboarding')}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Join Community</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
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
              {activeTab === 'campus' && (
                <TouchableOpacity 
                  style={[s.modalBtnCreate, { marginTop: 20, paddingHorizontal: 30 }]}
                  onPress={() => setIsCreating(true)}
                >
                  <Text style={s.modalCreateText}>+ Create Room</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => <RoomCard room={item} isActive={false} onPress={() => openRoom(item)} />}
        />
      )}

      {activeTab === 'campus' && isJoinedToCampus && !selectedRoom && campusSubTab === 'community' && (
        <TouchableOpacity style={s.fab} onPress={() => setIsCreating(true)} activeOpacity={0.8}>
          <Text style={s.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      {/* Campus Selection One-Time Flow */}
      <CampusPicker 
        visible={isCampusPicking}
        isLoading={isJoinLoading}
        onConfirm={handleSetCampus}
      />

      {/* Create Community Modal */}
      <Modal visible={isCreating} transparent animationType="slide">
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Create Community</Text>

            <TextInput
              style={s.modalInput}
              placeholder="Community Name (e.g. CS 101)"
              placeholderTextColor="#4b5563"
              value={newRoomName}
              onChangeText={setNewRoomName}
              autoFocus
            />

            <TextInput
              style={[s.modalInput, { height: 80 }]}
              placeholder="Description (optional)"
              placeholderTextColor="#4b5563"
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
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 20 
  },
  screenTitle: { 
    color: '#ffffff', 
    fontSize: 28, 
    fontWeight: '800', 
    letterSpacing: -0.5 
  },
  liveIndicator: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#052e16', 
    borderWidth: 1, 
    borderColor: '#16a34a', 
    borderRadius: 20, 
    paddingHorizontal: 10, 
    paddingVertical: 4 
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  liveText: { color: '#4ade80', fontSize: 11, fontWeight: '700' },
  
  // Pill Toggle
  tabs: { 
    flexDirection: 'row', 
    marginHorizontal: 20, 
    backgroundColor: '#111111', 
    borderRadius: 12, 
    padding: 4,
    marginBottom: 16
  },
  tab: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    paddingVertical: 10, 
    borderRadius: 10
  },
  tabActive: { backgroundColor: '#7c3aed' },
  tabIcon: { fontSize: 14 },
  tabLabel: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  tabLabelActive: { color: '#ffffff' },

  // Sub Tabs
  subTabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 20
  },
  subTab: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabActive: {
    borderBottomColor: '#7c3aed',
  },
  subTabText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  subTabTextActive: {
    color: '#ffffff',
  },

  // Room Cards
  roomCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16, 
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937'
  },
  roomCardActive: { borderColor: '#7c3aed' },
  roomIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#4c1d95' 
  },
  roomIconText: { fontSize: 20 },
  roomNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  roomName: { color: '#ffffff', fontSize: 16, fontWeight: '700', flex: 1 },
  onlinePillText: { color: '#4ade80', fontSize: 12, fontWeight: '600' },
  roomDesc: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  
  unreadBadge: { 
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18, 
    height: 18, 
    borderRadius: 9, 
    backgroundColor: '#ef4444', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  emptyList: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#6b7280', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // Chat View
  chatView: { flex: 1, backgroundColor: '#0a0a0a' },
  chatHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#1f2937' 
  },
  backBtn: { padding: 4, marginRight: 12 },
  backIcon: { color: '#ffffff', fontSize: 24 },
  chatTitle: { flex: 1, color: '#ffffff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  infoBtn: { padding: 4 },
  infoBtnText: { color: '#6b7280', fontSize: 20 },

  onlineStrip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    paddingVertical: 6, 
    backgroundColor: '#0a0a0a', 
    borderBottomWidth: 1, 
    borderBottomColor: '#1f2937' 
  },
  onlineStripText: { color: '#4ade80', fontSize: 11, fontWeight: '600' },

  msgList: { paddingHorizontal: 20, paddingVertical: 16, gap: 16 },
  chatLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  msgRow: { marginBottom: 16 },
  msgRowMe: { alignItems: 'flex-end' },
  
  senderName: { color: '#7c3aed', fontSize: 11, fontWeight: '700', marginBottom: 4, marginLeft: 44 },
  
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  bubbleRowMe: { flexDirection: 'row-reverse' },
  
  avatarCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4c1d95', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  
  bubble: { 
    maxWidth: '75%', 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderWidth: 1,
    borderColor: '#1f2937'
  },
  bubbleThem: { 
    backgroundColor: '#1a1a2e', 
    borderRadius: 16,
    borderTopLeftRadius: 4 
  },
  bubbleMe: { 
    backgroundColor: '#7c3aed', 
    borderColor: '#7c3aed',
    borderRadius: 16,
    borderTopRightRadius: 4 
  },
  bubbleFlagged: { borderColor: '#ef4444' },
  
  bubbleText: { color: '#e5e7eb', fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: '#ffffff' },
  
  bubbleTime: { color: '#4b5563', fontSize: 10, marginTop: 4 },
  bubbleTimeMe: { color: '#a78bfa', textAlign: 'right' },
  flaggedText: { color: '#ef4444', fontSize: 10, marginTop: 2, fontWeight: '600' },

  dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dateLine: { flex: 1, height: 1, backgroundColor: '#374151' },
  dateLabel: { color: '#374151', fontSize: 11, fontWeight: '600' },

  inputBarContainer: {
    padding: 10,
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0a',
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 25,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  msgInput: { 
    flex: 1, 
    color: '#ffffff', 
    fontSize: 15, 
    maxHeight: 100,
    paddingVertical: 4
  },
  sendBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#4b5563',
    marginLeft: 8
  },
  sendBtnActive: { backgroundColor: '#7c3aed' },
  sendBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  fab: { 
    position: 'absolute', 
    bottom: 20, 
    right: 20, 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: '#7c3aed', 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 8, 
    shadowColor: '#7c3aed', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 20 
  },
  fabIcon: { color: '#fff', fontSize: 28, fontWeight: '300' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: '700', marginBottom: 20 },
  modalInput: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#1f2937', borderRadius: 12, padding: 16, color: '#ffffff', fontSize: 16, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  modalBtnCancel: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#1f2937', alignItems: 'center' },
  modalCancelText: { color: '#9ca3af', fontWeight: '600', fontSize: 16 },
  modalBtnCreate: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#7c3aed', alignItems: 'center' },
  modalCreateText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
