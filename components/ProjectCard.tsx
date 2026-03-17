import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, FontSizes, Spacing } from '@/constants/theme';

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

const glassBorder = { borderWidth: 1, borderColor: Colors.border };

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const progress = project.currentDay / project.totalDays;
  const isActive = project.status === 'active';

  const renderIcon = () => {
    switch (project.type) {
      case 'code':
        return <Feather name="code" size={28} color={Colors.primary} />;
      case 'design':
        return <MaterialCommunityIcons name="palette" size={28} color={Colors.primary} />;
      case 'writing':
        return <Feather name="edit-3" size={28} color={Colors.primary} />;
      default:
        return <Feather name="folder" size={28} color={Colors.primary} />;
    }
  };

  const handlePress = () => {
    router.push(`/project/${project.id}`);
  };

  const content = (
    <>
      <View style={[styles.iconContainer, glassBorder]}>
        {renderIcon()}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {project.title}
      </Text>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, glassBorder]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
              !isActive && styles.progressFillCompleted,
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Day {project.currentDay}/{project.totalDays}
        </Text>
      </View>

      <View style={[
        styles.statusBadge,
        isActive ? styles.statusActive : styles.statusCompleted,
        glassBorder,
      ]}>
        <Text style={[
          styles.statusText,
          isActive ? styles.statusTextActive : styles.statusTextCompleted,
        ]}>
          {isActive ? 'Active' : 'Completed'}
        </Text>
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
    margin: Spacing.xs,
    flex: 1,
    aspectRatio: 1,
  },
  inner: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: '#333333',
    borderWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#111111',
    borderRightColor: '#111111',
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#444444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderTopColor: '#888888',
    borderLeftColor: '#888888',
    borderBottomColor: '#222222',
    borderRightColor: '#222222',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    minHeight: 36,
  },
  progressContainer: {
    marginBottom: Spacing.sm,
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#555555',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressFillCompleted: {
    backgroundColor: Colors.accentEmerald,
  },
  progressText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  statusActive: {
    backgroundColor: Colors.primary,
  },
  statusCompleted: {
    backgroundColor: Colors.accentEmerald,
  },
  statusText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  statusTextActive: {},
  statusTextCompleted: {},
});
