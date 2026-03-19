/**
 * app/(tabs)/search.tsx — Explore / Search Screen
 *
 * ✅ Preserved: Supabase search queries, useEffect, state
 * 🎨 Updated: Full UI redesign
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { FeedPostCard as PostCard, FeedPost as Post } from '../../components/FeedPostCard';
import { EmptyState, Avatar, SectionHeader, LoadingScreen, Tag } from '../../components/ui/UI';

interface Developer {
  id: string;
  username: string;
  bio?: string;
  skills?: string[];
  college?: string;
  project_count?: number;
}

interface SearchPost {
  id: string;
  username: string;
  project_name?: string;
  caption?: string;
  skills?: string[];
  gravity_score?: number;
}

export default function SearchScreen() {
  const router = useRouter();

  // ── State (preserved) ─────────────────────────────────────
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [activeTab, setActiveTab] = useState<'developers' | 'projects'>('developers');

  // ── Search Logic (preserved) ───────────────────────────────
  useEffect(() => {
    if (query.length < 2) {
      fetchTrending();
      return;
    }
    const timer = setTimeout(() => performSearch(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  async function fetchTrending() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:author_id(username, avatar_url)')
        .order('gravity_score', { ascending: false })
        .limit(20);

      if (!error && data) {
        const mapped = data.map((p: any) => ({
          ...p,
          username: p.profiles?.username || 'builder',
        }));
        setPosts(mapped);
      }
      setDevelopers([]); // Don't show by default
    } finally {
      setLoading(false);
    }
  }

  async function performSearch(q: string) {
    setLoading(true);
    try {
      const [devRes, postRes] = await Promise.all([
        supabase.from('profiles').select('*').ilike('username', `%${q}%`).limit(20),
        supabase
          .from('posts')
          .select('*, profiles:author_id(username, avatar_url)')
          .or(`project_name.ilike.%${q}%,caption.ilike.%${q}%`)
          .limit(20),
      ]);

      setDevelopers(devRes.data ?? []);
      if (postRes.data) {
        const mapped = postRes.data.map((p: any) => ({
          ...p,
          username: p.profiles?.username || 'builder',
        }));
        setPosts(mapped);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.primary} />

      {/* Top bar */}
      <View style={s.topBar}>
        <Text style={s.title}>Explore</Text>
      </View>

      {/* Search input */}
      <View style={s.searchBar}>
        <Text style={s.searchIcon}>⊙</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search developers, projects, skills..."
          placeholderTextColor={Colors.text.tertiary}
          style={s.searchInput}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={s.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {(['developers', 'projects'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabLabel, activeTab === tab && s.tabLabelActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.text.tertiary }}>Searching...</Text>
        </View>
      ) : activeTab === 'developers' ? (
        <FlatList
          data={developers}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={<EmptyState title="No developers found" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.devCard}
              activeOpacity={0.75}
              onPress={() => router.push(`/profile/${item.id}` as any)}
            >
              <Avatar username={item.username} size={44} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={s.devName}>{item.username}</Text>
                {item.bio && <Text style={s.devBio} numberOfLines={1}>{item.bio}</Text>}
                {item.college && (
                  <Text style={s.devCollege}>{item.college}</Text>
                )}
                {item.skills && item.skills.length > 0 && (
                  <View style={s.skillsRow}>
                    {item.skills.slice(0, 3).map((skill, i) => (
                      <Tag key={i} label={skill} />
                    ))}
                  </View>
                )}
              </View>
              {item.project_count && item.project_count > 0 && (
                <View style={s.countBadge}>
                  <Text style={s.countText}>{item.project_count}</Text>
                  <Text style={s.countLabel}>projects</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={<EmptyState title="No projects found" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.projectCard}
              activeOpacity={0.75}
              onPress={() => router.push(`/post/${item.id}` as any)}
            >
              <View style={s.projHeader}>
                <Avatar username={item.username} size={30} />
                <Text style={s.projUser}>{item.username}</Text>
                {item.gravity_score !== undefined && item.gravity_score > 0 && (
                  <View style={s.gravBadge}>
                    <Text style={s.gravText}>↑{item.gravity_score}</Text>
                  </View>
                )}
              </View>
              {item.project_name && (
                <Text style={s.projTitle}>{item.project_name}</Text>
              )}
              {item.caption && (
                <Text style={s.projCaption} numberOfLines={2}>{item.caption}</Text>
              )}
              {item.skills && item.skills.length > 0 && (
                <View style={s.skillsRow}>
                  {item.skills.slice(0, 4).map((skill, i) => (
                    <Tag key={i} label={skill} />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  topBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border.subtle,
  },
  title: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.bg.secondary,
    borderWidth: 0.5,
    borderColor: Colors.border.default,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  searchIcon: { color: Colors.text.tertiary, fontSize: 16 },
  searchInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
    paddingVertical: Spacing.md,
  },
  clearBtn: { color: Colors.text.tertiary, fontSize: 14, padding: 4 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 8,
    marginBottom: Spacing.sm,
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.bg.secondary,
  },
  tabActive: {
    backgroundColor: Colors.accent.muted,
    borderColor: Colors.border.accent,
  },
  tabLabel: { color: Colors.text.secondary, fontSize: Typography.sizes.sm },
  tabLabelActive: { color: Colors.accent.glow, fontWeight: '500' },
  devCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border.subtle,
  },
  devName: { color: Colors.text.primary, fontSize: Typography.sizes.base, fontWeight: '500' },
  devBio: { color: Colors.text.secondary, fontSize: Typography.sizes.sm, marginTop: 2 },
  devCollege: { color: Colors.accent.glow, fontSize: Typography.sizes.xs, marginTop: 2 },
  skillsRow: { flexDirection: 'row', gap: 5, marginTop: 6, flexWrap: 'wrap' },
  countBadge: { alignItems: 'center' },
  countText: { color: Colors.text.primary, fontSize: Typography.sizes.lg, fontWeight: '600' },
  countLabel: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs },
  projectCard: {
    padding: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border.subtle,
  },
  projHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  projUser: { color: Colors.text.secondary, fontSize: Typography.sizes.sm, flex: 1 },
  gravBadge: {
    backgroundColor: Colors.accent.muted, borderColor: Colors.border.accent,
    borderWidth: 0.5, borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  gravText: { color: Colors.accent.glow, fontSize: Typography.sizes.xs, fontFamily: 'Courier New' },
  projTitle: { color: Colors.text.primary, fontSize: Typography.sizes.md, fontWeight: '500', marginBottom: 3 },
  projCaption: { color: Colors.text.secondary, fontSize: Typography.sizes.sm, marginBottom: 8 },
});
