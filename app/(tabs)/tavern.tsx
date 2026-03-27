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
  rules?: string;
  tags?: string[];
  created_by?: string;
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



function RoomCard({
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
}) {
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
}

function MessageBubble({ msg, isMe, onLongPress }: { msg: Message; isMe: boolean; onLongPress?: () => void }) {
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

function ChatView({ 
  room, messages, loading, userId, onSend, onBack, onViewMembers, onViewAbout, onLeave, onDeleteMessage 
}: {
  room: Room; messages: Message[]; loading: boolean;
  userId: string; onSend: (t: string) => void; onBack: () => void;
  onViewMembers: () => void; onViewAbout: () => void;
  onLeave: () => void;
  onDeleteMessage: (id: string) => void;
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
  };

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
  const [joinedRooms, setJoinedRooms] = useState<string[]>([]);
  const [isJoinPromptVisible, setIsJoinPromptVisible] = useState(false);
  const [roomForPrompt, setRoomForPrompt] = useState<Room | null>(null);

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

  async function initScreen() {
    if (!profileFetched) return;
    if (!userId) { router.replace('/(auth)/login' as any); return; }

    // One-Time Campus Selection Flow
    if (!userProfile?.campus_id) {
      setIsCampusPicking(true);
    }

    await Promise.all([
      fetchRooms(),
      fetchJoinedRooms()
    ]);
    setLoading(false);
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
    const { error } = await supabase
      .from('room_members')
      .insert({
        room_id: roomId,
        user_id: userId
      });

    if (!error) {
      setJoinedRooms(prev => [...prev, roomId]);
      // Update local room list member count optimistically
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, member_count: (r.member_count ?? 0) + 1 } : r));

      showToast('Joined successfully! 🎉');

      if (enterImmediately) {
        const room = rooms.find(r => r.id === roomId);
        if (room) openRoom(room);
      }
    } else {
      Alert.alert('Error', 'Failed to join room: ' + error.message);
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
    try {
      // 1. Update Profile in Supabase directly (Better than calling separate backend)
      await updateUserProfile({
        campus_id: campusId,
        campus_name: campusName,
        is_joined_to_campus: true
      });

      // 2. Find and join the official campus chat room if it exists
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('college', campusId)
        .eq('type', 'campus');

      if (rooms && rooms.length > 0) {
        for (const r of rooms) {
          await joinRoom(r.id);
        }
      }

      setIsCampusPicking(false);
      
      if (Platform.OS === 'web') {
        window.alert(`Welcome! You are now a verified member of ${campusName}.`);
      } else {
        Alert.alert('Welcome!', `You are now a verified member of ${campusName}.`);
      }

      // Refresh rooms to include campus-specific ones
      await fetchRooms();

    } catch (err: any) {
      console.error('Set campus error:', err);
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
        <StatusBar barStyle="light-content" />
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
                    <View style={[s.memberAvatar, { backgroundColor: '#1f2937' }]}>
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

  roomStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  roomStatText: { color: '#6b7280', fontSize: 12 },
  roomStatSeparator: { color: '#374151', fontSize: 12 },
  roomOnlineText: { color: '#4ade80', fontSize: 12, fontWeight: '600' },

  roomCardAction: { marginLeft: 12, justifyContent: 'center' },
  joinedPill: { backgroundColor: '#064e3b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#065f46' },
  joinedPillText: { color: '#4ade80', fontSize: 11, fontWeight: '700' },
  joinBtnSmall: { backgroundColor: 'transparent', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#7c3aed' },
  joinBtnSmallText: { color: '#7c3aed', fontSize: 12, fontWeight: '700' },

  joinPromptOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  joinPromptContent: { backgroundColor: '#111111', borderRadius: 24, padding: 32, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
  joinPromptIcon: { fontSize: 48, marginBottom: 16 },
  joinPromptTitle: { color: '#ffffff', fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  joinPromptSub: { color: '#6b7280', fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 24 },
  joinPromptStats: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  joinPromptMembers: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  joinPromptBtn: { backgroundColor: '#7c3aed', width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  joinPromptBtnText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  joinPromptCancel: { paddingVertical: 12 },
  joinPromptCancelText: { color: '#6b7280', fontSize: 16, fontWeight: '600' },

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
  chatHeaderSub: { color: '#6b7280', fontSize: 12, fontWeight: '500' },
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

  modalHeader: { marginBottom: 20 },
  modalCloseText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  memberSectionTitle: { color: '#6b7280', fontSize: 14, fontWeight: '700', marginTop: 24, marginBottom: 16, textTransform: 'uppercase' },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  memberAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4c1d95', alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  memberUsername: { flex: 1, color: '#ffffff', fontSize: 16, fontWeight: '600' },
  leaveBtn: { marginTop: 40, marginBottom: 20, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#ef4444', alignItems: 'center' },
  leaveBtnText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },

  aboutTitle: { color: '#ffffff', fontSize: 24, fontWeight: '800', marginTop: 12 },
  aboutHandle: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },
  aboutSection: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#1f2937', borderRadius: 16, padding: 16, marginTop: 20 },
  aboutSectionTitle: { color: '#6b7280', fontSize: 14, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },
  aboutSectionBody: { color: '#ffffff', fontSize: 15, lineHeight: 22 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statLabel: { color: '#6b7280', fontSize: 15 },
  statValue: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  tagPill: { backgroundColor: '#111111', paddingHorizontal: 4, paddingVertical: 2 },
  tagText: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },

  // Toast
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#052e16',
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    zIndex: 9999
  },
  toastText: { color: '#4ade80', fontSize: 14, fontWeight: '700' },
});
