/**
 * buildlog — Shared Components
 * All reusable UI atoms and molecules live here.
 * Import from here, never duplicate.
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, ViewStyle, TextStyle, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Typography, Spacing, Radius, getAvatarColor, getInitials } from '../../constants/theme';
import { useTheme } from '@/context/ThemeContext';

// ─────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────
interface AvatarProps {
  username: string;
  uri?: string | null;
  size?: number;
  style?: ViewStyle;
}
export function Avatar({ username, uri, size = 36, style }: AvatarProps) {
  const { isDark } = useTheme();
  const colors = getAvatarColor(username, isDark);
  const [error, setError] = React.useState(false);

  const finalUri = React.useMemo(() => {
    if (!uri || !uri.includes('supabase.co/storage/v1/object/public/avatars/')) return uri;
    const separator = uri.includes('?') ? '&' : '?';
    return `${uri}${separator}t=${Date.now()}`;
  }, [uri]);

  const initials = (
    <Text style={{ 
      color: colors.text, 
      fontSize: size * 0.4, 
      fontWeight: '800',
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif'
    }}>
      {getInitials(username)}
    </Text>
  );

  return (
    <View style={[{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colors.bg,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.text + '20'
    }, style]}>
      {(!!finalUri && finalUri.trim() !== '' && !error) ? (
        <View style={StyleSheet.absoluteFill}>
          <Image 
            source={{ uri: finalUri }} 
            style={{ width: '100%', height: '100%' }} 
            contentFit="cover"
            transition={200}
            {...(Platform.OS === 'web' ? { crossOrigin: 'anonymous' } : {})}
            onError={(e) => {
              // Avatar load error handled silently
              setError(true);
            }}
          />
        </View>
      ) : initials}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────────────────────
type PillType = 'building' | 'collab' | 'campus' | 'challenge' | 'done' | 'tech' | 'design' | 'other';
interface PillProps { type: PillType; label: string; style?: ViewStyle }

export function StatusPill({ type, label, style }: PillProps) {
  const { theme, isDark } = useTheme();
  
  const getPillColors = (type: PillType) => {
    switch (type) {
      case 'tech': return { bg: theme.purpleGlow, border: theme.purpleGlow, text: theme.purple };
      case 'design': return { bg: isDark ? 'rgba(247,129,102,0.15)' : 'rgba(247,129,102,0.05)', border: theme.border, text: '#F78166' };
      case 'campus': return { bg: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.05)', border: theme.border, text: theme.green };
      case 'collab': return { bg: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.05)', border: theme.border, text: theme.green };
      case 'challenge': return { bg: theme.purpleGlow, border: theme.border, text: theme.purple };
      case 'building': return { bg: isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.05)', border: theme.border, text: isDark ? '#60a5fa' : '#2563eb' };
      case 'done': return { bg: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.05)', border: theme.border, text: theme.green };
      default: return { bg: theme.bgInput, border: theme.border, text: theme.textSecondary };
    }
  };

  const c = getPillColors(type);
  
  return (
    <View style={[{
      backgroundColor: c.bg, borderColor: c.border,
      borderWidth: 0.5, borderRadius: Radius.sm,
      paddingHorizontal: 8, paddingVertical: 2,
    }, style]}>
      <Text style={{ color: c.text, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────
interface ProgressBarProps { percent: number; color?: string; style?: ViewStyle }
export function ProgressBar({ percent, color, style }: ProgressBarProps) {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  
  const barColor = color || theme.purple;
  const clamp = Math.min(100, Math.max(0, percent));
  const finalColor = clamp >= 100 ? theme.green : barColor;
  
  return (
    <View style={style}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={s.mutedText}>PROGRESS</Text>
        <Text style={{ color: finalColor, fontSize: 10, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
          {clamp}%
        </Text>
      </View>
      <View style={{ height: 4, backgroundColor: theme.bgInput, borderRadius: 2, overflow: 'hidden', borderWidth: 0.5, borderColor: theme.border }}>
        <View style={{ width: `${clamp}%`, height: '100%', backgroundColor: finalColor }} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}
export function Button({ label, onPress, variant = 'primary', loading, style, textStyle, disabled }: ButtonProps) {
  const { theme, isDark } = useTheme();
  
  const getColors = () => {
    switch (variant) {
      case 'primary': return { bg: theme.purple, text: isDark ? '#000' : '#FFF', border: theme.purple };
      case 'secondary': return { bg: theme.bgInput, text: theme.textPrimary, border: theme.border };
      case 'danger': return { bg: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.05)', text: theme.red, border: theme.red };
      case 'ghost': return { bg: 'transparent', text: theme.purple, border: theme.purple };
      default: return { bg: theme.purple, text: '#FFF', border: theme.purple };
    }
  };

  const c = getColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled || loading}
      style={[{
        backgroundColor: c.bg, borderColor: c.border,
        borderWidth: 1, borderRadius: Radius.md,
        paddingVertical: 12, paddingHorizontal: Spacing.xl,
        alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.5 : 1
      }, style]}
    >
      {loading
        ? <ActivityIndicator color={c.text} size="small" />
        : <Text style={[{ color: c.text, fontSize: 14, fontWeight: '800', letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }, textStyle]}>
            {label.toUpperCase()}
          </Text>
      }
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────────────────────
interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  style?: ViewStyle;
  label?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}
export function Input({
  placeholder, value, onChangeText,
  secureTextEntry, multiline, style, label, autoCapitalize,
}: InputProps) {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const [focused, setFocused] = React.useState(false);
  
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      {label && (
        <Text style={[s.mutedText, { marginBottom: 6, fontSize: 10, fontWeight: '800', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
          {label.toUpperCase()}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        autoCapitalize={autoCapitalize || 'none'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[s.input, { 
          borderColor: focused ? theme.purple : theme.border, 
          borderWidth: 1, 
          minHeight: multiline ? 100 : 48 
        }, style] as any}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────
interface CardProps { children: React.ReactNode; style?: ViewStyle }
export function Card({ children, style }: CardProps) {
  const { theme } = useTheme();
  return (
    <View style={[{
      backgroundColor: theme.bgCard,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
    }, style]}>
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  const { theme } = useTheme();
  return <View style={[{ height: 1, backgroundColor: theme.border, marginVertical: Spacing.md }, style]} />;
}

// ─────────────────────────────────────────────────────────────
// TAG (mono-font tech label)
// ─────────────────────────────────────────────────────────────
export function Tag({ label }: { label: string }) {
  const { theme } = useTheme();
  return (
    <View style={{
      backgroundColor: theme.bgInput,
      borderColor: theme.border,
      borderWidth: 1, borderRadius: Radius.sm,
      paddingHorizontal: 8, paddingVertical: 4,
    }}>
      <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
        {label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────
export function SectionHeader({ title }: { title: string }) {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  return (
    <Text style={[s.mutedText, {
      fontSize: 11, letterSpacing: 1.5,
      fontWeight: '800', marginBottom: Spacing.md,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
    }]}>
      {title.toUpperCase()}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────
// LOADING SCREEN (NOW WITH SKELETON SUPPORT)
// ─────────────────────────────────────────────────────────────
import { FeedSkeleton } from '../skeletons/FeedSkeleton';
import { ProfileSkeleton } from '../skeletons/ProfileSkeleton';
import { ChallengesSkeleton } from '../skeletons/ChallengesSkeleton';
import { TavernSkeleton } from '../skeletons/TavernSkeleton';
import { SearchSkeleton } from '../skeletons/SearchSkeleton';
import { ProblemSolverSkeleton } from '../skeletons/ProblemSolverSkeleton';
import { FormSkeleton } from '../skeletons/FormSkeleton';

interface LoadingScreenProps {
  type?: 'feed' | 'profile' | 'challenges' | 'tavern' | 'search' | 'problem' | 'form';
  count?: number;
}

export function LoadingScreen({ type, count = 3 }: LoadingScreenProps) {
  const { theme } = useTheme();

  if (type === 'feed') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, padding: Spacing.md }}>
        {[...Array(count)].map((_, i) => <FeedSkeleton key={i} />)}
      </View>
    );
  }

  if (type === 'profile') {
    return <ProfileSkeleton />;
  }

  if (type === 'challenges') {
    return <ChallengesSkeleton />;
  }

  if (type === 'tavern') {
    return <TavernSkeleton />;
  }

  if (type === 'search') {
    return <SearchSkeleton />;
  }

  if (type === 'problem') {
    return <ProblemSolverSkeleton />;
  }

  if (type === 'form') {
    return <FormSkeleton />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={theme.purple} size="large" />
      <Text style={{ 
        marginTop: 16, 
        color: theme.purple, 
        fontSize: 10, 
        fontWeight: '900', 
        letterSpacing: 2,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' 
      }}>
        INITIALIZING_SYSTEM...
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────
interface EmptyProps { icon?: string; title: string; subtitle?: string; action?: React.ReactNode }
export function EmptyState({ icon = '📂', title, subtitle, action }: EmptyProps) {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  
  return (
    <View style={{ alignItems: 'center', padding: Spacing.xxxl, backgroundColor: theme.bg }}>
      <View style={{
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: theme.bgInput,
        borderColor: theme.border, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl,
      }}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '900', marginBottom: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
        {title.toUpperCase()}
      </Text>
      {subtitle && <Text style={[s.mutedText, { textAlign: 'center', maxWidth: '80%' }]}>{subtitle}</Text>}
      {action && <View style={{ marginTop: Spacing.xxl }}>{action}</View>}
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  mutedText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '600'
  },
  input: {
    backgroundColor: theme.bgInput,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: theme.textPrimary,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
});
