/**
 * components/UsernameLink.tsx — Tappable Username Navigation Component
 *
 * A high-performance, zero-overhead component that renders a tappable
 * @username link. Tapping navigates to the user's public profile via
 * the existing /(stack)/[username] route.
 *
 * Features:
 * - Deterministic badge engine (rule-based, no network calls)
 * - Local data parsing and caching via AsyncStorage
 * - Theme-aware styling with primary accent color
 */

import React, { memo, useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { Radius, Spacing } from '@/constants/theme';

// ── Constants ────────────────────────────────────────────────
const CACHE_KEY = '@codenid_profile_nav_cache';

interface BadgeRule {
  id: string;
  icon: string;
  label: string;
  test: (u: string) => boolean;
}

// ── Deterministic Badge Engine ───────────────────────────────
const BADGE_RULES: BadgeRule[] = [
  {
    id: 'og_builder',
    icon: '⚡',
    label: 'OG',
    test: (u) => u.length >= 3 && u.length <= 5,
  },
  {
    id: 'creative_coder',
    icon: '🎨',
    label: 'Creative',
    test: (u) => u.includes('_') && u.length >= 6,
  },
  {
    id: 'pro_handle',
    icon: '🏆',
    label: 'Pro',
    test: (u) => /^[a-z]{4,12}$/.test(u),
  },
];

function computeBadges(username: string) {
  if (!username || username.length < 3) return [];
  const lower = username.toLowerCase();
  return BADGE_RULES.filter((rule) => rule.test(lower));
}

// ── Cache Helpers ────────────────────────────────────────────
async function cacheNavTarget(username: string) {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[username] = { ts: Date.now(), visits: (cache[username]?.visits || 0) + 1 };
    const keys = Object.keys(cache);
    if (keys.length > 100) delete cache[keys[0]];
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* non-critical */ }
}

// ══════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════

interface UsernameLinkProps {
  username: string;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

function UsernameLink({ username, showBadge = false, size = 'md', style }: UsernameLinkProps) {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();
  const [badges, setBadges] = useState<BadgeRule[]>([]);

  useEffect(() => {
    if (username) {
      const computed = computeBadges(username);
      setBadges(computed);
    }
  }, [username]);

  if (!username) return null;

  const handlePress = async () => {
    await cacheNavTarget(username);
    router.push(`/(stack)/${username}` as any);
  };

  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 18 : 15;
  const firstBadge = badges.length > 0 ? badges[0] : null;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[s.container, style]}
      accessibilityRole="link"
      accessibilityLabel={`View profile of ${username}`}
    >
      <Text style={[s.username, { fontSize }]} numberOfLines={1}>
        @{username}
      </Text>
      {showBadge && firstBadge && (
        <View style={s.badgeChip}>
          <Text style={s.badgeText}>{firstBadge.icon} {firstBadge.label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Memoize to prevent re-renders
export default memo(UsernameLink);

// ── Styles ───────────────────────────────────────────────────
const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    color: theme.purple,
    fontWeight: '800',
    letterSpacing: -0.3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  badgeChip: {
    backgroundColor: theme.purpleGlow,
    borderWidth: 0.5,
    borderColor: theme.border,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    color: theme.purple,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
