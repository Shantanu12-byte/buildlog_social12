import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, Alert, Linking,
  RefreshControl, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Avatar, LoadingScreen } from '@/components/ui/UI';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { VerifiedSkillsSection, SkillLevel } from '@/components/VerifiedSkillChip';
import { fetchUserProjects, GitHubProject } from '@/services/githubPortfolio';

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
  const [activeTab, setActiveTab] = useState<'posts' | 'projects' | 'matrix'>('posts');

  const fetchProfileData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      // 1. Fetch Profile
      const { data: prof, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!pErr) {
        setProfile(prof);
        if (prof.verified_skills) {
          setVerifiedSkills(prof.verified_skills);
        }
      }

      // 2. Fetch Stats
      const [projRes, buildsRes, followingRes, followersRes, postsRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('quest_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('followers').select('id', { count: 'exact', head: true }).eq('follower_id', user.id),
        supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      ]);

      if (postsRes.data) {
        setPosts(postsRes.data);
      }

      // 4. Local Persistence (Flame Streak & Time)
      let streakStr = await AsyncStorage.getItem('daily_streak');
      let timeStr = await AsyncStorage.getItem('total_time_spent');
      
      // Mock initialization if empty, just like Android defaults
      if (!streakStr) {
          await AsyncStorage.setItem('daily_streak', '3');
          streakStr = '3';
      }
      if (!timeStr) {
          await AsyncStorage.setItem('total_time_spent', '145'); // 145 mins
          timeStr = '145';
      }

      setStats({
        projects: projRes.count || 0,
        builds: buildsRes.count || 0,
        followers: followersRes.count || 0,
        collabs: 3, 
        streak: parseInt(streakStr, 10),
        timeSpent: parseInt(timeStr, 10)
      });

      // 3. Fetch Learning Stats (Local AsyncStorage)
      const allKeys = await AsyncStorage.getAllKeys();
      const progressKeys = allKeys.filter(k => k.startsWith('progress_'));
      const progressValues = await AsyncStorage.multiGet(progressKeys);
      
      const statsByTopic: Record<string, { total: number; done: number }> = {};
      const TOPICS = ['HTML', 'CSS', 'Python', 'React', 'Java', 'DSA', 'Web3'];
      
      TOPICS.forEach(topic => {
        let sum = 0;
        let count = 0;
        progressValues.forEach(([key, val]) => {
          if (key.startsWith(`progress_${topic}_`)) {
            sum += val ? parseInt(val, 10) : 0;
            count++;
          }
        });
        // We always show the average across 3 levels (even if not started)
        const avg = Math.round(sum / 3);
        if (avg > 0) {
          statsByTopic[topic] = { total: 100, done: avg }; // Using 100 as total for percentage display
        }
      });
      
      setLearningStats(statsByTopic);

      // 5. Fetch GitHub Projects for Automation
      setIsSyncingGithub(true);
      try {
        const repoData = await fetchUserProjects(user.id);
        setGithubProjects(repoData.projects);
      } catch (repoErr) {
        console.log('GitHub sync skipping or failed:', repoErr);
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



  if (loading) return <LoadingScreen />;

  const username = profile?.username || 'builder';

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
          <Avatar username="shantanu" size={90} style={s.avatar} />
          <Text style={s.nameText}>Shantanu</Text>
          <Text style={s.handleText}>@shantanu</Text>
          
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
          <View style={s.statItem}>
            <Text style={s.statVal}>2</Text>
            <Text style={s.statLab}>Followers</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.statItem}>
            <Text style={s.statVal}>2h 25m</Text>
            <Text style={s.statLab}>Learning</Text>
          </View>
        </View>

        {/* Profile Actions */}
        <View style={s.profileActionsGrid}>
          <TouchableOpacity style={s.actionBtnHalf} onPress={() => router.push('/(stack)/edit-profile')}>
            <Feather name="edit-2" size={16} color={ACCENT_PURPLE} />
            <Text style={s.actionBtnText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtnHalf} onPress={() => router.push('/devcard')}>
            <FontAwesome5 name="id-card" size={16} color={ACCENT_PURPLE} />
            <Text style={s.actionBtnText}>Share Card</Text>
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
            <View style={s.grid}>
              {posts.length > 0 ? (
                posts.map((post) => (
                  <TouchableOpacity 
                    key={post.id} 
                    style={s.gridItem}
                    onPress={() => router.push(`/post/${post.id}` as any)}
                  >
                    {post.image_url ? (
                      <Image 
                        source={{ uri: post.image_url }} 
                        style={s.gridImage} 
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={s.gridTextPlaceholder}>
                        <Text style={s.gridInitial}>{post.project_name?.charAt(0) || 'B'}</Text>
                        <Text style={s.gridProjectName} numberOfLines={1}>{post.project_name || 'Build'}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
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
              {githubProjects.length > 0 ? (
                githubProjects.map((repo) => (
                  <TouchableOpacity 
                    key={repo.id} 
                    style={s.repoCard}
                    onPress={() => Linking.openURL(repo.url)}
                  >
                    <View style={s.repoHeader}>
                      <FontAwesome5 name="github" size={24} color="#FFF" />
                      <View style={s.repoTitleArea}>
                        <Text style={s.repoName}>{repo.name}</Text>
                        <View style={s.langBadge}>
                          <Text style={s.langText}>{repo.language}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={s.repoDesc} numberOfLines={2}>
                      {repo.description}
                    </Text>
                    <View style={s.repoFooter}>
                      <Text style={s.repoCallToAction}>View Source on GitHub →</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={s.emptyGrid}>
                  {isSyncingGithub ? (
                    <ActivityIndicator color={ACCENT_PURPLE} />
                  ) : (
                    <>
                      <FontAwesome5 name="github" size={40} color="#222" />
                      <Text style={s.emptyGridText}>GitHub projects not imported</Text>
                      <TouchableOpacity 
                        style={s.connectGithubBtn}
                        onPress={() => router.push('/(stack)/connect-github')}
                      >
                        <Text style={s.connectGithubBtnText}>Connect GitHub</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
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
  profileActionsGrid: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  actionBtnHalf: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  actionBtnText: { color: ACCENT_PURPLE, fontSize: 13, fontWeight: '700' },

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
});
