import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { AvatarBlock } from '@/components/AvatarBlock';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

type NetworkUser = {
  id: string;
  username: string;
  avatar_url: string | null;
  level?: string;
};

export default function NetworkRadarScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  
  const { type = 'following' } = useLocalSearchParams<{ type: 'followers' | 'following' }>();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(type);
  const [networkList, setNetworkList] = useState<NetworkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile, fetchUserProfile } = useUserStore();
  const [currentUserId, setCurrentUserId] = useState<string | null>(userProfile?.id || null);

  const fetchNetwork = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      if (activeTab === 'followers') {
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

        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', ids);

        if (profileError) throw profileError;

        setNetworkList(profiles || []);
      } else {
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
  }, [currentUserId, userProfile, fetchNetwork, fetchUserProfile, router]);

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    }
  }, [type]);

  const handleUnfollow = async (targetUserId: string, usernameText: string) => {
    try {
      if (!currentUserId) return;
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);

      if (error) throw error;
      
      setNetworkList(prev => prev.filter(u => u.id !== targetUserId));
    } catch (error) { Alert.alert('ERROR', `COULD_NOT_DROP_${usernameText.toUpperCase()}`);
    }
  };

  const renderPlayerCard = ({ item }: { item: NetworkUser }) => (
    <View style={s.card}>
      <AvatarBlock 
        url={item.avatar_url} 
        username={item.username} 
        size={48} 
        tier={item.level}
      />
      <View style={s.cardInfo}>
        <Text style={s.usernameText}>{item.username.toUpperCase()}</Text>
        <Text style={s.levelText}>LVL {item.level?.toUpperCase() || 'DEFAULT'} ARCHITECT</Text>
      </View>
      <TouchableOpacity 
        style={[
          s.actionButton, 
          activeTab === 'following' ? s.dropButton : s.viewButton
        ]}
        onPress={() => {
          if (activeTab === 'following') {
            handleUnfollow(item.id, item.username);
          } else {
            router.push(`/profile/${item.username}`);
          }
        }}
        activeOpacity={0.7}
      >
        <Text style={s.actionButtonText}>
          {activeTab === 'following' ? '[ DROP ]' : '[ VIEW ]'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={s.emptyContainer}>
      <Feather name={activeTab === 'followers' ? 'eye-off' : 'users'} size={64} color={theme.textMuted} />
      <Text style={s.emptyText}>
        {'> '}NO_PLAYERS_FOUND_IN_THIS_SECTOR...
      </Text>
      <TouchableOpacity 
        style={s.refreshButton} 
        onPress={() => currentUserId && fetchNetwork(currentUserId)}
      >
        <Text style={s.refreshText}>[ RE-SCAN_SECTOR ]</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Feather name="chevron-left" size={24} color={theme.purple} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>NETWORK_RADAR</Text>
      </View>

      <View style={s.tabContainer}>
        <TouchableOpacity 
          style={[
            s.tab, 
            activeTab === 'following' ? s.tabActive : s.tabInactive
          ]}
          onPress={() => setActiveTab('following')}
          activeOpacity={0.8}
        >
          <Text style={[
            s.tabText, 
            { color: activeTab === 'following' ? theme.green : theme.textSecondary }
          ]}>[ FOLLOWING ]</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            s.tab, 
            activeTab === 'followers' ? s.tabActive : s.tabInactive
          ]}
          onPress={() => setActiveTab('followers')}
          activeOpacity={0.8}
        >
          <Text style={[
            s.tabText, 
            { color: activeTab === 'followers' ? theme.green : theme.textSecondary }
          ]}>[ ALLIES ]</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={theme.green} />
          <Text style={s.loadingText}>SCANNING_SOCIAL_GRAPH...</Text>
        </View>
      ) : (
        <FlatList
          data={networkList}
          renderItem={renderPlayerCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 4,
    borderBottomColor: theme.border,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontFamily: 'monospace',
    color: theme.purple,
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
    backgroundColor: theme.bgCard,
    borderTopColor: isDark ? '#555' : '#ddd',
    borderLeftColor: isDark ? '#555' : '#ddd',
    borderBottomColor: theme.textPrimary,
    borderRightColor: theme.textPrimary,
  },
  tabInactive: {
    backgroundColor: theme.bg,
    borderTopColor: theme.border,
    borderLeftColor: theme.border,
    borderBottomColor: theme.bgInput,
    borderRightColor: theme.bgInput,
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
    backgroundColor: theme.bgCard,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 4,
    borderTopColor: isDark ? '#555' : '#ddd',
    borderLeftColor: isDark ? '#555' : '#ddd',
    borderBottomColor: isDark ? '#000' : '#888',
    borderRightColor: isDark ? '#000' : '#888',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  usernameText: {
    fontFamily: 'monospace',
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  levelText: {
    fontFamily: 'monospace',
    color: theme.textSecondary,
    fontSize: 8,
    marginTop: 2,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 4,
    borderTopColor: isDark ? '#FFF' : '#eee',
    borderLeftColor: isDark ? '#FFF' : '#eee',
    borderBottomColor: 'rgba(0,0,0,0.5)',
    borderRightColor: 'rgba(0,0,0,0.5)',
  },
  dropButton: {
    backgroundColor: theme.red,
  },
  viewButton: {
    backgroundColor: theme.purple,
  },
  actionButtonText: {
    fontFamily: 'monospace',
    color: isDark ? '#000' : '#FFF',
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
    color: theme.green,
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
    color: theme.textMuted,
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
    color: theme.green,
    fontSize: 12,
  },
});
