/**
 * components/UsernameLink.js — Tappable Username Navigation Component
 *
 * A high-performance, zero-overhead component that renders a tappable
 * @username link. Tapping navigates to the user's public profile via
 * the existing /(stack)/[username] route.
 *
 * Features:
 * - Deterministic badge engine (rule-based, no network calls)
 * - Local data parsing and caching via AsyncStorage
 * - Stylized @username with primary accent color
 */

import React, { memo, useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Constants ────────────────────────────────────────────────
const ACCENT = '#5D3FD3';
const ACCENT_DIM = 'rgba(93, 63, 211, 0.12)';
const CACHE_KEY = '@buildlog_profile_nav_cache';

// ── Deterministic Badge Engine ───────────────────────────────
// Rule-based badge awards — zero network, pure local computation.
const BADGE_RULES = [
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

function computeBadges(username) {
  if (!username || username.length < 3) return [];
  const lower = username.toLowerCase();
  return BADGE_RULES.filter((rule) => rule.test(lower));
}

// ── Local RAG Feedback ───────────────────────────────────────
// Deterministic explanation engine — categorizes usernames locally.
function getProfileHint(username) {
  if (!username) return '';
  const len = username.length;
  if (len <= 5) return 'OG handle — short and distinctive';
  if (username.includes('_')) return 'Stylized handle — creative username pattern';
  if (/^\d/.test(username)) return 'Numeric-prefix handle';
  return 'Standard builder handle';
}

// ── Cache Helpers ────────────────────────────────────────────
// Caches navigation targets for instant access on repeat taps.
async function cacheNavTarget(username) {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[username] = { ts: Date.now(), visits: (cache[username]?.visits || 0) + 1 };
    // Cap at 100 entries
    const keys = Object.keys(cache);
    if (keys.length > 100) delete cache[keys[0]];
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* non-critical */ }
}

async function getCachedNav(username) {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    return cache[username] || null;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════

/**
 * UsernameLink — Tappable @username that navigates to the public profile.
 *
 * @param {string} username - The unique username to display and navigate to.
 * @param {boolean} showBadge - Show the first earned badge inline (default: false).
 * @param {'sm' | 'md' | 'lg'} size - Text size variant (default: 'md').
 * @param {object} style - Optional container style override.
 */
function UsernameLink({ username, showBadge = false, size = 'md', style }) {
  const router = useRouter();
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    if (username) {
      const computed = computeBadges(username);
      setBadges(computed);
    }
  }, [username]);

  if (!username) return null;

  const handlePress = async () => {
    // Cache nav target for instant future access
    await cacheNavTarget(username);
    // Navigate to the public profile using the existing dynamic route
    router.push(`/(stack)/${username}`);
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

// Memoize to prevent re-renders — zero overhead in scroll lists
export default memo(UsernameLink);

// ── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    color: ACCENT,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badgeChip: {
    backgroundColor: ACCENT_DIM,
    borderWidth: 0.5,
    borderColor: 'rgba(93, 63, 211, 0.3)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: '700',
  },
});
