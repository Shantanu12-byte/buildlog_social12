import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, Alert, Linking,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Avatar, LoadingScreen } from '@/components/ui/UI';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { VerifiedSkillsSection, SkillLevel } from '@/components/VerifiedSkillChip';

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
      const [projRes, buildsRes, followingRes, followersRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('quest_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('followers').select('id', { count: 'exact', head: true }).eq('follower_id', user.id),
        supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', user.id),
      ]);

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
          <Avatar username={username} size={90} style={s.avatar} />
          <Text style={s.nameText}>{username}</Text>
          <Text style={s.handleText}>@{username.toLowerCase()}</Text>
          
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
        </View>

        {/* High-Fi Stats Grid */}
        <View style={s.statsBox}>
          <View style={s.statItem}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <FontAwesome5 name="fire-alt" size={16} color="#FF5F1F" />
              <Text style={s.statVal}>{stats.streak}</Text>
            </View>
            <Text style={s.statLab}>Days</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{stats.projects}</Text>
            <Text style={s.statLab}>Projects</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{stats.followers}</Text>
            <Text style={s.statLab}>Followers</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{Math.floor(stats.timeSpent / 60)}h {stats.timeSpent % 60}m</Text>
            <Text style={s.statLab}>Learning</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.btnPrimary} onPress={() => router.push('/(stack)/create-project')}>
            <Text style={s.btnTextPrimary}>+ New Post</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={() => router.push('/(stack)/create-project')}>
            <Text style={s.btnTextSecondary}>+ New Project</Text>
          </TouchableOpacity>
        </View>

        <View style={s.profileActions}>
          <TouchableOpacity style={s.editLink} onPress={() => router.push('/(stack)/edit-profile')}>
            <Text style={s.editText}>Edit Profile</Text>
          </TouchableOpacity>
          <View style={s.dotSep} />
          <TouchableOpacity style={s.shareDevBtn} onPress={() => router.push('/devcard')}>
            <FontAwesome5 name="id-card" size={16} color={ACCENT_PURPLE} />
            <Text style={s.shareDevTxt}>Share Card</Text>
          </TouchableOpacity>
        </View>

        {/* Learning Progress Section */}
        {Object.keys(learningStats).length > 0 && (
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
  socialRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  socialPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  socialText: { fontSize: 13, fontWeight: '600' },
  statsBox: { flexDirection: 'row', backgroundColor: CARD_BG, borderRadius: 16, paddingVertical: 18, marginBottom: 24, borderWidth: 1, borderColor: '#222' },
  statItem: { flex: 1, alignItems: 'center' },
  statSep: { width: 1, height: '60%', backgroundColor: '#333', alignSelf: 'center' },
  statVal: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  statLab: { color: '#888', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  btnPrimary: { flex: 1, backgroundColor: ACCENT_PURPLE, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  btnTextPrimary: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  btnSecondary: { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#333', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  btnTextSecondary: { color: '#FFF', fontSize: 15, fontWeight: '700' },
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

});
