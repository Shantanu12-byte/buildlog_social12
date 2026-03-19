import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { AvatarBlock } from '@/components/AvatarBlock';
import { Colors, Typography, Spacing, Radius, FontSizes, getThemeColors } from '@/constants/theme';

type NetworkUser = {
  id: string;
  username: string;
  avatar_url: string | null;
  level?: string;
};

export default function NetworkRadarScreen() {
  const router = useRouter();
  const { type = 'following' } = useLocalSearchParams<{ type: 'followers' | 'following' }>();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(type);
  const [networkList, setNetworkList] = useState<NetworkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile, isEnderMode, fetchUserProfile } = useUserStore();
  const colors = getThemeColors(isEnderMode);
  const [currentUserId, setCurrentUserId] = useState<string | null>(userProfile?.id || null);

  const fetchNetwork = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      if (activeTab === 'followers') {
        // 1. Get follower IDs
        const { data: followRecords, error: followError } = await supabase
          .from('followers')
          .select('follower_id')
          .eq('following_id', uid);

        if (followError) throw followError;

        if (!followRecords || followRecords.length === 0) {
          setNetworkList([]);
          return;
        }

        const ids = followRecords.map(f => f.follower_id);

        // 2. Get profiles for those IDs
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', ids);

        if (profileError) throw profileError;

        setNetworkList(profiles || []);
      } else {
        // 1. Get following IDs
        const { data: followRecords, error: followError } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', uid);

        if (followError) throw followError;

        if (!followRecords || followRecords.length === 0) {
          setNetworkList([]);
          return;
        }

        const ids = followRecords.map(f => f.following_id);

        // 2. Get profiles for those IDs
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', ids);

        if (profileError) throw profileError;

        setNetworkList(profiles || []);
      }
    } catch (error) {
      Alert.alert('ERROR', 'FAILED_TO_LOAD_NETWORK_DATA');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const init = async () => {
      let uid = currentUserId;
      if (!uid) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          uid = session.user.id;
          setCurrentUserId(uid);
          if (!userProfile) await fetchUserProfile();
        } else {
          router.replace('/(auth)/login');
          return;
        }
      }
      if (uid) fetchNetwork(uid);
    };
    init();
  }, [currentUserId, userProfile]);

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    }
  }, [type]);

  const handleUnfollow = async (targetUserId: string, username: string) => {
    try {
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);

      if (error) throw error;
      
      // Update local state
      setNetworkList(prev => prev.filter(u => u.id !== targetUserId));
    } catch (error) {
      console.error('Unfollow error:', error);
      Alert.alert('ERROR', `COULD_NOT_DROP_${username.toUpperCase()}`);
    }
  };

  const renderPlayerCard = ({ item }: { item: NetworkUser }) => (
    <View style={styles.card}>
      <AvatarBlock 
        url={item.avatar_url} 
        username={item.username} 
        size={48} 
        tier={item.level}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.usernameText}>{item.username.toUpperCase()}</Text>
        <Text style={styles.levelText}>LVL {item.level?.toUpperCase() || 'DEFAULT'} ARCHITECT</Text>
      </View>
      <TouchableOpacity 
        style={[
          styles.actionButton, 
          activeTab === 'following' ? styles.dropButton : styles.viewButton
        ]}
        onPress={() => {
          if (activeTab === 'following') {
            handleUnfollow(item.id, item.username);
          } else {
            router.push(`/user/${item.id}`);
          }
        }}
      >
        <Text style={styles.actionButtonText}>
          {activeTab === 'following' ? '[ DROP ]' : '[ VIEW ]'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name={activeTab === 'followers' ? 'eye-off' : 'users'} size={64} color="#333" />
      <Text style={styles.emptyText}>
        {'> '}NO_PLAYERS_FOUND_IN_THIS_SECTOR...
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={() => currentUserId && fetchNetwork(currentUserId)}
      >
        <Text style={styles.refreshText}>[ RE-SCAN_SECTOR ]</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>NETWORK_RADAR</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'following' ? styles.tabActive : styles.tabInactive
          ]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'following' ? '#55FF55' : '#888' }
          ]}>[ FOLLOWING ]</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'followers' ? styles.tabActive : styles.tabInactive
          ]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'followers' ? '#55FF55' : '#888' }
          ]}>[ ALLIES ]</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#55FF55" />
          <Text style={styles.loadingText}>SCANNING_SOCIAL_GRAPH...</Text>
        </View>
      ) : (
        <FlatList
          data={networkList}
          renderItem={renderPlayerCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 4,
    borderBottomColor: '#222',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 4,
  },
  tabActive: {
    backgroundColor: '#111',
    borderTopColor: '#555',
    borderLeftColor: '#555',
    borderBottomColor: '#FFF',
    borderRightColor: '#FFF',
  },
  tabInactive: {
    backgroundColor: '#000',
    borderTopColor: '#222',
    borderLeftColor: '#222',
    borderBottomColor: '#111',
    borderRightColor: '#111',
  },
  tabText: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 4,
    borderTopColor: '#555',
    borderLeftColor: '#555',
    borderBottomColor: '#000',
    borderRightColor: '#000',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  usernameText: {
    fontFamily: 'monospace',
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  levelText: {
    fontFamily: 'monospace',
    color: '#888',
    fontSize: 8,
    marginTop: 2,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 4,
    borderTopColor: '#FFF',
    borderLeftColor: '#FFF',
    borderBottomColor: 'rgba(0,0,0,0.5)',
    borderRightColor: 'rgba(0,0,0,0.5)',
  },
  dropButton: {
    backgroundColor: '#FF5555',
  },
  viewButton: {
    backgroundColor: '#00E5FF',
  },
  actionButtonText: {
    fontFamily: 'monospace',
    color: '#000',
    fontWeight: 'bold',
    fontSize: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'monospace',
    color: '#55FF55',
    marginTop: 16,
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: 'monospace',
    color: '#444',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    lineHeight: 20,
  },
  refreshButton: {
    marginTop: 24,
  },
  refreshText: {
    fontFamily: 'monospace',
    color: '#55FF55',
    fontSize: 12,
  },
});
