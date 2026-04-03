/**
 * app/(auth)/CompleteProfileScreen.tsx — Complete Profile Screen
 *
 * ✅ Preserved: Supabase profile upsert, navigation to /(tabs)/
 * 🎨 Updated: Migrated to dynamic theme system with useTheme hook
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { Typography, Spacing, Radius } from '../../constants/theme';
import { Button, Avatar } from '../../components/ui/UI';
import { sanitizeUsername, sanitizeBio, sanitizeUrl, isValidUsername } from '@/lib/sanitize';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/context/ThemeContext';

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

  if (username.length >= 3 && username.length <= 5) {
    badges.push({
      id: 'og_builder',
      label: 'OG Builder',
      icon: '⚡',
      reason: 'Short, iconic username — claimed early.',
    });
  }

  if (stack.length >= 5) {
    badges.push({
      id: 'stack_master',
      label: 'Stack Master',
      icon: '🧱',
      reason: 'Selected 5+ technologies in your stack.',
    });
  }

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

async function getCachedResult(username: string): Promise<boolean | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: Record<string, { available: boolean; ts: number }> = JSON.parse(raw);
    const entry = cache[username];
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
    const keys = Object.keys(cache);
    if (keys.length > 50) {
      delete cache[keys[0]];
    }
    cache[username] = { available, ts: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const { updateOnboardingStatus } = useAuth();
  const { fetchUserProfile } = useUserStore();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [college, setCollege] = useState('');
  const [selectedStack, setSelectedStack] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const prefillFromAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !username) {
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
      } catch (err) { }
    };
    prefillFromAuth();
  }, []);

  const validateUsername = useCallback(
    debounce(async (raw: string) => {
      const clean = sanitizeUsername(raw);

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

      const cached = await getCachedResult(clean);
      if (cached !== null) {
        setUsernameStatus(cached ? 'available' : 'taken');
        setIsLoadingAvailability(false);
        if (!cached) setSuggestions(generateSuggestions(clean));
        else setSuggestions([]);
        return;
      }

      setUsernameStatus('checking');
      setIsLoadingAvailability(true);

      try {
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', clean)
          .maybeSingle();

        if (dbError) {
          setUsernameStatus('error');
          setSuggestions([]);
        } else if (data) {
          setUsernameStatus('taken');
          setSuggestions(generateSuggestions(clean));
          await setCachedResult(clean, false);
        } else {
          setUsernameStatus('available');
          setSuggestions([]);
          await setCachedResult(clean, true);
        }
      } catch (err) {
        setUsernameStatus('error');
        setSuggestions([]);
      } finally {
        setIsLoadingAvailability(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    return () => {
      validateUsername.cancel();
    };
  }, [validateUsername]);

  useEffect(() => {
    const clean = sanitizeUsername(username);
    if (clean.length >= 3 && usernameStatus === 'available') {
      setEarnedBadges(evaluateBadges(clean, selectedStack));
    } else {
      setEarnedBadges([]);
    }
  }, [username, selectedStack, usernameStatus]);

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

  function applySuggestion(suggested: string) {
    setUsername(suggested);
    setUsernameStatus('idle');
    setSuggestions([]);
    setIsLoadingAvailability(true);
    validateUsername(suggested);
  }

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
        avatar_url: null,
        github_url: sanitizeUrl(githubUrl) ?? '',
        linkedin_url: sanitizeUrl(linkedinUrl) ?? '',
        skills: selectedStack,
        learning_focus: selectedStack[0] || 'Web Development',
        skill_level: 'beginner',
      });
      if (uError) throw uError;

      if (earnedBadges.length > 0) {
        await AsyncStorage.setItem('@buildlog_badges', JSON.stringify(earnedBadges));
      }
      
      await AsyncStorage.setItem('onboarding_complete', 'true');
      updateOnboardingStatus(true);
      await fetchUserProfile();
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

  function renderStatusIcon() {
    if (username.length === 0) return null;

    if (isLoadingAvailability || usernameStatus === 'checking') {
      return (
        <View style={s.iconWrap}>
          <ActivityIndicator size="small" color={theme.purple} />
        </View>
      );
    }
    if (usernameStatus === 'available') {
      return (
        <View style={[s.iconWrap, s.iconAvailable]}>
          <Text style={s.checkmark}>✓</Text>
        </View>
      );
    }
    if (usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'error') {
      return (
        <View style={[s.iconWrap, s.iconTaken]}>
          <Text style={s.xmark}>✗</Text>
        </View>
      );
    }
    return null;
  }

  function renderFeedbackPill() {
    const msg = getAvailabilityFeedback(usernameStatus, username);
    const isPositive = usernameStatus === 'available';
    return !!msg ? (
      <View style={[s.feedbackPill, isPositive ? s.feedbackSuccess : s.feedbackError]}>
        <Text style={[s.feedbackText, isPositive ? s.feedbackTextSuccess : s.feedbackTextError]}>
          {msg}
        </Text>
      </View>
    ) : null;
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.header}>
          <Text style={s.headerTitle}>Complete your profile</Text>
          <View style={s.progressSteps}>
            {STEPS.map((label, i) => (
              <View key={i} style={s.stepItem}>
                <View style={[s.stepDot, i <= step && s.stepDotActive, i < step && s.stepDotDone]}>
                  {i < step
                    ? <Text style={s.stepDotCheck}>✓</Text>
                    : <Text style={[s.stepDotNum, i === step && { color: theme.purple }]}>{i + 1}</Text>
                  }
                </View>
                <Text style={[s.stepLabel, i === step && s.stepLabelActive]}>{label}</Text>
                {i < STEPS.length - 1 && (
                  <View style={[s.stepLine, i < step && s.stepLineActive]} />
                )}
              </View>
            ))}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <View style={s.stepContent}>
              <View style={s.avatarPreview}>
                <Avatar username={username || 'you'} size={64} />
                <Text style={s.avatarHint}>Your avatar is auto-generated from your username</Text>
              </View>

              <View style={{ marginBottom: Spacing.md }}>
                <Text style={s.inputLabel}>USERNAME</Text>
                <View style={s.inputRow}>
                  <TextInput
                    value={username}
                    onChangeText={handleUsernameChange}
                    placeholder="username"
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      s.usernameInput,
                      usernameStatus === 'available' && s.inputBorderGreen,
                      (usernameStatus === 'taken' || usernameStatus === 'invalid') && s.inputBorderRed,
                    ]}
                  />
                  {renderStatusIcon()}
                </View>
                <Text style={s.inputHint}>Letters, numbers and underscores only</Text>

                {renderFeedbackPill()}

                {usernameStatus === 'taken' && !!suggestions.length && (
                  <View style={s.suggestionsWrap}>
                    <Text style={s.suggestionsLabel}>TRY THESE</Text>
                    <View style={s.suggestionsRow}>
                      {suggestions.map(sg => (
                        <TouchableOpacity
                          key={sg}
                          style={s.suggestionChip}
                          onPress={() => applySuggestion(sg)}
                          activeOpacity={0.7}
                        >
                          <Text style={s.suggestionText}>{sg}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {!!earnedBadges.length && (
                  <View style={s.badgesWrap}>
                    <Text style={s.badgesLabel}>BADGES EARNED</Text>
                    {earnedBadges.map(b => (
                      <View key={b.id} style={s.badgeRow}>
                        <Text style={s.badgeIcon}>{b.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.badgeName}>{b.label}</Text>
                          <Text style={s.badgeReason}>{b.reason}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={{ marginBottom: Spacing.md }}>
                <Text style={s.inputLabel}>BIO</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Building buildlog — Instagram for devs..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  autoCapitalize="sentences"
                  style={[s.usernameInput, { minHeight: 80 }]}
                />
              </View>

              <View style={{ marginBottom: Spacing.md }}>
                <Text style={s.inputLabel}>COLLEGE / UNIVERSITY (OPTIONAL)</Text>
                <TextInput
                  value={college}
                  onChangeText={setCollege}
                  placeholder="IIT Bombay, BITS Pilani..."
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="words"
                  style={s.usernameInput}
                />
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={s.stepContent}>
              <Text style={s.stepIntro}>
                Pick your tech stack. This helps other developers find you.
              </Text>
              <Text style={s.selectedCount}>
                {selectedStack.length} selected
              </Text>
              <View style={s.stackGrid}>
                {ALL_STACKS.map(skill => (
                  <TouchableOpacity
                    key={skill}
                    style={[s.stackChip, selectedStack.includes(skill) && s.stackChipActive]}
                    onPress={() => toggleStack(skill)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.stackChipText, selectedStack.includes(skill) && s.stackChipTextActive]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={s.stepContent}>
              <Text style={s.stepIntro}>
                Add your GitHub and LinkedIn so others can see your real work.
              </Text>

              <View style={s.linkInput}>
                <View style={s.linkIcon}>
                  <Text style={s.linkIconText}>⌥</Text>
                </View>
                <View style={{ flex: 1, marginBottom: Spacing.md }}>
                  <Text style={s.inputLabel}>GITHUB URL</Text>
                  <TextInput
                    value={githubUrl}
                    onChangeText={setGithubUrl}
                    placeholder="https://github.com/username"
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="none"
                    style={s.usernameInput}
                  />
                </View>
              </View>

              <View style={s.linkInput}>
                <View style={[s.linkIcon, { backgroundColor: '#0A66C2' }]}>
                  <Text style={s.linkIconText}>in</Text>
                </View>
                <View style={{ flex: 1, marginBottom: Spacing.md }}>
                  <Text style={s.inputLabel}>LINKEDIN URL (OPTIONAL)</Text>
                  <TextInput
                    value={linkedinUrl}
                    onChangeText={setLinkedinUrl}
                    placeholder="https://linkedin.com/in/username"
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="none"
                    style={s.usernameInput}
                  />
                </View>
              </View>

              <View style={s.preview}>
                <Text style={s.previewLabel}>PREVIEW</Text>
                <View style={s.previewCard}>
                  <View style={s.previewHeader}>
                    <Avatar username={username || 'you'} size={40} />
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <Text style={s.previewName}>{username || 'your_username'}</Text>
                      {!!college && <Text style={s.previewCollege}>{college}</Text>}
                    </View>
                  </View>
                  {!!bio && <Text style={s.previewBio} numberOfLines={2}>{bio}</Text>}

                  <View style={s.statsRow}>
                    <View style={s.statItem}>
                      <Text style={s.statIcon}>⑂</Text>
                      <Text style={s.statCount}>0</Text>
                      <Text style={s.statLabel}>forks</Text>
                    </View>
                    <View style={s.statItem}>
                      <Text style={s.statIcon}>★</Text>
                      <Text style={s.statCount}>0</Text>
                      <Text style={s.statLabel}>stars</Text>
                    </View>
                  </View>

                  {selectedStack.length > 0 && (
                    <View style={s.previewStack}>
                      {selectedStack.slice(0, 4).map((sk, index) => (
                        <View key={index} style={s.miniChip}>
                          <Text style={s.miniChipText}>{sk}</Text>
                        </View>
                      ))}
                      {selectedStack.length > 4 && (
                        <Text style={s.moreText}>+{selectedStack.length - 4}</Text>
                      )}
                    </View>
                  )}

                  {!!earnedBadges.length && (
                    <View style={s.previewBadges}>
                      {earnedBadges.map(b => (
                        <View key={b.id} style={s.previewBadgeChip}>
                          <Text style={s.previewBadgeText}>{b.icon} {b.label}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {error !== '' && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <View style={s.navRow}>
            {step > 0 && (
              <Button
                label="Back"
                onPress={() => setStep(st => st - 1)}
                variant="secondary"
                style={{ flex: 1 }}
              />
            )}
            <Button
              label={step === STEPS.length - 1 ? 'Launch profile' : 'Continue'}
              onPress={step === STEPS.length - 1 ? handleSubmit : () => setStep(st => st + 1)}
              loading={loading}
              style={{
                flex: step > 0 ? 1 : undefined,
                opacity: canProceed() ? 1 : 0.4,
              }}
            />
          </View>

          {step === 0 && !canProceed() && username.length > 0 && (
            <Text style={s.disabledHint}>
              Choose an available username to continue
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: {
    padding: Spacing.xl, paddingBottom: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: theme.border,
  },
  headerTitle: {
    color: theme.textPrimary, fontSize: Typography.sizes.xl,
    fontWeight: '600', marginBottom: Spacing.lg,
  },
  progressSteps: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: theme.bgInput,
    borderWidth: 0.5, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { borderColor: theme.purple, backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.05)' },
  stepDotDone: { backgroundColor: theme.purple, borderColor: theme.purple },
  stepDotCheck: { color: isDark ? '#000' : '#fff', fontSize: 12, fontWeight: '600' },
  stepDotNum: { color: theme.textMuted, fontSize: Typography.sizes.xs, fontWeight: '500' },
  stepLabel: { color: theme.textMuted, fontSize: Typography.sizes.xs, marginLeft: 5 },
  stepLabelActive: { color: theme.purple, fontWeight: '500' },
  stepLine: { flex: 1, height: 0.5, backgroundColor: theme.border, marginHorizontal: 5 },
  stepLineActive: { backgroundColor: theme.purple },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xxxl, flexGrow: 1 },
  stepContent: { marginBottom: Spacing.xl },
  avatarPreview: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarHint: { color: theme.textMuted, fontSize: Typography.sizes.xs, marginTop: Spacing.sm, textAlign: 'center' },
  inputHint: { color: theme.textMuted, fontSize: Typography.sizes.xs, marginTop: 4, marginBottom: Spacing.sm },
  stepIntro: { color: theme.textSecondary, fontSize: Typography.sizes.base, lineHeight: 22, marginBottom: Spacing.lg },
  selectedCount: { color: theme.purple, fontSize: Typography.sizes.sm, fontWeight: '500', marginBottom: Spacing.md },
  stackGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stackChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.md, borderWidth: 0.5,
    borderColor: theme.border,
    backgroundColor: theme.bgInput,
  },
  stackChipActive: { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.05)', borderColor: theme.purple },
  stackChipText: { color: theme.textSecondary, fontSize: Typography.sizes.sm, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  stackChipTextActive: { color: theme.purple, fontWeight: '500' },
  linkInput: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: 4 },
  linkIcon: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.05)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 20,
  },
  linkIconText: { color: theme.purple, fontSize: Typography.sizes.sm, fontWeight: '600' },
  preview: { marginTop: Spacing.xl },
  previewLabel: {
    color: theme.textMuted, fontSize: Typography.sizes.xs,
    fontWeight: '500', letterSpacing: 0.8, marginBottom: Spacing.sm,
  },
  previewCard: {
    backgroundColor: theme.bgCard,
    borderWidth: 0.5, borderColor: theme.border,
    borderRadius: Radius.lg, padding: Spacing.lg,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  previewName: { color: theme.textPrimary, fontSize: Typography.sizes.md, fontWeight: '500' },
  previewCollege: { color: theme.purple, fontSize: Typography.sizes.xs, marginTop: 2 },
  previewBio: { color: theme.textSecondary, fontSize: Typography.sizes.sm, marginBottom: Spacing.md },
  previewStack: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  miniChip: {
    backgroundColor: theme.bgInput, borderWidth: 0.5,
    borderColor: theme.border, borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  miniChipText: { color: theme.textMuted, fontSize: Typography.sizes.xs, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  moreText: { color: theme.textMuted, fontSize: Typography.sizes.xs, alignSelf: 'center' },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 0.5, borderColor: theme.red,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { color: theme.red, fontSize: Typography.sizes.sm },
  navRow: { flexDirection: 'row', gap: Spacing.md },
  inputLabel: {
    color: theme.textMuted, fontSize: Typography.sizes.xs,
    letterSpacing: 0.5, fontWeight: '500', marginBottom: 5,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  usernameInput: {
    flex: 1,
    backgroundColor: theme.bgInput,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: theme.border,
    padding: Spacing.md,
    color: theme.textPrimary,
    fontSize: Typography.sizes.base,
    minHeight: 44,
  },
  inputBorderGreen: {
    borderColor: theme.green, borderWidth: 1,
  },
  inputBorderRed: {
    borderColor: theme.red, borderWidth: 1,
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
    color: theme.green, fontSize: 16, fontWeight: '700',
  },
  xmark: {
    color: theme.red, fontSize: 16, fontWeight: '700',
  },
  feedbackPill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    borderWidth: 0.5,
  },
  feedbackSuccess: {
    backgroundColor: isDark ? 'rgba(35, 134, 54, 0.15)' : 'rgba(35, 134, 54, 0.05)',
    borderColor: theme.green,
  },
  feedbackError: {
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.05)',
    borderColor: theme.red,
  },
  feedbackText: {
    fontSize: Typography.sizes.xs,
  },
  feedbackTextSuccess: {
    color: theme.green,
  },
  feedbackTextError: {
    color: theme.red,
  },
  suggestionsWrap: {
    marginTop: Spacing.md,
  },
  suggestionsLabel: {
    color: theme.textMuted, fontSize: Typography.sizes.xs,
    letterSpacing: 0.5, fontWeight: '500', marginBottom: Spacing.sm,
  },
  suggestionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.05)',
    borderWidth: 0.5, borderColor: theme.purple,
  },
  suggestionText: {
    color: theme.purple, fontSize: Typography.sizes.sm,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  badgesWrap: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: theme.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 0.5, borderColor: theme.border,
  },
  badgesLabel: {
    color: theme.textMuted, fontSize: Typography.sizes.xs,
    letterSpacing: 0.5, fontWeight: '500', marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, gap: Spacing.sm,
  },
  badgeIcon: { fontSize: 20 },
  badgeName: { color: theme.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  badgeReason: { color: theme.textMuted, fontSize: Typography.sizes.xs, marginTop: 1 },
  disabledHint: {
    color: theme.textMuted, fontSize: Typography.sizes.xs,
    textAlign: 'center', marginTop: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row', gap: Spacing.lg,
    marginBottom: Spacing.md, paddingTop: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  statIcon: { color: theme.textMuted, fontSize: 14 },
  statCount: { color: theme.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  statLabel: { color: theme.textMuted, fontSize: Typography.sizes.xs },
  previewBadges: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.md,
  },
  previewBadgeChip: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.05)',
    borderWidth: 0.5, borderColor: theme.purple,
  },
  previewBadgeText: {
    color: theme.purple, fontSize: Typography.sizes.xs, fontWeight: '500',
  },
});
