import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { supabase } from '@/lib/supabase';
import { Spacing } from '@/constants/theme';
import { PublicBentoProfile } from '@/components/PublicBentoProfile';
import { LoadingScreen } from '@/components/ui/UI';
import { useTheme } from '@/context/ThemeContext';

export default function PublicProfilePage() {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const { username } = useLocalSearchParams<{ username: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [pinnedProject, setPinnedProject] = useState<any>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchPublicData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch Profile
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .eq('is_public', true)
          .maybeSingle();

        if (profileErr) throw profileErr;
        if (!profileData) {
          setError('PROFILE_NOT_FOUND');
          setLoading(false);
          return;
        }

        setProfile(profileData);

        // 2. Fetch Pinned Project & Recent Posts in parallel
        const [projectsRes, postsRes] = await Promise.all([
          supabase
            .from('projects')
            .select('*')
            .eq('user_id', profileData.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('posts')
            .select('*')
            .eq('user_id', profileData.id)
            .order('created_at', { ascending: false })
            .limit(3)
        ]);

        if (projectsRes.data) setPinnedProject(projectsRes.data);
        if (postsRes.data) setRecentPosts(postsRes.data);

      } catch (err: any) { setError('FETCH_ERROR');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, [username]);

  if (loading) return <LoadingScreen />;

  if (error === 'PROFILE_NOT_FOUND' || !profile) {
    return (
      <View style={s.center}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        <Text style={s.errorText}>404</Text>
        <Text style={s.errorSubText}>Builder "@ {username}" not found or profile is private.</Text>
      </View>
    );
  }

  const name = profile.full_name || profile.username || 'Builder';
  const bio = profile.bio || 'Building the future, one core at a time.';
  const streak = profile.streak_count || 0;
  const avatarUrl = profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}&background=0D1117&color=fff`;

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          title: `${name} | Buildlog`,
        }}
      />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      {Platform.OS === 'web' && (
        <Head>
          <title>{name} | Buildlog</title>
          <meta property="og:title" content={`${name} | Buildlog`} />
          <meta property="og:description" content={`${bio} | 🔥 ${streak} day streak`} />
          <meta property="og:image" content={avatarUrl} />
          <meta name="twitter:card" content="summary_large_image" />
        </Head>
      )}
      
      <SafeAreaView style={s.container}>
        <PublicBentoProfile 
          user={profile}
          pinnedProject={pinnedProject}
          recentPosts={recentPosts}
        />
      </SafeAreaView>
    </>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  center: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    color: theme.purple,
    fontSize: 64,
    fontWeight: '900',
    marginBottom: Spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorSubText: {
    color: theme.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 300,
    fontWeight: '600',
  },
});
