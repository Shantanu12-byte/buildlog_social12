import 'react-native-get-random-values';
import { Slot, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, Platform, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { getOrCreateKeyPair } from '@/lib/crypto';
import { useUserStore } from '@/store/userStore';
import { WebSidebar } from '@/components/WebSidebar';
import { MinecraftLoader } from '@/components/MinecraftLoader';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { registerPushNotifications } from '@/lib/push-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    <AuthProvider>
      <InnerRootLayout />
    </AuthProvider>
  );
}

function InnerRootLayout() {
  const { isOnboardingFinished, isLoading: authLoading, updateOnboardingStatus } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const segments = useSegments();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  const { userProfile, fetchUserProfile, updateUserProfile, initialize: initializeStore, profileFetched } = useUserStore();

  // 🔔 NOTIFICATION STATE
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // 1. Initialize Auth and Listen for Changes
  useEffect(() => {
    initializeStore();

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) getOrCreateKeyPair().catch(e => console.error('E2EE_INIT_ERROR:', e));
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) getOrCreateKeyPair().catch(e => console.error('E2EE_INIT_ERROR:', e));
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🔔 NOTIFICATION HANDLERS
  useEffect(() => {
    if (!session || !userProfile) return;

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
        // Notifications now stay on feed or go to specific post
        router.push('/(tabs)/' as any);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [session, userProfile]);

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
      if (userProfile?.id) {
        await updateUserProfile({ expo_push_token: token });
      }
    } catch (e) {
      console.error('🔔 REGISTRATION_ERROR:', e);
    }
  };

  // 2. Secure Routing Logic
  useEffect(() => {
    const handleRedirects = async () => {
      if (isLoading || authLoading) return;

      const segs = segments as string[];
      const inAuthGroup = segs.includes('(auth)');

      if (!session) {
        // Allow public access to /u/[username]
        const isPublicRoute = segs[0] === 'u';
        if (!inAuthGroup && !isPublicRoute) {
          router.replace('/(auth)/login');
        }
      } else {
        try {
          let profile = userProfile;
          if (!profile && !profileFetched) {
            setProfileLoading(true);
            await fetchUserProfile();
            profile = useUserStore.getState().userProfile;
            setProfileLoading(false);
          }
          
          // Sync local context with database status
          if (profile && profile.onboarding_complete !== isOnboardingFinished) {
            updateOnboardingStatus(!!profile.onboarding_complete);
          }

          if (profile?.id && Platform.OS === 'web') {
            registerPushNotifications(profile.id);
          }

          const isOnboarded = !!profile?.onboarding_complete;

          if (!isOnboarded) {
            const onSetupScreen = segs.includes('CompleteProfileScreen');
            if (!onSetupScreen) {
              router.replace('/(auth)/CompleteProfileScreen');
            }
          } else {
            const isAllowedRootScreen = (segs.length === 1 && !segs[0].startsWith('('));
            const isAuthAllowedScreen = segs.includes('CampusOnboarding');
            if (!isAllowedRootScreen && ((inAuthGroup && !isAuthAllowedScreen) || segs.length === 0 || segs[0] === '')) {
              router.replace('/(tabs)');
            }
          }
        } catch (error) {
          setProfileLoading(false);
        }
      }
    };

    handleRedirects();
  }, [session, userProfile, isLoading, authLoading, segments, isOnboardingFinished, profileFetched]);

  if (isLoading || profileLoading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <MinecraftLoader />
        <Text style={styles.loadingText}>SYNCHRONIZING_MOTHERSHIP...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: Colors.bg.primary, flex: 1 }}>
      <View style={[styles.root, { flexDirection: isDesktop ? 'row' : 'column', backgroundColor: Colors.bg.primary }]}>
        {Platform.OS === 'web' && isDesktop && <WebSidebar />}
        <View style={[styles.centerWrapper, { backgroundColor: Colors.bg.primary }]}>
          <View style={[styles.mainContent, { backgroundColor: Colors.bg.primary }]}>
            <Slot />
            <StatusBar style="light" />
            <CustomNotificationModal 
              visible={showNotificationModal}
              onAuthorize={() => {
                setShowNotificationModal(false);
                registerForPushNotificationsAsync();
              }}
              onCancel={() => setShowNotificationModal(false)}
            />
          </View>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    color: '#55FF55',
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 2,
  },
  root: {
    flex: 1,
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: Colors.border.subtle,
  },
});
