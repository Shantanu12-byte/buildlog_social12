/**
 * components/VerifiedSkillChip.tsx
 * Displays a skill with its verification state.
 * Used on profile, project cards, devcard, search results.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius } from '../constants/theme';

export type SkillLevel = 'claimed' | 'beginner' | 'proficient' | 'community';

interface SkillChipProps {
  skill: string;
  level?: SkillLevel;
  onPress?: () => void;
  size?: 'sm' | 'md';
}

const LEVEL_CONFIG = {
  claimed: {
    bg: '#1A2236',
    border: 'rgba(255,255,255,0.08)',
    text: '#4A5568',
    badge: null,
    label: null,
  },
  beginner: {
    bg: '#1E3A5F',
    border: '#1D4ED8',
    text: '#93C5FD',
    badge: '✓',
    label: null,
  },
  proficient: {
    bg: '#1E1B4B',
    border: 'rgba(127,119,221,0.5)',
    text: '#AFA9EC',
    badge: '✓✓',
    label: null,
  },
  community: {
    bg: '#451A03',
    border: '#92400E',
    text: '#FCD34D',
    badge: '⚡',
    label: null,
  },
};

export function VerifiedSkillChip({ skill, level = 'claimed', onPress, size = 'md' }: SkillChipProps) {
  const config = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.claimed;
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
  const verified = skills.filter(s => verifiedSkills[s] && verifiedSkills[s] !== 'claimed');
  const claimed = skills.filter(s => !verifiedSkills[s] || verifiedSkills[s] === 'claimed');

  return (
    <View>
      {verified.length > 0 && (
        <View style={s.group}>
          <Text style={s.groupLabel}>VERIFIED SKILLS</Text>
          <View style={s.chipsRow}>
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
        <View style={s.group}>
          <Text style={s.groupLabel}>CLAIMED (no proof yet)</Text>
          <View style={s.chipsRow}>
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
  group: {
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: Colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 7,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
