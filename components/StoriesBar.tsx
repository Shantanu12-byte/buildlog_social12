import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Colors, FontSizes, Spacing } from '@/constants/theme';

export interface Challenge {
  id: string;
  username: string;
  projectName: string;
  currentDay: number;
  totalDays: number;
  user_id?: string;
}

interface StoriesBarProps {
  challenges: Challenge[];
  onProfilePress?: (userId: string) => void;
}

export function StoriesBar({ challenges, onProfilePress }: StoriesBarProps) {
  if (challenges.length === 0) return null;

  const handlePress = (challenge: Challenge) => {
    if (challenge.user_id && onProfilePress) {
      onProfilePress(challenge.user_id);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {challenges.map((challenge) => {
          const label = `Day ${challenge.currentDay}`;

          return (
            <Pressable
              key={challenge.id}
              style={styles.storyItem}
              onPress={() => handlePress(challenge)}
            >
              <View style={styles.ring}>
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>
                    {challenge.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.label} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const RING_SIZE = 72;
const AVATAR_SIZE = 64;

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    backgroundColor: '#000000',
    borderBottomWidth: 4,
    borderBottomColor: '#222222',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    alignItems: 'center',
  },
  storyItem: {
    alignItems: 'center',
  },
  ring: {
    width: 64,
    height: 64,
    backgroundColor: '#333333',
    borderWidth: 2,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#111111',
    borderRightColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 48,
    height: 48,
    backgroundColor: '#8B8B8B',
    borderWidth: 2,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#333333',
    borderRightColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: FontSizes.xl,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  label: {
    marginTop: Spacing.xs,
    color: '#AAAAAA',
    fontSize: 8,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
});