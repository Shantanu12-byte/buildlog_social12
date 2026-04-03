import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export interface Challenge {
  id: string;
  username: string;
  projectName: string;
  currentDay: number;
  totalDays: number;
  user_id?: string;
}

interface ChallengeCardProps {
  challenge: Challenge;
}

const SEGMENT_COUNT = 10;

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  
  const progress = challenge.currentDay / challenge.totalDays;
  const filledSegments = Math.round(progress * SEGMENT_COUNT);
  const glassBorder = { borderWidth: 1, borderColor: theme.border };

  const content = (
    <>
      <View style={[styles.avatarContainer, glassBorder]}>
        <Text style={styles.avatarText}>{challenge.username.charAt(0).toUpperCase()}</Text>
      </View>

      <Text style={styles.username} numberOfLines={1}>{challenge.username}</Text>
      <Text style={styles.projectName} numberOfLines={1}>{challenge.projectName}</Text>

      <View style={styles.progressContainer}>
        <div style={styles.segmentBar}>
          {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                i < filledSegments ? styles.segmentFilled : styles.segmentEmpty,
              ]}
            />
          ))}
        </div>
        <Text style={styles.progressText}>
          {challenge.currentDay}/{challenge.totalDays}
        </Text>
      </View>

      <View style={[styles.sprintBadge, glassBorder]}>
        <Text style={styles.sprintText}>{challenge.totalDays}-Day Sprint</Text>
      </View>
    </>
  );

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={isDark ? 50 : 80} tint={isDark ? "dark" : "light"} style={[styles.blur, glassBorder]}>
        <View style={styles.inner}>{content}</View>
      </BlurView>
    </View>
  );
}

function getStyles(theme: any, isDark: boolean) {
  const accentColor = isDark ? '#00F0FF' : theme.purple;
  
  return StyleSheet.create({
    wrapper: {
      marginRight: Spacing.md,
      borderRadius: 16,
      overflow: 'hidden',
    },
    blur: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    inner: {
      padding: Spacing.md,
      width: 120,
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.4)',
    },
    avatarContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? 'rgba(0, 240, 255, 0.25)' : 'rgba(124,58,237,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    avatarText: {
      color: theme.textPrimary,
      fontSize: Typography.sizes.xl,
      fontWeight: 'bold',
    },
    username: {
      color: theme.textPrimary,
      fontSize: Typography.sizes.sm,
      fontWeight: '600',
      marginBottom: 2,
    },
    projectName: {
      color: theme.textSecondary,
      fontSize: Typography.sizes.xs,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    progressContainer: {
      width: '100%',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    segmentBar: {
      flexDirection: 'row',
      width: '100%',
      height: 12,
      gap: 2,
      marginBottom: Spacing.xs,
      display: 'flex',
    },
    segment: {
      flex: 1,
      borderRadius: 2,
    },
    segmentFilled: {
      backgroundColor: accentColor,
    },
    segmentEmpty: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    progressText: {
      color: theme.textSecondary,
      fontSize: Typography.sizes.xs,
    },
    sprintBadge: {
      backgroundColor: isDark ? 'rgba(0, 240, 255, 0.2)' : 'rgba(124,58,237,0.1)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: 9999,
    },
    sprintText: {
      color: accentColor,
      fontSize: 10,
      fontWeight: '600',
    },
  });
}
