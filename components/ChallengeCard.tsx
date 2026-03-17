import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, FontSizes, Spacing } from '@/constants/theme';

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
const glassBorder = { borderWidth: 1, borderColor: Colors.border };

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const progress = challenge.currentDay / challenge.totalDays;
  const filledSegments = Math.round(progress * SEGMENT_COUNT);

  const content = (
    <>
      <View style={[styles.avatarContainer, glassBorder]}>
        <Text style={styles.avatarText}>{challenge.username.charAt(0).toUpperCase()}</Text>
      </View>

      <Text style={styles.username} numberOfLines={1}>{challenge.username}</Text>
      <Text style={styles.projectName} numberOfLines={1}>{challenge.projectName}</Text>

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

      <View style={[styles.sprintBadge, glassBorder]}>
        <Text style={styles.sprintText}>{challenge.totalDays}-Day Sprint</Text>
      </View>
    </>
  );

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={50} tint="dark" style={[styles.blur, glassBorder]}>
        <View style={styles.inner}>{content}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 240, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
  },
  username: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  projectName: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
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
  },
  segment: {
    flex: 1,
    borderRadius: 2,
  },
  segmentFilled: {
    backgroundColor: Colors.primary,
  },
  segmentEmpty: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
  },
  sprintBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  sprintText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
});
