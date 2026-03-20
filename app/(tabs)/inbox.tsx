import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, FlatList, TouchableOpacity, RefreshControl, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { FeedPostCard as PostCard, FeedPost as Post } from '@/components/FeedPostCard';
import { checkRateLimit } from '@/lib/rateLimit';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { LoadingScreen, EmptyState, Avatar } from '@/components/ui/UI';
import { useLocalSearchParams } from 'expo-router';
import { getOrCreateKeyPair, encryptMessage, decryptMessage, KeyPair } from '@/lib/crypto';

interface SecretScroll {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_read: boolean;
  type: string;
}

interface DMRoom {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message?: string;
  updated_at: string;
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
  recipient_id?: string;
  content: string;
  created_at: string;
}

export default function InboxScreen() {
  const { roomId, targetUserId } = useLocalSearchParams<{ roomId?: string, targetUserId?: string }>();
  
  const [activeTab, setActiveTab] = useState<'scrolls' | 'whispers'>('scrolls');
  const [scrolls, setScrolls] = useState<SecretScroll[]>([]);
  const [rooms, setRooms] = useState<DMRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<DMRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [myKeys, setMyKeys] = useState<KeyPair | null>(null);

  const channelRef = useRef<any>(null);
  const flatRef = useRef<FlatList>(null);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    return user;
  };

  const fetchScrolls = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error) setScrolls(data || []);
  };

  const fetchRooms = async () => {
    if (!user) return;
    const { data: roomData, error: roomError } = await supabase
      .from('dm_rooms')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (roomError) {
      console.error('Fetch rooms error:', roomError);
      return;
    }

    if (!roomData || roomData.length === 0) {
      setRooms([]);
      return;
    }

    const userIds = new Set<string>();
    roomData.forEach(r => {
      userIds.add(r.user1_id);
      userIds.add(r.user2_id);
    });

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, username, public_key')
      .in('id', Array.from(userIds));

    const profileMap = new Map(profileData?.map(p => [p.id, p]));

    const keys = myKeys || await getOrCreateKeyPair();
    const processedRooms = roomData.map((r: any) => {
      const other = r.user1_id === user.id ? profileMap.get(r.user2_id) : profileMap.get(r.user1_id);
      let lastMsg = r.last_message;
      if (lastMsg && other?.public_key) {
        lastMsg = decryptMessage(lastMsg, other.public_key, keys.privateKey);
      }
      return {
        ...r,
        other_user: other,
        last_message: lastMsg,
        last_message_at: r.last_message_at || r.created_at
      };
    });
    setRooms(processedRooms);
  };

  const findOrCreateRoom = async (otherUserId: string) => {
    if (!user) return null;
    
    // Follow Check
    const { data: follow } = await supabase.from('followers').select('id').eq('follower_id', user.id).eq('following_id', otherUserId).single();
    if (!follow) {
      alert("FOLLOW_REQUIRED: You must follow this operative to start a whisper.");
      return null;
    }
    const { data: roomData } = await supabase
      .from('dm_rooms')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    const existing = roomData?.find(r => 
      (r.user1_id === user.id && r.user2_id === otherUserId) || 
      (r.user1_id === otherUserId && r.user2_id === user.id)
    );

    if (existing) {
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, username, public_key')
        .in('id', [existing.user1_id, existing.user2_id]);
      const map = new Map(pData?.map(p => [p.id, p]));

      return { ...existing, other_user: existing.user1_id === user.id ? map.get(existing.user2_id) : map.get(existing.user1_id) };
    }

    // 2. Create room
    const { data: myProf } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    const { data: theirProf } = await supabase.from('profiles').select('username').eq('id', otherUserId).single();
    
    const { data: created, error: createError } = await supabase
      .from('dm_rooms')
      .insert({ 
        user1_id: user.id, 
        user1_username: myProf?.username || 'user',
        user2_id: otherUserId,
        user2_username: theirProf?.username || 'user',
        last_message_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (created) {
      const { data: freshRoom } = await supabase.from('dm_rooms').select('*').eq('id', created.id).single();
      if (freshRoom) {
        const { data: pData } = await supabase
          .from('profiles')
          .select('id, username, public_key')
          .in('id', [freshRoom.user1_id, freshRoom.user2_id]);
        const map = new Map(pData?.map(p => [p.id, p]));
        return { ...freshRoom, other_user: freshRoom.user1_id === user.id ? map.get(freshRoom.user2_id) : map.get(freshRoom.user1_id) };
      }
    }
    return null;
  };

  const init = async () => {
    const u = await fetchUser();
    if (u) {
      const keys = await getOrCreateKeyPair();
      setMyKeys(keys);
      await Promise.all([fetchScrolls(), fetchRooms()]);
      
      
      if (roomId) {
        setActiveTab('whispers');
        // Find the room in the fetched list or fetch it specifically
        const room = (await fetchRoomsAndReturn())?.find(r => r.id === roomId);
        if (room) openRoom(room);
      } else if (targetUserId) {
        setActiveTab('whispers');
        const room = await findOrCreateRoom(targetUserId);
        if (room) openRoom(room);
      }
    }
    setLoading(false);
  };

  const fetchRoomsAndReturn = async () => {
    if (!user) return [];
    const { data } = await supabase
      .from('dm_rooms')
      .select('*, user1:profiles!user1_id(id, username, public_key), user2:profiles!user2_id(id, username, public_key)')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    
    if (data) {
      const processed = data.map((r: any) => ({ ...r, other_user: r.user1_id === user.id ? r.user2 : r.user1 }));
      setRooms(processed);
      return processed;
    }
    return [];
  };

  useEffect(() => {
    init();
    return () => { 
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).then(() => {
          channelRef.current = null;
        });
      }
    };
  }, [roomId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await (activeTab === 'scrolls' ? fetchScrolls() : fetchRooms());
    setRefreshing(false);
  };

  const openRoom = useCallback(async (room: DMRoom) => {
    setSelectedRoom(room);
    setChatLoading(true);
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true })
      .limit(50);

    const keys = myKeys || await getOrCreateKeyPair();
    const decryptedDocs = (data ?? []).map(m => ({
      ...m,
      content: decryptMessage(m.content, room.other_user?.public_key || '', keys.privateKey)
    }));

    setMessages(decryptedDocs);
    setChatLoading(false);

    channelRef.current = supabase
      .channel(`dm:${room.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `room_id=eq.${room.id}` 
      },
        payload => {
          const m = payload.new as Message;
          const decrypted = decryptMessage(m.content, room.other_user?.public_key || '', keys.privateKey);
          setMessages(prev => [...prev, { ...m, content: decrypted }]);
        }
      ).subscribe();
  }, []);

  const handleSend = async () => {
    if (!text.trim() || !user || !selectedRoom || !myKeys || !selectedRoom.other_user?.public_key || sending) {
      if (selectedRoom && !selectedRoom.other_user?.public_key) alert("ENCRYPTION_ERROR: Recipient has no public key.");
      return;
    }
    
    if (!checkRateLimit('message', 3, 5000)) { // 3 messages per 5 seconds
      return;
    }

    setSending(true);
    try {
      const encrypted = encryptMessage(text.trim(), selectedRoom.other_user.public_key, myKeys.privateKey);
      const recipientId = selectedRoom.other_user.id;
      const newMsg = {
        room_id: selectedRoom.id,
        sender_id: user.id,
        recipient_id: recipientId,
        content: encrypted,
      };

      setText('');
      const { data, error } = await supabase.from('messages').insert(newMsg).select().single();
      if (!error && data) {
        await supabase.from('dm_rooms').update({ 
          last_message: encrypted, 
          last_message_at: new Date().toISOString() 
        }).eq('id', selectedRoom.id);
      }
    } catch (e: any) {
      alert(`ENCRYPTION_FAILED: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (selectedRoom) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedRoom(null)}>
            <Feather name="chevron-left" size={24} color={Colors.cyber.accent} />
          </TouchableOpacity>
          <Avatar username={selectedRoom.other_user?.username || 'user'} size={32} style={{ marginHorizontal: 10 }} />
          <Text style={s.headerTitle}>{selectedRoom.other_user?.username.toUpperCase()}</Text>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
          {chatLoading ? (
            <ActivityIndicator style={{ flex: 1 }} color={Colors.cyber.accent} />
          ) : (
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 20 }}
              renderItem={({ item }) => (
                <View style={[s.msgBubble, item.sender_id === user.id ? s.msgMe : s.msgThem]}>
                  <Text style={[s.msgText, item.sender_id === user.id && { color: '#000' }]}>{item.content}</Text>
                </View>
              )}
              onContentSizeChange={() => flatRef.current?.scrollToEnd()}
            />
          )}

          <View style={s.inputBar}>
            <TextInput
              style={s.input}
              value={text}
              onChangeText={setText}
              placeholder="Broadcast whisper..."
              placeholderTextColor="#444"
              multiline
            />
            <TouchableOpacity onPress={handleSend} disabled={!text.trim()}>
              <Feather name="send" size={20} color={text.trim() ? Colors.cyber.accent : '#333'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <View style={s.tabRow}>
          <TouchableOpacity onPress={() => setActiveTab('scrolls')} style={[s.tab, activeTab === 'scrolls' && s.tabActive]}>
            <Text style={[s.tabText, activeTab === 'scrolls' && s.tabTextActive]}>SCROLLS</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('whispers')} style={[s.tab, activeTab === 'whispers' && s.tabActive]}>
            <Text style={[s.tabText, activeTab === 'whispers' && s.tabTextActive]}>WHISPERS</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onRefresh} style={s.refreshBtn}>
          <Feather name="refresh-cw" size={18} color={Colors.cyber.accent} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'scrolls' ? scrolls : rooms}
        keyExtractor={item => item.id}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyber.accent} />
        }
        ListEmptyComponent={
          <EmptyState 
            title={activeTab === 'scrolls' ? "NO_SCROLLS_DETECTED" : "NO_WHISPERS_FOUND"} 
            subtitle="Secure channel is quiet. Stay alert for incoming data."
          />
        }
        renderItem={({ item }: { item: any }) => (
          activeTab === 'scrolls' ? (
            <TouchableOpacity style={[s.card, !item.is_read && s.cardUnread]} onPress={() => {}}>
              <View style={s.cardHeader}>
                <View style={[s.indicator, item.is_read ? s.indicatorRead : s.indicatorUnread]} />
                <Text style={s.cardTitle}>{item.title.toUpperCase()}</Text>
                <Text style={s.time}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text style={s.cardContent}>{item.content}</Text>
              <View style={s.cardFooter}><Text style={s.typeTag}>// {item.type.toUpperCase()}</Text></View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.roomCard} onPress={() => openRoom(item)}>
              <Avatar username={item.other_user?.username || 'u'} size={40} />
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={s.roomTitle}>{item.other_user?.username.toUpperCase()}</Text>
                <Text style={s.roomLastMsg} numberOfLines={1}>{item.last_message || 'SECURE_CHANNEL_READY'}</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#333" />
            </TouchableOpacity>
          )
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cyber.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cyber.border,
  },
  tabRow: { flexDirection: 'row', gap: 20 },
  tab: { paddingVertical: 5 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.cyber.accent },
  tabText: { color: '#444', fontSize: 13, fontWeight: '900', letterSpacing: 1, fontFamily: 'monospace' },
  tabTextActive: { color: Colors.cyber.accent },
  headerTitle: { color: Colors.cyber.accent, fontSize: 16, fontWeight: '900', letterSpacing: 2, fontFamily: 'monospace' },
  refreshBtn: { padding: 8 },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  card: { backgroundColor: Colors.cyber.card, borderWidth: 1, borderColor: Colors.cyber.border, borderRadius: 4, padding: 20, marginBottom: 15 },
  cardUnread: { borderColor: 'rgba(0, 255, 65, 0.3)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  indicator: { width: 6, height: 6, borderRadius: 3, marginRight: 10 },
  indicatorUnread: { backgroundColor: Colors.cyber.accent },
  indicatorRead: { backgroundColor: '#333' },
  cardTitle: { flex: 1, color: '#FFF', fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  time: { color: '#444', fontSize: 10, fontFamily: 'monospace' },
  cardContent: { color: '#888', fontSize: 12, lineHeight: 18, fontFamily: 'monospace', marginBottom: 10 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#111', paddingTop: 10 },
  typeTag: { color: '#333', fontSize: 9, fontFamily: 'monospace' },
  
  roomCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cyber.card, padding: 15, borderRadius: 4, marginBottom: 10, borderWidth: 1, borderColor: Colors.cyber.border },
  roomTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', fontFamily: 'monospace' },
  roomLastMsg: { color: '#666', fontSize: 12, marginTop: 4, fontFamily: 'monospace' },

  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.cyber.border },
  msgBubble: { maxWidth: '80%', padding: 12, borderRadius: Radius.md, marginBottom: 10 },
  msgMe: { alignSelf: 'flex-end', backgroundColor: Colors.cyber.accent, borderBottomRightRadius: 2 },
  msgThem: { alignSelf: 'flex-start', backgroundColor: '#1A1A1A', borderBottomLeftRadius: 2 },
  msgText: { color: '#FFF', fontSize: 14, fontFamily: 'monospace' },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 15, borderTopWidth: 1, borderTopColor: Colors.cyber.border, gap: 10 },
  input: { flex: 1, backgroundColor: '#0A0A0A', color: '#FFF', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 4, fontFamily: 'monospace' },
});

