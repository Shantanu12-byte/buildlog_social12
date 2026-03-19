/**
 * app/devcard.tsx — buildlog DevCard
 *
 * Features:
 * - Renders a beautiful shareable card with profile, stats, stack, top projects
 * - Save as image using react-native-view-shot
 * - Share via native share sheet
 * - Copy profile link to clipboard
 *
 * Install required packages:
 *   npx expo install react-native-view-shot expo-sharing expo-clipboard
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Share,
  ActivityIndicator, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Colors, Typography, Spacing, Radius, getAvatarColor, getInitials } from '../constants/theme';
import { LoadingScreen } from '../components/ui/UI';

// Install these: npx expo install react-native-view-shot expo-sharing expo-clipboard
let captureRef: any = null;
let Sharing: any = null;
let Clipboard: any = null;

try { captureRef = require('react-native-view-shot').captureRef; } catch {}
try { Sharing = require('expo-sharing'); } catch {}
try { Clipboard = require('expo-clipboard'); } catch {}

// ─── Types ────────────────────────────────────────────────────
interface Profile {
  username: string;
  bio?: string;
  college?: string;
  skills?: string[];
  github_url?: string;
  linkedin_url?: string;
  build_streak?: number;
  id: string;
}

interface Project {
  id: string;
  name: string;
  progress?: number;
}

interface Stats {
  projects: number;
  builds: number;
  allies: number;
  hypes: number;
  streak: number;
}

// ─── Avatar ───────────────────────────────────────────────────
function CardAvatar({ username, size = 56 }: { username: string; size?: number }) {
  const c = getAvatarColor(username);
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: c.bg, borderWidth: 2, borderColor: '#534AB7',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: c.text, fontSize: size * 0.32, fontWeight: '500' }}>
        {getInitials(username)}
      </Text>
    </View>
  );
}

// ─── The Card (rendered + captured) ──────────────────────────
function DevCardView({
  cardRef,
  profile,
  stats,
  projects,
}: {
  cardRef: any;
  profile: Profile;
  stats: Stats;
  projects: Project[];
}) {
  const topProjects = projects.slice(0, 3);

  function getProgressColor(p: number) {
    if (p >= 100) return '#1D9E75';
    if (p >= 50) return '#534AB7';
    return '#BA7517';
  }

  function getProgressLabel(p: number) {
    if (p >= 100) return 'Done';
    return `${p}%`;
  }

  return (
    <View ref={cardRef} style={s.card} collapsable={false}>
      {/* Header */}
      <View style={s.cardHeader}>
        <View style={s.brandRow}>
          <View style={s.brandDot} />
          <Text style={s.brandName}>buildlog</Text>
        </View>
        {(stats.streak ?? 0) > 0 && (
          <View style={s.streakBadge}>
            <Text style={s.streakFire}>🔥</Text>
            <Text style={s.streakText}>{stats.streak} day streak</Text>
          </View>
        )}
      </View>

      {/* Avatar + Name */}
      <View style={s.avatarRow}>
        <CardAvatar username={profile.username} size={56} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.devName}>{profile.username}</Text>
          <Text style={s.devHandle}>@{profile.username}_dev</Text>
          {profile.college && (
            <View style={s.collegePill}>
              <Text style={s.collegeText}>🎓 {profile.college}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bio */}
      {profile.bio && (
        <Text style={s.bio} numberOfLines={2}>{profile.bio}</Text>
      )}

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { n: stats.projects, l: 'Projects' },
          { n: stats.builds, l: 'Builds' },
          { n: stats.allies, l: 'Allies' },
          { n: stats.hypes, l: '⚡ Hypes' },
        ].map((item, i, arr) => (
          <View key={i} style={[s.statItem, i < arr.length - 1 && s.statBorder]}>
            <Text style={s.statN}>
              {item.n >= 1000 ? `${(item.n / 1000).toFixed(1)}k` : item.n}
            </Text>
            <Text style={s.statL}>{item.l}</Text>
          </View>
        ))}
      </View>

      {/* Stack */}
      {profile.skills && profile.skills.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>STACK</Text>
          <View style={s.chipsRow}>
            {profile.skills.slice(0, 6).map((skill, i) => (
              <View key={i} style={[s.chip, i < 4 && s.chipActive]}>
                <Text style={[s.chipText, i < 4 && s.chipTextActive]}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Top Projects */}
      {topProjects.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>TOP PROJECTS</Text>
          {topProjects.map((proj, i) => {
            const progress = proj.progress ?? 0;
            const color = getProgressColor(progress);
            return (
              <View key={i} style={s.projRow}>
                <View style={[s.projDot, { backgroundColor: color }]} />
                <Text style={s.projName} numberOfLines={1}>{proj.name}</Text>
                <View style={s.projBarWrap}>
                  <View style={[s.projBar, { width: `${Math.min(progress, 100)}%` as any, backgroundColor: color }]} />
                </View>
                <Text style={[s.projPct, { color: progress >= 100 ? '#1D9E75' : '#4A5568' }]}>
                  {getProgressLabel(progress)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Footer */}
      <View style={s.cardFooter}>
        <Text style={s.footerLink}>
          buildlog.app/<Text style={{ color: '#534AB7' }}>{profile.username}</Text>
        </Text>
        <View style={s.qrBox}>
          <Text style={{ color: '#4A5568', fontSize: 14 }}>⊞</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function DevCardScreen() {
  const router = useRouter();
  const cardRef = useRef(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ projects: 0, builds: 0, allies: 0, hypes: 0, streak: 0 });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const { username: paramUsername } = useLocalSearchParams<{ username?: string }>();

  async function loadData() {
    try {
      let userId: string | null = null;
      let targetUsername: string | null = paramUsername || null;

      if (targetUsername) {
        const { data: prof, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', targetUsername)
          .single();
        if (prof) userId = prof.id;
      }

      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/(auth)/login' as any); return; }
        userId = user.id;
      }

      const [profileRes, projectsRes, alliesRes, buildsRes, hypesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('posts').select('id, title, progress').eq('user_id', userId).order('progress', { ascending: false }).limit(3),
        supabase.from('followers').select('id', { count: 'exact' }).eq('following_id', userId),
        supabase.from('posts').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('likes').select('id', { count: 'exact' }).eq('post_owner_id', userId),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (projectsRes.data) {
        setProjects(projectsRes.data.map((p: any) => ({
          id: p.id,
          name: p.title || 'Untitled',
          progress: p.progress
        })));
      }

      const streak = profileRes.data?.build_streak ?? 0;

      setStats({
        projects: projectsRes.data?.length ?? 0,
        builds: buildsRes.count ?? 0,
        allies: alliesRes.count ?? 0,
        hypes: hypesRes.count ?? 0,
        streak,
      });
    } catch (e) {
      console.error('loadData error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadWeb(uri: string) {
    try {
      const link = document.createElement('a');
      link.href = uri;
      link.download = `buildlog-${profile?.username || 'dev'}-card.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Web download error:', e);
      handleCopyLink();
    }
  }

  async function handleSaveImage() {
    if (!cardRef.current) return;
    
    // Fallback if captureRef is missing (especially on Web if packages fail)
    if (!captureRef) {
      if (Platform.OS === 'web') {
        handleCopyLink();
        return;
      }
      alert('Install react-native-view-shot to save images');
      return;
    }

    setSaving(true);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: Platform.OS === 'web' ? 'datauri' : 'tmpfile',
      });

      if (Platform.OS === 'web') {
        await handleDownloadWeb(uri);
      } else if (Sharing) {
        await Sharing.shareAsync(uri, { 
          mimeType: 'image/png', 
          dialogTitle: 'Share your buildlog DevCard' 
        });
      }
    } catch (e) {
      console.error('Save image error:', e);
      if (Platform.OS === 'web') {
        handleCopyLink(); // Graceful fallback
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    const username = profile?.username ?? 'developer';
    try {
      await Share.share({
        message: `Check out my buildlog DevCard! 🚀\nbuildlog.app/${username}`,
        url: `https://buildlog.app/${username}`,
        title: `${username}'s buildlog DevCard`,
      });
    } catch (e) {
      console.error('Share error:', e);
    }
  }

  async function handleCopyLink() {
    const username = profile?.username ?? 'developer';
    const link = `https://buildlog.app/${username}`;
    if (Clipboard) {
      await Clipboard.setStringAsync(link);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <LoadingScreen />;
  if (!profile) return <LoadingScreen />;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.primary} />

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Your DevCard</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.subtitle}>Share your buildlog identity with the world</Text>

        {/* The card */}
        <View style={s.cardWrap}>
          <DevCardView
            cardRef={cardRef}
            profile={profile}
            stats={stats}
            projects={projects}
          />
        </View>

        {/* Action buttons */}
        <View style={s.actionsCol}>
          <TouchableOpacity
            style={s.actionPrimary}
            onPress={handleSaveImage}
            activeOpacity={0.75}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.actionPrimaryText}>Save as image</Text>
            }
          </TouchableOpacity>

          <View style={s.actionsRow}>
            <TouchableOpacity
              style={s.actionSecondary}
              onPress={handleCopyLink}
              activeOpacity={0.75}
            >
              <Text style={s.actionSecondaryText}>
                {copied ? '✓ Copied!' : 'Copy link'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.actionSecondary}
              onPress={handleShare}
              activeOpacity={0.75}
            >
              <Text style={s.actionSecondaryText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Install hint */}
        {!captureRef && (
          <View style={s.hintBox}>
            <Text style={s.hintTitle}>Enable image saving</Text>
            <Text style={s.hintText}>
              Run this to enable "Save as image":{'\n'}
              npx expo install react-native-view-shot expo-sharing
            </Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const CARD_BG = '#0A0F1E';
const CARD_SURFACE = '#111827';
const CARD_BORDER = 'rgba(127,119,221,0.3)';
const CARD_MUTED = 'rgba(255,255,255,0.06)';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border.subtle,
  },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.bg.secondary, borderWidth: 0.5, borderColor: Colors.border.default, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: Colors.text.primary, fontSize: 18 },
  topTitle: { color: Colors.text.primary, fontSize: Typography.sizes.lg, fontWeight: '600' },
  scroll: { padding: Spacing.lg, alignItems: 'center' },
  subtitle: { color: Colors.text.tertiary, fontSize: Typography.sizes.sm, marginBottom: Spacing.xl, textAlign: 'center' },

  // Card wrapper
  cardWrap: { width: '100%', maxWidth: 380, marginBottom: Spacing.xl },

  // ── THE CARD (hardcoded dark colors — must NOT invert in light mode) ──
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 22,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 18,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7F77DD' },
  brandName: { fontSize: 12, fontWeight: '500', color: '#AFA9EC', letterSpacing: 0.5 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(30,27,75,0.8)', borderWidth: 0.5,
    borderColor: 'rgba(127,119,221,0.3)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  streakFire: { fontSize: 11 },
  streakText: { fontSize: 11, fontWeight: '500', color: '#AFA9EC' },

  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  devName: { fontSize: 20, fontWeight: '600', color: '#F0F2F8', letterSpacing: -0.5, marginBottom: 2 },
  devHandle: { fontSize: 11, color: '#4A5568', marginBottom: 5 },
  collegePill: {
    alignSelf: 'flex-start', backgroundColor: '#1E3A5F',
    borderWidth: 0.5, borderColor: '#1D4ED8',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
  },
  collegeText: { fontSize: 10, color: '#93C5FD' },

  bio: { fontSize: 12, color: '#8892A4', lineHeight: 18, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: CARD_MUTED },

  statsRow: { flexDirection: 'row', backgroundColor: CARD_SURFACE, borderRadius: 10, overflow: 'hidden', borderWidth: 0.5, borderColor: CARD_MUTED, marginBottom: 16 },
  statItem: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center' },
  statBorder: { borderRightWidth: 0.5, borderRightColor: CARD_MUTED },
  statN: { fontSize: 16, fontWeight: '600', color: '#F0F2F8', letterSpacing: -0.5 },
  statL: { fontSize: 9, color: '#4A5568', marginTop: 2 },

  section: { marginBottom: 14 },
  sectionLabel: { fontSize: 9, fontWeight: '500', color: '#4A5568', letterSpacing: 0.8, marginBottom: 7 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, backgroundColor: '#1A2236', borderWidth: 0.5, borderColor: CARD_MUTED },
  chipActive: { backgroundColor: '#1E1B4B', borderColor: 'rgba(127,119,221,0.4)' },
  chipText: { fontSize: 10, color: '#8892A4', fontFamily: 'Courier New' },
  chipTextActive: { color: '#AFA9EC' },

  projRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  projDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  projName: { flex: 1, fontSize: 11, color: '#F0F2F8', fontWeight: '500' },
  projBarWrap: { width: 56, height: 3, backgroundColor: '#1A2236', borderRadius: 3 },
  projBar: { height: 3, borderRadius: 3 },
  projPct: { fontSize: 10, minWidth: 28, textAlign: 'right' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTopWidth: 0.5, borderTopColor: CARD_MUTED },
  footerLink: { fontSize: 10, color: '#4A5568', fontFamily: 'Courier New' },
  qrBox: { width: 30, height: 30, borderRadius: 6, backgroundColor: CARD_SURFACE, borderWidth: 0.5, borderColor: CARD_MUTED, alignItems: 'center', justifyContent: 'center' },

  // Action buttons
  actionsCol: { width: '100%', maxWidth: 380, gap: 10, marginBottom: Spacing.lg },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionPrimary: {
    backgroundColor: Colors.accent.primary, borderRadius: Radius.md,
    paddingVertical: 13, alignItems: 'center', justifyContent: 'center',
  },
  actionPrimaryText: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: '500' },
  actionSecondary: {
    flex: 1, backgroundColor: Colors.bg.secondary,
    borderWidth: 0.5, borderColor: Colors.border.default,
    borderRadius: Radius.md, paddingVertical: 11, alignItems: 'center',
  },
  actionSecondaryText: { color: Colors.text.primary, fontSize: Typography.sizes.base, fontWeight: '500' },

  // Hint box
  hintBox: {
    width: '100%', maxWidth: 380,
    backgroundColor: 'rgba(30,27,75,0.4)', borderWidth: 0.5,
    borderColor: Colors.border.accent, borderRadius: Radius.md, padding: Spacing.md,
  },
  hintTitle: { color: Colors.accent.glow, fontSize: Typography.sizes.sm, fontWeight: '500', marginBottom: 5 },
  hintText: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs, lineHeight: 18, fontFamily: 'Courier New' },
});
