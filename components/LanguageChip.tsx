import React, { useRef } from 'react';
import { Text, StyleSheet, Animated, Pressable, View, ViewStyle, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '@/constants/theme';

interface LanguageChipProps {
  name: string;
  icon?: string;
  style?: ViewStyle;
}

const getLanguageIcon = (name: string): any => {
  const lang = name.toLowerCase();
  if (lang.includes('javascript') || lang === 'js') return 'language-javascript';
  if (lang.includes('typescript') || lang === 'ts') return 'language-typescript';
  if (lang.includes('python')) return 'language-python';
  if (lang.includes('java') && !lang.includes('script')) return 'language-java';
  if (lang.includes('cpp') || lang.includes('c++')) return 'language-cpp';
  if (lang.includes('csharp') || lang.includes('c#')) return 'language-csharp';
  if (lang.includes('go')) return 'language-go';
  if (lang.includes('rust')) return 'language-rust';
  if (lang.includes('ruby')) return 'language-ruby';
  if (lang.includes('swift')) return 'language-swift';
  if (lang.includes('php')) return 'language-php';
  if (lang.includes('html')) return 'language-html5';
  if (lang.includes('css')) return 'language-css3';
  return 'code-tags';
};

export const LanguageChip = ({ name, icon, style }: LanguageChipProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const iconName = icon || getLanguageIcon(name);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.chip}
      >
        <MaterialCommunityIcons name={iconName} size={16} color={Colors.accentGold} />
        <Text style={styles.text}>{name.toUpperCase()}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 2,
    borderColor: '#333333',
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
    gap: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  text: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
