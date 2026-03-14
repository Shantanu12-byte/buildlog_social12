import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing, NeubrutalismShadow } from '@/constants/theme';

export interface Challenge {
  id: string;
  username: string;
  projectName: string;
  currentDay: number;
  totalDays: number;
}

interface ChallengeCardProps {
  challenge: Challenge;
}

const SEGMENT_COUNT = 10;

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const progress = challenge.currentDay / challenge.totalDays;
  const filledSegments = Math.round(progress * SEGMENT_COUNT);

  return (
    <View style={styles.container}>
      {/* User Avatar Placeholder */}
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{challenge.username.charAt(0).toUpperCase()}</Text>
      </View>

      {/* User and Project Info */}
      <Text style={styles.username} numberOfLines={1}>{challenge.username}</Text>
      <Text style={styles.projectName} numberOfLines={1}>{challenge.projectName}</Text>

      {/* Blocky segment bar - thick horizontal, Diamond Cyan filled, individual blocks */}
      <View style={styles.progressContainer}>
        <View style={styles.segmentBar}>
          {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                i < filledSegments ? styles.segmentFilled : styles.segmentEmpty,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>
          {challenge.currentDay}/{challenge.totalDays}
        </Text>
      </View>

      {/* Sprint Label */}
      <View style={styles.sprintBadge}>
        <Text style={styles.sprintText}>{challenge.totalDays}-DAY SPRINT</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 0,
    padding: Spacing.md,
    width: 120,
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 4,
    borderColor: '#000000',
    ...NeubrutalismShadow,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 0,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: '#000000',
  },
  avatarText: {
    color: '#000000',
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
  },
  username: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  projectName: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    textTransform: 'uppercase',
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
  },
  segment: {
    flex: 1,
    borderRadius: 0,
  },
  segmentFilled: {
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: '#000000',
  },
  segmentEmpty: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#000000',
  },
  progressText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontFamily: undefined,
  },
  sprintBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#000000',
  },
  sprintText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
