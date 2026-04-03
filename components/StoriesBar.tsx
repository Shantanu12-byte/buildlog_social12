import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { FontSizes, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export interface Challenge {
  id: string;
  username: string;
  projectName: string;
  currentDay: number;
  totalDays: number;
  user_id?: string;
}

interface StoriesBarProps {
  challenges: Challenge[];
  onProfilePress?: (userId: string) => void;
}

export function StoriesBar({ challenges, onProfilePress }: StoriesBarProps) {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  if (challenges.length === 0) return null;

  const handlePress = (challenge: Challenge) => {
    if (challenge.user_id && onProfilePress) {
      onProfilePress(challenge.user_id);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {challenges.map((challenge) => {
          const label = `Day ${challenge.currentDay}`;

          return (
            <Pressable
              key={challenge.id}
              style={styles.storyItem}
              onPress={() => handlePress(challenge)}
            >
              <View style={styles.ring}>
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>
                    {challenge.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.label} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const RING_SIZE = 72;
const AVATAR_SIZE = 64;

function getStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
    container: {
      paddingVertical: Spacing.md,
      backgroundColor: theme.bg,
      borderBottomWidth: 4,
      borderBottomColor: theme.border,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      gap: Spacing.lg,
      alignItems: 'center',
    },
    storyItem: {
      alignItems: 'center',
    },
    ring: {
      width: 64,
      height: 64,
      backgroundColor: theme.bgInput,
      borderWidth: 2,
      borderTopColor: isDark ? '#FFFFFF' : theme.textMuted,
      borderLeftColor: isDark ? '#FFFFFF' : theme.textMuted,
      borderBottomColor: theme.border,
      borderRightColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarInner: {
      width: 48,
      height: 48,
      backgroundColor: theme.textSecondary,
      borderWidth: 2,
      borderTopColor: isDark ? '#FFFFFF' : theme.bg,
      borderLeftColor: isDark ? '#FFFFFF' : theme.bg,
      borderBottomColor: theme.borderLight,
      borderRightColor: theme.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: FontSizes.xl,
      fontFamily: 'monospace',
      fontWeight: 'bold',
    },
    label: {
      marginTop: Spacing.xs,
      color: theme.textSecondary,
      fontSize: 8,
      fontFamily: 'monospace',
      textTransform: 'uppercase',
    },
  });
}