import { View, Text, Image, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '@/constants/theme';

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

const glassBorder = { borderWidth: 1, borderColor: Colors.border };

export function TimelineUpdate({ entry, isLast = false }: TimelineUpdateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.timelineLeft}>
        <View style={styles.dotContainer}>
          {entry.type === 'milestone' ? (
            <View style={styles.milestoneDot}>
              <Feather name="flag" size={12} color={Colors.textPrimary} />
            </View>
          ) : (
            <View style={styles.dot} />
          )}
        </View>
        {!isLast && (
          <LinearGradient
            colors={['rgba(0,240,255,0.6)', 'rgba(0,240,255,0.1)', 'rgba(88,28,135,0.2)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.line}
          />
        )}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.timestamp}>{entry.timestamp}</Text>
        <BlurView
          intensity={50}
          tint="dark"
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

const styles = StyleSheet.create({
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
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.5)',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  milestoneDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.5)',
  },
  line: {
    width: 3,
    flex: 1,
    marginTop: Spacing.xs,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: Spacing.sm,
  },
  timestamp: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  contentBox: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  contentInner: {
    padding: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  milestoneBox: {
    borderColor: 'rgba(0, 240, 255, 0.4)',
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
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
});
