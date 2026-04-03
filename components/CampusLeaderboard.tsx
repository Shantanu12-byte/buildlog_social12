import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Dimensions, Platform, ScrollView,
  ActivityIndicator, Image, Pressable
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { Avatar } from '@/components/ui/UI';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withRepeat,
  withSequence,
  runOnJS,
  interpolate
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

interface LeaderboardUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  streak: number;
  campus: string;
}

function FlameIcon() {
  const scale = useSharedValue(1);
  const { theme } = useTheme();

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <MaterialCommunityIcons name="fire" size={18} color="#f97316" />
    </Animated.View>
  );
}

function TopThreeCard({ user, rank, onPress }: { user: LeaderboardUser; rank: number; onPress: () => void }) {
  const isGold = rank === 1;
  const isSilver = rank === 2;
  const isBronze = rank === 3;
  const { theme, isDark } = useTheme();
  const s = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const glowColor = isGold ? '#f59e0b' : isSilver ? '#94a3b8' : '#b45309';
  const medal = isGold ? '🥇' : isSilver ? '🥈' : '🥉';
  const trophy = isGold ? '🏆' : null;

  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        s.topThreeCard,
        { 
          borderColor: glowColor + (isDark ? '40' : '80'),
          shadowColor: glowColor,
          transform: [{ scale: pressed ? 0.98 : (isGold ? 1.05 : 1) }]
        },
        isGold && s.goldCard
      ]}
    >
      <View style={[s.medalBadge, { backgroundColor: glowColor }]}>
        <Text style={s.medalText}>{medal}</Text>
      </View>
      <Avatar username={user.username} size={isGold ? 64 : 54} style={s.topAvatar} />
      <Text style={s.topUsername} numberOfLines={1}>@{user.username}</Text>
      <View style={s.streakRow}>
        <FlameIcon />
        <Text style={s.topStreakText}>{user.streak || 0}</Text>
      </View>
      {trophy && <Text style={s.trophyIcon}>{trophy}</Text>}
    </Pressable>
  );
}

