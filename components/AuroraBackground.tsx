import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

/**
 * MinimalBackground - Clean, solid background
 * Replaces the aurora gradient with a simple premium dark grey
 */
export function AuroraBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <View style={[StyleSheet.absoluteFill, styles.base]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.background,
  },
});