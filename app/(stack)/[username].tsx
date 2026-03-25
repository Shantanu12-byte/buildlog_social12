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
    forks: 0,
    stars: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [insight, setInsight] = useState('');

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const fetchProfileData = useCallback(async () => {
    if (!username) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // ── Try consolidated backend API first (cached, single call) ──
      let apiSuccess = false;
      try {
        const res = await fetch(`${BACKEND_URL}/api/user/profile/${username}`);
        if (res.ok) {
          const payload = await res.json();
          setProfile(payload.user);
          setStats({
            projects: payload.stats.projects.value,
            builds: payload.stats.builds.value,
            followers: payload.stats.followers.value,
            hypes: payload.stats.hypes.value,
            forks: payload.stats.forks.value,
            stars: payload.stats.stars.value,
          });
          setBadges(payload.badges || []);
          setPortfolio(payload.portfolio || []);
          setInsight(payload.insight || '');

          if (user?.id === payload.user.id) {
            setIsOwner(true);
          } else if (user?.id) {
            const { data: followData } = await supabase
              .from('followers')
              .select('id')
              .eq('follower_id', user.id)
              .eq('following_id', payload.user.id)
              .maybeSingle();
            setIsFollowing(!!followData);
          }
          apiSuccess = true;
        } else if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
      } catch {
        // Backend unavailable — fall through to direct Supabase
      }

      // ── Fallback: direct Supabase queries ──
      if (!apiSuccess) {
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
        if (user?.id === prof.id) {
          setIsOwner(true);
        } else if (user?.id) {
          const { data: followData } = await supabase
            .from('followers')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', prof.id)
            .maybeSingle();
          setIsFollowing(!!followData);
        }

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
          forks: prof?.fork_count || 0,
          stars: prof?.star_count || 0,
        });
      }
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

  const handleFollowToggle = async () => {
    if (followLoading || !profile) return;
    setFollowLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/(auth)/login');
        return;
      }

      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id);
        
        if (!error) {
          setIsFollowing(false);
          setStats(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
        }
      } else {
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: profile.id
          });
        
        if (!error) {
          setIsFollowing(true);
          setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
          
          // Create a notification for the followed user
          await supabase.from('notifications').insert({
            user_id: profile.id,
            type: 'follow',
            title: 'New Recruiter',
            content: `@${user.user_metadata?.username || 'Someone'} is now tracking your builds.`,
            sender_id: user.id,
            metadata: { username: user.user_metadata?.username }
          });

          // Trigger Web Push Notification
          if (Platform.OS === 'web') {
            fetch(`${BACKEND_URL}/api/user/push/notify/follow`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                targetUserId: profile.id,
                followerUsername: user.user_metadata?.username || 'Someone',
              }),
            }).catch(e => console.error('Push Notify Error (Follow):', e));
          }
        }
      }
    } catch (err) {
      console.error('Follow Toggle Error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

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
            uri={profile?.avatar_url}
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
            <StatItem label="⑂ Forks" value={stats.forks} />
            <StatItem label="★ Stars" value={stats.stars} />
          </View>

          {/* Badges */}
          {badges.length > 0 && (
            <View style={s.badgesSection}>
              {badges.map((b: any) => (
                <View key={b.id} style={s.badgeChip}>
                  <Text style={s.badgeIcon}>{b.icon}</Text>
                  <Text style={s.badgeLabel}>{b.label}</Text>
                  {b.tier && <Text style={s.badgeTier}>{b.tier.toUpperCase()}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Insight */}
          {insight !== '' && (
            <Text style={s.insightText}>{insight}</Text>
          )}

          {isOwner ? (
            <TouchableOpacity 
              style={s.editBtn} 
              onPress={() => router.push('/(stack)/edit-profile')}
            >
              <Text style={s.editBtnTxt}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.actionRow}>
              <TouchableOpacity 
                style={[s.followBtn, isFollowing && s.followingBtn]} 
                onPress={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Feather name={isFollowing ? "check" : "user-plus"} size={16} color="#FFF" />
                    <Text style={s.editBtnTxt}>{isFollowing ? 'Following' : 'Follow'}</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={s.msgBtn} 
                onPress={() => router.push({ pathname: '/(stack)/messages', params: { targetUserId: profile.id } } as any)}
              >
                <Feather name="message-square" size={16} color="#FFF" />
                <Text style={s.editBtnTxt}>Message</Text>
              </TouchableOpacity>
            </View>
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

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
  followBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: ACCENT_PURPLE, paddingVertical: 12, borderRadius: 14 
  },
  followingBtn: { backgroundColor: '#333' },
  msgBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1A1A1A', paddingVertical: 12, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },

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

  // Badges
  badgesSection: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  badgeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(93, 63, 211, 0.1)', borderWidth: 1,
    borderColor: 'rgba(93, 63, 211, 0.25)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeIcon: { fontSize: 14 },
  badgeLabel: { color: ACCENT_PURPLE, fontSize: 11, fontWeight: '700' },
  badgeTier: { color: '#666', fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginLeft: 2 },

  // Insight
  insightText: { color: '#888', fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: 12, paddingHorizontal: 10, lineHeight: 18 },
});
