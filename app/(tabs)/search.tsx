/**
 * app/(tabs)/search.tsx — Explore / Search Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, TextInput, Platform, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { FeedPostCard as PostCard, FeedPost as Post } from '@/components/FeedPostCard';
import { EmptyState, Avatar, LoadingScreen, Tag } from '@/components/ui/UI';
import { Feather } from '@expo/vector-icons';
import { trackPageView } from '@/services/analyticsService';
import { useUserStore } from '@/store/userStore';
import { DesktopLayout } from '@/components/ui/DesktopLayout';
import { useResponsive } from '@/hooks/useResponsive';
import { useLocalSearchParams } from 'expo-router';

interface Developer {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  campus_name?: string;
  skills?: string[];
}

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, isDark } = useTheme();
  const { isDesktop } = useResponsive();
  const s = React.useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'developers' | 'projects'>('developers');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const { userId } = useUserStore();

  useEffect(() => {
    if (userId) {
      trackPageView(userId, 'search');
    }
  }, [userId]);

  // Handle URL query params
  useEffect(() => {
    if (params.q) {
      handleSearch(params.q as string);
    }
  }, [params.q]);

  useEffect(() => {
    fetchTrending();
  }, [activeTab]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowSkeleton(false), 500);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
    }
  }, [loading]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      if (activeTab === 'developers') {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, bio, campus_name, skills')
          .limit(20);
        setDevelopers(data || []);
      } else {
        const { data } = await supabase
          .from('posts_with_profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        setProjects(data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (val: string) => {
    setSearch(val);
    if (val.length < 2) {
      if (val.length === 0) fetchTrending();
      return;
    }

    try {
      if (activeTab === 'developers') {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, bio, campus_name, skills')
          .ilike('username', `%${val}%`)
          .limit(20);
        setDevelopers(data || []);
      } else {
        const { data } = await supabase
          .from('posts_with_profiles')
          .select('*')
          .or(`title.ilike.%${val}%,projectTitle.ilike.%${val}%,caption.ilike.%${val}%`)
          .limit(20);
        setProjects(data || []);
      }
    } catch {
    }
  };

  return (
    <DesktopLayout>
      <SafeAreaView style={s.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        
        {!isDesktop && (
          <View style={s.header}>
            <View style={s.searchBar}>
              <Feather name="search" size={18} color={theme.textMuted} />
              <TextInput
                style={s.input}
                placeholder="Search projects, builders, stacks..."
                placeholderTextColor={theme.textMuted}
                value={search}
                onChangeText={handleSearch}
                autoCapitalize="none"
              />
            </View>
          </View>
        )}

        <View style={s.tabBar}>
          <TouchableOpacity 
            style={[s.tab, activeTab === 'developers' && s.activeTab]}
            onPress={() => setActiveTab('developers')}
          >
            <Text style={[s.tabText, activeTab === 'developers' && s.activeTabText]}>BUILDERS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.tab, activeTab === 'projects' && s.activeTab]}
            onPress={() => setActiveTab('projects')}
          >
            <Text style={[s.tabText, activeTab === 'projects' && s.activeTabText]}>SHIPS</Text>
          </TouchableOpacity>
        </View>

        {showSkeleton ? (
          <LoadingScreen type="search" />
        ) : (
          <FlatList
            data={activeTab === 'developers' ? developers : projects}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              activeTab === 'developers' ? (
                <TouchableOpacity 
                  style={s.devCard}
                  onPress={() => item.username && router.push(`/(stack)/${item.username}` as any)}
                >
                  <Avatar uri={item.avatar_url} username={item.username || '?'} size={50} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.devName}>{item.username || 'Anonymous'}</Text>
                    <Text style={s.devBio} numberOfLines={1}>{item.bio || 'Exploring the frontier'}</Text>
                    <Text style={s.devCollege}>{item.campus_name?.toUpperCase() || 'UNLINKED_ACADEMY'}</Text>
                    <View style={s.skillsRow}>
                      {(item.skills || []).slice(0, 3).map((skill: string, i: number) => (
                        <Tag key={i} label={skill.toUpperCase()} />
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity style={s.msgSmallBtn}>
                    <Feather name="mail" size={16} color={theme.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={s.projectCard}
                  onPress={() => router.push(`/(stack)/post/${item.id}`)}
                >
                   <View style={s.projHeader}>
                      <Avatar uri={item.avatar_url} username={item.username || '?'} size={24} />
                      <Text style={s.projUser}>{item.username || 'Anonymous'}</Text>
                      <View style={s.gravBadge}>
                        <Text style={s.gravText}>PROOF_OF_WORK</Text>
                      </View>
                   </View>
                   <Text style={s.projTitle}>{item.title?.toUpperCase()}</Text>
                   <Text style={s.projCaption} numberOfLines={2}>{item.caption || item.description}</Text>
                   <View style={s.skillsRow}>
                      {(item.tags || []).slice(0, 2).map((tag: string, i: number) => (
                        <Tag key={i} label={tag.toUpperCase()} />
                      ))}
                   </View>
                </TouchableOpacity>
              )
            )}
            ListEmptyComponent={<EmptyState title={`No ${activeTab} found.`} />}
            contentContainerStyle={s.listContent}
          />
        )}
      </SafeAreaView>
    </DesktopLayout>
  );
}

const getStyles = (theme: any, isDark: boolean, isDesktop?: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { padding: Spacing.lg, borderBottomWidth: 0.5, borderBottomColor: theme.border },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgInput,
    paddingHorizontal: 15,
    height: 46,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  input: { flex: 1, marginLeft: 10, color: theme.textPrimary, fontSize: Typography.sizes.base, fontWeight: '500' },
  tabBar: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border,
    paddingHorizontal: isDesktop ? 32 : 0,
    marginTop: isDesktop ? 20 : 0,
  },
  tab: { 
    flex: isDesktop ? 0 : 1, 
    paddingVertical: 15, 
    alignItems: 'center',
    paddingHorizontal: isDesktop ? 32 : 0,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: theme.purple },
  tabText: { color: theme.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  activeTabText: { color: theme.purple },
  listContent: { 
    paddingBottom: 100,
    paddingHorizontal: isDesktop ? 32 : 0,
  },
  devCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isDesktop ? 24 : Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    backgroundColor: isDesktop ? theme.bgCard : 'transparent',
    borderRadius: isDesktop ? 16 : 0,
    marginTop: isDesktop ? 16 : 0,
    borderWidth: isDesktop ? 1 : 0,
    borderColor: theme.border,
  },
  devName: { color: theme.textPrimary, fontSize: Typography.sizes.base, fontWeight: '700' },
  devBio: { color: theme.textSecondary, fontSize: Typography.sizes.sm, marginTop: 4 },
  devCollege: { color: theme.purple, fontSize: 10, fontWeight: '800', marginTop: 4 },
  skillsRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  msgSmallBtn: {
    padding: 10,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: theme.bgInput,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  projectCard: {
    padding: isDesktop ? 24 : Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    backgroundColor: isDesktop ? theme.bgCard : 'transparent',
    borderRadius: isDesktop ? 16 : 0,
    marginTop: isDesktop ? 16 : 0,
    borderWidth: isDesktop ? 1 : 0,
    borderColor: theme.border,
  },
  projHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  projUser: { color: theme.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '600', flex: 1 },
  gravBadge: {
    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.05)', 
    borderColor: theme.purple,
    borderWidth: 0.5, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
  },
  gravText: { color: theme.purple, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  projTitle: { color: theme.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  projCaption: { color: theme.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 12 },
});
