import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/store/userStore';
import { FontSizes, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export function MinecraftLoader() {
  const { theme, isDark } = useTheme();
  const { isEnderMode, toggleEnderMode } = useUserStore();
  
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
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: isEnderMode ? '#FFD700' : theme.purple }]}>
        BUILDLOG
      </Text>
      
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={handleTap}
        style={[
          styles.progressContainer, 
          { 
            borderColor: isEnderMode ? '#FFD700' : theme.border, 
            backgroundColor: theme.bgInput 
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.progressBar, 
            { 
              width: barWidth, 
              backgroundColor: isEnderMode ? '#FFD700' : theme.green,
            }
          ]} 
        />
      </TouchableOpacity>

      <Text style={[styles.phrase, { color: theme.textSecondary }]}>
        {phrases[phraseIndex]}
      </Text>

      {tapCount > 0 && (
        <Text style={[styles.debugText, { color: theme.green }]}>
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
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 48,
    fontWeight: '900',
    marginBottom: Spacing['3xl'],
    letterSpacing: 8,
  },
  progressContainer: {
    width: '80%',
    height: 32,
    borderWidth: 2,
    padding: 4,
    marginBottom: Spacing.xl,
    borderRadius: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  phrase: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: FontSizes.xs,
    letterSpacing: 2,
    fontWeight: '800',
    textAlign: 'center',
  },
  debugText: {
    position: 'absolute',
    bottom: 50,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    opacity: 0.5,
    fontWeight: '800',
  }
});
