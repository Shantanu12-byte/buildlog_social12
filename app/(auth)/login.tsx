import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Typography, Spacing, Radius } from '../../constants/theme';
import { Input, Button } from '../../components/ui/UI';
import { useTheme } from '@/context/ThemeContext';
import { checkRateLimit } from '@/lib/rateLimit';
import { sanitizeText } from '@/lib/sanitize';

export default function LoginScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  async function handleAuth() {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (!checkRateLimit('auth_attempt', 5, 60000)) {
      setError('Too many attempts. Please wait a moment.');
      return;
    }
    const cleanEmail = sanitizeText(email).toLowerCase();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (authError) throw authError;

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_complete, username')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }

          const isOnboarded = profile?.onboarding_complete || !!(profile?.username && profile.username.trim() !== '');

          if (isOnboarded) {
            router.replace('/(tabs)/' as any);
          } else {
            router.replace('/(auth)/CompleteProfileScreen' as any);
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({ 
          email: cleanEmail, 
          password,
        });
        if (error) throw error;
        
        router.replace('/(auth)/CompleteProfileScreen' as any);
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('user not found')) {
        setError('Invalid email or password');
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setError('Please verify your email before signing in');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setError(error.message);
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo + tagline */}
          <View style={s.hero}>
            <View style={s.logoMark}>
              <Text style={s.logoMarkText}>bl</Text>
            </View>
            <Text style={s.logoText}>
              build<Text style={{ color: theme.purple }}>log</Text>
            </Text>
            <Text style={s.tagline}>Where developers share what they're building</Text>
          </View>

          {/* Mode toggle */}
          <View style={s.modeToggle}>
            <TouchableOpacity
              style={[s.modeBtn, mode === 'login' && s.modeBtnActive]}
              onPress={() => { setMode('login'); setError(''); }}
            >
              <Text style={[s.modeBtnLabel, mode === 'login' && s.modeBtnLabelActive]}>
                Sign in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modeBtn, mode === 'signup' && s.modeBtnActive]}
              onPress={() => { setMode('signup'); setError(''); }}
            >
              <Text style={[s.modeBtnLabel, mode === 'signup' && s.modeBtnLabelActive]}>
                Create account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={s.form} accessibilityRole="form">
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              textContentType="emailAddress"
              autoComplete="email"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              textContentType="password"
              autoComplete="password"
            />

            {/* Error message */}
            {error !== '' && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* Forgot password */}
            {mode === 'login' && (
              <TouchableOpacity style={s.forgotRow} activeOpacity={0.7}>
                <Text style={s.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {/* Primary CTA */}
            <Button
              label={mode === 'login' ? 'Sign in' : 'Create account'}
              onPress={handleAuth}
              loading={loading}
              style={s.primaryBtn}
            />

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Google OAuth */}
            <TouchableOpacity
              style={s.googleBtn}
              onPress={handleGoogleAuth}
              activeOpacity={0.75}
            >
              <Text style={s.googleIcon}>G</Text>
              <Text style={s.googleText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
              <Text style={s.footerLink}>
                {mode === 'login' ? 'Sign up free' : 'Sign in'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social proof */}
          <View style={s.socialProof}>
            {['React', 'Flutter', 'Node.js', 'Python', 'Go', 'Rust'].map((tag, i) => (
              <View key={i} style={s.techTag}>
                <Text style={s.techTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  scroll: {
    flexGrow: 1, padding: Spacing.xl,
    paddingTop: Spacing.xxxl, paddingBottom: Spacing.xxxl,
  },
  hero: { alignItems: 'center', marginBottom: Spacing.xxxl },
  logoMark: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.05)',
    borderWidth: 1, borderColor: theme.purple,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoMarkText: {
    color: theme.purple,
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logoText: {
    fontSize: Typography.sizes.hero,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -1,
    marginBottom: Spacing.sm,
  },
  tagline: {
    color: theme.textSecondary,
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: theme.bgInput,
    borderWidth: 0.5, borderColor: theme.border,
    borderRadius: Radius.md, padding: 3,
    marginBottom: Spacing.xl,
  },
  modeBtn: {
    flex: 1, paddingVertical: 9,
    borderRadius: Radius.sm - 1,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: theme.bg,
    borderWidth: 0.5, borderColor: theme.purple,
  },
  modeBtnLabel: {
    color: theme.textSecondary,
    fontSize: Typography.sizes.base,
    fontWeight: '500',
  },
  modeBtnLabelActive: { color: theme.purple },
  form: { marginBottom: Spacing.xl },
  errorBox: {
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.05)',
    borderWidth: 0.5, borderColor: theme.red,
    borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { color: theme.red, fontSize: Typography.sizes.sm },
  forgotRow: { alignItems: 'flex-end', marginBottom: Spacing.md, marginTop: -6 },
  forgotText: { color: theme.purple, fontSize: Typography.sizes.sm },
  primaryBtn: { marginTop: Spacing.sm },
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md, marginVertical: Spacing.lg,
  },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: theme.border },
  dividerText: { color: theme.textMuted, fontSize: Typography.sizes.sm },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.md, backgroundColor: theme.bgInput,
    borderWidth: 0.5, borderColor: theme.border,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  googleIcon: {
    color: theme.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: '700',
    width: 22, textAlign: 'center',
  },
  googleText: { color: theme.textPrimary, fontSize: Typography.sizes.base, fontWeight: '500' },
  footer: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginBottom: Spacing.xxxl,
  },
  footerText: { color: theme.textSecondary, fontSize: Typography.sizes.sm },
  footerLink: { color: theme.purple, fontSize: Typography.sizes.sm, fontWeight: '500' },
  socialProof: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 8,
  },
  techTag: {
    backgroundColor: theme.bgInput,
    borderWidth: 0.5, borderColor: theme.border,
    borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 5,
  },
  techTagText: { color: theme.textSecondary, fontSize: Typography.sizes.xs, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
