import { Slot, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, Platform, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { WebSidebar } from '@/components/WebSidebar';
import { MinecraftLoader } from '@/components/MinecraftLoader';
import { Colors } from '@/constants/theme';

// 🛡️ SECURITY: Strip logs in production
if (!__DEV__) {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
}

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { CustomNotificationModal } from '@/components/CustomNotificationModal';

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
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const segments = useSegments();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  const { userProfile, fetchUserProfile, updateUserProfile, initialize: initializeStore } = useUserStore();

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
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🔔 NOTIFICATION HANDLERS
  useEffect(() => {
    if (!session || !userProfile) return;

    // Check if we need to show the modal
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

    // Listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 NOTIFICATION_RECEIVED:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('🔔 NOTIFICATION_CLICKED:', data);
      
      // Route to Inbox if it's a Secret Scroll or DM
      if (data?.type === 'secret_scroll' || data?.screen === 'inbox') {
        router.push({ 
          pathname: '/(tabs)/inbox', 
          params: { roomId: data?.roomId || data?.room_id } 
        } as any);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [session, userProfile]);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'web') return;
    
    if (!Device.isDevice) {
      console.warn('PUSH_ERROR: Must use physical device for push notifications');
      return;
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: '659c2596-f99a-4712-ae88-812165edb7d3', // Hardcoded project ID as per package/auth
      })).data;

      console.log('🔔 PUSH_TOKEN_ACQUIRED:', token);
      setExpoPushToken(token);
      
      // Sync with Supabase profiles table
      if (userProfile?.id) {
        await updateUserProfile({ expo_push_token: token });
      }
    } catch (e) {
      console.error('🔔 REGISTRATION_ERROR:', e);
    }
  };

  // 2. Secure Routing Logic
  useEffect(() => {
    if (isLoading) return;

    const segs = segments as string[];
    const inAuthGroup = segs.includes('(auth)');

    const handleRedirects = async () => {
      if (!session) {
        // No session: Go to Login
        if (!inAuthGroup) {
          router.replace('/(auth)/login');
        }
      } else {
        // Session exists: Check Profile
        try {
          // Fetch if not already in store
          if (!userProfile) {
            setProfileLoading(true);
            await fetchUserProfile();
            setProfileLoading(false);
          }
          
          const profile = userProfile;
          const isOnboarded = profile?.onboarding_complete || !!(profile?.username && profile.username.trim() !== '');

          if (!isOnboarded) {
            const onSetupScreen = segs.includes('CompleteProfileScreen');
            if (!onSetupScreen) {
              router.replace('/(auth)/CompleteProfileScreen');
            }
          } else {
            // Already onboarded: Go to Tabs if in auth or on root (but allow /devcard and public [username])
            const isAllowedRootScreen = segs.includes('devcard') || (segs.length === 1 && !segs[0].startsWith('('));
            if (!isAllowedRootScreen && (inAuthGroup || segs.length === 0 || segs[0] === '')) {
              router.replace('/(tabs)');
            }
          }
        } catch (error) {
          setProfileLoading(false);
        }
      }
    };

    handleRedirects();
  }, [session, userProfile, isLoading, segments]);

  // 3. Loading Splash Screen
  if (isLoading || profileLoading) {
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
        
        {/* Fixed Left Sidebar for Web */}
        {Platform.OS === 'web' && isDesktop && <WebSidebar />}

        {/* Center Wrapper: Ensures the 600px app is centered in remaining space */}
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
