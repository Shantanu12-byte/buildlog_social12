import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, Alert, Linking,
  RefreshControl, Image, Modal, FlatList, Switch, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { Avatar, LoadingScreen } from '@/components/ui/UI';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { VerifiedSkillsSection, SkillLevel } from '@/components/VerifiedSkillChip';
import { GitHubProject } from '@/services/githubPortfolio';
import { ProfilePortfolioController } from '@/services/ProfilePortfolioController';
import LogEntryFeedItem from '@/components/LogEntryFeedItem';
import { fetchUserProjects } from '@/services/ProfilePersistenceManager';
import { useUserStore } from '@/store/userStore';

export default function ProfileScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();
  const { userProfile, userId, fetchUserProfile: syncStore } = useUserStore();
  const [profile, setProfile] = useState<any>(userProfile);
  const [stats, setStats] = useState({ projects: 0, builds: 0, followers: 0, collabs: 0, streak: 0, timeSpent: 0, following: 0 });
  const [loading, setLoading] = useState(true);
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

  if (loading) return <LoadingScreen />;

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

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
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

        {/* Identity */}
        <View style={s.identity}>
          <Avatar 
            username={activeProfile?.username || 'builder'} 
            uri={activeProfile?.avatar_url}
            size={90} 
            style={s.avatar} 
          />
          <Text style={s.nameText}>{displayName}</Text>
          <Text style={s.handleText}>@{username}</Text>
          
          <Text style={s.bioText}>
            {activeProfile?.bio || 'Building the future, one core at a time.'}
          </Text>

          {/* Social Pills */}
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

          {/* Campus Badge Section */}
          <View style={s.campusSection}>
            <View style={s.campusInfo}>
              <Text style={s.campusLabel}>CAMPUS</Text>
              <Text style={s.campusValue}>{activeProfile?.campus_name || 'Not Joined'}</Text>
            </View>
          </View>
        </View>

        {/* High-Fi Stats Grid */}
        <View style={s.statsBox}>
          <View style={s.statItem}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <FontAwesome5 name="fire-alt" size={16} color="#FF5F1F" />
              <Text style={s.statVal}>{stats.streak}</Text>
            </View>
            <Text style={s.statLab}>Streak</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{githubProjects.length}</Text>
            <Text style={s.statLab}>Repos</Text>
          </View>
          <View style={s.statSep} />
          <TouchableOpacity style={s.statItem} onPress={handleViewFollowers} activeOpacity={0.7}>
            <Text style={s.statVal}>{stats.followers}</Text>
            <Text style={s.statLab}>Followers</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Actions */}
        <View style={s.profileActionsGrid}>
          <TouchableOpacity style={s.actionBtnHighlight} onPress={() => router.push('/(stack)/new-post')}>
            <Feather name="plus-circle" size={16} color={isDark ? '#000' : '#FFF'} />
            <Text style={s.actionBtnTextWhite}>New Post</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtnHalf} onPress={() => router.push('/(stack)/edit-profile')}>
            <Feather name="edit-2" size={16} color={theme.purple} />
            <Text style={s.actionBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

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
            <View style={s.postList}>
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
            <View style={s.projectList}>
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
                    To see private projects or organization work, please refresh your credentials. Your current pass lacks the full 'repo' scope stamp.
                  </Text>
                  <View style={s.reAuthActionRow}>
                    <TouchableOpacity style={s.reAuthAction} onPress={() => router.push('/(stack)/connect-github')}>
                      <Text style={s.reAuthActionText}>Refresh Pass Now</Text>
                      <Feather name="arrow-right" size={16} color={isDark ? '#000' : '#FFF'} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.disconnectMiniBtn} onPress={handleDisconnectGithub}>
                      <Text style={s.disconnectMiniText}>Disconnect</Text>
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
              ) : githubStatus.hasSufficientScopes && !isSyncingGithub && (
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
            <View>
              {Object.keys(learningStats).length > 0 ? (
                <View style={s.learningSection}>
                  <Text style={s.stackHeader}>MATRIX PROGRESS</Text>
                  {Object.entries(learningStats).map(([topic, data]) => {
                    const percent = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
                    return (
                      <View key={topic} style={s.progressRow}>
                        <View style={s.progressHeader}>
                          <Text style={s.progressTopic}>{topic}</Text>
                          <Text style={s.progressPercent}>{percent}%</Text>
                        </View>
                        <View style={s.progressBarBg}>
                          <View style={[s.progressBarFill, { width: `${percent}%` }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={s.emptyGrid}>
                  <Feather name="activity" size={40} color={theme.border} />
                  <Text style={s.emptyGridText}>No matrix data</Text>
                </View>
              )}

              {/* Stack */}
              <View style={s.stackWrap}>
                <Text style={s.stackHeader}>STACK</Text>
                {activeProfile?.skills && activeProfile.skills.length > 0 ? (
                  <VerifiedSkillsSection
                    skills={activeProfile.skills}
                    verifiedSkills={verifiedSkills}
                    onSkillPress={(skill: string) => {
                      router.push(`/skill/${skill}` as any);
                    }}
                  />
                ) : (
                  <View style={s.stackGrid}>
                    {['React Native', 'TypeScript', 'Node.js', 'Python'].map((u: string, i: number) => (
                      <View key={i} style={s.pillDark}>
                        <Text style={s.pillTxtDark}>{u}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

      </ScrollView>

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
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg }, 
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', paddingTop: 10, marginBottom: 10, alignItems: 'center' },
  themeToggleRow: { flexDirection: 'row', alignItems: 'center' },
  themeIcon: { marginRight: 8, fontSize: 16 },
  settingsBtn: { padding: 8 },
  identity: { alignItems: 'flex-start' },
  avatar: { marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  nameText: { color: theme.textPrimary, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  handleText: { color: theme.textSecondary, fontSize: 16, fontWeight: '500', marginBottom: 12 },
  bioText: { color: theme.textMuted, fontSize: 15, lineHeight: 22, maxWidth: '90%', marginBottom: 20 },
  campusSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    width: '100%', 
    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.05)', 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: theme.border, 
    marginBottom: 24 
  },
  campusInfo: { flex: 1 },
  campusLabel: { color: theme.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  campusValue: { color: theme.textPrimary, fontSize: 14, fontWeight: '600' },
  socialRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  socialPillGitHub: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    gap: 6,
    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.05)'
  },
  socialPillLinkedIn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    gap: 6,
    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.05)'
  },
  socialText: { fontSize: 13, fontWeight: '600' },
  statsBox: { flexDirection: 'row', backgroundColor: theme.bgCard, borderRadius: 16, paddingVertical: 18, marginBottom: 24, borderWidth: 1, borderColor: theme.border },
  statItem: { flex: 1, alignItems: 'center' },
  statSep: { width: 1, height: '60%', backgroundColor: theme.border, alignSelf: 'center' },
  statVal: { color: theme.textPrimary, fontSize: 18, fontWeight: '800' },
  statLab: { color: theme.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginTop: 4 },
  profileActionsGrid: { flexDirection: 'row', gap: 10, marginBottom: 40 },
  actionBtnHalf: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    backgroundColor: theme.bgInput, 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: theme.border 
  },
  actionBtnHighlight: { 
    flex: 1.2, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    backgroundColor: theme.purple, 
    paddingVertical: 12, 
    borderRadius: 12, 
    ...Shadows.soft 
  },
  actionBtnText: { color: theme.purple, fontSize: 13, fontWeight: '700' },
  actionBtnTextWhite: { color: isDark ? '#000' : '#FFF', fontSize: 13, fontWeight: '700' },
  stackWrap: { marginTop: 0 },
  stackHeader: { color: theme.textSecondary, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  stackGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pillDark: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, backgroundColor: theme.bgInput, borderColor: theme.border },
  pillTxtDark: { color: theme.textSecondary, fontWeight: '700', fontSize: 13 },
  learningSection: { marginBottom: 30, backgroundColor: theme.bgCard, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.border },
  progressRow: { marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressTopic: { color: theme.textPrimary, fontSize: 14, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  progressPercent: { color: theme.green, fontSize: 14, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  progressBarBg: { height: 8, backgroundColor: theme.bgInput, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.green, borderRadius: 4 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: theme.border, marginTop: 20 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 15, borderBottomWidth: 2, borderBottomColor: 'transparent', gap: 4 },
  tabItemActive: { borderBottomColor: theme.purple },
  tabLabelText: { fontSize: 9, fontWeight: '800', color: theme.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 },
  tabLabelActive: { color: theme.purple },
  tabContent: { marginTop: 2 },
  emptyGrid: { width: '100%', paddingVertical: 60, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyGridText: { color: theme.textSecondary, fontSize: 12, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  projectList: { gap: 12 },
  connectGithubBtn: { marginTop: 16, backgroundColor: theme.purple, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  connectGithubBtnText: { color: isDark ? '#000' : '#fff', fontSize: 13, fontWeight: '700' },
  reAuthCard: { 
    backgroundColor: theme.bgCard, 
    borderRadius: 20, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: theme.border, 
    marginBottom: 20, 
    ...Shadows.soft 
  },
  reAuthIconHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  reAuthTitle: { color: theme.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 10 },
  reAuthSubtitle: { color: theme.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 20 },
  reAuthAction: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.purple, paddingVertical: 12, borderRadius: 12 },
  reAuthActionText: { color: isDark ? '#000' : '#fff', fontSize: 14, fontWeight: '700' },
  reAuthActionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  disconnectMiniBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,59,48,0.1)', borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)' },
  disconnectMiniText: { color: theme.red, fontSize: 13, fontWeight: '600' },
  postList: { gap: Spacing.lg, marginTop: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { flex: 0.75, backgroundColor: theme.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: theme.border },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  modalTitle: { color: theme.textPrimary, fontSize: 22, fontWeight: '900', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  modalSub: { color: theme.purple, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1, marginTop: 2 },
  modalCloseBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.05)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: theme.border 
  },
  modalDivider: { height: 1, backgroundColor: theme.border },
  followerList: { padding: 16, gap: 12 },
  followerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bgCard, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.border, gap: 12 },
  followerInfo: { flex: 1 },
  followerName: { color: theme.textPrimary, fontSize: 15, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  followerBio: { color: theme.textSecondary, fontSize: 12, marginTop: 3, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
