/**
 * app/(auth)/completeprofilescreen.tsx — Complete Profile Screen
 *
 * ✅ Preserved: Supabase profile upsert, navigation to /(tabs)/
 * 🎨 Updated: Full UI redesign with stack selector, GitHub/LinkedIn inputs
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Input, Button, Avatar, SectionHeader } from '../../components/ui/UI';
import { sanitizeUsername, sanitizeBio, sanitizeUrl, isValidUsername } from '@/lib/sanitize';

const ALL_STACKS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++',
  'Go', 'Rust', 'Swift', 'Kotlin', 'PHP',
  'React', 'React Native', 'Flutter', 'Vue', 'Angular',
  'Node.js', 'Django', 'FastAPI', 'Spring', 'Laravel',
  'PostgreSQL', 'MongoDB', 'Redis', 'Supabase', 'Firebase',
  'HTML', 'CSS', 'TailwindCSS', 'Docker', 'AWS',
];

const STEPS = ['Identity', 'Stack', 'Links'];

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { updateOnboardingStatus } = useAuth();

  // ── State (preserved) ─────────────────────────────────────
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

  // ── Submit (preserved) ────────────────────────────────────
  async function handleSubmit() {
    if (!username.trim()) {
      setError('Username is required');
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

      // Check if username is taken (other than current user)
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .neq('id', user.id)
        .maybeSingle();
      
      if (existing) {
        throw new Error('Username already taken. Try another.');
      }

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: cleanUsername,
        bio: sanitizeBio(bio),
        college: college.trim(),
        skills: selectedStack,
        github_url: sanitizeUrl(githubUrl) ?? '',
        linkedin_url: sanitizeUrl(linkedinUrl) ?? '',
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      
      // ✅ (b) Save status to AsyncStorage
      await AsyncStorage.setItem('onboarding_complete', 'true');
      
      // ✅ (c) Update context state to trigger navigation swap
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
    if (step === 0) return username.trim().length >= 3;
    if (step === 1) return selectedStack.length >= 1;
    return true;
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Progress header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Complete your profile</Text>
          <View style={s.progressSteps}>
            {STEPS.map((label, i) => (
              <View key={i} style={s.stepItem}>
                <View style={[s.stepDot, i <= step && s.stepDotActive, i < step && s.stepDotDone]}>
                  {i < step
                    ? <Text style={s.stepDotCheck}>✓</Text>
                    : <Text style={[s.stepDotNum, i === step && { color: Colors.accent.glow }]}>{i + 1}</Text>
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
          {/* ── STEP 0: Identity ── */}
          {step === 0 && (
            <View style={s.stepContent}>
              <View style={s.avatarPreview}>
                <Avatar username={username || 'you'} size={64} />
                <Text style={s.avatarHint}>Your avatar is auto-generated from your username</Text>
              </View>

              <Input
                label="Username"
                value={username}
                onChangeText={text => { setUsername(sanitizeUsername(text)); setError(''); }}
                placeholder="tripathi_dev"
                autoCapitalize="none"
              />
              <Text style={s.inputHint}>Letters, numbers and underscores only</Text>

              <Input
                label="Bio"
                value={bio}
                onChangeText={setBio}
                placeholder="Building buildlog — Instagram for devs..."
                multiline
                autoCapitalize="sentences"
              />

              <Input
                label="College / University (optional)"
                value={college}
                onChangeText={setCollege}
                placeholder="IIT Bombay, BITS Pilani..."
                autoCapitalize="words"
              />
            </View>
          )}

          {/* ── STEP 1: Stack ── */}
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

          {/* ── STEP 2: Links ── */}
          {step === 2 && (
            <View style={s.stepContent}>
              <Text style={s.stepIntro}>
                Add your GitHub and LinkedIn so others can see your real work.
              </Text>

              <View style={s.linkInput}>
                <View style={s.linkIcon}>
                  <Text style={s.linkIconText}>⌥</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="GitHub URL"
                    value={githubUrl}
                    onChangeText={setGithubUrl}
                    placeholder="https://github.com/username"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={s.linkInput}>
                <View style={[s.linkIcon, { backgroundColor: Colors.pills.collab.bg }]}>
                  <Text style={s.linkIconText}>in</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="LinkedIn URL (optional)"
                    value={linkedinUrl}
                    onChangeText={setLinkedinUrl}
                    placeholder="https://linkedin.com/in/username"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Profile preview */}
              <View style={s.preview}>
                <Text style={s.previewLabel}>PREVIEW</Text>
                <View style={s.previewCard}>
                  <View style={s.previewHeader}>
                    <Avatar username={username || 'you'} size={40} />
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <Text style={s.previewName}>{username || 'your_username'}</Text>
                      {college && <Text style={s.previewCollege}>{college}</Text>}
                    </View>
                  </View>
                  {bio && <Text style={s.previewBio} numberOfLines={2}>{bio}</Text>}
                  {selectedStack.length > 0 && (
                    <View style={s.previewStack}>
                      {selectedStack.slice(0, 4).map((s, i) => (
                        <View key={i} style={s2.chip}>
                          <Text style={s2.chipText}>{s}</Text>
                        </View>
                      ))}
                      {selectedStack.length > 4 && (
                        <Text style={s2.more}>+{selectedStack.length - 4}</Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Error */}
          {error !== '' && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          {/* Navigation buttons */}
          <View style={s.navRow}>
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
              style={{ flex: step > 0 ? 1 : undefined }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
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
  inputHint: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs, marginTop: -8, marginBottom: Spacing.md },
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

const s2 = StyleSheet.create({
  chip: {
    backgroundColor: Colors.bg.tertiary, borderWidth: 0.5,
    borderColor: Colors.border.subtle, borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  chipText: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs, fontFamily: 'Courier New' },
  more: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs, alignSelf: 'center' },
});
