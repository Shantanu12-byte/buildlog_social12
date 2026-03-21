import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { Colors } from '@/constants/theme';

interface AnimatedProgressBarProps {
  progress: number;
}

export default function AnimatedProgressBar({ progress }: AnimatedProgressBarProps) {
  // progress should be bounded between 0 and 1
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: clampedProgress,
      duration: 500, // exact 500ms
      easing: Easing.inOut(Easing.ease), // smooth easing
      useNativeDriver: false, // required since interpolating percentage width
    }).start();
  }, [clampedProgress, animatedWidth]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressBar}>
      <Animated.View
        style={[
          styles.progressFill,
          { width: widthInterpolation },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  progressBar: { 
    height: 4, 
    backgroundColor: '#222', 
    width: '100%', 
    borderRadius: 2, 
    overflow: 'hidden' 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: Colors.accent.primary 
  },
});
