/**
 * buildlog — Shared Components
 * All reusable UI atoms and molecules live here.
 * Import from here, never duplicate.
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, getAvatarColor, getInitials } from '../../constants/theme';

// ─────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────
interface AvatarProps {
  username: string;
  size?: number;
  style?: ViewStyle;
}
export function Avatar({ username, size = 36, style }: AvatarProps) {
  const colors = getAvatarColor(username);
  return (
    <View style={[{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colors.bg,
      alignItems: 'center', justifyContent: 'center',
    }, style]}>
      <Text style={{ color: colors.text, fontSize: size * 0.35, fontWeight: '500' }}>
        {getInitials(username)}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────────────────────
type PillType = 'building' | 'collab' | 'campus' | 'challenge' | 'done';
interface PillProps { type: PillType; label: string }
export function StatusPill({ type, label }: PillProps) {
  const c = Colors.pills[type];
  return (
    <View style={{
      backgroundColor: c.bg, borderColor: c.border,
      borderWidth: 0.5, borderRadius: Radius.full,
      paddingHorizontal: 8, paddingVertical: 2,
    }}>
      <Text style={{ color: c.text, fontSize: Typography.sizes.xs, fontWeight: '500' }}>
        {label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────
interface ProgressBarProps { percent: number; color?: string }
export function ProgressBar({ percent, color = Colors.accent.primary }: ProgressBarProps) {
  const clamp = Math.min(100, Math.max(0, percent));
  const barColor = clamp >= 100 ? Colors.success : color;
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={s.mutedText}>Progress</Text>
        <Text style={{ color: barColor, fontSize: Typography.sizes.xs, fontWeight: '500' }}>
          {clamp}%
        </Text>
      </View>
      <View style={{ height: 3, backgroundColor: Colors.bg.tertiary, borderRadius: 3 }}>
        <View style={{ width: `${clamp}%`, height: 3, backgroundColor: barColor, borderRadius: 3 }} />
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
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}
export function Button({ label, onPress, variant = 'primary', loading, style, textStyle }: ButtonProps) {
  const bg = variant === 'primary' ? Colors.accent.primary
    : variant === 'secondary' ? Colors.bg.tertiary : 'transparent';
  const tc = variant === 'primary' ? '#fff'
    : variant === 'ghost' ? Colors.accent.glow : Colors.text.primary;
  const border = variant === 'ghost' ? Colors.border.accent : Colors.border.subtle;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[{
        backgroundColor: bg, borderColor: border,
        borderWidth: 0.5, borderRadius: Radius.md,
        paddingVertical: 10, paddingHorizontal: Spacing.lg,
        alignItems: 'center', justifyContent: 'center',
      }, style]}
    >
      {loading
        ? <ActivityIndicator color={tc} size="small" />
        : <Text style={[{ color: tc, fontSize: Typography.sizes.base, fontWeight: '500' }, textStyle]}>
            {label}
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
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ marginBottom: Spacing.md }}>
      {label && (
        <Text style={[s.mutedText, { marginBottom: 5, fontSize: Typography.sizes.xs, letterSpacing: 0.5 }]}>
          {label.toUpperCase()}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.tertiary}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        autoCapitalize={autoCapitalize || 'none'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[{
          backgroundColor: Colors.bg.input,
          borderColor: focused ? Colors.accent.primary : Colors.border.default,
          borderWidth: focused ? 1 : 0.5,
          borderRadius: Radius.md,
          padding: Spacing.md,
          color: Colors.text.primary,
          fontSize: Typography.sizes.base,
          minHeight: multiline ? 80 : 44,
        }, style]}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────
interface CardProps { children: React.ReactNode; style?: ViewStyle }
export function Card({ children, style }: CardProps) {
  return (
    <View style={[{
      backgroundColor: Colors.bg.secondary,
      borderColor: Colors.border.subtle,
      borderWidth: 0.5,
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
  return <View style={[{ height: 0.5, backgroundColor: Colors.border.subtle, marginVertical: Spacing.sm }, style]} />;
}

// ─────────────────────────────────────────────────────────────
// TAG (mono-font tech label)
// ─────────────────────────────────────────────────────────────
export function Tag({ label }: { label: string }) {
  return (
    <View style={{
      backgroundColor: Colors.bg.tertiary,
      borderColor: Colors.border.default,
      borderWidth: 0.5, borderRadius: Radius.sm,
      paddingHorizontal: 8, paddingVertical: 3,
    }}>
      <Text style={{ color: Colors.text.secondary, fontSize: Typography.sizes.xs, fontFamily: 'Courier New' }}>
        {label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────
export function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={[s.mutedText, {
      fontSize: Typography.sizes.xs, letterSpacing: 0.8,
      fontWeight: '500', marginBottom: Spacing.sm,
    }]}>
      {title.toUpperCase()}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────
// LOADING SCREEN
// ─────────────────────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg.primary, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.accent.primary} size="large" />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────
interface EmptyProps { icon?: string; title: string; subtitle?: string; action?: React.ReactNode }
export function EmptyState({ title, subtitle, action }: EmptyProps) {
  return (
    <View style={{ alignItems: 'center', padding: Spacing.xxxl }}>
      <View style={{
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: Colors.bg.tertiary,
        borderColor: Colors.border.default, borderWidth: 0.5,
        alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
      }}>
        <Text style={{ color: Colors.text.tertiary, fontSize: 20 }}>📂</Text>
      </View>
      <Text style={{ color: Colors.text.primary, fontSize: Typography.sizes.md, fontWeight: '500', marginBottom: 4 }}>
        {title}
      </Text>
      {subtitle && <Text style={[s.mutedText, { textAlign: 'center' }]}>{subtitle}</Text>}
      {action && <View style={{ marginTop: Spacing.lg }}>{action}</View>}
    </View>
  );
}

const s = StyleSheet.create({
  mutedText: {
    color: Colors.text.tertiary,
    fontSize: Typography.sizes.sm,
  },
});
