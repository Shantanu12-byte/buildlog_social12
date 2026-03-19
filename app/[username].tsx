import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, Linking,
  RefreshControl, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, Radius, getAvatarColor, getInitials } from '@/constants/theme';
import { Avatar, LoadingScreen } from '@/components/ui/UI';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

// ─── Constants & Colors ─────────────────────────────────────────
const PROFILE_BG = '#0A0A0A'; // Deep cyber black
const CARD_BG = '#111111';    // Slate cyber
const ACCENT_PURPLE = '#5D3FD3'; 

export default function PublicProfileScreen() {
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();
  
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    projects: 0,
    builds: 0,
    followers: 0,
    hypes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!username) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Fetch Profile by Username
      const { data: prof, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      
      if (pErr || !prof) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(prof);
      if (user?.id === prof.id) setIsOwner(true);

      // 2. Fetch Stats
      const [projRes, buildsRes, followersRes, hypesRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', prof.id),
        supabase.from('quest_logs').select('id', { count: 'exact', head: true }).eq('user_id', prof.id),
        supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', prof.id),
        supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_owner_id', prof.id),
      ]);

      setStats({
        projects: projRes.count || 0,
        builds: buildsRes.count || 0,
        followers: followersRes.count || 0,
        hypes: hypesRes.count || 0,
      });
    } catch (err: any) {
      console.error('Error fetching public profile:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  if (loading) return <LoadingScreen />;

  if (notFound) {
    return (
      <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Feather name="user-x" size={64} color="rgba(255,255,255,0.1)" />
        <Text style={s.notFoundTitle}>User Not Found</Text>
        <Text style={s.notFoundSub}>The developer handle @{username} doesn't exist in our logs.</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
        {/* Top Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>@{profile?.username}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Profile Card */}
        <View style={s.profileCard}>
          <Avatar 
            username={profile?.username || ''} 
            size={80} 
          />
          <Text style={s.name}>{profile?.username}</Text>
          <Text style={s.bio}>{profile?.bio || 'Building the future of software.'}</Text>
          
          {profile?.college && (
            <View style={s.collegeTag}>
              <Text style={s.collegeTxt}>🎓 {profile.college}</Text>
            </View>
          )}

          <View style={s.statsRow}>
            <StatItem label="Projects" value={stats.projects} />
            <StatItem label="Builds" value={stats.builds} />
            <StatItem label="Followers" value={stats.followers} />
            <StatItem label="⚡ Hypes" value={stats.hypes} />
          </View>

          {isOwner && (
            <TouchableOpacity 
              style={s.editBtn} 
              onPress={() => router.push('/(stack)/edit-profile')}
            >
              <Text style={s.editBtnTxt}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Links */}
        <View style={s.linksSection}>
          <Text style={s.sectionTitle}>CONNECT</Text>
          <View style={s.linksRow}>
            {profile?.github_url && (
              <SocialBtn icon="github" onPress={() => Linking.openURL(profile.github_url)} />
            )}
            {profile?.linkedin_url && (
              <SocialBtn icon="linkedin" onPress={() => Linking.openURL(profile.linkedin_url)} />
            )}
            <SocialBtn 
              icon="id-card" 
              label="DevCard"
              onPress={() => router.push(`/devcard?username=${username}`)} 
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.statItem}>
      <Text style={s.statVal}>{value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}</Text>
      <Text style={s.statLab}>{label}</Text>
    </View>
  );
}

function SocialBtn({ icon, onPress, label }: { icon: string; onPress: () => void; label?: string }) {
  return (
    <TouchableOpacity style={s.socialBtn} onPress={onPress}>
      {icon === 'id-card' ? (
        <FontAwesome5 name={icon} size={18} color="#FFF" />
      ) : (
        <Feather name={icon as any} size={18} color="#FFF" />
      )}
      {label && <Text style={s.socialBtnLab}>{label}</Text>}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PROFILE_BG },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 20, marginBottom: 30,
  },
  iconBtn: { padding: 8 },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', opacity: 0.8 },
  
  profileCard: {
    backgroundColor: CARD_BG, borderRadius: 24, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  name: { color: '#FFF', fontSize: 24, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  bio: { color: '#AAA', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  collegeTag: { backgroundColor: 'rgba(93, 63, 211, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 20 },
  collegeTxt: { color: ACCENT_PURPLE, fontSize: 12, fontWeight: '700' },
  
  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 20 },
  statItem: { alignItems: 'center' },
  statVal: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  statLab: { color: '#666', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },
  
  editBtn: { backgroundColor: ACCENT_PURPLE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 20 },
  editBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  linksSection: { marginTop: 30 },
  sectionTitle: { color: '#444', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 16 },
  linksRow: { flexDirection: 'row', gap: 12 },
  socialBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1A1A1A', paddingHorizontal: 16, paddingVertical: 12, 
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' 
  },
  socialBtnLab: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  notFoundTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginTop: 20 },
  notFoundSub: { color: '#666', fontSize: 14, marginTop: 10, textAlign: 'center', paddingHorizontal: 40 },
  backBtn: { marginTop: 30, backgroundColor: '#333', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { color: '#FFF', fontWeight: '700' },
});
