import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, Linking,
  RefreshControl, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Avatar, LoadingScreen } from '@/components/ui/UI';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/useResponsive';
import { DesktopLayout } from '@/components/ui/DesktopLayout';

export default function PublicProfileScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { isDesktop } = useResponsive();
  const s = React.useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

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

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://buildlog-social12.onrender.com';

  const fetchProfileData = useCallback(async () => {
    if (!username) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let apiSuccess = false;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch(`${BACKEND_URL}/api/user/profile/${username}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
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
        // Fallback to direct Supabase
      }

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
        
        // Single-hit consolidated stats fetch via Postgres RPC
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_profile_stats', { 
          user_id_param: prof.id 
        });

        if (rpcError) {
          console.warn('[username] RPC fallback failed:', rpcError);
        }

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

        setStats({
          projects: rpcData?.projects_count || 0,
          builds: rpcData?.builds_count || 0,
          followers: rpcData?.followers_count || 0,
          hypes: rpcData?.hypes_count || 0,
          forks: prof?.fork_count || 0,
          stars: prof?.star_count || 0,
        });
        setPortfolio(rpcData?.posts || []);
      }
    } catch (err: any) { } finally {
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
          
          await supabase.from('notifications').insert({
            user_id: profile.id,
            type: 'follow',
            title: 'New Recruiter',
            content: `@${user.user_metadata?.username || 'Someone'} is now tracking your builds.`,
            sender_id: user.id,
            metadata: { username: user.user_metadata?.username }
          });

          // 🔔 Trigger Push Notification (Backend handles platform routing)
          const { data: { session: notificationSession } } = await supabase.auth.getSession();
          const notificationToken = notificationSession?.access_token;

          fetch(`${BACKEND_URL}/api/user/push/notify/follow`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${notificationToken}`
            },
            body: JSON.stringify({
              targetUserId: profile.id,
              followerUsername: user.user_metadata?.username || 'Someone',
            }),
          }).catch(() => {});
        }
      }
    } catch (err) { } finally {
      setFollowLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
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

  if (showSkeleton && !refreshing) return <LoadingScreen type="profile" />;

  if (notFound) {
    return (
      <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Feather name="user-x" size={64} color={theme.textMuted} />
        <Text style={s.notFoundTitle}>User Not Found</Text>
        <Text style={s.notFoundSub}>The developer handle @{username} doesn't exist in our logs.</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const renderProfileSidebar = () => (
    <View style={isDesktop ? s.desktopSidebar : undefined}>
      <View style={s.profileCard}>
        <Avatar 
          username={profile?.username || ''} 
          uri={profile?.avatar_url}
          size={isDesktop ? 120 : 80} 
        />
        <Text style={s.name}>{profile?.username}</Text>
        <Text style={s.bio}>{profile?.bio || 'Building the future of software.'}</Text>
        
        {profile?.college && (
          <View style={s.collegeTag}>
            <Text style={s.collegeTxt}>🎓 {profile.college}</Text>
          </View>
        )}

        <View style={s.statsRow}>
          <View style={s.statsGrid}>
            <StatItem label="Projects" value={stats.projects} />
            <StatItem label="Builds" value={stats.builds} />
            <StatItem label="Followers" value={stats.followers} />
            <StatItem label="XP" value={profile?.xp || 0} />
          </View>
        </View>

        {badges.length > 0 && (
          <View style={s.badgesSection}>
            {badges.map((b: any) => (
              <View key={b.id} style={s.badgeChip}>
                <Text style={s.badgeIcon}>{b.icon}</Text>
                <Text style={s.badgeLabel}>{b.label}</Text>
              </View>
            ))}
          </View>
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
                <ActivityIndicator size="small" color={isDark ? "#000" : "#FFF"} />
              ) : (
                <Text style={[s.editBtnTxt, { color: isFollowing ? theme.textPrimary : (isDark ? "#000" : "#FFF") }]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={s.linksSection}>
        <Text style={s.sectionTitle}>CONNECT</Text>
        <View style={s.linksRow}>
          {profile?.github_url && <SocialBtn icon="github" onPress={() => Linking.openURL(profile.github_url)} />}
          {profile?.linkedin_url && <SocialBtn icon="linkedin" onPress={() => Linking.openURL(profile.linkedin_url)} />}
        </View>
      </View>
    </View>
  );

  const renderProfileContent = () => (
    <View style={isDesktop ? s.desktopMain : undefined}>
      {insight !== '' && (
        <View style={s.insightCard}>
          <Text style={s.sectionTitle}>DEVELOPER INSIGHT</Text>
          <Text style={s.insightText}>{insight}</Text>
        </View>
      )}

      <View style={s.portfolioSection}>
        <Text style={s.sectionTitle}>BUILD HISTORY</Text>
        {portfolio.length > 0 ? (
          <View style={s.repoGrid}>
            {portfolio.map((repo: any) => (
              <TouchableOpacity 
                key={repo.id} 
                style={s.repoCard}
                onPress={() => repo.html_url && Linking.openURL(repo.html_url)}
              >
                <View style={s.repoHeader}>
                  <Feather name="box" size={18} color={theme.purple} />
                  <Text style={s.repoName}>{repo.name}</Text>
                </View>
                <Text style={s.repoDesc} numberOfLines={2}>{repo.description || 'No description provided.'}</Text>
                <View style={s.repoFooter}>
                  <Text style={s.repoLang}>● {repo.language || 'Code'}</Text>
                  <Text style={s.repoStars}>★ {repo.stargazers_count || 0}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={s.emptyState}>
            <Feather name="package" size={48} color={theme.border} />
            <Text style={s.emptyText}>No builds documented yet.</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <DesktopLayout>
      <SafeAreaView style={s.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        
        {isDesktop ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.desktopLayout}>
            {renderProfileSidebar()}
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
            <View style={s.mobileHeader}>
              <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
                <Feather name="arrow-left" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={s.headerTitle}>@{profile?.username}</Text>
              <View style={{ width: 40 }} />
            </View>
            {renderProfileSidebar()}
            {renderProfileContent()}
          </ScrollView>
        )}
      </SafeAreaView>
    </DesktopLayout>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  const { theme, isDark } = useTheme();
  const { isDesktop } = useResponsive();
  const s = React.useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);
  return (
    <View style={s.statItem}>
      <Text style={s.statVal}>{value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}</Text>
      <Text style={s.statLab}>{label}</Text>
    </View>
  );
}

function SocialBtn({ icon, onPress, label }: { icon: string; onPress: () => void; label?: string }) {
  const { theme, isDark } = useTheme();
  const { isDesktop } = useResponsive();
  const s = React.useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);
  return (
    <TouchableOpacity style={s.socialBtn} onPress={onPress}>
      {icon === 'id-card' ? (
        <FontAwesome5 name={icon} size={18} color={theme.textPrimary} />
      ) : (
        <Feather name={icon as any} size={18} color={theme.textPrimary} />
      )}
      {label && <Text style={s.socialBtnLab}>{label}</Text>}
    </TouchableOpacity>
  );
}

function getStyles(theme: any, isDark: boolean, isDesktop?: boolean) {
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
    content: { paddingBottom: 40 },
    
    // Desktop Layout
    desktopLayout: {
      flexDirection: 'row',
      gap: 32,
      padding: 32,
      maxWidth: 1200,
      alignSelf: 'center',
      width: '100%',
    },
    desktopSidebar: {
      width: 380,
      ...(Platform.OS === 'web' && {
        position: 'sticky' as any,
        top: 32,
      })
    },
    desktopMain: {
      flex: 1,
      gap: 24,
    },

    mobileHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 20, marginBottom: 20,
    },
    iconBtn: { padding: 8 },
    headerTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: '700', opacity: 0.8 },
    
    profileCard: {
      backgroundColor: bgCard, borderRadius: 24, padding: 32,
      alignItems: 'center', borderWidth: 1, borderColor: border,
      ...shadow
    },
    name: { color: theme.textPrimary, fontSize: 28, fontWeight: '800', marginTop: 16, marginBottom: 8 },
    bio: { color: theme.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 20 },
    collegeTag: { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.05)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginBottom: 24 },
    collegeTxt: { color: theme.purple, fontSize: 13, fontWeight: '700' },
    
    statsRow: { width: '100%', borderTopWidth: 1, borderTopColor: border, paddingTop: 24 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center' },
    statItem: { alignItems: 'center', minWidth: 70 },
    statVal: { color: theme.textPrimary, fontSize: 20, fontWeight: '800' },
    statLab: { color: theme.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },
    
    editBtn: { backgroundColor: theme.purple, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 24, width: '100%', alignItems: 'center' },
    editBtnTxt: { color: '#ffffff', fontSize: 15, fontWeight: '800' },

    actionRow: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
    followBtn: { flex: 1, backgroundColor: theme.purple, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    followingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.purple },

    insightCard: { backgroundColor: bgCard, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: border, ...shadow },
    insightText: { color: theme.textSecondary, fontSize: 15, lineHeight: 26, fontStyle: 'italic' },

    portfolioSection: { gap: 16 },
    sectionTitle: { color: theme.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
    repoGrid: { gap: 16 },
    repoCard: { backgroundColor: bgCard, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: border, ...shadow },
    repoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    repoName: { color: theme.textPrimary, fontSize: 18, fontWeight: '700' },
    repoDesc: { color: theme.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 16 },
    repoFooter: { flexDirection: 'row', gap: 16 },
    repoLang: { color: theme.textSecondary, fontSize: 12, fontWeight: '600' },
    repoStars: { color: theme.textSecondary, fontSize: 12, fontWeight: '600' },

    linksSection: { marginTop: 32, paddingHorizontal: isDesktop ? 0 : 20 },
    linksRow: { flexDirection: 'row', gap: 12 },
    socialBtn: { backgroundColor: bgCard, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: border, ...shadow, flexDirection: 'row', alignItems: 'center', gap: 8 },
    socialBtnLab: { color: theme.textPrimary, fontSize: 13, fontWeight: '600' },

    emptyState: { alignItems: 'center', paddingVertical: 60, opacity: 0.5 },
    emptyText: { color: theme.textSecondary, marginTop: 12, fontWeight: '600' },

    badgesSection: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20, justifyContent: 'center' },
    badgeChip: { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.05)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center' },
    badgeIcon: { fontSize: 16 },
    badgeLabel: { color: theme.purple, fontSize: 12, fontWeight: '700', marginLeft: 4 },

    notFoundTitle: { color: theme.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 20 },
    notFoundSub: { color: theme.textSecondary, fontSize: 14, marginTop: 10, textAlign: 'center', paddingHorizontal: 40 },
    backBtn: { marginTop: 30, backgroundColor: theme.bgInput, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    backBtnText: { color: theme.textPrimary, fontWeight: '700' },
  });
}
