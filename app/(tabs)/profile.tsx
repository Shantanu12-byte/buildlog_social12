import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, Alert, Linking,
  RefreshControl, Image, Modal, FlatList, Switch, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { trackPageView } from '@/services/analyticsService';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { Avatar, LoadingScreen } from '@/components/ui/UI';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { VerifiedSkillsSection, SkillLevel } from '@/components/VerifiedSkillChip';
import { GitHubProject } from '@/services/githubPortfolio';
import { ProfilePortfolioController } from '@/services/ProfilePortfolioController';
import LogEntryFeedItem from '@/components/LogEntryFeedItem';
import { fetchUserProjects } from '@/services/ProfilePersistenceManager';
import { useUserStore } from '@/store/userStore';
import { useResponsive } from '@/hooks/useResponsive';
import { DesktopLayout } from '@/components/ui/DesktopLayout';

export default function ProfileScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { isDesktop } = useResponsive();
  const s = React.useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);
  const router = useRouter();
  const { userProfile, userId, fetchUserProfile: syncStore } = useUserStore();
  const [profile, setProfile] = useState<any>(userProfile);
  const [stats, setStats] = useState({ projects: 0, builds: 0, followers: 0, collabs: 0, streak: 0, timeSpent: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      trackPageView(userId, 'profile');
    }
  }, [userId]);
  const [refreshing, setRefreshing] = useState(false);
  const [verifiedSkills, setVerifiedSkills] = useState<Record<string, SkillLevel>>({});
  const [learningStats, setLearningStats] = useState<Record<string, { total: number; done: number }>>({});
  const [posts, setPosts] = useState<any[]>([]);
  const [githubProjects, setGithubProjects] = useState<GitHubProject[]>([]);
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [githubStatus, setGithubStatus] = useState({ isConnected: false, hasSufficientScopes: false });
  const [activeTab, setActiveTab] = useState<'posts' | 'projects' | 'matrix'>('posts');
  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!userId) {
      router.replace('/(auth)/login');
      return;
    }

    try {
      // Update local profile state from store if available
      if (userProfile) {
        setProfile(userProfile);
        if (userProfile.verified_skills) {
          setVerifiedSkills(userProfile.verified_skills);
        }
      }

      // 1. Parallel Secondary Fetches (Counts, Posts)
      const fetchActions = [
        supabase.from('posts').select('*', { count: 'exact' }).eq('author_id', userId).order('created_at', { ascending: false }).limit(30),
        supabase.from('followers').select('id', { count: 'exact' }).eq('following_id', userId),
        supabase.from('followers').select('id', { count: 'exact' }).eq('follower_id', userId),
      ];

      const [postsRes, followersRes, followingRes] = await Promise.all(fetchActions);

      if (postsRes.data) setPosts(postsRes.data);
      
      setStats(prev => ({
        ...prev,
        projects: postsRes.count || 0,
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
      }));

      // 2. Local Persistence (Flame Streak & Time)
      const [streakStr, timeStr] = await Promise.all([
        AsyncStorage.getItem('daily_streak'),
        AsyncStorage.getItem('total_time_spent')
      ]);

      setStats(prev => ({
        ...prev,
        streak: parseInt(streakStr || '3', 10),
        timeSpent: parseInt(timeStr || '145', 10)
      }));

      // 3. Fetch Learning Stats (Local AsyncStorage)
      const allKeys = await AsyncStorage.getAllKeys();
      const progressKeys = allKeys.filter(k => k.startsWith('progress_'));
      const progressValues = await AsyncStorage.multiGet(progressKeys);
      
      const statsByTopic: Record<string, { total: number; done: number }> = {};
      const TOPICS = ['HTML', 'CSS', 'Python', 'React', 'Java', 'DSA', 'Web3'];
      
      TOPICS.forEach(topic => {
        let sum = 0;
        progressValues.forEach(([key, val]) => {
          if (key.startsWith(`progress_${topic}_`)) {
            sum += val ? parseInt(val, 10) : 0;
          }
        });
        const avg = Math.round(sum / 3);
        if (avg > 0) statsByTopic[topic] = { total: 100, done: avg };
      });
      setLearningStats(statsByTopic);

      // 4. GitHub Integration
      setIsSyncingGithub(true);
      const status = await ProfilePortfolioController.checkGitHubStatus(userId);
      setGithubStatus(status);
      
      if (status.isConnected && status.hasSufficientScopes) {
        const repoData = await ProfilePortfolioController.loadUserProjects(userId);
        setGithubProjects(repoData.projects || []);
      }

    } catch (err: any) { } finally {
      setIsSyncingGithub(false);
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, userProfile, router]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  const handleDisconnectGithub = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setLoading(true);
      await ProfilePortfolioController.disconnectGitHub(user.id);
      Alert.alert('Disconnected', 'GitHub account has been unlinked.');
      fetchProfileData();
    } catch (err) { Alert.alert('Error', 'Failed to disconnect GitHub.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFollowers = async () => {
    setFollowersModalVisible(true);
    if (followersList.length > 0) return; // already loaded
    setFollowersLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: follows } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('following_id', user.id);
      if (follows && follows.length > 0) {
        const ids = follows.map((f: any) => f.follower_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, bio')
          .in('id', ids);
        setFollowersList(profiles || []);
      } else {
        setFollowersList([]);
      }
    } catch (e) { } finally {
      setFollowersLoading(false);
    }
  };

  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowSkeleton(false), 500);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
    }
  }, [loading]);

  if (showSkeleton) return <LoadingScreen type="profile" />;

  // Prioritize store for current user to enable instant updates
  const isOwnProfile = (profile?.id === userId) || (!profile && userId);
  // Merged profile, ensuring we don't overwrite a valid avatar_url with null from stale store
  const activeProfile = isOwnProfile ? { 
    ...profile, 
    ...userProfile,
    avatar_url: userProfile?.avatar_url || profile?.avatar_url 
  } : profile;

  const userMetadata = activeProfile?.user_metadata || (activeProfile as any)?._user_metadata;
  const displayName = activeProfile?.full_name || userMetadata?.full_name || activeProfile?.username || userMetadata?.username || 'Builder';
  const username = activeProfile?.username || userMetadata?.username || 'builder';

  const renderProfileHeader = () => (
    <View style={s.desktopSidebar}>
      <View style={s.identityCard}>
        <Avatar 
          username={activeProfile?.username || 'builder'} 
          uri={activeProfile?.avatar_url}
          size={isDesktop ? 120 : 90} 
        />
        <Text style={s.nameText}>{displayName}</Text>
        <Text style={s.handleText}>@{username}</Text>
        
        <Text style={s.bioText}>
          {activeProfile?.bio || 'Building the future, one core at a time.'}
        </Text>

        <View style={s.statsBox}>
          <View style={s.statItem}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <FontAwesome5 name="fire-alt" size={14} color="#FF5F1F" />
              <Text style={s.statVal}>{stats.streak}</Text>
            </View>
            <Text style={s.statLab}>Streak</Text>
          </View>
          <View style={s.statSep} />
          <TouchableOpacity style={s.statItem} onPress={handleViewFollowers}>
            <Text style={s.statVal}>{stats.followers}</Text>
            <Text style={s.statLab}>Followers</Text>
          </TouchableOpacity>
        </View>

        <View style={s.profileActionsGrid}>
          <TouchableOpacity style={s.actionBtnHighlight} onPress={() => router.push('/(stack)/new-post')}>
            <Text style={s.actionBtnTextWhite}>New Post</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtnHalf} onPress={() => router.push('/(stack)/edit-profile')}>
            <Text style={s.actionBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={s.socialRow}>
          <TouchableOpacity 
            style={s.socialPillGitHub}
            onPress={() => activeProfile?.github_url && Linking.openURL(activeProfile.github_url)}
          >
            <FontAwesome5 name="github" size={14} color={theme.purple} />
            <Text style={[s.socialText, { color: theme.purple }]}>GitHub</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={s.socialPillLinkedIn}
            onPress={() => activeProfile?.linkedin_url && Linking.openURL(activeProfile.linkedin_url)}
          >
            <FontAwesome5 name="linkedin" size={14} color={theme.green} />
            <Text style={[s.socialText, { color: theme.green }]}>LinkedIn</Text>
          </TouchableOpacity>
        </View>

        <View style={s.campusSection}>
          <View style={s.campusInfo}>
            <Text style={s.campusLabel}>CAMPUS</Text>
            <Text style={s.campusValue}>{activeProfile?.campus_name || 'Not Joined'}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={s.settingsBtnDesktop} 
          onPress={() => router.push('/(stack)/settings')}
        >
          <Feather name="settings" size={18} color={theme.textSecondary} />
          <Text style={s.settingsBtnText}>Account Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProfileContent = () => (
    <View style={isDesktop ? s.desktopMain : s.mobileMain}>
      {/* Tab Bar */}
      <View style={s.tabBar}>
        <TouchableOpacity 
          style={[s.tabItem, activeTab === 'posts' && s.tabItemActive]} 
          onPress={() => setActiveTab('posts')}
        >
          <Feather name="grid" size={20} color={activeTab === 'posts' ? theme.purple : theme.textSecondary} />
          <Text style={[s.tabLabelText, activeTab === 'posts' && s.tabLabelActive]}>POSTS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.tabItem, activeTab === 'projects' && s.tabItemActive]} 
          onPress={() => setActiveTab('projects')}
        >
          <Feather name="folder" size={20} color={activeTab === 'projects' ? theme.purple : theme.textSecondary} />
          <Text style={[s.tabLabelText, activeTab === 'projects' && s.tabLabelActive]}>PROJECTS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.tabItem, activeTab === 'matrix' && s.tabItemActive]} 
          onPress={() => setActiveTab('matrix')}
        >
          <Feather name="activity" size={20} color={activeTab === 'matrix' ? theme.purple : theme.textSecondary} />
          <Text style={[s.tabLabelText, activeTab === 'matrix' && s.tabLabelActive]}>MATRIX</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={s.tabContent}>
        {activeTab === 'posts' && (
          <View style={s.tabPane}>
            {posts.length > 0 ? (
              posts.map((post) => (
                <LogEntryFeedItem 
                  key={post.id} 
                  post={post}
                  onHypePress={() => {}} 
                  onCommentPress={() => {}}
                  onSharePress={() => {}}
                />
              ))
            ) : (
              <View style={s.emptyGrid}>
                <Feather name="camera" size={40} color={theme.border} />
                <Text style={s.emptyGridText}>No posts yet</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'projects' && (
          <View style={s.tabPane}>
            {githubStatus.isConnected && !githubStatus.hasSufficientScopes && (
              <TouchableOpacity 
                style={s.reAuthCard} 
                onPress={() => router.push('/(stack)/connect-github')}
              >
                <View style={s.reAuthIconHeader}>
                  <FontAwesome5 name="github" size={30} color={theme.purple} />
                  <Feather name="refresh-cw" size={20} color={theme.purple} />
                </View>
                <Text style={s.reAuthTitle}>Re-Authorize GitHub</Text>
                <Text style={s.reAuthSubtitle}>
                  To see private projects or organization work, please refresh your credentials.
                </Text>
                <View style={s.reAuthActionRow}>
                  <TouchableOpacity style={s.reAuthAction} onPress={() => router.push('/(stack)/connect-github')}>
                    <Text style={s.reAuthActionText}>Refresh Pass Now</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}

            {!githubStatus.isConnected && !isSyncingGithub && (
              <View style={s.emptyGrid}>
                <FontAwesome5 name="github" size={40} color={theme.border} />
                <Text style={s.emptyGridText}>GitHub projects not imported</Text>
                <TouchableOpacity 
                  style={s.connectGithubBtn}
                  onPress={() => router.push('/(stack)/connect-github')}
                >
                  <Text style={s.connectGithubBtnText}>Connect GitHub</Text>
                </TouchableOpacity>
              </View>
            )}

            {githubStatus.isConnected && githubStatus.hasSufficientScopes && githubProjects.length > 0 ? (
              githubProjects.map((repo) => (
                <LogEntryFeedItem 
                  key={repo.id}
                  post={{
                    username: username,
                    repoName: repo.name,
                    language: repo.language,
                    title: repo.name,
                    description: repo.description,
                    achievements: ['Imported from GitHub', 'Verified Proof of Work'],
                    tags: [repo.language, 'GitHub'],
                    progress: 100
                  }}
                  onHypePress={() => {}}
                  onCommentPress={() => {}}
                  onSharePress={() => {}}
                />
              ))
            ) : githubStatus.hasSufficientScopes && !isSyncingGithub && githubStatus.isConnected && (
              <View style={s.emptyGrid}>
                <Feather name="folder" size={40} color={theme.textMuted} />
                <Text style={s.emptyGridText}>No public projects found</Text>
              </View>
            )}

            {isSyncingGithub && (
              <ActivityIndicator color={theme.purple} style={{ marginVertical: 40 }} />
            )}
          </View>
        )}

        {activeTab === 'matrix' && (
          <View style={s.tabPane}>
            {/* Placement Prep Coding Stats */}
            <View style={[s.codingStatsSection, { marginTop: 0 }]}>
              <Text style={s.stackHeader}>CODING STATS</Text>
              <View style={s.statsStatRow}>
                <View style={s.statsCard}>
                  <Text style={s.statsValLarge}>{activeProfile?.easy_solved || 0}</Text>
                  <Text style={[s.statsLabelSmall, { color: theme.green }]}>Easy</Text>
                </View>
                <View style={s.statsCard}>
                  <Text style={s.statsValLarge}>{activeProfile?.medium_solved || 0}</Text>
                  <Text style={[s.statsLabelSmall, { color: theme.amber }]}>Med</Text>
                </View>
                <View style={s.statsCard}>
                  <Text style={s.statsValLarge}>{activeProfile?.hard_solved || 0}</Text>
                  <Text style={[s.statsLabelSmall, { color: theme.red }]}>Hard</Text>
                </View>
              </View>
              
              <View style={s.xpStreakRow}>
                <View style={s.xpBadgeMini}>
                  <MaterialCommunityIcons name="lightning-bolt" size={14} color={theme.purple} />
                  <Text style={s.xpTextMini}>{activeProfile?.xp || 0} XP</Text>
                </View>
                <View style={s.streakBadgeMini}>
                  <FontAwesome5 name="fire-alt" size={12} color="#FF5F1F" />
                  <Text style={s.streakTextMini}>{activeProfile?.streak_count || 0} DAY STREAK</Text>
                </View>
              </View>
            </View>

            {/* Stack */}
            <View style={s.stackWrap}>
              <Text style={s.stackHeader}>STACK</Text>
              {activeProfile?.skills && activeProfile.skills.length > 0 && (
                <VerifiedSkillsSection
                  skills={activeProfile.skills}
                  verifiedSkills={verifiedSkills}
                  onSkillPress={(skill: string) => {
                    router.push(`/skill/${skill}` as any);
                  }}
                />
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <DesktopLayout scrollable={false}>
      <SafeAreaView style={s.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        
        {isDesktop ? (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.desktopLayout}>
            {renderProfileHeader()}
            {renderProfileContent()}
          </ScrollView>
        ) : (
          <ScrollView 
            style={s.scrollView}
            contentContainerStyle={s.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.purple} />
            }
          >
            {/* Header */}
            <View style={s.header}>
              <View style={s.themeToggleRow}>
                <Text style={[s.themeIcon, { color: theme.textPrimary }]}>
                  {isDark ? '🌙' : '☀️'}
                </Text>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: theme.border, true: theme.purple }}
                  thumbColor="#ffffff"
                />
              </View>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => router.push('/(stack)/settings')} style={s.settingsBtn}>
                <Feather name="settings" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Identity Area for Mobile */}
            <View style={s.identity}>
              <Avatar 
                username={activeProfile?.username || 'builder'} 
                uri={activeProfile?.avatar_url}
                size={90} 
                style={s.avatar} 
              />
              <Text style={s.nameText}>{displayName}</Text>
              <Text style={s.handleText}>@{username}</Text>
              <Text style={s.bioText}>{activeProfile?.bio || 'Building the future.'}</Text>
            </View>

            {/* Render Tab View */}
            {renderProfileContent()}
          </ScrollView>
        )}

        {/* Followers Modal */}
        <Modal
          visible={followersModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setFollowersModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <SafeAreaView style={s.modalSheet}>
              <View style={s.modalHeader}>
                <View>
                  <Text style={s.modalTitle}>FOLLOWERS</Text>
                  <Text style={s.modalSub}>OPERATIVE_NETWORK</Text>
                </View>
                <TouchableOpacity onPress={() => setFollowersModalVisible(false)} style={s.modalCloseBtn}>
                  <Feather name="x" size={22} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
              <View style={s.modalDivider} />
              {followersLoading ? (
                <ActivityIndicator color={theme.purple} style={{ marginTop: 40 }} />
              ) : (
                <FlatList
                  data={followersList}
                  keyExtractor={item => item.id}
                  contentContainerStyle={s.followerList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={s.followerCard}
                      onPress={() => {
                        setFollowersModalVisible(false);
                        router.push(`/(stack)/messages?targetUserId=${item.id}` as any);
                      }}
                      activeOpacity={0.8}
                    >
                      <Avatar username={item.username} uri={item.avatar_url || null} size={44} />
                      <View style={s.followerInfo}>
                        <Text style={s.followerName}>@{item.username}</Text>
                        {item.bio ? <Text style={s.followerBio} numberOfLines={1}>{item.bio}</Text> : null}
                      </View>
                      <Feather name="message-circle" size={18} color={theme.purple} />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={s.emptyGrid}>
                      <Feather name="users" size={40} color={theme.textMuted} />
                      <Text style={s.emptyGridText}>No followers yet</Text>
                    </View>
                  }
                />
              )}
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </DesktopLayout>
  );
}

const getStyles = (theme: any, isDark: boolean, isDesktop?: boolean) => {
  const bg = isDark ? '#000000' : '#f8fafc';
  const bgCard = isDark ? '#0a0a0a' : '#ffffff';
  const border = isDark ? '#1f2937' : '#e2e8f0';
  const shadow = !isDark ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  } : {};

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg }, 
    scrollView: { flex: 1 },
    content: { paddingBottom: 100 },
    
    // Desktop Layout Extensions
    desktopLayout: {
      flexDirection: 'row',
      gap: 32,
      padding: 32,
      maxWidth: 1200,
      alignSelf: 'center',
    },
    desktopSidebar: { 
      width: 380,
      ...(Platform.OS === 'web' && {
        position: 'sticky' as any,
        top: 32,
      })
    },
    desktopMain: { flex: 1, gap: 24 },
    mobileMain: { gap: 16 },
    
    identityCard: {
      backgroundColor: bgCard, borderRadius: 24, padding: 32,
      alignItems: 'center', borderWidth: 1, borderColor: border,
      ...shadow
    },

    header: { flexDirection: 'row', paddingTop: 20, paddingHorizontal: 20, marginBottom: 10, alignItems: 'center' },
    themeToggleRow: { flexDirection: 'row', alignItems: 'center' },
    themeIcon: { marginRight: 8, fontSize: 16 },
    settingsBtn: { padding: 8 },
    identity: { alignItems: 'center', paddingHorizontal: 20 },
    avatar: { marginBottom: 16, borderWidth: 1, borderColor: border },
    nameText: { color: theme.textPrimary, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginTop: 8 },
    handleText: { color: theme.textSecondary, fontSize: 16, fontWeight: '500', marginBottom: 12 },
    bioText: { color: theme.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
    
    campusSection: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      width: '100%', 
      backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.03)', 
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12, 
      borderWidth: 1, 
      borderColor: border, 
      marginBottom: 20 
    },
    campusInfo: { flex: 1 },
    campusLabel: { color: theme.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
    campusValue: { color: theme.textPrimary, fontSize: 14, fontWeight: '700' },
    
    socialRow: { flexDirection: 'row', gap: 10, marginBottom: 20, width: '100%' },
    socialPillGitHub: { 
      flex: 1,
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center',
      paddingVertical: 10, 
      borderRadius: 12, 
      gap: 8,
      backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.05)'
    },
    socialPillLinkedIn: { 
      flex: 1,
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center',
      paddingVertical: 10, 
      borderRadius: 12, 
      gap: 8,
      backgroundColor: isDark ? 'rgba(0, 102, 255, 0.1)' : 'rgba(0, 102, 255, 0.05)'
    },
    socialText: { fontSize: 13, fontWeight: '700' },
    
    statsBox: { 
      flexDirection: 'row', 
      width: '100%',
      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', 
      borderRadius: 16, 
      paddingVertical: 16, 
      marginBottom: 24, 
      borderWidth: 1, 
      borderColor: border 
    },
    statItem: { flex: 1, alignItems: 'center' },
    statSep: { width: 1, height: '60%', backgroundColor: border, alignSelf: 'center' },
    statVal: { color: theme.textPrimary, fontSize: 18, fontWeight: '800' },
    statLab: { color: theme.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
    
    profileActionsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24, width: '100%' },
    actionBtnHalf: { 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: isDark ? 'transparent' : '#fff', 
      paddingVertical: 14, 
      borderRadius: 14, 
      borderWidth: 1, 
      borderColor: border 
    },
    actionBtnHighlight: { 
      flex: 2, 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: theme.purple, 
      paddingVertical: 14, 
      borderRadius: 14, 
    },
    actionBtnText: { color: theme.textPrimary, fontSize: 14, fontWeight: '800' },
    actionBtnTextWhite: { color: '#ffffff', fontSize: 14, fontWeight: '800' },

    settingsBtnDesktop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      marginTop: 10,
    },
    settingsBtnText: { color: theme.textSecondary, fontSize: 14, fontWeight: '600' },

    tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: border, marginBottom: 0 },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: 16, borderBottomWidth: 2, borderBottomColor: 'transparent', gap: 6 },
    tabItemActive: { borderBottomColor: theme.purple },
    tabLabelText: { fontSize: 10, fontWeight: '900', color: theme.textMuted, letterSpacing: 1 },
    tabLabelActive: { color: theme.purple },
    
    tabContent: { marginTop: 0 },
    tabPane: { gap: 20, paddingTop: 20 },
    
    codingStatsSection: { 
      backgroundColor: bgCard, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: border, ...shadow,
      marginTop: 20,
    },
    stackHeader: { color: theme.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 20, textTransform: 'uppercase' },
    
    statsStatRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    statsCard: { flex: 1, alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: border },
    statsValLarge: { color: theme.textPrimary, fontSize: 24, fontWeight: '900' },
    statsLabelSmall: { fontSize: 11, fontWeight: '800', marginTop: 4 },
    
    xpStreakRow: { flexDirection: 'row', gap: 12 },
    xpBadgeMini: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(124, 58, 237, 0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
    xpTextMini: { color: theme.purple, fontSize: 13, fontWeight: '800' },
    streakBadgeMini: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255, 95, 31, 0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
    streakTextMini: { color: '#FF5F1F', fontSize: 13, fontWeight: '800' },
    
    stackWrap: { marginTop: 24, backgroundColor: bgCard, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: border, ...shadow },
    
    emptyGrid: { paddingVertical: 80, alignItems: 'center', opacity: 0.5 },
    emptyGridText: { color: theme.textSecondary, fontSize: 14, fontWeight: '700', marginTop: 12 },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalSheet: { flex: 0.85, backgroundColor: theme.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24 },
    modalTitle: { color: theme.textPrimary, fontSize: 24, fontWeight: '900' },
    modalSub: { color: theme.purple, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
    modalCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: border, alignItems: 'center', justifyContent: 'center' },
    modalDivider: { height: 1, backgroundColor: border, marginHorizontal: 20 },
    followerList: { padding: 20, gap: 12 },
    followerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: bgCard, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: border, gap: 16 },
    followerInfo: { flex: 1 },
    followerName: { color: theme.textPrimary, fontSize: 16, fontWeight: '700' },
    followerBio: { color: theme.textSecondary, fontSize: 13, marginTop: 4 },

    projectList: { gap: 16, paddingTop: 20 },
    connectGithubBtn: { backgroundColor: theme.purple, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 16 },
    connectGithubBtnText: { color: '#ffffff', fontWeight: '800' },
    reAuthCard: { backgroundColor: bgCard, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: border, gap: 12 },
    reAuthIconHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    reAuthTitle: { color: theme.textPrimary, fontSize: 18, fontWeight: '800' },
    reAuthSubtitle: { color: theme.textSecondary, fontSize: 14, lineHeight: 22 },
    reAuthActionRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 10 },
    reAuthAction: { backgroundColor: theme.purple, paddingVertical: 12, alignItems: 'center', borderRadius: 12, flex: 1 },
    reAuthActionText: { color: '#ffffff', fontWeight: '800' },
  });
};
