import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing } from '@/constants/theme';

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
  strokeWidth = 12,
}: CircularProgressBarProps) {
  const progress = currentDay / totalDays;
  const filledSegments = Math.round(progress * SEGMENT_COUNT);

  return (
    <View style={[styles.container, { width: size }]}>
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
      <View style={styles.textContainer}>
        <Text style={styles.dayNumber}>{currentDay}</Text>
        <Text style={styles.dayLabel}>of {totalDays} days</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentBar: {
    flexDirection: 'row',
    width: '100%',
    height: 24,
    gap: 3,
    marginBottom: Spacing.md,
    borderWidth: 4,
    borderColor: '#000000',
    borderRadius: 0,
    padding: 2,
    backgroundColor: Colors.surface,
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
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    color: Colors.textPrimary,
    fontSize: FontSizes['4xl'],
    fontWeight: 'bold',
  },
  dayLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.base,
    marginTop: -Spacing.xs,
  },
});
