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
  Platform, ActivityIndicator, Modal, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/ui/UI';
import { useUserStore } from '@/store/userStore';
import CampusLeaderboard from '@/components/CampusLeaderboard';
import CampusPicker from '@/components/CampusPicker';
import { useTheme } from '@/context/ThemeContext';

// ─── Types ────────────────────────────────────────────────────
interface Room {
  id: string;
  name: string;
  type: 'campus' | 'global' | 'project';
  campus_id?: string;
  description?: string;
  online_count?: number;
  member_count?: number;
  last_message?: string;
  unread_count?: number;
  rules?: string;
  tags?: string[];
  created_by?: string;
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_username: string;
  sender_campus_name?: string;
  content: string;
  created_at: string;
}

type TabType = 'campus' | 'global';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}



const RoomCard = React.memo(({
  room,
  isActive,
  isJoined,
  onPress,
  onJoin
}: {
  room: Room;
  isActive: boolean;
  isJoined: boolean;
  onPress: () => void;
  onJoin: (roomId: string) => void;
}) => {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
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
        </View>
        <Text style={s.roomDesc} numberOfLines={1}>
          {room.description || (isGlobal ? 'Global public server' : 'Your campus community')}
        </Text>

        <View style={s.roomStatsRow}>
          <Text style={s.roomStatText}>👥 {room.member_count ?? 0} members</Text>
          <Text style={s.roomStatSeparator}>·</Text>
          <Text style={s.roomOnlineText}>● {room.online_count ?? 0} online</Text>
        </View>
      </View>

      <View style={s.roomCardAction}>
        {isJoined ? (
          <View style={s.joinedPill}>
            <Text style={s.joinedPillText}>Joined ✓</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={s.joinBtnSmall}
            onPress={(e) => {
              e.stopPropagation();
              onJoin(room.id);
            }}
          >
            <Text style={s.joinBtnSmallText}>+ Join Room</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

const MessageBubble = React.memo(({ msg, isMe, onLongPress }: { msg: Message; isMe: boolean; onLongPress?: () => void }) => {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const initials = msg.sender_username.slice(0, 2).toUpperCase();

  // FIX - Flagging Logic (URLs + Promotional keywords)
  const isFlagged = msg.content.match(/https?:\/\//) &&
    msg.content.toLowerCase().match(/buy|sale|offer|win|free|promo|discount/);

  return (
    <TouchableOpacity 
      style={[s.msgRow, isMe && s.msgRowMe]} 
      onLongPress={isMe ? onLongPress : undefined} 
      activeOpacity={0.8}
    >
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
    </TouchableOpacity>
  );
});

function DateSeparator({ date }: { date: string }) {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
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

function ChatView({ 
  room, messages, loading, userId, onSend, onBack, onViewMembers, onViewAbout, onLeave, onDeleteMessage 
}: {
  room: Room; messages: Message[]; loading: boolean;
  userId: string; onSend: (t: string) => void; onBack: () => void;
  onViewMembers: () => void; onViewAbout: () => void;
  onLeave: () => void;
  onDeleteMessage: (id: string) => void;
}) {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
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

  const renderItem = useCallback(({ item, index }: { item: Message; index: number }) => {
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showDate = !prevMsg || new Date(item.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

    return (
      <View>
        {showDate && <DateSeparator date={item.created_at} />}
        <MessageBubble 
          msg={item} 
          isMe={item.sender_id === userId} 
          onLongPress={() => {
            Alert.alert('Delete Message', 'Delete this message for everyone?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => onDeleteMessage(item.id) }
            ]);
          }}
        />
      </View>
    );
  }, [messages, userId, onDeleteMessage]);

  return (
    <View style={s.chatView}>
      <View style={s.chatHeader}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={onViewAbout}>
          <Text style={s.chatTitle}>{room.name}</Text>
          <Text style={s.chatHeaderSub}>{room.member_count ?? 0} members</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.infoBtn} onPress={() => {
          Alert.alert(
            'Room Options',
            'Choose an action',
            [
              { text: 'View Members', onPress: onViewMembers },
              { text: 'About Room', onPress: onViewAbout },
              { text: 'Leave Room', style: 'destructive', onPress: onLeave },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }}>
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
          <View style={s.chatLoading}><ActivityIndicator color={theme.purple} /></View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.msgList}
            onContentSizeChange={() => flatRef.current?.scrollToEnd()}
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={Platform.OS !== 'ios'}
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
              placeholderTextColor={theme.textMuted}
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
  const { userProfile, userId, updateUserProfile, profileFetched, fetchUserProfile } = useUserStore();
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

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
  const [joinedRooms, setJoinedRooms] = useState<string[]>([]);
  const [isJoinPromptVisible, setIsJoinPromptVisible] = useState(false);
  const [roomForPrompt, setRoomForPrompt] = useState<Room | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [isMembersVisible, setIsMembersVisible] = useState(false);
  const [isAboutVisible, setIsAboutVisible] = useState(false);
  const [roomMembers, setRoomMembers] = useState<any[]>([]);
  const [roomStats, setRoomStats] = useState<any>({ messageCount: 0 });

  const channelRef = useRef<any>(null);
  const memberChannelRef = useRef<any>(null);

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

  // 0. Auto-Close Guard: If userProfile updates and shows joined, unlock the UI
  useEffect(() => {
    if (!!userProfile?.is_joined_to_campus || !!userProfile?.campus_id) {
      if (isCampusPicking) {
        console.log('[Tavern] Profile updated, closing picker...');
        setIsCampusPicking(false);
      }
      if (!isJoined) setIsJoined(true);
    }
  }, [userProfile]);

  async function checkCampusStatus() {
    if (!userId) return;
    setIsCheckingStatus(true);
    console.log('[Tavern] 1. Checking fresh campus status from DB...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_joined_to_campus, campus_id, campus_name')
      .eq('id', userId)
      .single();
      
    if (!error && data) {
      console.log('[Tavern] 2. Fresh status:', data.is_joined_to_campus);
      setIsJoined(data.is_joined_to_campus);
      // If store is out of sync, trigger a background refresh
      if (data.is_joined_to_campus !== userProfile?.is_joined_to_campus) {
        useUserStore.getState().refreshProfile();
      }
    }
    setIsCheckingStatus(false);
  }

  async function initScreen() {
    if (!profileFetched) return;
    if (!userId) { router.replace('/(auth)/login' as any); return; }

    await checkCampusStatus();

    // 1. One-Time Campus Selection Flow
    if (!userProfile?.campus_id && !userProfile?.is_joined_to_campus && !isJoined) {
      setIsCampusPicking(true);
    }

    // 2. Ensure user is actually IN their campus rooms if they have a campus_id
    if (userProfile?.campus_id) {
       await ensureCampusRooms(userProfile.campus_id, userProfile.campus_name || 'Campus');
    }

    await Promise.all([
      fetchRooms(),
      fetchJoinedRooms()
    ]);
    setLoading(false);
  }

  /**
   * Helper to find/create/join official campus rooms.
   * Ensures the Tavern isn't empty for users with a campus_id.
   */
  async function ensureCampusRooms(campusId: string, campusName: string) {
    if (!userId) return;
    try {
      // 1. Check for existing campus rooms
      const { data: rooms, error: fetchError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('campus_id', campusId)
        .eq('type', 'campus');

      if (fetchError) return;

      // 2. Auto-Create Official Hub if no rooms exist for this campus
      if (!rooms || rooms.length === 0) {
        const { data: newRoom, error: createError } = await supabase
          .from('chat_rooms')
          .insert({
            name: `Official ${campusName.split('(')[0].trim()} Hub`,
            description: `Official community for students and builders at ${campusName}.`,
            type: 'campus',
            campus_id: campusId,
            member_count: 1,
            online_count: 1,
            rules: "1. Be respectful\n2. Share what you're building\n3. No spam.",
            tags: ["Official", "Campus", "Building"]
          })
          .select()
          .single();
        
        if (!createError && newRoom) {
          await joinRoom(newRoom.id);
        }
      } else {
        // 3. Join any existing rooms that the user isn't already in
        // (joinRoom handles the duplicate check internally)
        for (const r of rooms) {
          await joinRoom(r.id);
        }
      }
    } catch (e) {
      // Silent fail for background sync
    }
  }

  async function fetchJoinedRooms() {
    if (!userId) return;
    const { data, error } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', userId);

    if (!error && data) {
      setJoinedRooms(data.map(j => j.room_id));
    }
  }

  async function joinRoom(roomId: string, enterImmediately = false) {
    if (!userId) return;
    
    // 1. Check if membership already exists to avoid 409 Conflict / 403 Forbidden on upsert
    const { data: existing } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      if (!joinedRooms.includes(roomId)) setJoinedRooms(prev => [...prev, roomId]);
      if (enterImmediately) {
        const room = rooms.find(r => r.id === roomId);
        if (room) openRoom(room);
      }
      return;
    }

    const { error } = await supabase
      .from('room_members')
      .insert({
        room_id: roomId,
        user_id: userId
      });

    if (!error) {
      setJoinedRooms(prev => [...prev, roomId]);
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, member_count: (r.member_count ?? 0) + 1 } : r));
      showToast('Joined successfully! 🎉');
      if (enterImmediately) {
        const room = rooms.find(r => r.id === roomId);
        if (room) openRoom(room);
      }
    } else {
      console.error('[Tavern] Join error:', error);
      // If it's just a duplicate, we can ignore and pretend success
      if (error.code === '23505') { 
         setJoinedRooms(prev => [...prev, roomId]);
      } else {
         Alert.alert('Join Permission Error', 'Your account settings or permissions might be preventing joining. Please try again.');
      }
    }
  }

  async function leaveRoom(roomId: string) {
    if (!userId) return;
    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (!error) {
      setJoinedRooms(prev => prev.filter(id => id !== roomId));
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, member_count: Math.max(0, (r.member_count ?? 1) - 1) } : r));
      setSelectedRoom(null);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      Alert.alert('Left', 'You have left the room.');
    }
  }

  async function handleSetCampus(campusId: string, campusName: string) {
    if (!userId) return;
    setIsJoinLoading(true);
    
    console.log('1. Starting campus join...');
    console.log('2. Updating DB with clean payload:', {
      campus_id: campusId,
      campus_name: campusName,
      is_joined_to_campus: true
    });

    try {
      // 1. Update Profile in Supabase directly with CLEAN PAYLOAD
      const { data, error } = await supabase
        .from('profiles')
        .update({
          campus_id: campusId,
          campus_name: campusName,
          is_joined_to_campus: true
        })
        .eq('id', userId)
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Update failed to return data');
      }

      console.log('3. DB response confirmed update:', data.is_joined_to_campus);

      if (!data.is_joined_to_campus) {
        console.error('Update did not persist!');
        throw new Error('Update did not persist in database.');
      }

      // 2. Clear picker state immediately
      setIsCampusPicking(false);

      // 3. Sync Rooms
      await ensureCampusRooms(campusId, campusName);
      
      // 4. Force state sync - WAIT for refresh
      console.log('4. Refreshing store...');
      await useUserStore.getState().refreshProfile();
      console.log('5. Store after refresh:', useUserStore.getState().userProfile?.is_joined_to_campus);

      // 5. Small delay for state to settle
      await new Promise(r => setTimeout(r, 300));

      setIsJoined(true);
      console.log('6. Finalizing join. Showing alert...');

      Alert.alert(
        '🎉 Welcome!',
        `You are now a verified member of ${campusName}`,
        [{ 
          text: 'Enter The Tavern', 
          onPress: () => {
             console.log('7. User dismissed alert. Flow complete.');
          }
        }]
      );

    } catch (err: any) { 
      console.error('Join process failed:', err);
      Alert.alert('Join Failed', err.message || 'Could not join campus.');
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
      campus_id: userProfile?.campus_id || 'Global',
      online_count: 1,
      member_count: 1,
    };

    // We explicitly name columns here to be safe and catch errors early
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert([newRoom])
      .select()
      .single();

    if (error) { Alert.alert('Error', `Could not create community: ${error.message}${error.details ? ` (${error.details})` : ''}\n\nHint: Check if the chat_rooms table has all required columns.`);
      return;
    }

    if (data) {
      setRooms(prev => [data, ...prev]);
      setIsCreating(false);
      setNewRoomName('');
      setNewRoomDesc('');
      // Auto join the created room
      await joinRoom(data.id);
      openRoom(data);
    }
  }

  const handleRoomPress = (room: Room) => {
    if (joinedRooms.includes(room.id)) {
      openRoom(room);
    } else {
      setRoomForPrompt(room);
      setIsJoinPromptVisible(true);
    }
  };

  const openRoom = useCallback(async (room: Room) => {
    setSelectedRoom(room);
    setChatLoading(true);
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    if (memberChannelRef.current) supabase.removeChannel(memberChannelRef.current);

    const { data } = await supabase.from('messages').select('*').eq('room_id', room.id).order('created_at', { ascending: true }).limit(100);
    setMessages(data ?? []);
    setChatLoading(false);

    // Realtime Messages
    channelRef.current = supabase
      .channel(`room:${room.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${room.id}`
      },
        payload => setMessages(prev => [...prev, payload.new as Message])
      )
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${room.id}`
      },
        payload => setMessages(prev => prev.filter(m => m.id !== payload.old.id))
      )
      .subscribe();

    // Realtime Member Count
    memberChannelRef.current = supabase
      .channel(`members:${room.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_members',
        filter: `room_id=eq.${room.id}`
      }, () => {
        fetchRoomDetails(room.id);
      })
      .subscribe();

    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unread_count: 0 } : r));
    fetchRoomDetails(room.id);
  }, []);

  async function fetchRoomDetails(roomId: string) {
    // Member Count update in rooms list
    const { data: roomData } = await supabase.from('chat_rooms').select('member_count, online_count').eq('id', roomId).single();
    if (roomData) {
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, ...roomData } : r));
      setSelectedRoom(prev => prev?.id === roomId ? { ...prev, ...roomData } : prev);
    }
  }

  async function fetchRoomMembers(roomId: string) {
    const { data, error } = await supabase
      .from('room_members')
      .select(`
        user_id,
        joined_at,
        profiles (
          username,
          avatar_url,
          full_name,
          last_seen
        )
      `)
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (!error && data) {
      setRoomMembers(data);
    }
  }

  async function fetchRoomStats(roomId: string) {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId);

    setRoomStats({
      messageCount: count || 0,
      createdAt: selectedRoom?.id === roomId ? (selectedRoom as any).created_at : new Date().toISOString()
    });
  }

  async function handleSend(text: string) {
    if (!userId || !selectedRoom) return;

    let processedText = text;
    let wasFiltered = false;

    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // 1. Secure Profanity Filter (Requires JWT)
    try {
      const response = await fetch(`${backendUrl}/api/chat/clean`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      if (data.wasFiltered) {
        processedText = data.cleaned;
        wasFiltered = true;
      }
    } catch (e) { }

    const newMsg = {
      room_id: selectedRoom.id,
      sender_id: userId,
      sender_username: userProfile?.username || 'user',
      content: processedText,
      created_at: new Date().toISOString(),
    };

    // 2. Insert into Supabase
    await supabase.from('messages').insert(newMsg);
    setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, last_message: processedText.slice(0, 50) } : r));

    // 3. Delegate Push Notifications to Backend (Privacy & Efficiency)
    try {
      if (token) {
        fetch(`${backendUrl}/api/user/push/notify/chat`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            roomId: selectedRoom.id,
            senderUsername: userProfile?.username || 'user',
            roomName: selectedRoom.name,
            message: processedText
          }),
        }).catch(() => {});
      }
    } catch (e) { }

    if (wasFiltered) {
      Alert.alert(
        'Community Guidelines',
        'Keep it professional, Builder! Your message was filtered to follow community guidelines.',
        [{ text: 'Got it' }]
      );
    }
  }

  async function handleDeleteMessage(messageId: string) {
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) {
      Alert.alert('Error', 'Failed to delete message: ' + error.message);
    }
    // Note: Local state updated via realtime listener
  }

  if (loading) return <LoadingScreen />;

  if (selectedRoom) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        <ChatView
          room={selectedRoom}
          messages={messages}
          loading={chatLoading}
          userId={userId || ''}
          onSend={handleSend}
          onBack={() => {
            setSelectedRoom(null);
            if (channelRef.current) supabase.removeChannel(channelRef.current);
            if (memberChannelRef.current) supabase.removeChannel(memberChannelRef.current);
          }}
          onViewMembers={() => {
            fetchRoomMembers(selectedRoom.id);
            setIsMembersVisible(true);
          }}
          onViewAbout={() => {
            fetchRoomStats(selectedRoom.id);
            fetchRoomMembers(selectedRoom.id);
            setIsAboutVisible(true);
          }}
          onLeave={() => {
            Alert.alert('Leave Room', 'Are you sure you want to leave this room?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Leave', style: 'destructive', onPress: () => {
                const roomId = selectedRoom.id;
                leaveRoom(roomId);
              }}
            ]);
          }}
          onDeleteMessage={handleDeleteMessage}
        />

        {/* Members Modal */}
        <Modal visible={isMembersVisible} transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={[s.modalContent, { height: '80%' }]}>
              <View style={s.modalHeader}>
                <TouchableOpacity onPress={() => setIsMembersVisible(false)}>
                  <Text style={s.modalCloseText}>← Members ({roomMembers.length})</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={s.memberSectionTitle}>🟢 Online ({roomMembers.filter(m => {
                  const lastSeen = m.profiles?.last_seen;
                  if (!lastSeen) return false;
                  return new Date().getTime() - new Date(lastSeen).getTime() < 5 * 60000;
                }).length})</Text>

                {roomMembers.filter(m => {
                  const lastSeen = m.profiles?.last_seen;
                  if (!lastSeen) return false;
                  return new Date().getTime() - new Date(lastSeen).getTime() < 5 * 60000;
                }).map((m, i) => (
                  <View key={i} style={s.memberRow}>
                    <View style={s.memberAvatar}>
                      <Text style={s.memberAvatarText}>{(m.profiles?.username || 'U').slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <Text style={s.memberUsername}>{m.profiles?.username}</Text>
                    <View style={s.onlineDot} />
                  </View>
                ))}

                <Text style={s.memberSectionTitle}>👥 All Members ({roomMembers.length})</Text>
                {roomMembers.map((m, i) => (
                  <View key={i} style={s.memberRow}>
                    <View style={[s.memberAvatar, { backgroundColor: theme.bgInput }]}>
                      <Text style={s.memberAvatarText}>{(m.profiles?.username || 'U').slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <Text style={s.memberUsername}>{m.profiles?.username}</Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={s.leaveBtn}
                  onPress={() => {
                    if (selectedRoom) {
                      const roomId = selectedRoom.id;
                      Alert.alert('Leave Room', 'Are you sure you want to leave this room?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Leave', style: 'destructive', onPress: () => {
                            leaveRoom(roomId);
                            setIsMembersVisible(false);
                          }
                        }
                      ]);
                    }
                  }}
                >
                  <Text style={s.leaveBtnText}>Leave Room</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* About Modal */}
        <Modal visible={isAboutVisible} transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={[s.modalContent, { height: '80%' }]}>
              <View style={s.modalHeader}>
                <TouchableOpacity onPress={() => setIsAboutVisible(false)}>
                  <Text style={s.modalCloseText}>← About</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <Text style={{ fontSize: 48 }}>{selectedRoom?.type === 'global' ? '🌐' : '🏛️'}</Text>
                  <Text style={s.aboutTitle}>{selectedRoom?.name}</Text>
                  <Text style={s.aboutHandle}>@{selectedRoom?.name.toLowerCase().replace(/\s/g, '_')}</Text>
                </View>

                <View style={s.aboutSection}>
                  <Text style={s.aboutSectionTitle}>📋 Description</Text>
                  <Text style={s.aboutSectionBody}>{selectedRoom?.description || 'No description provided.'}</Text>
                </View>

                <View style={s.aboutSection}>
                  <Text style={s.aboutSectionTitle}>📌 Tags</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {(selectedRoom?.tags || ['Campus', 'Community']).map((tag: string, i: number) => (
                      <View key={i} style={s.tagPill}>
                        <Text style={s.tagText}>[{tag}]</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={s.aboutSection}>
                  <Text style={s.aboutSectionTitle}>📜 Rules</Text>
                  <Text style={s.aboutSectionBody}>{selectedRoom?.rules || "1. Be respectful\n2. No spam\n3.Follow the chat rules"}</Text>
                </View>

                <View style={s.aboutSection}>
                  <Text style={s.aboutSectionTitle}>📊 Stats</Text>
                  <View style={s.statRow}>
                    <Text style={s.statLabel}>👥 Members</Text>
                    <Text style={s.statValue}>{selectedRoom?.member_count ?? 0}</Text>
                  </View>
                  <View style={s.statRow}>
                    <Text style={s.statLabel}>💬 Messages</Text>
                    <Text style={s.statValue}>{roomStats.messageCount}</Text>
                  </View>
                  <View style={s.statRow}>
                    <Text style={s.statLabel}>📅 Created</Text>
                    <Text style={s.statValue}>{new Date(roomStats.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</Text>
                  </View>
                </View>

                <View style={{ marginTop: 24, marginBottom: 8 }}>
                  <Text style={s.memberSectionTitle}>👥 Members ({roomMembers.length})</Text>
                  {roomMembers.map((m, i) => (
                    <View key={i} style={s.memberRow}>
                      <View style={[s.memberAvatar, { backgroundColor: theme.bgInput }]}>
                        <Text style={s.memberAvatarText}>{(m.profiles?.username || 'U').slice(0, 1).toUpperCase()}</Text>
                      </View>
                      <Text style={s.memberUsername}>{m.profiles?.username}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={s.leaveBtn}
                  onPress={() => {
                    if (selectedRoom) {
                      const roomId = selectedRoom.id;
                      Alert.alert(
                        'Leave Room', 
                        'Are you sure you want to leave this room?', 
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Leave', style: 'destructive', onPress: () => {
                            leaveRoom(roomId);
                            setIsAboutVisible(false);
                          }
                        }
                      ]);
                    }
                  }}
                >
                  <Text style={s.leaveBtnText}>Leave Room</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  const filteredRooms = rooms.filter(r => {
    if (activeTab === 'campus') {
      const match = r.type === 'campus' && r.campus_id === userProfile?.campus_id;
      return match;
    }
    return r.type === 'global';
  });

  const isJoinedToCampus = (isJoined || !!userProfile?.is_joined_to_campus || !!userProfile?.campus_id);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

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
      ) : activeTab === 'campus' && (!isJoined && !userProfile?.is_joined_to_campus) ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {isCheckingStatus ? (
            <ActivityIndicator color={theme.purple} size="large" />
          ) : (
            <View style={{ backgroundColor: theme.bgCard, padding: 30, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: theme.border, width: '100%' }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🎓</Text>
              <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Campus Hub Locked</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                You must select and officially join a campus community to access chat groups and projects.
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: theme.purple, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                onPress={() => setIsCampusPicking(true)}
              >
                <Text style={{ color: isDark ? '#000' : '#fff', fontSize: 16, fontWeight: '700' }}>Join Community</Text>
              </TouchableOpacity>
            </View>
          )}
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
          renderItem={({ item }) => (
            <RoomCard
              room={item}
              isActive={false}
              isJoined={joinedRooms.includes(item.id)}
              onPress={() => handleRoomPress(item)}
              onJoin={(id) => joinRoom(id)}
            />
          )}
        />
      )}

      {activeTab === 'campus' && (isJoined || userProfile?.is_joined_to_campus) && !selectedRoom && campusSubTab === 'community' && (
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

      {/* Join Prompt Modal */}
      <Modal visible={isJoinPromptVisible} transparent animationType="fade">
        <View style={s.joinPromptOverlay}>
          <View style={s.joinPromptContent}>
            <Text style={s.joinPromptIcon}>{roomForPrompt?.type === 'global' ? '🌐' : '🏛️'}</Text>
            <Text style={s.joinPromptTitle}>{roomForPrompt?.name}</Text>
            <Text style={s.joinPromptSub}>
              Join this room to start chatting with your campus community
            </Text>

            <View style={s.joinPromptStats}>
              <Text style={s.joinPromptMembers}>👥 {roomForPrompt?.member_count ?? 0} members</Text>
            </View>

            <TouchableOpacity
              style={s.joinPromptBtn}
              onPress={() => {
                if (roomForPrompt) {
                  joinRoom(roomForPrompt.id, true);
                  setIsJoinPromptVisible(false);
                }
              }}
            >
              <Text style={s.joinPromptBtnText}>Join & Enter →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.joinPromptCancel} onPress={() => setIsJoinPromptVisible(false)}>
              <Text style={s.joinPromptCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <View style={s.toastContainer}>
          <Text style={s.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Create Community Modal */}
      <Modal visible={isCreating} transparent animationType="slide">
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Create Community</Text>

            <TextInput
              style={s.modalInput}
              placeholder="Community Name (e.g. CS 101)"
              placeholderTextColor={theme.textMuted}
              value={newRoomName}
              onChangeText={setNewRoomName}
              autoFocus
            />

            <TextInput
              style={[s.modalInput, { height: 80 }]}
              placeholder="Description (optional)"
              placeholderTextColor={theme.textMuted}
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

function getStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20
    },
    screenTitle: {
      color: theme.textPrimary,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.5
    },
    liveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
      borderWidth: 1,
      borderColor: theme.green,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4
    },
    onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.green },
    liveText: { color: theme.green, fontSize: 11, fontWeight: '700' },

    tabs: {
      flexDirection: 'row',
      marginHorizontal: 20,
      backgroundColor: theme.bgInput,
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
    tabActive: { backgroundColor: theme.purple },
    tabIcon: { fontSize: 14 },
    tabLabel: { color: theme.textSecondary, fontSize: 14, fontWeight: '600' },
    tabLabelActive: { color: isDark ? '#000' : '#ffffff' },

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
      borderBottomColor: theme.purple,
    },
    subTabText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    subTabTextActive: {
      color: theme.textPrimary,
    },

    roomCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      marginBottom: 10,
      padding: 16,
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border
    },
    roomCardActive: { borderColor: theme.purple },
    roomIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.05)'
    },
    roomIconText: { fontSize: 20 },
    roomNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
    roomName: { color: theme.textPrimary, fontSize: 16, fontWeight: '700', flex: 1 },
    onlinePillText: { color: theme.green, fontSize: 12, fontWeight: '600' },
    roomDesc: { color: theme.textSecondary, fontSize: 13, marginTop: 2 },

    roomStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
    roomStatText: { color: theme.textSecondary, fontSize: 12 },
    roomStatSeparator: { color: theme.border, fontSize: 12 },
    roomOnlineText: { color: theme.green, fontSize: 12, fontWeight: '600' },

    roomCardAction: { marginLeft: 12, justifyContent: 'center' },
    joinedPill: { backgroundColor: 'rgba(74, 222, 128, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.2)' },
    joinedPillText: { color: theme.green, fontSize: 11, fontWeight: '700' },
    joinBtnSmall: { backgroundColor: 'transparent', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: theme.purple },
    joinBtnSmallText: { color: theme.purple, fontSize: 12, fontWeight: '700' },

    joinPromptOverlay: { flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    joinPromptContent: { backgroundColor: theme.bgCard, borderRadius: 24, padding: 32, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: theme.border },
    joinPromptIcon: { fontSize: 48, marginBottom: 16 },
    joinPromptTitle: { color: theme.textPrimary, fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    joinPromptSub: { color: theme.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 24 },
    joinPromptStats: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
    joinPromptMembers: { color: theme.textPrimary, fontSize: 16, fontWeight: '600' },
    joinPromptBtn: { backgroundColor: theme.purple, width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
    joinPromptBtnText: { color: isDark ? '#000' : '#ffffff', fontSize: 18, fontWeight: '700' },
    joinPromptCancel: { paddingVertical: 12 },
    joinPromptCancelText: { color: theme.textSecondary, fontSize: 16, fontWeight: '600' },

    unreadBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.red,
      alignItems: 'center',
      justifyContent: 'center'
    },
    unreadText: { color: '#fff', fontSize: 10, fontWeight: '800' },

    emptyList: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
    emptyIcon: { fontSize: 48, marginBottom: 8 },
    emptyTitle: { color: theme.textPrimary, fontSize: 18, fontWeight: '700' },
    emptySub: { color: theme.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },

    chatView: { flex: 1, backgroundColor: theme.bg },
    chatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border
    },
    chatHeaderSub: { color: theme.textSecondary, fontSize: 12, fontWeight: '500' },
    backBtn: { padding: 4, marginRight: 12 },
    backIcon: { color: theme.textPrimary, fontSize: 24 },
    chatTitle: { flex: 1, color: theme.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center' },
    infoBtn: { padding: 4 },
    infoBtnText: { color: theme.textSecondary, fontSize: 20 },

    onlineStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 6,
      backgroundColor: theme.bg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border
    },
    onlineStripText: { color: theme.green, fontSize: 11, fontWeight: '600' },

    msgList: { paddingHorizontal: 20, paddingVertical: 16, gap: 16 },
    chatLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    msgRow: { marginBottom: 16 },
    msgRowMe: { alignItems: 'flex-end' },

    senderName: { color: theme.purple, fontSize: 11, fontWeight: '700', marginBottom: 4, marginLeft: 44 },

    bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
    bubbleRowMe: { flexDirection: 'row-reverse' },

    avatarCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(124, 58, 237, 0.3)' : 'rgba(124, 58, 237, 0.1)', alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: theme.textPrimary, fontSize: 12, fontWeight: '700' },

    bubble: {
      maxWidth: '75%',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.border
    },
    bubbleThem: {
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      borderTopLeftRadius: 4
    },
    bubbleMe: {
      backgroundColor: theme.purple,
      borderColor: theme.purple,
      borderRadius: 16,
      borderTopRightRadius: 4
    },
    bubbleFlagged: { borderColor: theme.red },

    bubbleText: { color: theme.textPrimary, fontSize: 14, lineHeight: 20 },
    bubbleTextMe: { color: isDark ? '#000' : '#ffffff' },

    bubbleTime: { color: theme.textSecondary, fontSize: 10, marginTop: 4 },
    bubbleTimeMe: { color: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)', textAlign: 'right' },
    flaggedText: { color: theme.red, fontSize: 10, marginTop: 2, fontWeight: '600' },

    dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
    dateLine: { flex: 1, height: 1, backgroundColor: theme.border },
    dateLabel: { color: theme.textSecondary, fontSize: 11, fontWeight: '600' },

    inputBarContainer: {
      padding: 10,
      paddingHorizontal: 16,
      backgroundColor: 'transparent',
    },
    inputPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.bgInput,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 25,
      paddingLeft: 16,
      paddingRight: 6,
      paddingVertical: 6,
    },
    msgInput: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 15,
      maxHeight: 100,
      paddingVertical: 4
    },
    sendBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.bg,
      borderWidth: 1,
      borderColor: theme.border,
      marginLeft: 8
    },
    sendBtnActive: { backgroundColor: theme.purple, borderColor: theme.purple },
    sendBtnText: { color: isDark ? '#000' : '#ffffff', fontSize: 13, fontWeight: '700' },

    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.purple,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: theme.purple,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10
    },
    fabIcon: { color: isDark ? '#000' : '#fff', fontSize: 28, fontWeight: '400' },

    modalOverlay: { flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: theme.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    modalTitle: { color: theme.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 20 },
    modalInput: { backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 16, color: theme.textPrimary, fontSize: 16, marginBottom: 12 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
    modalBtnCancel: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
    modalCancelText: { color: theme.textSecondary, fontWeight: '600', fontSize: 16 },
    modalBtnCreate: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: theme.purple, alignItems: 'center' },
    modalCreateText: { color: isDark ? '#000' : '#fff', fontWeight: '600', fontSize: 16 },

    modalHeader: { marginBottom: 20 },
    modalCloseText: { color: theme.textPrimary, fontSize: 18, fontWeight: '700' },
    memberSectionTitle: { color: theme.textMuted, fontSize: 14, fontWeight: '700', marginTop: 24, marginBottom: 16, textTransform: 'uppercase' },
    memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
    memberAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)', alignItems: 'center', justifyContent: 'center' },
    memberAvatarText: { color: theme.textPrimary, fontSize: 12, fontWeight: '700' },
    memberUsername: { flex: 1, color: theme.textPrimary, fontSize: 16, fontWeight: '600' },
    leaveBtn: { marginTop: 40, marginBottom: 20, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.red, alignItems: 'center' },
    leaveBtnText: { color: theme.red, fontSize: 16, fontWeight: '700' },

    aboutTitle: { color: theme.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 12 },
    aboutHandle: { color: theme.purple, fontSize: 14, fontWeight: '600' },
    aboutSection: { backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 16, marginTop: 20 },
    aboutSectionTitle: { color: theme.textMuted, fontSize: 14, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },
    aboutSectionBody: { color: theme.textPrimary, fontSize: 15, lineHeight: 22 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    statLabel: { color: theme.textSecondary, fontSize: 15 },
    statValue: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },
    tagPill: { backgroundColor: theme.bg, paddingHorizontal: 4, paddingVertical: 2 },
    tagText: { color: theme.purple, fontSize: 14, fontWeight: '600' },

    toastContainer: {
      position: 'absolute',
      bottom: 100,
      left: 20,
      right: 20,
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
      borderWidth: 1,
      borderColor: theme.green,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      zIndex: 9999
    },
    toastText: { color: theme.green, fontSize: 14, fontWeight: '700' },
  });
}
