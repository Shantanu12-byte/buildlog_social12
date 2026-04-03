import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export interface TimelineEntry {
  id: string;
  timestamp: string;
  content: string;
  imageUrl?: string;
  type: 'photo' | 'text' | 'milestone';
}

interface TimelineUpdateProps {
  entry: TimelineEntry;
  isLast?: boolean;
}

export function TimelineUpdate({ entry, isLast = false }: TimelineUpdateProps) {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const glassBorder = { borderWidth: 1, borderColor: theme.border };

  return (
    <View style={styles.container}>
      <View style={styles.timelineLeft}>
        <View style={styles.dotContainer}>
          {entry.type === 'milestone' ? (
            <View style={styles.milestoneDot}>
              <Feather name="flag" size={12} color={theme.textPrimary} />
            </View>
          ) : (
            <View style={styles.dot} />
          )}
        </View>
        {!isLast && (
          <LinearGradient
            colors={isDark 
              ? ['rgba(0,240,255,0.6)', 'rgba(0,240,255,0.1)', 'rgba(88,28,135,0.2)']
              : [theme.purple, 'rgba(124,58,237,0.1)', 'transparent']
            }
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.line}
          />
        )}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.timestamp}>{entry.timestamp}</Text>
        <BlurView
          intensity={isDark ? 50 : 80}
          tint={isDark ? "dark" : "light"}
          style={[
            styles.contentBox,
            glassBorder,
            entry.type === 'milestone' && styles.milestoneBox,
          ]}
        >
          <View style={styles.contentInner}>
            {entry.imageUrl ? (
              <View style={[styles.imageContainer, glassBorder]}>
                <Image
                  source={{ uri: entry.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </View>
            ) : null}
            <Text style={styles.content}>{entry.content}</Text>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

function getStyles(theme: any, isDark: boolean) {
  const accentColor = isDark ? '#00F0FF' : theme.purple;
  
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      marginBottom: Spacing.md,
    },
    timelineLeft: {
      width: 24,
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    dotContainer: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: accentColor,
      borderWidth: 1,
      borderColor: accentColor,
      ...(Platform.OS === 'web'
        ? { boxShadow: `0 0 10px ${accentColor}4D` }
        : {
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
          }
      ),
    },
    milestoneDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(0, 240, 255, 0.25)' : 'rgba(124,58,237,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(0, 240, 255, 0.5)' : 'rgba(124,58,237,0.3)',
    },
    line: {
      width: 2,
      flex: 1,
      marginTop: Spacing.xs,
      borderRadius: 1,
    },
    contentContainer: {
      flex: 1,
      paddingBottom: Spacing.sm,
    },
    timestamp: {
      color: theme.textSecondary,
      fontSize: Typography.sizes.xs,
      marginBottom: Spacing.xs,
    },
    contentBox: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    contentInner: {
      padding: Spacing.md,
      backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.4)',
    },
    milestoneBox: {
      borderColor: isDark ? 'rgba(0, 240, 255, 0.4)' : 'rgba(124,58,237,0.3)',
    },
    imageContainer: {
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: Spacing.sm,
    },
    image: {
      width: '100%',
      height: 120,
      borderRadius: 8,
    },
    content: {
      color: theme.textPrimary,
      fontSize: Typography.sizes.sm,
      lineHeight: 20,
    },
  });
}
