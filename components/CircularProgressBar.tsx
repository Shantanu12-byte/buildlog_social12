import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface CircularProgressBarProps {
  currentDay: number;
  totalDays: number;
  size?: number;
  strokeWidth?: number;
}

const SEGMENT_COUNT = 15;

export function CircularProgressBar({
  currentDay,
  totalDays,
  size = 200,
}: CircularProgressBarProps) {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  
  const progress = currentDay / totalDays;
  const filledSegments = Math.round(progress * SEGMENT_COUNT);
  
  const neonCyan = isDark ? '#00F0FF' : theme.purple;
  const neonPurple = isDark ? 'rgba(160, 100, 255, 0.9)' : theme.purple;

  return (
    <View style={[styles.container, { width: size }]}>
      <View style={styles.trackWrapper}>
        <LinearGradient
          colors={isDark 
            ? ['rgba(0,240,255,0.15)', 'rgba(88,28,135,0.2)', 'rgba(0,240,255,0.15)']
            : [theme.bgInput, theme.bgInput, theme.bgInput]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.track}
        >
          <View style={styles.segmentBar}>
            {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
              i < filledSegments ? (
                <LinearGradient
                  key={i}
                  colors={[neonCyan, neonPurple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.segment, styles.segmentFilled]}
                />
              ) : (
                <View key={i} style={[styles.segment, styles.segmentEmpty]} />
              )
            ))}
          </View>
        </LinearGradient>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.dayNumber}>{currentDay}</Text>
        <Text style={styles.dayLabel}>of {totalDays} days</Text>
      </View>
    </View>
  );
}

function getStyles(theme: any, isDark: boolean) {
  const accentColor = isDark ? '#00F0FF' : theme.purple;
  
  return StyleSheet.create({
    container: {
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
    },
    trackWrapper: {
      width: '100%',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(0, 240, 255, 0.3)' : theme.border,
    },
    track: {
      padding: 3,
    },
    segmentBar: {
      flexDirection: 'row',
      width: '100%',
      height: 24,
      gap: 2,
    },
    segment: {
      flex: 1,
      borderRadius: 4,
    },
    segmentFilled: {
      elevation: 5,
      ...(Platform.OS === 'web'
        ? { boxShadow: `0 0 10px ${accentColor}66` }
        : {
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
          }
      ),
    },
    segmentEmpty: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    textContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayNumber: {
      color: theme.textPrimary,
      fontSize: Typography.sizes['4xl'],
      fontWeight: 'bold',
      ...(isDark ? {
        textShadowColor: 'rgba(255,255,255,0.35)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      } : {}),
    },
    dayLabel: {
      color: theme.textSecondary,
      fontSize: Typography.sizes.base,
      marginTop: -Spacing.xs,
    },
  });
}
