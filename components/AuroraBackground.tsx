import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

/**
 * MinimalBackground - Clean, solid background
 * Replaces the aurora gradient with a theme-aware background
 */
export function AuroraBackground() {
  const { theme } = useTheme();
  
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]} />
    </View>
  );
}

const styles = StyleSheet.create({});