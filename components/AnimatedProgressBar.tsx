import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface AnimatedProgressBarProps {
  progress: number;
}

export default function AnimatedProgressBar({ progress }: AnimatedProgressBarProps) {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: clampedProgress,
      duration: 500, 
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
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

function getStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
    progressBar: { 
      height: 4, 
      backgroundColor: theme.bgInput, 
      width: '100%', 
      borderRadius: 2, 
      overflow: 'hidden' 
    },
    progressFill: { 
      height: '100%', 
      backgroundColor: theme.purple 
    },
  });
}
