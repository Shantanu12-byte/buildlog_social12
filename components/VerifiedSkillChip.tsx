/**
 * components/VerifiedSkillChip.tsx
 * Displays a skill with its verification state.
 * Used on profile, project cards, devcard, search results.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Radius } from '../constants/theme';
import { useTheme } from '@/context/ThemeContext';

export type SkillLevel = 'claimed' | 'beginner' | 'proficient' | 'community';

interface SkillChipProps {
  skill: string;
  level?: SkillLevel;
  onPress?: () => void;
  size?: 'sm' | 'md';
}

const getLevelConfig = (theme: any, isDark: boolean) => ({
  claimed: {
    bg: isDark ? '#1A2236' : '#E2E8F0',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    text: isDark ? '#A0AEC0' : '#4A5568',
    badge: null,
  },
  beginner: {
    bg: isDark ? '#1E3A5F' : '#DBEAFE',
    border: isDark ? '#1D4ED8' : '#3B82F6',
    text: isDark ? '#93C5FD' : '#1E40AF',
    badge: '✓',
  },
  proficient: {
    bg: isDark ? '#1E1B4B' : '#EDE9FE',
    border: isDark ? 'rgba(127,119,221,0.5)' : '#A78BFA',
    text: isDark ? '#AFA9EC' : '#5B21B6',
    badge: '✓✓',
  },
  community: {
    bg: isDark ? '#451A03' : '#FFEDD5',
    border: isDark ? '#92400E' : '#F97316',
    text: isDark ? '#FCD34D' : '#9A3412',
    badge: '⚡',
  },
});

export function VerifiedSkillChip({ skill, level = 'claimed', onPress, size = 'md' }: SkillChipProps) {
  const { theme, isDark } = useTheme();
  const config = getLevelConfig(theme, isDark)[level as keyof ReturnType<typeof getLevelConfig>] || getLevelConfig(theme, isDark).claimed;
  const isSm = size === 'sm';

  const content = (
    <View style={[
      s.chip,
      {
        backgroundColor: config.bg,
        borderColor: config.border,
        paddingHorizontal: isSm ? 7 : 10,
        paddingVertical: isSm ? 2 : 4,
      }
    ]}>
      {config.badge && (
        <Text style={[s.badge, { color: config.text, fontSize: isSm ? 8 : 10 }]}>
          {config.badge}
        </Text>
      )}
      <Text style={[s.skillText, { color: config.text, fontSize: isSm ? 9 : 11 }]}>
        {skill}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

/**
 * Shows a full skills section with verified + claimed split
 */
interface SkillsSectionProps {
  skills: string[];
  verifiedSkills: Record<string, SkillLevel>;
  onSkillPress?: (skill: string) => void;
}

export function VerifiedSkillsSection({ skills, verifiedSkills, onSkillPress }: SkillsSectionProps) {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  
  const verified = skills.filter(s => verifiedSkills[s] && verifiedSkills[s] !== 'claimed');
  const claimed = skills.filter(s => !verifiedSkills[s] || verifiedSkills[s] === 'claimed');

  return (
    <View>
      {verified.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>VERIFIED SKILLS</Text>
          <View style={styles.chipsRow}>
            {verified.map(skill => (
              <VerifiedSkillChip
                key={skill}
                skill={skill}
                level={verifiedSkills[skill]}
                onPress={onSkillPress ? () => onSkillPress(skill) : undefined}
              />
            ))}
          </View>
        </View>
      )}
      {claimed.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>CLAIMED (no proof yet)</Text>
          <View style={styles.chipsRow}>
            {claimed.map(skill => (
              <VerifiedSkillChip
                key={skill}
                skill={skill}
                level="claimed"
                onPress={onSkillPress ? () => onSkillPress(skill) : undefined}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.sm,
    borderWidth: 0.5,
  },
  badge: {
    fontWeight: '600',
  },
  skillText: {
    fontFamily: 'monospace',
    fontWeight: '500',
  },
});

function getStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
    group: {
      marginBottom: 12,
    },
    groupLabel: {
      fontSize: 9,
      fontWeight: '500',
      color: theme.textSecondary,
      letterSpacing: 0.8,
      marginBottom: 7,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
  });
}
