import 'react-native-get-random-values';
import { Slot, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, Platform, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { getOrCreateKeyPair } from '@/lib/crypto';
import { useUserStore } from '@/store/userStore';
import { MinecraftLoader } from '@/components/MinecraftLoader';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { registerPushNotifications } from '@/lib/push-notifications';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { CustomNotificationModal } from '@/components/CustomNotificationModal';

// 🛡️ SECURITY: Strip logs in production
if (!__DEV__) {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
}

// 🔔 NOTIFICATION HANDLER CONFIG
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InnerRootLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}

function InnerRootLayout() {
  const { isOnboardingFinished, isLoading: authLoading, updateOnboardingStatus } = useAuth();
  const segments = useSegments();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  const { 
    userProfile, 
    userId, 
    initialize: initializeStore, 
    profileFetched,
    updateUserProfile,
  } = useUserStore();

  const { theme, isDark } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(theme.bg, { duration: 300 }),
    };
  });

  // 🔔 NOTIFICATION STATE
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  const isInitialized = useRef(false);

  // 0. Inject Web Scrollbar Styles
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.innerHTML = `
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: ${isDark ? '#1a1a1a' : '#f1f5f9'};
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? '#333' : '#cbd5e1'};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#444' : '#94a3b8'};
        }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [isDark]);

  // 1. Initialize Global Store once
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    initializeStore();
    getOrCreateKeyPair().catch(() => {});
  }, []);

  // 🔔 NOTIFICATION HANDLERS
  useEffect(() => {
    if (!userId || !userProfile) return;

    const checkNotificationPermission = async () => {
      if (Platform.OS === 'web') return;
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus === 'undetermined' && !userProfile.expo_push_token) {
        setShowNotificationModal(true);
      } else if (existingStatus === 'granted' && !userProfile.expo_push_token) {
        registerForPushNotificationsAsync();
      }
    };

    checkNotificationPermission();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.type === 'secret_scroll') {
        router.push('/(tabs)/' as any);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [userId, userProfile]);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'web') return;
    if (!Device.isDevice) return;

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: '659c2596-f99a-4712-ae88-812165edb7d3',
      })).data;

      setExpoPushToken(token);
      if (userId) {
        await updateUserProfile({ expo_push_token: token });
      }
    } catch {
      // Push notification registration failed silently
    }
  };

  // 2. Secure Routing Logic
  useEffect(() => {
    const handleRedirects = async () => {
      if (!profileFetched || authLoading) return;

      const segs = segments as string[];
      const inAuthGroup = segs.includes('(auth)');
      const isPublicRoute = segs[0] === 'u';

      if (!userId) {
        if (!inAuthGroup && !isPublicRoute) {
          router.replace('/(auth)/login');
        }
      } else {
        const profile = userProfile;
        
        // Priority: If either the DB or the local Auth context says onboarding is done, trust it.
        const isOnboarded = !!profile?.onboarding_complete || isOnboardingFinished;

        if (profile && profile.onboarding_complete !== isOnboardingFinished) {
          updateOnboardingStatus(!!profile.onboarding_complete);
        }

        if (profile?.id && Platform.OS === 'web') {
          registerPushNotifications(profile.id);
        }

        if (!isOnboarded) {
          const onSetupScreen = segs.includes('CompleteProfileScreen');
          if (!onSetupScreen) {
            router.replace('/(auth)/CompleteProfileScreen');
          }
        } else {
          const isAllowedRootScreen = (segs.length === 1 && !segs[0].startsWith('('));
          const isAuthAllowedScreen = segs.includes('CampusOnboarding') || segs.includes('CompleteProfileScreen');
          
          if (!isAllowedRootScreen && ((inAuthGroup && !isAuthAllowedScreen) || segs.length === 0 || segs[0] === '')) {
            router.replace('/(tabs)');
          }
        }
      }
    };

    handleRedirects();
  }, [userId, userProfile, authLoading, segments, isOnboardingFinished, profileFetched]);

  const segs = segments as string[];
  const isPublicRoute = segs[0] === 'u';

  if ((!profileFetched || authLoading) && !isPublicRoute) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <MinecraftLoader />
        <Text style={[styles.loadingText, { color: theme.purple }]}>SYNCHRONIZING_MOTHERSHIP...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: theme.bg }}>
      <Animated.View style={[styles.root, animatedStyle, { flexDirection: 'column' }]}>
        <Animated.View style={[styles.centerWrapper, animatedStyle]}>
          <Animated.View style={[styles.mainContent, animatedStyle, { borderColor: theme.border }]}>
            <Slot />
            <StatusBar style={isDark ? "light" : "dark"} />
            <CustomNotificationModal 
              visible={showNotificationModal}
              onAuthorize={() => {
                setShowNotificationModal(false);
                registerForPushNotificationsAsync();
              }}
              onCancel={() => setShowNotificationModal(false)}
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
  },
  root: {
    flex: 1,
  },
  centerWrapper: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    width: '100%',
    // No fixed max-width here - handled by DesktopLayout or screen-specific containers
    borderLeftWidth: Platform.OS === 'web' ? 0.5 : 0,
    borderRightWidth: Platform.OS === 'web' ? 0.5 : 0,
  },
});
