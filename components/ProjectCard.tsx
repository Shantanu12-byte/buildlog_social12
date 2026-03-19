import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

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
  const router = useRouter();
  const progress = project.currentDay / project.totalDays;
  const isActive = project.status === 'active';

  const renderIcon = () => {
    switch (project.type) {
      case 'code':
        return <Feather name="code" size={24} color={Colors.accent.primary} />;
      case 'design':
        return <MaterialCommunityIcons name="palette" size={24} color={Colors.accent.glow} />;
      case 'writing':
        return <Feather name="edit-3" size={24} color={Colors.accent.glow} />;
      default:
        return <Feather name="folder" size={24} color={Colors.text.secondary} />;
    }
  };

  const handlePress = () => {
    router.push(`/project/${project.id}`);
  };

  const content = (
    <>
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
              { width: `${progress * 100}%` },
              !isActive && styles.progressFillCompleted,
            ]}
          />
        </View>
      </View>
    </>
  );

  return (
    <Pressable style={styles.wrapper} onPress={handlePress}>
      <View style={styles.inner}>{content}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  inner: {
    padding: Spacing.lg,
    backgroundColor: Colors.bg.secondary,
    borderWidth: 0.5,
    borderColor: Colors.border.default,
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
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.border.subtle,
  },
  title: {
    color: Colors.text.primary,
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
    color: Colors.text.tertiary,
    fontSize: Typography.sizes.xs,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.primary,
    borderRadius: Radius.full,
  },
  progressFillCompleted: {
    backgroundColor: '#2EA043',
  },
  progressText: {
    color: Colors.text.secondary,
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
    backgroundColor: 'rgba(138,43,226,0.1)',
    borderColor: 'rgba(138,43,226,0.3)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(46,160,67,0.1)',
    borderColor: 'rgba(46,160,67,0.3)',
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#8A2BE2',
  },
  statusTextCompleted: {
    color: '#2EA043',
  },
});
