import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Pressable,
  useWindowDimensions,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { useChatStore } from '@/store/chatStore';
import { Colors } from '@/constants/theme';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

// --- Sub-components ---

const CyberAvatar = ({ url, username, size = 56, unread = false }: any) => {
  const initials = username?.charAt(0).toUpperCase() || '?';
  
  return (
    <View style={[styles.avatarContainer, { width: size, height: size }]}>
      <View style={[styles.avatarBorder, { borderRadius: size / 2 }]}>
        {url ? (
          <Image 
            source={{ uri: url }} 
            style={[styles.avatarImage, { borderRadius: size / 2 - 2 }]} 
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { borderRadius: size / 2 - 2 }]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
      </View>
      {unread && <View style={styles.unreadPulse} />}
    </View>
  );
};

const EmptyInbox = () => (
  <View style={styles.emptyContainer}>
    <View style={styles.scrollIconContainer}>
      <MaterialCommunityIcons name="script-text-outline" size={100} color="#1A1A1A" />
      <View style={styles.scrollLock}>
        <Feather name="lock" size={32} color="#55FF55" />
      </View>
    </View>
    <Text style={styles.emptyTitle}>THE_SECRET_SCROLL_IS_CLOSED</Text>
    <Text style={styles.emptySub}>No encrypted transmissions found in the current sector.</Text>
    <TouchableOpacity 
      style={styles.whisperBtn}
      onPress={() => router.push('/search')}
    >
      <Text style={styles.whisperBtnText}>[ START_A_SECRET_WHISPER ]</Text>
    </TouchableOpacity>
  </View>
);

// --- Main Component ---

export default function InboxScreen() {
  const { width } = useWindowDimensions();
  const { userProfile } = useUserStore();
  const { inbox, isLoading, fetchInbox, subscribeToMessages } = useChatStore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isDesktop = Platform.OS === 'web' && width > 768;

  useEffect(() => {
    if (userProfile?.id) {
      fetchInbox(userProfile.id);
      
      const unsubscribe = subscribeToMessages(userProfile.id, () => {
        fetchInbox(userProfile.id);
      });
      return unsubscribe;
    }
  }, [userProfile?.id]);

  const onRefresh = async () => {
    if (userProfile?.id) {
      setRefreshing(true);
      await fetchInbox(userProfile.id);
      setRefreshing(false);
    }
  };

  const handleChatPress = (chat: any) => {
    if (isDesktop) {
      setSelectedChatId(chat.id);
    } else {
      router.push(`/(stack)/chat/${chat.id}`);
    }
  };

  const renderChatCard = ({ item }: { item: any }) => {
    const isSelected = selectedChatId === item.id;
    const date = new Date(item.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // In a real app, unread status would come from the messages table
    const isUnread = item.unread_count > 0;

    return (
      <Pressable 
        style={({ pressed }) => [
          styles.card, 
          isSelected && styles.cardSelected,
          pressed && styles.cardPressed
        ]}
        onPress={() => handleChatPress(item)}
      >
        {isUnread && <View style={styles.unreadNeon} />}
        
        <CyberAvatar url={item.avatar_url} username={item.username} unread={isUnread} />
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.nameRow}>
              <Text style={styles.usernameText}>{item.username?.toUpperCase() || 'UNKNOWN'}</Text>
              <MaterialCommunityIcons name="shield-check" size={14} color="#55FF55" style={styles.lockIcon} />
            </View>
            <Text style={styles.timeText}>{timeStr}</Text>
          </View>
          
          <Text style={styles.previewText} numberOfLines={1}>
            {item.lastMessage || 'NO_RECENT_WHISPERS...'}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color="#333" style={styles.chevron} />
      </Pressable>
    );
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>SECRET_SCROLL</Text>
        <MaterialCommunityIcons name="eye-off-outline" size={20} color="#55FF55" />
      </View>
      <Text style={styles.headerSub}>SECURE_VOICE_INBOX</Text>
      <View style={styles.headerLine} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.mainWrapper}>
        {/* Left Side: Inbox List */}
        <View style={[styles.sidebar, isDesktop ? styles.desktopSidebar : styles.fullWidth]}>
          <FlatList
            data={inbox}
            renderItem={renderChatCard}
            keyExtractor={item => item.id}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#55FF55" />
            }
            ListEmptyComponent={isLoading ? <ActivityIndicator color="#55FF55" style={{marginTop: 40}} /> : <EmptyInbox />}
          />
        </View>

        {/* Right Side: Detail Pane (Desktop only) */}
        {isDesktop && (
          <View style={styles.detailPane}>
            {selectedChatId ? (
              <View style={styles.chatPlaceholder}>
                <MaterialCommunityIcons name="shield-lock-outline" size={64} color="#1A1A1A" />
                <Text style={styles.placeholderText}>WHISPER_CHANNEL_ESTABLISHED</Text>
                <TouchableOpacity 
                   style={styles.openDetailBtn}
                   onPress={() => router.push(`/(stack)/chat/${selectedChatId}`)}
                >
                   <MaterialCommunityIcons name="run-fast" size={20} color="#000" style={{marginRight: 10}} />
                   <Text style={styles.openDetailBtnText}>ENTER_DEEP_LINK</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.chatPlaceholder}>
                <Feather name="message-square" size={64} color="#111" />
                <Text style={styles.placeholderText}>SELECT_A_TRANSMISSION_TO_DECRYPT</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mainWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    backgroundColor: '#000',
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightColor: '#1A1A1A',
  },
  desktopSidebar: {
    width: '30%',
    maxWidth: 450,
    minWidth: 350,
  },
  fullWidth: {
    flex: 1,
  },
  detailPane: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listHeader: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: 'monospace',
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
  },
  headerSub: {
    fontFamily: 'monospace',
    color: '#55FF55',
    fontSize: 10,
    letterSpacing: 2,
    opacity: 0.7,
  },
  headerLine: {
    height: 4,
    backgroundColor: '#1A1A1A',
    marginTop: 20,
    width: '40%',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  cardSelected: {
    backgroundColor: '#111',
    borderColor: '#333',
  },
  cardPressed: {
    backgroundColor: '#151515',
    opacity: 0.9,
  },
  unreadNeon: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 3,
    backgroundColor: '#55FF55',
    ...Platform.select({
      web: {
        // @ts-ignore
        boxShadow: '0px 0px 12px #55FF55',
      },
      default: {
        shadowColor: '#55FF55',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
      }
    })
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBorder: {
    flex: 1,
    padding: 2,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontFamily: 'monospace',
    color: '#55FF55',
    fontWeight: 'bold',
    fontSize: 20,
  },
  unreadPulse: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#55FF55',
    borderWidth: 3,
    borderColor: '#0A0A0A',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameText: {
    fontFamily: 'monospace',
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  lockIcon: {
    marginLeft: 6,
    opacity: 0.8,
  },
  timeText: {
    fontFamily: 'monospace',
    color: '#444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  previewText: {
    fontFamily: 'monospace',
    color: '#888',
    fontSize: 12,
    lineHeight: 16,
  },
  chevron: {
    marginLeft: 8,
    opacity: 0.3,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  scrollIconContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  scrollLock: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  emptyTitle: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
  },
  emptySub: {
    fontFamily: 'monospace',
    color: '#555555',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 18,
  },
  whisperBtn: {
    backgroundColor: '#55FF55',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 0, // Keep it sharp
    flexDirection: 'row',
    alignItems: 'center',
  },
  whisperBtnText: {
    fontFamily: 'monospace',
    color: '#000',
    fontWeight: '900',
    fontSize: 13,
  },
  chatPlaceholder: {
    alignItems: 'center',
    padding: 40,
  },
  placeholderText: {
    fontFamily: 'monospace',
    color: '#1A1A1A',
    fontSize: 16,
    marginTop: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },
  openDetailBtn: {
    marginTop: 40,
    backgroundColor: '#55FF55',
    paddingVertical: 14,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  openDetailBtnText: {
    fontFamily: 'monospace',
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  }
});
