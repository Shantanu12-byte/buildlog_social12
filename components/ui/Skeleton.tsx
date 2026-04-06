import React, { useEffect } from 'react';
import { View, Animated, StyleSheet, Easing, Platform, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { Radius } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  circle?: boolean;
  style?: ViewStyle;
}

/**
 * SkeletonShimmer - Base animated shimmer layer
 */
export function SkeletonShimmer({ children, style }: { children?: React.ReactNode; style?: ViewStyle }) {
  const { theme, isDark } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    ).start();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-400, 400],
  });

  return (
    <View style={[styles.shimmerContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f0f2f5' }, style]}>
      <Animated.View style={[styles.shimmerGradient, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={isDark 
            ? ['transparent', 'rgba(255,255,255,0.05)', 'transparent'] 
            : ['transparent', 'rgba(0,0,0,0.05)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {children}
    </View>
  );
}

/**
 * SkeletonRect - Rectangular ghost block
 */
export function SkeletonRect({ width = '100%', height = 20, borderRadius = Radius.md, style }: SkeletonProps) {
  const { isDark } = useTheme();
  return (
    <SkeletonShimmer style={[{ width, height, borderRadius }, style] as any} />
  );
}

/**
 * SkeletonCircle - Round ghost block
 */
export function SkeletonCircle({ size = 48, style }: { size?: number; style?: ViewStyle }) {
  return (
    <SkeletonRect width={size} height={size} borderRadius={size / 2} style={style} />
  );
}

const styles = StyleSheet.create({
  shimmerContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerGradient: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
  },
});