function RankRow({ user, rank, isEven, onPress }: { user: LeaderboardUser; rank: number; isEven: boolean; onPress: () => void }) {
  const { theme, isDark } = useTheme();
  const s = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[s.rankRow, isEven && s.rankRowEven]}
      activeOpacity={0.7}
    >
      <Text style={s.rankNumber}>{rank}</Text>
      <Avatar username={user.username} size={36} style={s.rowAvatar} />
      <View style={s.userInfo}>
        <Text style={s.rowUsername}>@{user.username}</Text>
        <Text style={s.rowCampus}>{user.campus || 'Global'}</Text>
      </View>
      <View style={s.rowStreak}>
        <MaterialCommunityIcons name="fire" size={16} color="#f97316" />
        <Text style={s.rowStreakText}>{user.streak || 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CampusLeaderboard() {
  const router = useRouter();
  const { userProfile } = useUserStore();
  const { theme, isDark } = useTheme();
  const s = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [, setTick] = useState(0);
  
  const fetchLeaderboard = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, streak, campus')
        .order('streak', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      let filteredData = data || [];
      if (filter === 'my' && userProfile?.campus_id) {
        filteredData = filteredData.filter(u => u.campus === userProfile.campus_id);
      }

      setUsers(filteredData);
      setLastUpdated(new Date());
    } catch (err) {
      // Leaderboard fetch error handled silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(() => fetchLeaderboard(true), 5 * 60 * 1000); // 5 mins
    const tickInterval = setInterval(() => setTick(t => t + 1), 60000); // Update status every min
    return () => {
      clearInterval(interval);
      clearInterval(tickInterval);
    };
  }, [filter]);

  const getTimeAgo = () => {
    const mins = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 60000);
    return mins === 0 ? 'just now' : `${mins} mins ago`;
  };

  const topThree = users.slice(0, 3);
  const restOfUsers = users.slice(3);
  
  const myRank = users.findIndex(u => u.id === userProfile?.id) + 1;
  const myUserData = users.find(u => u.id === userProfile?.id);

  const navigateToProfile = (username: string) => {
    router.push(`/u/${username}` as any);
  };

  if (loading && !refreshing) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={theme.purple} size="large" />
        <Text style={s.loadingText}>Fetching builders...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header & Filter */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>🏆 Campus Leaderboard</Text>
          <Text style={s.subtitle}>Top builders this week · Updated {getTimeAgo()}</Text>
        </View>
        <TouchableOpacity 
          style={s.filterBtn}
          onPress={() => setFilter(filter === 'all' ? 'my' : 'all')}
        >
          <Text style={s.filterText}>
            {filter === 'all' ? '🌎 All Campus' : '🏛️ My Campus'}
          </Text>
          <Feather name="chevron-down" size={14} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {users.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>{filter === 'all' ? '🔥' : '👥'}</Text>
          <Text style={s.emptyTitle}>
            {filter === 'all' ? 'Start your streak to appear here!' : 'No builders from your campus yet.'}
          </Text>
          <Text style={s.emptySub}>
            {filter === 'all' ? 'The forge is waiting for you.' : 'Invite your friends to start the fire!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={restOfUsers}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <View style={s.podiumContainer}>
              <View style={s.podiumRow}>
                {topThree[1] && <TopThreeCard user={topThree[1]} rank={2} onPress={() => navigateToProfile(topThree[1].username)} />}
                {topThree[0] && <TopThreeCard user={topThree[0]} rank={1} onPress={() => navigateToProfile(topThree[0].username)} />}
                {topThree[2] && <TopThreeCard user={topThree[2]} rank={3} onPress={() => navigateToProfile(topThree[2].username)} />}
              </View>
            </View>
          }
          renderItem={({ item, index }) => (
            <RankRow 
              user={item} 
              rank={index + 4} 
              isEven={index % 2 === 0} 
              onPress={() => navigateToProfile(item.username)} 
            />
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
          onRefresh={() => fetchLeaderboard(true)}
          refreshing={refreshing}
        />
      )}

      {/* Pinned My Rank */}
      {myRank > 0 && myUserData && (
        <View style={s.myRankContainer}>
          <View style={s.myRankCard}>
            <Text style={s.myRankNumber}>{myRank}</Text>
            <Avatar username={myUserData.username} size={32} style={s.rowAvatar} />
            <View style={s.userInfo}>
              <Text style={s.myRankLabel}>YOU</Text>
              <Text style={s.rowUsername}>@{myUserData.username}</Text>
            </View>
            <View style={s.rowStreak}>
              <FlameIcon />
              <Text style={s.rowStreakText}>{myUserData.streak || 0}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function getStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    loadingText: {
      color: theme.textSecondary,
      marginTop: 12,
      fontSize: 14,
    },
    header: {
      padding: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    title: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 4,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 13,
    },
    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.bgCard,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    podiumContainer: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    podiumRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 12,
    },
    topThreeCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      width: (width - 64) / 3,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    goldCard: {
      paddingTop: 24,
      paddingBottom: 24,
      width: (width - 48) / 3,
    },
    medalBadge: {
      position: 'absolute',
      top: -10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      zIndex: 10,
    },
    medalText: {
      fontSize: 12,
    },
    topAvatar: {
      marginBottom: 12,
      borderWidth: 2,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    topUsername: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 6,
    },
    streakRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    topStreakText: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '800',
    },
    trophyIcon: {
      position: 'absolute',
      bottom: -10,
      fontSize: 20,
    },
    rankRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 14,
      gap: 16,
    },
    rankRowEven: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    },
    rankNumber: {
      color: theme.textSecondary,
      fontSize: 16,
      fontWeight: '600',
      width: 24,
    },
    rowAvatar: {
      borderRadius: 10,
    },
    userInfo: {
      flex: 1,
    },
    rowUsername: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    rowCampus: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    rowStreak: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(249,115,22,0.1)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    rowStreakText: {
      color: '#f97316',
      fontSize: 15,
      fontWeight: '700',
    },
    myRankContainer: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      zIndex: 100,
    },
    myRankCard: {
      backgroundColor: theme.bgCard,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.purple,
      gap: 16,
      shadowColor: theme.purple,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
    },
    myRankNumber: {
      color: theme.purple,
      fontSize: 18,
      fontWeight: '800',
      width: 28,
    },
    myRankLabel: {
      color: theme.purple,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
      marginBottom: 2,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySub: {
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
}
