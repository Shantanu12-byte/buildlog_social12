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

interface Developer {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  college?: string;
  skills?: string[];
}

export default function ExploreScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'developers' | 'projects'>('developers');

  useEffect(() => {
    fetchTrending();
  }, [activeTab]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      if (activeTab === 'developers') {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, bio, college, skills')
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
          .select('id, username, avatar_url, bio, college, skills')
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
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
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

      {loading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={activeTab === 'developers' ? developers : projects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            activeTab === 'developers' ? (
              <TouchableOpacity 
                style={s.devCard}
                onPress={() => item.username && router.push(`/user/${item.username}`)}
              >
                <Avatar uri={item.avatar_url} username={item.username || '?'} size={50} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.devName}>{item.username || 'Anonymous'}</Text>
                  <Text style={s.devBio} numberOfLines={1}>{item.bio || 'Exploring the frontier'}</Text>
                  <Text style={s.devCollege}>{item.college?.toUpperCase() || 'UNLINKED_ACADEMY'}</Text>
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
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
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
  tabBar: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: theme.border },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: theme.purple },
  tabText: { color: theme.textMuted, fontSize: Typography.sizes.xs, fontWeight: '800', letterSpacing: 1 },
  activeTabText: { color: theme.purple },
  devCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  devName: { color: theme.textPrimary, fontSize: Typography.sizes.base, fontWeight: '500' },
  devBio: { color: theme.textSecondary, fontSize: Typography.sizes.sm, marginTop: 2 },
  devCollege: { color: theme.purple, fontSize: Typography.sizes.xs, marginTop: 2 },
  skillsRow: { flexDirection: 'row', gap: 5, marginTop: 6, flexWrap: 'wrap' },
  countBadge: { alignItems: 'center' },
  countText: { color: theme.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '600' },
  countLabel: { color: theme.textMuted, fontSize: Typography.sizes.xs },
  msgSmallBtn: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: theme.bgInput,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  projectCard: {
    padding: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  projHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  projUser: { color: theme.textSecondary, fontSize: Typography.sizes.sm, flex: 1 },
  gravBadge: {
    backgroundColor: theme.bgInput, 
    borderColor: theme.purple,
    borderWidth: 0.5, borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  gravText: { color: theme.purple, fontSize: Typography.sizes.xs, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  projTitle: { color: theme.textPrimary, fontSize: Typography.sizes.md, fontWeight: '500', marginBottom: 3 },
  projCaption: { color: theme.textSecondary, fontSize: Typography.sizes.sm, marginBottom: 8 },
});
