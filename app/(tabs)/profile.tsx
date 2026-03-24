import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, Alert, Linking,
  RefreshControl, Image, Modal, FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { Avatar, LoadingScreen } from '@/components/ui/UI';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { VerifiedSkillsSection, SkillLevel } from '@/components/VerifiedSkillChip';
import { GitHubProject } from '@/services/githubPortfolio';
import { ProfilePortfolioController } from '@/services/ProfilePortfolioController';
import LogEntryFeedItem from '@/components/LogEntryFeedItem';
import { fetchUserProjects } from '@/services/ProfilePersistenceManager';

// ─── Constants & Colors ─────────────────────────────────────────
const PROFILE_BG = '#0F0F0B'; // Premium deep black/brown tint
const CARD_BG = '#1A1A1A';    // Slate dark
const ACCENT_PURPLE = '#5D3FD3'; 

export default function ProfileScreen() {
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ projects: 0, builds: 0, followers: 0, collabs: 0, streak: 0, timeSpent: 0 });
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }
      
      // Initial fallback to metadata to prevent 'builder' flicker
      if (!profile && user.user_metadata?.username) {
        setProfile({ username: user.user_metadata.username });
      }

      // Single Consolidated Query: Profile + Stats + Recent Posts
      // This replaces 7 individual REST calls with 1.
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          posts_count:posts(count),
          builds_count:quest_logs(count),
          following_count:followers!follower_id(count),
          followers_count:followers!following_id(count),
          recent_posts:posts(*)
        `)
        .eq('id', user.id)
        .order('created_at', { foreignTable: 'posts', ascending: false })
        .limit(30, { foreignTable: 'posts' })
        .single();
      
      if (error) throw error;
      
      if (data) {
        setProfile(data);
        if (data.verified_skills) {
          setVerifiedSkills(data.verified_skills);
        }
        setPosts(data.recent_posts || []);
        
        // Map stats from the nested count arrays
        setStats(prev => ({
          ...prev,
          projects: data.posts_count?.[0]?.count || 0,
          builds: data.builds_count?.[0]?.count || 0,
          followers: data.followers_count?.[0]?.count || 0,
          following: data.following_count?.[0]?.count || 0, // Using internal state mapping
          streak: prev.streak, // Preserve local streak
          timeSpent: prev.timeSpent
        }));
      }

      // 4. Local Persistence (Flame Streak & Time)
      let streakStr = await AsyncStorage.getItem('daily_streak');
      let timeStr = await AsyncStorage.getItem('total_time_spent');
      
      if (!streakStr) {
          await AsyncStorage.setItem('daily_streak', '3');
          streakStr = '3';
      }
      if (!timeStr) {
          await AsyncStorage.setItem('total_time_spent', '145');
          timeStr = '145';
      }

      setStats(prev => ({
        ...prev,
        streak: parseInt(streakStr || '3', 10),
        timeSpent: parseInt(timeStr || '145', 10)
      }));

      // 6. Fetch Learning Stats (Local AsyncStorage)
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
        if (avg > 0) {
          statsByTopic[topic] = { total: 100, done: avg };
        }
      });
      setLearningStats(statsByTopic);

      // 5. Check GitHub Status
      setIsSyncingGithub(true);
      try {
        const status = await ProfilePortfolioController.checkGitHubStatus(user.id);
        setGithubStatus(status);
        
        if (status.isConnected && status.hasSufficientScopes) {
          const repoData = await ProfilePortfolioController.loadUserProjects(user.id);
          setGithubProjects(repoData.projects || []);
        }
      } catch (repoErr) {
        console.log('GitHub sync skipping:', repoErr);
      } finally {
        setIsSyncingGithub(false);
      }

    } catch (err: any) {
      console.error('Error fetching profile:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

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
    } catch (err) {
      console.error('Disconnect error:', err);
      Alert.alert('Error', 'Failed to disconnect GitHub.');
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
    } catch (e) {
      console.error('fetchFollowers error:', e);
    } finally {
      setFollowersLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  const userMetadata = profile?.user_metadata || (profile as any)?._user_metadata;
  const displayName = profile?.full_name || userMetadata?.full_name || profile?.username || userMetadata?.username || 'Builder';
  const username = profile?.username || userMetadata?.username || 'builder';

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        style={s.scrollView}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT_PURPLE} />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => router.push('/(stack)/settings')} style={s.settingsBtn}>
            <Feather name="settings" size={22} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Identity */}
        <View style={s.identity}>
          <Avatar 
            username={profile?.username || 'builder'} 
            uri={profile?.avatar_url}
            size={90} 
            style={s.avatar} 
          />
          <Text style={s.nameText}>{displayName}</Text>
          <Text style={s.handleText}>@{username}</Text>
          
          <Text style={s.bioText}>
            {profile?.bio || 'Building the future, one core at a time.'}
          </Text>

          {/* Social Pills */}
          <View style={s.socialRow}>
            <TouchableOpacity 
              style={[s.socialPill, { backgroundColor: 'rgba(93, 63, 211, 0.1)' }]}
              onPress={() => profile?.github_url && Linking.openURL(profile.github_url)}
            >
              <FontAwesome5 name="github" size={14} color={ACCENT_PURPLE} />
              <Text style={[s.socialText, { color: ACCENT_PURPLE }]}>GitHub</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[s.socialPill, { backgroundColor: 'rgba(52, 211, 153, 0.1)' }]}
              onPress={() => profile?.linkedin_url && Linking.openURL(profile.linkedin_url)}
            >
              <FontAwesome5 name="linkedin" size={14} color="#34D399" />
              <Text style={[s.socialText, { color: '#34D399' }]}>LinkedIn</Text>
            </TouchableOpacity>
          </View>

          {/* Campus Badge Section */}
          <View style={s.campusSection}>
            <View style={s.campusInfo}>
              <Text style={s.campusLabel}>CAMPUS</Text>
              <Text style={s.campusValue}>{profile?.campus_name || 'Not Joined'}</Text>
            </View>
          </View>
        </View>

        {/* High-Fi Stats Grid */}
        <View style={s.statsBox}>
          <View style={s.statItem}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <FontAwesome5 name="fire-alt" size={16} color="#FF5F1F" />
              <Text style={s.statVal}>3</Text>
            </View>
            <Text style={s.statLab}>Days</Text>
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
            <Feather name="plus-circle" size={16} color="#FFF" />
            <Text style={s.actionBtnTextWhite}>New Post</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtnHalf} onPress={() => router.push('/(stack)/edit-profile')}>
            <Feather name="edit-2" size={16} color={ACCENT_PURPLE} />
            <Text style={s.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtnHalf} onPress={() => router.push('/devcard')}>
            <FontAwesome5 name="id-card" size={16} color={ACCENT_PURPLE} />
            <Text style={s.actionBtnText}>Card</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Bar */}
        <View style={s.tabBar}>
          <TouchableOpacity 
            style={[s.tabItem, activeTab === 'posts' && s.tabItemActive]} 
            onPress={() => setActiveTab('posts')}
          >
            <Feather name="grid" size={20} color={activeTab === 'posts' ? ACCENT_PURPLE : '#666'} />
            <Text style={[s.tabLabelText, activeTab === 'posts' && s.tabLabelActive]}>POSTS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.tabItem, activeTab === 'projects' && s.tabItemActive]} 
            onPress={() => setActiveTab('projects')}
          >
            <Feather name="folder" size={20} color={activeTab === 'projects' ? ACCENT_PURPLE : '#666'} />
            <Text style={[s.tabLabelText, activeTab === 'projects' && s.tabLabelActive]}>PROJECTS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.tabItem, activeTab === 'matrix' && s.tabItemActive]} 
            onPress={() => setActiveTab('matrix')}
          >
            <Feather name="activity" size={20} color={activeTab === 'matrix' ? ACCENT_PURPLE : '#666'} />
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
                  <Feather name="camera" size={40} color="#222" />
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
                    <FontAwesome5 name="github" size={30} color={ACCENT_PURPLE} />
                    <Feather name="refresh-cw" size={20} color={ACCENT_PURPLE} />
                  </View>
                  <Text style={s.reAuthTitle}>Re-Authorize GitHub</Text>
                  <Text style={s.reAuthSubtitle}>
                    To see private projects or organization work, please refresh your credentials. Your current pass lacks the full 'repo' scope stamp.
                  </Text>
                  <View style={s.reAuthActionRow}>
                    <TouchableOpacity style={s.reAuthAction} onPress={() => router.push('/(stack)/connect-github')}>
                      <Text style={s.reAuthActionText}>Refresh Pass Now</Text>
                      <Feather name="arrow-right" size={16} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.disconnectMiniBtn} onPress={handleDisconnectGithub}>
                      <Text style={s.disconnectMiniText}>Disconnect</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}

              {!githubStatus.isConnected && !isSyncingGithub && (
                <View style={s.emptyGrid}>
                  <FontAwesome5 name="github" size={40} color="#222" />
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
                  <Feather name="folder" size={40} color="#222" />
                  <Text style={s.emptyGridText}>No public projects found</Text>
                </View>
              )}

              {isSyncingGithub && (
                <ActivityIndicator color={ACCENT_PURPLE} style={{ marginVertical: 40 }} />
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
                  <Feather name="activity" size={40} color="#222" />
                  <Text style={s.emptyGridText}>No matrix data</Text>
                </View>
              )}

              {/* Stack */}
              <View style={s.stackWrap}>
                <Text style={s.stackHeader}>STACK</Text>
                {profile?.skills && profile.skills.length > 0 ? (
                  <VerifiedSkillsSection
                    skills={profile.skills}
                    verifiedSkills={verifiedSkills}
                    onSkillPress={(skill: string) => {
                      router.push(`/skill/${skill}` as any);
                    }}
                  />
                ) : (
                  <View style={s.stackGrid}>
                    {['React Native', 'TypeScript', 'Node.js', 'Python'].map((u: string, i: number) => (
                      <View key={i} style={[s.pill, s.pillDark]}>
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
                <Feather name="x" size={22} color={ACCENT_PURPLE} />
              </TouchableOpacity>
            </View>
            <View style={s.modalDivider} />
            {followersLoading ? (
              <ActivityIndicator color={ACCENT_PURPLE} style={{ marginTop: 40 }} />
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
                    <Avatar username={item.username} uri={item.avatar_url} size={44} />
                    <View style={s.followerInfo}>
                      <Text style={s.followerName}>@{item.username}</Text>
                      {item.bio ? <Text style={s.followerBio} numberOfLines={1}>{item.bio}</Text> : null}
                    </View>
                    <Feather name="message-circle" size={18} color={ACCENT_PURPLE} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={s.emptyGrid}>
                    <Feather name="users" size={40} color="#222" />
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PROFILE_BG },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', paddingTop: 10, marginBottom: 10 },
  settingsBtn: { padding: 8 },
  identity: { alignItems: 'flex-start' },
  avatar: { marginBottom: 16, borderWidth: 1, borderColor: '#222' },
  nameText: { color: '#FFF', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  handleText: { color: '#888', fontSize: 16, fontWeight: '500', marginBottom: 12 },
  bioText: { color: '#CCC', fontSize: 15, lineHeight: 22, maxWidth: '90%', marginBottom: 20 },
  campusSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: 'rgba(93, 63, 211, 0.05)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(93, 63, 211, 0.2)', marginBottom: 24 },
  campusInfo: { flex: 1 },
  campusLabel: { color: '#888', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  campusValue: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  campusEditBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6 },
  campusEditTxt: { color: ACCENT_PURPLE, fontSize: 12, fontWeight: '700' },
  socialRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  socialPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  socialText: { fontSize: 13, fontWeight: '600' },
  statsBox: { flexDirection: 'row', backgroundColor: CARD_BG, borderRadius: 16, paddingVertical: 18, marginBottom: 24, borderWidth: 1, borderColor: '#222' },
  statItem: { flex: 1, alignItems: 'center' },
  statSep: { width: 1, height: '60%', backgroundColor: '#333', alignSelf: 'center' },
  statVal: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  statLab: { color: '#888', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginTop: 4 },
  profileActionsGrid: { flexDirection: 'row', gap: 10, marginBottom: 40 },
  actionBtnHalf: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  actionBtnHighlight: { flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: ACCENT_PURPLE, paddingVertical: 12, borderRadius: 12, ...Shadows.soft },
  actionBtnText: { color: ACCENT_PURPLE, fontSize: 13, fontWeight: '700' },
  actionBtnTextWhite: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  profileActions: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 20, marginBottom: 40 },
  editLink: { },
  editText: { color: ACCENT_PURPLE, fontSize: 14, fontWeight: '600' },
  shareDevBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(93, 63, 211, 0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  shareDevTxt: { color: ACCENT_PURPLE, fontSize: 13, fontWeight: '700' },
  dotSep: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  stackWrap: { marginTop: 0 },
  stackHeader: { color: '#666', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  stackGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  pillLight: { backgroundColor: 'rgba(93, 63, 211, 0.08)', borderColor: 'rgba(93, 63, 211, 0.2)' },
  pillTxtLight: { color: '#A5B4FC', fontWeight: '700', fontSize: 13 },
  pillDark: { backgroundColor: '#141414', borderColor: '#333' },
  pillTxtDark: { color: '#888', fontWeight: '700', fontSize: 13 },
  
  learningSection: { marginBottom: 30, backgroundColor: CARD_BG, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#222' },
  progressRow: { marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressTopic: { color: '#FFF', fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  progressPercent: { color: '#1D9E75', fontSize: 14, fontWeight: '900', fontFamily: 'monospace' },
  progressBarBg: { height: 8, backgroundColor: '#111', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#1D9E75', borderRadius: 4 },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#222',
    marginTop: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 4,
  },
  tabItemActive: {
    borderBottomColor: ACCENT_PURPLE,
  },
  tabLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#666',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  tabLabelActive: {
    color: ACCENT_PURPLE,
  },

  // Grid
  tabContent: {
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridItem: {
    width: '32.8%', // 3 columns with small gaps
    aspectRatio: 1,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  gridImage: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  gridTextPlaceholder: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
  },
  gridInitial: {
    color: ACCENT_PURPLE,
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'monospace',
    opacity: 0.5,
  },
  gridProjectName: {
    color: '#444',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  emptyGrid: {
    width: '100%',
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyGridText: {
    color: '#444',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  // Repo List
  projectList: { gap: 12 },
  repoCard: { backgroundColor: '#111', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#222' },
  repoHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 12 },
  repoTitleArea: { flex: 1, gap: 4 },
  repoName: { color: '#FFF', fontSize: 18, fontWeight: '800', fontFamily: 'monospace' },
  langBadge: { backgroundColor: 'rgba(93, 63, 211, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(93, 63, 211, 0.2)' },
  langText: { color: ACCENT_PURPLE, fontSize: 10, fontWeight: '800' },
  repoDesc: { color: '#888', fontSize: 13, lineHeight: 18, marginBottom: 16 },
  repoFooter: { borderTopWidth: 1, borderTopColor: '#222', paddingTop: 12 },
  repoCallToAction: { color: ACCENT_PURPLE, fontSize: 12, fontWeight: '700' },
  connectGithubBtn: { marginTop: 16, backgroundColor: ACCENT_PURPLE, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  connectGithubBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  // Re-Auth Card
  reAuthCard: { backgroundColor: '#1A1A1A', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(93, 63, 211, 0.3)', marginBottom: 20, ...Shadows.soft },
  reAuthIconHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  reAuthTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginBottom: 10 },
  reAuthSubtitle: { color: '#888', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  reAuthAction: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: ACCENT_PURPLE, paddingVertical: 12, borderRadius: 12 },
  reAuthActionText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  reAuthActionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  disconnectMiniBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,59,48,0.1)', borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)' },
  disconnectMiniText: { color: Colors.danger || '#FF3B30', fontSize: 13, fontWeight: '600' },
  postList: { gap: Spacing.lg, marginTop: Spacing.md },
  // Followers Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalSheet: { flex: 0.75, backgroundColor: '#0A0A0A', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: '#1A1A1A' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  modalTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', letterSpacing: 2, fontFamily: 'monospace' },
  modalSub: { color: ACCENT_PURPLE, fontSize: 9, fontFamily: 'monospace', letterSpacing: 1, marginTop: 2 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(93,63,211,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(93,63,211,0.2)' },
  modalDivider: { height: 1, backgroundColor: '#111' },
  followerList: { padding: 16, gap: 12 },
  followerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#1A1A1A', gap: 12 },
  followerInfo: { flex: 1 },
  followerName: { color: '#FFF', fontSize: 15, fontWeight: '700', fontFamily: 'monospace' },
  followerBio: { color: '#555', fontSize: 12, marginTop: 3, fontFamily: 'monospace' },
});
