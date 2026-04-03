import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export interface Project {
  id: string;
  title: string;
  type: 'code' | 'design' | 'writing' | 'other';
  currentDay: number;
  totalDays: number;
  status: 'active' | 'completed';
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();
  
  const progress = project.currentDay / project.totalDays;
  const isActive = project.status === 'active';

  const renderIcon = () => {
    switch (project.type) {
      case 'code':
        return <Feather name="code" size={24} color={theme.purple} />;
      case 'design':
        return <MaterialCommunityIcons name="palette" size={24} color={theme.purple} />;
      case 'writing':
        return <Feather name="edit-3" size={24} color={theme.purple} />;
      default:
        return <Feather name="folder" size={24} color={theme.textSecondary} />;
    }
  };

  const handlePress = () => {
    router.push(`/project/${project.id}`);
  };

  return (
    <Pressable style={styles.wrapper} onPress={handlePress}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {renderIcon()}
          </View>
          <View style={[
            styles.statusBadge, 
            isActive ? styles.statusActive : styles.statusCompleted
          ]}>
            <Text style={[
              styles.statusText, 
              isActive ? styles.statusTextActive : styles.statusTextCompleted
            ]}>
              {isActive ? 'Active' : 'Completed'}
            </Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {project.title}
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressText}>Day {project.currentDay}/{project.totalDays}</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { 
                  width: `${progress * 100}%`,
                  backgroundColor: isActive ? theme.purple : theme.green 
                }
              ]}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function getStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
    wrapper: {
      marginBottom: Spacing.md,
      width: '100%',
    },
    inner: {
      padding: Spacing.lg,
      backgroundColor: theme.bgCard,
      borderWidth: 0.5,
      borderColor: theme.border,
      borderRadius: Radius.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    iconContainer: {
      width: 44,
      height: 44,
      backgroundColor: theme.bgInput,
      borderRadius: Radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: theme.border,
    },
    title: {
      color: theme.textPrimary,
      fontSize: Typography.sizes.base,
      fontWeight: '600',
      letterSpacing: -0.2,
      marginBottom: Spacing.md,
      minHeight: 44,
    },
    progressContainer: {
      gap: 6,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progressLabel: {
      color: theme.textMuted,
      fontSize: Typography.sizes.xs,
    },
    progressBar: {
      width: '100%',
      height: 6,
      backgroundColor: theme.bgInput,
      borderRadius: Radius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: Radius.full,
    },
    progressText: {
      color: theme.textSecondary,
      fontSize: Typography.sizes.xs,
      fontWeight: '500',
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    statusActive: {
      backgroundColor: isDark ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.05)',
      borderColor: isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.2)',
    },
    statusCompleted: {
      backgroundColor: isDark ? 'rgba(74,222,128,0.1)' : 'rgba(22,163,74,0.1)',
      borderColor: isDark ? 'rgba(74,222,128,0.3)' : 'rgba(22,163,74,0.2)',
    },
    statusText: {
      fontSize: Typography.sizes.xs,
      fontWeight: '600',
    },
    statusTextActive: {
      color: theme.purple,
    },
    statusTextCompleted: {
      color: theme.green,
    },
  });
}
