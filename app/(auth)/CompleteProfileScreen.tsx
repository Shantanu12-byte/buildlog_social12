/**
 * app/(auth)/CompleteProfileScreen.tsx — Complete Profile Screen
 *
 * ✅ Preserved: Supabase profile upsert, navigation to /(tabs)/
 * 🎨 Updated: Real-time debounced username validation (Instagram-style)
 *    - 300ms debounce with lodash.debounce
 *    - Visual feedback: green ✓ / red ✗ / spinner
 *    - Suggestion engine + badge system
 *    - AsyncStorage cache for validated usernames
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import debounce from 'lodash.debounce';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Button, Avatar, SectionHeader } from '../../components/ui/UI';
import { sanitizeUsername, sanitizeBio, sanitizeUrl, isValidUsername } from '@/lib/sanitize';

// ── Constants ────────────────────────────────────────────────

const CACHE_KEY = '@buildlog_username_cache';

const ALL_STACKS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++',
  'Go', 'Rust', 'Swift', 'Kotlin', 'PHP',
  'React', 'React Native', 'Flutter', 'Vue', 'Angular',
  'Node.js', 'Django', 'FastAPI', 'Spring', 'Laravel',
  'PostgreSQL', 'MongoDB', 'Redis', 'Supabase', 'Firebase',
  'HTML', 'CSS', 'TailwindCSS', 'Docker', 'AWS',
];

const STEPS = ['Identity', 'Stack', 'Links'];

// ── Username Status Type ─────────────────────────────────────
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

// ── Deterministic Suggestion Engine ──────────────────────────
function generateSuggestions(base: string): string[] {
  if (!base || base.length < 2) return [];
  const suffixes = ['_dev', '_builds', '_codes', '_hq', '_lab'];
  const digits = [
    String(base.length * 7 % 100),
    String((base.charCodeAt(0) * 3) % 999),
    String(new Date().getFullYear() % 100),
  ];
  const suggestions: string[] = [];
  suffixes.forEach(s => {
    const candidate = (base + s).slice(0, 20);
    if (isValidUsername(candidate)) suggestions.push(candidate);
  });
  digits.forEach(d => {
    const candidate = (base + d).slice(0, 20);
    if (isValidUsername(candidate)) suggestions.push(candidate);
  });
  return suggestions.slice(0, 4);
}

// ── Deterministic Badge Engine ───────────────────────────────
interface Badge {
  id: string;
  label: string;
  icon: string;
  reason: string;
}

function evaluateBadges(username: string, stack: string[]): Badge[] {
  const badges: Badge[] = [];

  // OG Builder — short, punchy username (3–5 chars)
  if (username.length >= 3 && username.length <= 5) {
    badges.push({
      id: 'og_builder',
      label: 'OG Builder',
      icon: '⚡',
      reason: 'Short, iconic username — claimed early.',
    });
  }

  // Stack Master — 5+ technologies selected
  if (stack.length >= 5) {
    badges.push({
      id: 'stack_master',
      label: 'Stack Master',
      icon: '🧱',
      reason: 'Selected 5+ technologies in your stack.',
    });
  }

  // Polyglot — has both frontend and backend tech
  const frontendTech = ['React', 'React Native', 'Flutter', 'Vue', 'Angular', 'HTML', 'CSS', 'TailwindCSS'];
  const backendTech = ['Node.js', 'Django', 'FastAPI', 'Spring', 'Laravel', 'PostgreSQL', 'MongoDB'];
  const hasFrontend = stack.some(s => frontendTech.includes(s));
  const hasBackend = stack.some(s => backendTech.includes(s));
  if (hasFrontend && hasBackend) {
    badges.push({
      id: 'full_stack',
      label: 'Full-Stack',
      icon: '🔥',
      reason: 'Frontend + Backend in your stack.',
    });
  }

  // Creative Coder — username contains underscore (intentional styling)
  if (username.includes('_') && username.length >= 6) {
    badges.push({
      id: 'creative_coder',
      label: 'Creative Coder',
      icon: '🎨',
      reason: 'Stylized username with underscores.',
    });
  }

  return badges;
}

// ── RAG-style Local Feedback Messages ────────────────────────
function getAvailabilityFeedback(status: UsernameStatus, username: string): string {
  switch (status) {
    case 'available':
      return `"${username}" is all yours! Great pick.`;
    case 'taken':
      return `"${username}" is already taken. Try adding numbers or underscores.`;
    case 'invalid':
      if (username.length < 3) return 'Username needs at least 3 characters.';
      if (username.length > 20) return 'Username can be at most 20 characters.';
      return 'Only lowercase letters, numbers, and underscores allowed.';
    case 'error':
      return 'Could not check availability. Please try again.';
    default:
      return '';
  }
}

// ── Cache Helpers ────────────────────────────────────────────
async function getCachedResult(username: string): Promise<boolean | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: Record<string, { available: boolean; ts: number }> = JSON.parse(raw);
    const entry = cache[username];
    // Cache valid for 5 minutes
    if (entry && Date.now() - entry.ts < 5 * 60 * 1000) {
      return entry.available;
    }
    return null;
  } catch {
    return null;
  }
}

async function setCachedResult(username: string, available: boolean) {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const cache: Record<string, { available: boolean; ts: number }> = raw ? JSON.parse(raw) : {};
    // Keep cache small — max 50 entries
    const keys = Object.keys(cache);
    if (keys.length > 50) {
      delete cache[keys[0]];
    }
    cache[username] = { available, ts: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

// ══════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════
export default function CompleteProfileScreen() {
  const router = useRouter();
  const { updateOnboardingStatus } = useAuth();

  // ── State ──────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [college, setCollege] = useState('');
  const [selectedStack, setSelectedStack] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);

  // ── Pre-fill Username from Auth Metadata ────────────────────
  useEffect(() => {
    const prefillFromAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !username) {
          // GitHub often provides 'user_name' or 'full_name' in metadata
          const raw = user.user_metadata?.user_name || user.user_metadata?.full_name || '';
          if (raw) {
            const clean = sanitizeUsername(raw);
            if (clean.length >= 3) {
              setUsername(clean);
              setIsLoadingAvailability(true);
              validateUsername(clean);
            }
          }
        }
      } catch (err) {
        console.warn('[CompleteProfile] Pre-fill error:', err);
      }
    };
    prefillFromAuth();
  }, []); // Run once on mount

  // ── Debounced Validation ────────────────────────────────────
  const validateUsername = useCallback(
    debounce(async (raw: string) => {
      const clean = sanitizeUsername(raw);

      // Basic client-side checks first
      if (!clean || clean.length < 3) {
        setUsernameStatus(clean.length > 0 ? 'invalid' : 'idle');
        setIsLoadingAvailability(false);
        setSuggestions([]);
        return;
      }
      if (!isValidUsername(clean)) {
        setUsernameStatus('invalid');
        setIsLoadingAvailability(false);
        setSuggestions([]);
        return;
      }

      // Check local cache first
      const cached = await getCachedResult(clean);
      if (cached !== null) {
        setUsernameStatus(cached ? 'available' : 'taken');
        setIsLoadingAvailability(false);
        if (!cached) setSuggestions(generateSuggestions(clean));
        else setSuggestions([]);
        return;
      }

      // Query Supabase directly (faster, no backend dependency)
      setUsernameStatus('checking');
      setIsLoadingAvailability(true);

      try {
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', clean)
          .maybeSingle();

        if (dbError) {
          console.error('[CompleteProfile] DB Validation Error:', dbError);
          setUsernameStatus('error');
          setSuggestions([]);
        } else if (data) {
          // Found someone else with this username
          setUsernameStatus('taken');
          setSuggestions(generateSuggestions(clean));
          await setCachedResult(clean, false);
        } else {
          // No match -> available
          setUsernameStatus('available');
          setSuggestions([]);
          await setCachedResult(clean, true);
        }
      } catch (err) {
        console.error('[CompleteProfile] Validation exception:', err);
        setUsernameStatus('error');
        setSuggestions([]);
      } finally {
        setIsLoadingAvailability(false);
      }
    }, 300),
    []
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      validateUsername.cancel();
    };
  }, [validateUsername]);

  // Evaluate badges whenever username or stack changes
  useEffect(() => {
    const clean = sanitizeUsername(username);
    if (clean.length >= 3 && usernameStatus === 'available') {
      setEarnedBadges(evaluateBadges(clean, selectedStack));
    } else {
      setEarnedBadges([]);
    }
  }, [username, selectedStack, usernameStatus]);

  // ── Username Input Handler ──────────────────────────────────
  function handleUsernameChange(text: string) {
    const clean = sanitizeUsername(text);
    setUsername(clean);
    setError('');
    setUsernameStatus('idle');
    setSuggestions([]);

    if (clean.length > 0) {
      setIsLoadingAvailability(true);
      validateUsername(clean);
    } else {
      setIsLoadingAvailability(false);
      validateUsername.cancel();
    }
  }

  // ── Apply Suggested Username ────────────────────────────────
  function applySuggestion(suggested: string) {
    setUsername(suggested);
    setUsernameStatus('idle');
    setSuggestions([]);
    setIsLoadingAvailability(true);
    validateUsername(suggested);
  }

  // ── Submit ─────────────────────────────────────────────────
  async function handleSubmit() {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (usernameStatus !== 'available') {
      setError('Please choose an available username before continuing.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const cleanUsername = sanitizeUsername(username);
      if (!isValidUsername(cleanUsername)) {
        throw new Error('Username must be 3-20 characters (letters, numbers, underscore only)');
      }

      // Final server-side uniqueness check (defense in depth)
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .neq('id', user.id)
        .maybeSingle();
      
      if (existing) {
        throw new Error('Username was just taken. Try another.');
      }

      const profileData = {
        id: user.id,
        username: cleanUsername,
        bio: sanitizeBio(bio),
        college: college.trim(),
        skills: selectedStack,
        github_url: sanitizeUrl(githubUrl) ?? '',
        linkedin_url: sanitizeUrl(linkedinUrl) ?? '',
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      };

      const { error: pError } = await supabase.from('profiles').upsert(profileData);
      if (pError) throw pError;

      const { error: uError } = await supabase.from('users').upsert({
        id: user.id,
        username: cleanUsername,
        bio: sanitizeBio(bio),
        avatar_url: null, // Removed UI-Avatars fallback
        github_url: sanitizeUrl(githubUrl) ?? '',
        linkedin_url: sanitizeUrl(linkedinUrl) ?? '',
        skills: selectedStack,
        learning_focus: selectedStack[0] || 'Web Development',
        skill_level: 'beginner',
      });
      if (uError) throw uError;

      // Save badges to AsyncStorage for later display
      if (earnedBadges.length > 0) {
        await AsyncStorage.setItem('@buildlog_badges', JSON.stringify(earnedBadges));
      }
      
      await AsyncStorage.setItem('onboarding_complete', 'true');
      updateOnboardingStatus(true);
      router.replace('/(tabs)/' as any);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  }

  function toggleStack(skill: string) {
    setSelectedStack(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  }

  function canProceed() {
    if (step === 0) return usernameStatus === 'available';
    if (step === 1) return selectedStack.length >= 1;
    return true;
  }

  // ── Status Icon Inline ─────────────────────────────────────
  function renderStatusIcon() {
    if (username.length === 0) return null;

    if (isLoadingAvailability || usernameStatus === 'checking') {
      return (
        <View style={vs.iconWrap}>
          <ActivityIndicator size="small" color={Colors.accent.glow} />
        </View>
      );
    }
    if (usernameStatus === 'available') {
      return (
        <View style={[vs.iconWrap, vs.iconAvailable]}>
          <Text style={vs.checkmark}>✓</Text>
        </View>
      );
    }
    if (usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'error') {
      return (
        <View style={[vs.iconWrap, vs.iconTaken]}>
          <Text style={vs.xmark}>✗</Text>
        </View>
      );
    }
    return null;
  }

  // ── Feedback Pill ──────────────────────────────────────────
  function renderFeedbackPill() {
    const msg = getAvailabilityFeedback(usernameStatus, username);
    const isPositive = usernameStatus === 'available';
    return !!msg ? (
      <View style={[vs.feedbackPill, isPositive ? vs.feedbackSuccess : vs.feedbackError]}>
        <Text style={[vs.feedbackText, isPositive ? vs.feedbackTextSuccess : vs.feedbackTextError]}>
          {msg}
        </Text>
      </View>
    ) : null;
  }

  return (
    <SafeAreaView style={st.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Progress header */}
        <View style={st.header}>
          <Text style={st.headerTitle}>Complete your profile</Text>
          <View style={st.progressSteps}>
            {STEPS.map((label, i) => (
              <View key={i} style={st.stepItem}>
                <View style={[st.stepDot, i <= step && st.stepDotActive, i < step && st.stepDotDone]}>
                  {i < step
                    ? <Text style={st.stepDotCheck}>✓</Text>
                    : <Text style={[st.stepDotNum, i === step && { color: Colors.accent.glow }]}>{i + 1}</Text>
                  }
                </View>
                <Text style={[st.stepLabel, i === step && st.stepLabelActive]}>{label}</Text>
                {i < STEPS.length - 1 && (
                  <View style={[st.stepLine, i < step && st.stepLineActive]} />
                )}
              </View>
            ))}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={st.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── STEP 0: Identity ── */}
          {step === 0 && (
            <View style={st.stepContent}>
              <View style={st.avatarPreview}>
                <Avatar username={username || 'you'} size={64} />
                <Text style={st.avatarHint}>Your avatar is auto-generated from your username</Text>
              </View>

              {/* Username Input with inline status */}
              <View style={{ marginBottom: Spacing.md }}>
                <Text style={vs.inputLabel}>USERNAME</Text>
                <View style={vs.inputRow}>
                  <TextInput
                    value={username}
                    onChangeText={handleUsernameChange}
                    placeholder="username"
                    placeholderTextColor={Colors.text.tertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      vs.usernameInput,
                      usernameStatus === 'available' && vs.inputBorderGreen,
                      (usernameStatus === 'taken' || usernameStatus === 'invalid') && vs.inputBorderRed,
                    ]}
                  />
                  {renderStatusIcon()}
                </View>
                <Text style={st.inputHint}>Letters, numbers and underscores only</Text>

                {/* Feedback pill */}
                {!!renderFeedbackPill() && renderFeedbackPill()}

                {/* Suggestions when taken */}
                {usernameStatus === 'taken' && !!suggestions.length && (
                  <View style={vs.suggestionsWrap}>
                    <Text style={vs.suggestionsLabel}>TRY THESE</Text>
                    <View style={vs.suggestionsRow}>
                      {suggestions.map(s => (
                        <TouchableOpacity
                          key={s}
                          style={vs.suggestionChip}
                          onPress={() => applySuggestion(s)}
                          activeOpacity={0.7}
                        >
                          <Text style={vs.suggestionText}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Badges earned */}
                {!!earnedBadges.length && (
                  <View style={vs.badgesWrap}>
                    <Text style={vs.badgesLabel}>BADGES EARNED</Text>
                    {earnedBadges.map(b => (
                      <View key={b.id} style={vs.badgeRow}>
                        <Text style={vs.badgeIcon}>{b.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={vs.badgeName}>{b.label}</Text>
                          <Text style={vs.badgeReason}>{b.reason}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Bio */}
              <View style={{ marginBottom: Spacing.md }}>
                <Text style={vs.inputLabel}>BIO</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Building buildlog — Instagram for devs..."
                  placeholderTextColor={Colors.text.tertiary}
                  multiline
                  autoCapitalize="sentences"
                  style={[vs.usernameInput, { minHeight: 80 }]}
                />
              </View>

              {/* College */}
              <View style={{ marginBottom: Spacing.md }}>
                <Text style={vs.inputLabel}>COLLEGE / UNIVERSITY (OPTIONAL)</Text>
                <TextInput
                  value={college}
                  onChangeText={setCollege}
                  placeholder="IIT Bombay, BITS Pilani..."
                  placeholderTextColor={Colors.text.tertiary}
                  autoCapitalize="words"
                  style={vs.usernameInput}
                />
              </View>
            </View>
          )}

          {/* ── STEP 1: Stack ── */}
          {step === 1 && (
            <View style={st.stepContent}>
              <Text style={st.stepIntro}>
                Pick your tech stack. This helps other developers find you.
              </Text>
              <Text style={st.selectedCount}>
                {selectedStack.length} selected
              </Text>
              <View style={st.stackGrid}>
                {ALL_STACKS.map(skill => (
                  <TouchableOpacity
                    key={skill}
                    style={[st.stackChip, selectedStack.includes(skill) && st.stackChipActive]}
                    onPress={() => toggleStack(skill)}
                    activeOpacity={0.7}
                  >
                    <Text style={[st.stackChipText, selectedStack.includes(skill) && st.stackChipTextActive]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── STEP 2: Links ── */}
          {step === 2 && (
            <View style={st.stepContent}>
              <Text style={st.stepIntro}>
                Add your GitHub and LinkedIn so others can see your real work.
              </Text>

              <View style={st.linkInput}>
                <View style={st.linkIcon}>
                  <Text style={st.linkIconText}>⌥</Text>
                </View>
                <View style={{ flex: 1, marginBottom: Spacing.md }}>
                  <Text style={vs.inputLabel}>GITHUB URL</Text>
                  <TextInput
                    value={githubUrl}
                    onChangeText={setGithubUrl}
                    placeholder="https://github.com/username"
                    placeholderTextColor={Colors.text.tertiary}
                    autoCapitalize="none"
                    style={vs.usernameInput}
                  />
                </View>
              </View>

              <View style={st.linkInput}>
                <View style={[st.linkIcon, { backgroundColor: Colors.pills.collab.bg }]}>
                  <Text style={st.linkIconText}>in</Text>
                </View>
                <View style={{ flex: 1, marginBottom: Spacing.md }}>
                  <Text style={vs.inputLabel}>LINKEDIN URL (OPTIONAL)</Text>
                  <TextInput
                    value={linkedinUrl}
                    onChangeText={setLinkedinUrl}
                    placeholder="https://linkedin.com/in/username"
                    placeholderTextColor={Colors.text.tertiary}
                    autoCapitalize="none"
                    style={vs.usernameInput}
                  />
                </View>
              </View>

              {/* Profile preview */}
              <View style={st.preview}>
                <Text style={st.previewLabel}>PREVIEW</Text>
                <View style={st.previewCard}>
                  <View style={st.previewHeader}>
                    <Avatar username={username || 'you'} size={40} />
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <Text style={st.previewName}>{username || 'your_username'}</Text>
                      {!!college && <Text style={st.previewCollege}>{college}</Text>}
                    </View>
                  </View>
                  {!!bio && <Text style={st.previewBio} numberOfLines={2}>{bio}</Text>}

                  {/* Fork / Star counts */}
                  <View style={vs.statsRow}>
                    <View style={vs.statItem}>
                      <Text style={vs.statIcon}>⑂</Text>
                      <Text style={vs.statCount}>0</Text>
                      <Text style={vs.statLabel}>forks</Text>
                    </View>
                    <View style={vs.statItem}>
                      <Text style={vs.statIcon}>★</Text>
                      <Text style={vs.statCount}>0</Text>
                      <Text style={vs.statLabel}>stars</Text>
                    </View>
                  </View>

                  {selectedStack.length > 0 && (
                    <View style={st.previewStack}>
                      {selectedStack.slice(0, 4).map((sk, i) => (
                        <View key={i} style={s2.chip}>
                          <Text style={s2.chipText}>{sk}</Text>
                        </View>
                      ))}
                      {selectedStack.length > 4 && (
                        <Text style={s2.more}>+{selectedStack.length - 4}</Text>
                      )}
                    </View>
                  )}

                  {/* Earned badges in preview */}
                  {!!earnedBadges.length && (
                    <View style={vs.previewBadges}>
                      {earnedBadges.map(b => (
                        <View key={b.id} style={vs.previewBadgeChip}>
                          <Text style={vs.previewBadgeText}>{b.icon} {b.label}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Error */}
          {error !== '' && (
            <View style={st.errorBox}>
              <Text style={st.errorText}>{error}</Text>
            </View>
          )}

          {/* Navigation buttons */}
          <View style={st.navRow}>
            {step > 0 && (
              <Button
                label="Back"
                onPress={() => setStep(s => s - 1)}
                variant="secondary"
                style={{ flex: 1 }}
              />
            )}
            <Button
              label={step === STEPS.length - 1 ? 'Launch profile' : 'Continue'}
              onPress={step === STEPS.length - 1 ? handleSubmit : () => setStep(s => s + 1)}
              loading={loading}
              style={{
                flex: step > 0 ? 1 : undefined,
                opacity: canProceed() ? 1 : 0.4,
              }}
            />
          </View>

          {/* Step 0 disabled hint */}
          {step === 0 && !canProceed() && username.length > 0 && (
            <Text style={vs.disabledHint}>
              Choose an available username to continue
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Main Styles ──────────────────────────────────────────────
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    padding: Spacing.xl, paddingBottom: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border.subtle,
  },
  headerTitle: {
    color: Colors.text.primary, fontSize: Typography.sizes.xl,
    fontWeight: '600', marginBottom: Spacing.lg,
  },
  progressSteps: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 0.5, borderColor: Colors.border.default,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { borderColor: Colors.accent.primary, backgroundColor: Colors.accent.muted },
  stepDotDone: { backgroundColor: Colors.accent.primary, borderColor: Colors.accent.primary },
  stepDotCheck: { color: '#fff', fontSize: 12, fontWeight: '600' },
  stepDotNum: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs, fontWeight: '500' },
  stepLabel: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs, marginLeft: 5 },
  stepLabelActive: { color: Colors.accent.glow, fontWeight: '500' },
  stepLine: { flex: 1, height: 0.5, backgroundColor: Colors.border.default, marginHorizontal: 5 },
  stepLineActive: { backgroundColor: Colors.accent.primary },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xxxl, flexGrow: 1 },
  stepContent: { marginBottom: Spacing.xl },
  avatarPreview: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarHint: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs, marginTop: Spacing.sm, textAlign: 'center' },
  inputHint: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs, marginTop: 4, marginBottom: Spacing.sm },
  stepIntro: { color: Colors.text.secondary, fontSize: Typography.sizes.base, lineHeight: 22, marginBottom: Spacing.lg },
  selectedCount: { color: Colors.accent.glow, fontSize: Typography.sizes.sm, fontWeight: '500', marginBottom: Spacing.md },
  stackGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stackChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.md, borderWidth: 0.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.bg.secondary,
  },
  stackChipActive: { backgroundColor: Colors.accent.muted, borderColor: Colors.border.accent },
  stackChipText: { color: Colors.text.secondary, fontSize: Typography.sizes.sm, fontFamily: 'Courier New' },
  stackChipTextActive: { color: Colors.accent.glow, fontWeight: '500' },
  linkInput: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: 4 },
  linkIcon: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.accent.muted,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 20,
  },
  linkIconText: { color: Colors.accent.glow, fontSize: Typography.sizes.sm, fontWeight: '600' },
  preview: { marginTop: Spacing.xl },
  previewLabel: {
    color: Colors.text.tertiary, fontSize: Typography.sizes.xs,
    fontWeight: '500', letterSpacing: 0.8, marginBottom: Spacing.sm,
  },
  previewCard: {
    backgroundColor: Colors.bg.secondary,
    borderWidth: 0.5, borderColor: Colors.border.default,
    borderRadius: Radius.lg, padding: Spacing.lg,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  previewName: { color: Colors.text.primary, fontSize: Typography.sizes.md, fontWeight: '500' },
  previewCollege: { color: Colors.accent.glow, fontSize: Typography.sizes.xs, marginTop: 2 },
  previewBio: { color: Colors.text.secondary, fontSize: Typography.sizes.sm, marginBottom: Spacing.md },
  previewStack: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  errorBox: {
    backgroundColor: 'rgba(163,45,45,0.15)', borderWidth: 0.5, borderColor: Colors.danger,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { color: '#FCA5A5', fontSize: Typography.sizes.sm },
  navRow: { flexDirection: 'row', gap: Spacing.md },
});

// ── Validation Styles ────────────────────────────────────────
const vs = StyleSheet.create({
  inputLabel: {
    color: Colors.text.tertiary, fontSize: Typography.sizes.xs,
    letterSpacing: 0.5, fontWeight: '500', marginBottom: 5,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  usernameInput: {
    flex: 1,
    backgroundColor: Colors.bg.input,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.border.default,
    padding: Spacing.md,
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
    minHeight: 44,
  },
  inputBorderGreen: {
    borderColor: Colors.success, borderWidth: 1,
  },
  inputBorderRed: {
    borderColor: Colors.danger, borderWidth: 1,
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    position: 'absolute', right: 8,
  },
  iconAvailable: {
    backgroundColor: 'rgba(35,134,54,0.2)',
  },
  iconTaken: {
    backgroundColor: 'rgba(218,54,51,0.2)',
  },
  checkmark: {
    color: Colors.success, fontSize: 16, fontWeight: '700',
  },
  xmark: {
    color: Colors.danger, fontSize: 16, fontWeight: '700',
  },
  feedbackPill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    borderWidth: 0.5,
  },
  feedbackSuccess: {
    backgroundColor: Colors.rag.success.bg,
    borderColor: Colors.rag.success.border,
  },
  feedbackError: {
    backgroundColor: Colors.rag.error.bg,
    borderColor: Colors.rag.error.border,
  },
  feedbackText: {
    fontSize: Typography.sizes.xs,
  },
  feedbackTextSuccess: {
    color: Colors.rag.success.text,
  },
  feedbackTextError: {
    color: Colors.rag.error.text,
  },
  suggestionsWrap: {
    marginTop: Spacing.md,
  },
  suggestionsLabel: {
    color: Colors.text.tertiary, fontSize: Typography.sizes.xs,
    letterSpacing: 0.5, fontWeight: '500', marginBottom: Spacing.sm,
  },
  suggestionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent.muted,
    borderWidth: 0.5, borderColor: Colors.border.accent,
  },
  suggestionText: {
    color: Colors.accent.glow, fontSize: Typography.sizes.sm,
    fontFamily: 'Courier New',
  },
  badgesWrap: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.lg,
    borderWidth: 0.5, borderColor: Colors.border.subtle,
  },
  badgesLabel: {
    color: Colors.text.tertiary, fontSize: Typography.sizes.xs,
    letterSpacing: 0.5, fontWeight: '500', marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, gap: Spacing.sm,
  },
  badgeIcon: { fontSize: 20 },
  badgeName: { color: Colors.text.primary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  badgeReason: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs, marginTop: 1 },
  disabledHint: {
    color: Colors.text.tertiary, fontSize: Typography.sizes.xs,
    textAlign: 'center', marginTop: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row', gap: Spacing.lg,
    marginBottom: Spacing.md, paddingTop: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  statIcon: { color: Colors.text.tertiary, fontSize: 14 },
  statCount: { color: Colors.text.primary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  statLabel: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs },
  previewBadges: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.md,
  },
  previewBadgeChip: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.pills.challenge.bg,
    borderWidth: 0.5, borderColor: Colors.pills.challenge.border,
  },
  previewBadgeText: {
    color: Colors.pills.challenge.text, fontSize: Typography.sizes.xs, fontWeight: '500',
  },
});

const s2 = StyleSheet.create({
  chip: {
    backgroundColor: Colors.bg.tertiary, borderWidth: 0.5,
    borderColor: Colors.border.subtle, borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  chipText: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs, fontFamily: 'Courier New' },
  more: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs, alignSelf: 'center' },
});
