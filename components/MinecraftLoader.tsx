import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/store/userStore';
import { getThemeColors, FontSizes, Spacing } from '@/constants/theme';

export function MinecraftLoader() {
  const { isEnderMode, toggleEnderMode } = useUserStore();
  const colors = getThemeColors(isEnderMode);
  
  const [tapCount, setTapCount] = useState(0);
  const [progress] = useState(new Animated.Value(0));

  // Splash phrases based on mode
  const phrases = isEnderMode 
    ? ["ESCAPING THE VOID...", "COLLECTING ENDER PEARLS...", "DEFEATING THE DRAGON..."]
    : ["MINING RESOURCES...", "CRAFTING TOOLS...", "BUILDING THE WORLD..."];
    
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Rotate phrases
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % phrases.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [isEnderMode]);

  const handleTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    
    if (newCount === 10) {
      setTapCount(0);
      toggleEnderMode();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}>BUILD_LOG</Text>
      
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={handleTap}
        style={[styles.progressContainer, { borderColor: colors.primaryDark }]}
      >
        <Animated.View 
          style={[
            styles.progressBar, 
            { 
              width: barWidth, 
              backgroundColor: colors.accentEmerald,
              boxShadow: isEnderMode ? `0 0 10px ${colors.accentEmerald}` : 'none'
            }
          ]} 
        />
      </TouchableOpacity>

      <Text style={[styles.phrase, { color: colors.textSecondary }]}>
        {phrases[phraseIndex]}
      </Text>

      {tapCount > 0 && (
        <Text style={[styles.debugText, { color: colors.accentEmerald }]}>
          TAP_LOG: {tapCount}/10
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: FontSizes['5xl'],
    fontWeight: 'bold',
    marginBottom: Spacing['3xl'],
    letterSpacing: 4,
  },
  progressContainer: {
    width: '80%',
    height: 32,
    backgroundColor: '#1A1A1A',
    borderWidth: 4,
    borderTopColor: '#333333',
    borderLeftColor: '#333333',
    borderBottomColor: '#FFFFFF', // Bevel effect
    borderRightColor: '#FFFFFF',
    padding: 2,
    marginBottom: Spacing.xl,
  },
  progressBar: {
    height: '100%',
  },
  phrase: {
    fontFamily: 'monospace',
    fontSize: FontSizes.sm,
    letterSpacing: 2,
  },
  debugText: {
    position: 'absolute',
    bottom: 50,
    fontFamily: 'monospace',
    fontSize: 10,
    opacity: 0.5,
  }
});
