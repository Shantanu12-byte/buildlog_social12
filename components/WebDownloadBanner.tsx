import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Typography, Spacing, Radius } from '@/constants/theme';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

export function WebDownloadBanner() {
  const { theme, isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    // Check local storage if user dismissed it
    const dismissed = localStorage.getItem('codenid_app_download_dismissed_v2');
    if (!dismissed) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible || Platform.OS !== 'web') return null;

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('codenid_app_download_dismissed_v2', 'true');
  };

  const handleDownload = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        (window as any).deferredPrompt = null;
        setIsVisible(false);
      }
    } else {
      window.alert('To install the web app:\n\n1. On Chrome (Android/Desktop): Look for the "Install" icon in the address bar.\n2. On Safari (iOS): Tap the Share button and select "Add to Home Screen".');
    }
  };

  const bannerStyles = [
    styles.container, 
    { 
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      borderColor: theme.purple,
      shadowColor: theme.purple,
      left: width < 768 ? Spacing.xl : undefined,
      right: Spacing.xl,
      width: width >= 768 ? 380 : undefined,
      // @ts-ignore - web only
      backdropFilter: 'blur(12px)',
    }
  ];

  return (
    <Animated.View 
      entering={FadeInUp.duration(400)} 
      exiting={FadeOutUp.duration(300)}
      style={bannerStyles as any}
    >
      <View style={styles.content}>
        <Image 
          source={require('@/assets/codenid_logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Install CodeNid Web App
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Add to your home screen.
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.downloadBtn, { backgroundColor: theme.purple }]}
          onPress={handleDownload}
        >
          <Text style={styles.downloadText}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.closeBtn}
          onPress={handleDismiss}
        >
          <Feather name="x" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Spacing.xl,
    right: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    zIndex: 99999,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
  },
  downloadBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginRight: Spacing.sm,
  },
  downloadText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: Typography.sizes.sm,
  },
  closeBtn: {
    padding: Spacing.xs,
  }
});
