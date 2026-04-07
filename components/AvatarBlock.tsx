import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface AvatarBlockProps {
  url?: string | null;
  username?: string;
  size?: number;
  tier?: string;
}

const TIER_COLORS: Record<string, string> = {
  Architect: '#00E5FF',
  Legend: '#FFD700',
  Default: '#55FF55',
};

export const AvatarBlock = ({ url, username = '?', size = 40, tier = 'Default' }: AvatarBlockProps) => {
  const fallbackChar = username.charAt(0).toUpperCase();
  const accentColor = TIER_COLORS[tier] || TIER_COLORS.Default;

  return (
    <View style={[
      styles.container, 
      { width: size, height: size, borderRadius: size / 2 }
    ]}>
      {url ? (
        <Image 
          source={{ uri: url }} 
          style={styles.image} 
          contentFit="cover"
          transition={200}
          priority="high"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={styles.fallback}>
          <Image 
            source={require('../assets/codenid_logo.png')}
            style={[StyleSheet.absoluteFill, { opacity: 0.2 }]}
            contentFit="contain"
          />
          <Text style={[styles.fallbackText, { color: accentColor }]}>
            {fallbackChar}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#222',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  fallbackText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
