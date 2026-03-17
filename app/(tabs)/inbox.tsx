import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { AvatarBlock } from '@/components/AvatarBlock';
import { getThemeColors } from '@/constants/theme';

type Notification = {
  id: string;
  user_id: string;
  sender_id: string;
  type: 'follow' | 'comment' | 'hype' | 'join_request';
  content: string;
  project_id?: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    username: string;
    avatar_url: string | null;
    level?: string;
  };
};

export default function InboxScreen() {
  const { userProfile, isEnderMode } = useUserStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colors = getThemeColors(isEnderMode);

  const fetchNotifications = useCallback(async () => {
    if (!userProfile?.id) return;
    
    try {
      console.log('📡 INBOX: Fetching historical transmissions...');
      // 1. Fetch raw notifications
      const { data: notifs, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!notifs || notifs.length === 0) {
        setNotifications(prev => prev.length > 0 ? prev : []);
        return;
      }

      // 2. Fetch profiles for all unique sender_ids
      const senderIds = [...new Set(notifs.map(n => n.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, level')
        .in('id', senderIds);

      // 3. Manually join them
      const enrichedNotifs = notifs.map(n => ({
        ...n,
        sender: profiles?.find(p => p.id === n.sender_id) || null
      }));

      // 4. Robust Merge Fix: Don't overwrite new realtime notifications
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const filteredNew = enrichedNotifs.filter(n => !existingIds.has(n.id));
        const merged = [...prev, ...filteredNew].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return merged as any;
      });
    } catch (error) {
      console.error('📡 INBOX_ERROR:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    if (!userProfile?.id) return;

    fetchNotifications();

    console.log('📡 INBOX: Opening real-time command channel for:', userProfile.id);
    const channel = supabase
      .channel(`inbox_realtime_${userProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`,
        },
        async (payload) => {
          console.log('📡 INBOX: New payload received!', payload.new.id);
          
          // Fetch the sender info for the new notification
          const { data: sender } = await supabase
            .from('profiles')
            .select('username, avatar_url, level')
            .eq('id', payload.new.sender_id)
            .single();
            
          const completeNotif: Notification = {
            ...(payload.new as any),
            sender: sender as any
          };

          setNotifications(prev => {
            // Deduplicate just in case
            if (prev.find(n => n.id === completeNotif.id)) return prev;
            return [completeNotif, ...prev];
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 INBOX: Subscription status:', status);
      });

    return () => {
      console.log('📡 INBOX: Closing channel.');
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);

  const handleNotificationPress = async (item: Notification) => {
    // 1. Mark as read in background
    if (!item.is_read) {
      setNotifications(prev => 
        prev.map(n => n.id === item.id ? { ...n, is_read: true } : n)
      );
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', item.id);
    }

    // 2. Route based on type
    if (item.type === 'follow') {
      router.push(`/user/${item.sender_id}`);
    } else if (item.project_id) {
      router.push(`/project/${item.project_id}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'follow': return '⚔️';
      case 'comment': return '🗨️';
      case 'hype': return '⚡';
      default: return '📡';
    }
  };

  const renderCard = ({ item }: { item: Notification }) => {
    const isUnread = !item.is_read;
    const actor = item.sender;

    return (
      <Pressable 
        style={[
          styles.card, 
          isUnread ? styles.unreadCard : styles.readCard
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <AvatarBlock 
          url={actor?.avatar_url} 
          username={actor?.username} 
          size={44}
          tier={actor?.level || 'Default'}
        />
        
        <View style={styles.cardMain}>
          <Text style={styles.contentLabel}>
            {'> '}
            <Text style={styles.usernameText}>{actor?.username?.toUpperCase() || 'EXTERNAL_UNIT'}</Text>
            {item.type === 'follow' && ' HAS_JOINED_YOUR_NETWORK.'}
            {item.type === 'comment' && ` LEFT_A_LOG: "${item.content.split(':').pop()?.trim()}"`}
            {item.type === 'hype' && ' HYPED_YOUR_QUEST.'}
            {item.type === 'join_request' && ' WANTS_TO_JOIN_YOUR_QUEST.'}
          </Text>
          <Text style={styles.timeText}>{new Date(item.created_at).toLocaleTimeString()}</Text>
        </View>

        <View style={styles.typeIndicator}>
          <Text style={styles.indicatorIcon}>{getIcon(item.type)}</Text>
        </View>
      </Pressable>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#55FF55" />
          <Text style={styles.loadingText}>SYNCHRONIZING_LONG_RANGE_SENSORS...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>[ INCOMING_TRANSMISSIONS ]</Text>
        <View style={styles.scanline} />
      </View>

      <FlatList
        data={notifications}
        renderItem={renderCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => {
              setRefreshing(true);
              fetchNotifications();
            }}
            tintColor="#55FF55"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>SIGNAL_LOST: NO_ACTIVITY_IN_THIS_SECTOR...</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    borderBottomWidth: 4,
    borderBottomColor: '#222',
    position: 'relative',
  },
  headerTitle: {
    fontFamily: 'monospace',
    color: '#55FF55',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scanline: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(85, 255, 85, 0.2)',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 4,
    marginBottom: 12,
  },
  unreadCard: {
    backgroundColor: '#050505',
    borderTopColor: '#555',
    borderBottomColor: '#000',
    borderRightColor: '#000',
    borderLeftWidth: 8,
    borderLeftColor: '#55FF55',
  },
  readCard: {
    backgroundColor: '#000',
    borderTopColor: '#222',
    borderLeftColor: '#222',
    borderBottomColor: '#111',
    borderRightColor: '#111',
    opacity: 0.8,
  },
  cardMain: {
    flex: 1,
    marginLeft: 12,
  },
  usernameText: {
    color: '#00E5FF',
    fontWeight: 'bold',
  },
  contentLabel: {
    fontFamily: 'monospace',
    color: '#FFF',
    fontSize: 12,
    lineHeight: 18,
  },
  timeText: {
    fontFamily: 'monospace',
    color: '#444',
    fontSize: 8,
    marginTop: 4,
  },
  typeIndicator: {
    paddingLeft: 12,
  },
  indicatorIcon: {
    fontSize: 18,
  },
  loadingText: {
    fontFamily: 'monospace',
    color: '#55FF55',
    marginTop: 16,
    fontSize: 10,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'monospace',
    color: '#333',
    fontSize: 12,
    textAlign: 'center',
  },
});
