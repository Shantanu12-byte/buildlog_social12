import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSizes, Spacing } from '@/constants/theme';

interface CircularProgressBarProps {
  currentDay: number;
  totalDays: number;
  size?: number;
  strokeWidth?: number;
}

const SEGMENT_COUNT = 15;
const NEON_CYAN = '#00F0FF';
const NEON_PURPLE = 'rgba(160, 100, 255, 0.9)';

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
      <View style={styles.trackWrapper}>
        <LinearGradient
          colors={['rgba(0,240,255,0.15)', 'rgba(88,28,135,0.2)', 'rgba(0,240,255,0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.track}
        >
          <View style={styles.segmentBar}>
            {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
              i < filledSegments ? (
                <LinearGradient
                  key={i}
                  colors={[NEON_CYAN, NEON_PURPLE]}
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

const styles = StyleSheet.create({
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
    borderColor: 'rgba(0, 240, 255, 0.3)',
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
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  segmentEmpty: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    color: Colors.textPrimary,
    fontSize: FontSizes['4xl'],
    fontWeight: 'bold',
    textShadowColor: 'rgba(255,255,255,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  dayLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.base,
    marginTop: -Spacing.xs,
  },
});
