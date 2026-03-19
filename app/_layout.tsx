import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef } from 'react';
import 'react-native-reanimated';
import { View, ActivityIndicator, Animated, Platform, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

import '../global.css';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { MinecraftLoader } from '@/components/MinecraftLoader';

// 🛡️ SECURITY: Strip logs in production
if (!__DEV__) {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
}

// ⚠️ Global Error Boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Hidden logging for critical failures (optional)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <View style={{ borderWidth: 4, borderColor: '#FFF', padding: 24, backgroundColor: '#111' }}>
            <Text style={{ color: '#FF0000', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
              {'[ SYSTEM_FAILURE ]'}
            </Text>
            <Text style={{ color: '#FFF', fontFamily: 'monospace', fontSize: 12, marginTop: 16, textAlign: 'center' }}>
              KERNEL_PANIC: UNEXPECTED_EXCEPTION_DETECTED.
            </Text>
            <TouchableOpacity 
              onPress={() => router.replace('/login')}
              style={{ marginTop: 24, backgroundColor: '#FFF', padding: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#000', fontFamily: 'monospace', fontWeight: 'bold' }}>REBOOT_SYSTEM</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}


import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TouchableOpacity, Text } from 'react-native';

// 🎬 Retro Pixel-Fade Component
function PixelFade({ children }: { children: React.ReactNode }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, backgroundColor: '#000000' }}>
      {children}
    </Animated.View>
  );
}

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooting, setIsBooting] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const bootAnim = useRef(new Animated.Value(1)).current;
  const blinkAnim = useRef(new Animated.Value(0.2)).current;
  const segments = useSegments();
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  if (Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  const { userProfile, fetchUserProfile, isLoading: isStoreLoading, initialize: initializeStore } = useUserStore();

  // 🚀 Initialize Store Persistence (Ender Mode, etc)
  useEffect(() => {
    initializeStore();

    // 🎬 Pulse Animation for Boot Emblem
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
      ])
    );
    blink.start();

    // 🎬 Fake Boot Sequence
    const timer = setTimeout(() => {
      Animated.timing(bootAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setIsBooting(false);
        blink.stop();
      });
    }, 2200);

    return () => {
      clearTimeout(timer);
      blink.stop();
    };
  }, []);

  // Unified Profile Check Logic
  useEffect(() => {
    if (session && !userProfile && !isStoreLoading) {
      fetchUserProfile();
    }
  }, [session, userProfile, isStoreLoading]);

  // Sync isProfileComplete with global state
  useEffect(() => {
    if (session && userProfile) {
      const isComplete = !!(userProfile.username && userProfile.username.trim() !== '');
      setIsProfileComplete(isComplete);
    } else if (!session) {
      setIsProfileComplete(false);
    }
  }, [session, userProfile]);

  // 📡 Notification Registration
  useEffect(() => {
    if (Platform.OS !== 'web' && session && userProfile && !userProfile.expo_push_token) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          setExpoPushToken(token);
          // Save token to Supabase
          supabase.from('profiles').update({ expo_push_token: token }).eq('id', session.user.id);
        }
      });
    }

    if (Platform.OS !== 'web') {
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('📡 NOTIFICATION_RECEIVED:', notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        if (data?.projectId) {
          router.push(`/project/${data.projectId}`);
        }
      });
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [session, userProfile]);

  async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      const projectId = 
        Constants.expoConfig?.extra?.eas?.projectId ?? 
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.warn('📡 PUSH_NOTIFICATIONS: No projectId found in Constants. Skipping token capture.');
        return;
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      console.log('📡 PUSH_TOKEN_CAPTURED:', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }

  // Fix the Root Navigator Auth Listener - Bulletproof Version with Aggressive Logging
  useEffect(() => {
    // 1. Initial Check on App Load
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
        setIsLoading(false);
      } catch (error) {
        console.error('📡 BACKEND_INIT_FAILURE:', error);
        setBackendError(true);
        setIsLoading(false);
      }
    };

    initializeAuth();

    // 2. Listen for Sign-In / Sign-Out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setIsProfileComplete(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Force re-render when auth state changes to ensure navigation updates


  // Expo Router Redirect Logic
  useEffect(() => {
    if (!isLoading && !isStoreLoading) {
      const inAuthGroup = (segments as any).includes('(auth)');
      const inTabsGroup = (segments as any).includes('(tabs)');
      const inStackGroup = (segments as any).includes('(stack)');
      const inProjectGroup = (segments as any).includes('project');
      const inUserGroup = (segments as any).includes('user');
      const inProfileGroup = (segments as any).includes('profile');
      
      if (!session) {
        if (!inAuthGroup) {
          router.replace('/login');
        }
      } else {
        // Session exists
        if (!isProfileComplete) {
          // Check if not already on the setup screen to avoid loops
          const onSetupScreen = (segments as string[]).includes('CompleteProfileScreen');
          if (!onSetupScreen) {
            router.replace('/(auth)/CompleteProfileScreen');
          }
        } else {
          // Session exists and profile is complete
          // Allow internal routes (tabs, stack, project, user, profile)
          const isInternalRoute = inTabsGroup || inStackGroup || inProjectGroup || inUserGroup || inProfileGroup;
          
          if (inAuthGroup || !isInternalRoute) {
            router.replace('/(tabs)');
          }
        }
      }
    }
  }, [session, isProfileComplete, isLoading, isStoreLoading, segments]);

  // Aggressive Render State Logging


  // Simplified return statement for Expo Router
  if (backendError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <View style={{ borderWidth: 4, borderColor: '#FFF', padding: 24, backgroundColor: '#111', width: '100%' }}>
          <Text style={{ color: '#FF0000', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
            {'[ SIGNAL_LOST ]'}
          </Text>
          <Text style={{ color: '#FFF', fontFamily: 'monospace', fontSize: 12, marginTop: 16, textAlign: 'center' }}>
            CANNOT_REACH_MOTHERSHIP. CHECK_CREDENTIALS_OR_UPLINK.
          </Text>
          <TouchableOpacity 
            onPress={() => {
              setBackendError(false);
              setIsLoading(true);
              // Retry initialization would be here, but for now we reset state
            }}
            style={{ marginTop: 24, backgroundColor: '#FFF', padding: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#000', fontFamily: 'monospace', fontWeight: 'bold' }}>RETRY_UPLINK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading || (session && isStoreLoading && !userProfile)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <MinecraftLoader />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#000000' }} importantForAccessibility="no-hide-descendants">
        <ErrorBoundary>
          <PixelFade>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right', // 🕹️ Classic side-scroller feel
                contentStyle: { backgroundColor: '#000000' }, // 🌑 Forces dark background per screen
                animationDuration: 200, // ⚡ Snappy retro feel
              }}
            />
            <StatusBar style="light" />
          </PixelFade>
        </ErrorBoundary>

        {/* 🎮 Retro Boot Sequence Overlay */}
        {isBooting && (
          <Animated.View 
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill, 
              { 
                backgroundColor: '#000000', 
                zIndex: 999,
                opacity: bootAnim,
                justifyContent: 'center',
                alignItems: 'center'
              }
            ]}
          >
            {/* Blinking Emblem Background */}
            <View style={{ position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
              <Animated.Image 
                source={require('../assets/developer_emblem.png')}
                style={{
                  width: 200,
                  height: 200,
                  opacity: blinkAnim,
                  resizeMode: 'contain'
                }}
              />
            </View>

            {/* Scrolling Terminal Text */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ 
                fontFamily: 'monospace', 
                color: '#55FF55', 
                fontSize: 14,
                fontWeight: 'bold',
                letterSpacing: 1
              }}>
                {'> KERNEL_PANIC. REBOOTING...'}
              </Text>
              <Text style={{ 
                fontFamily: 'monospace', 
                color: '#55FF55', 
                fontSize: 10,
                opacity: 0.7,
                marginTop: 8
              }}>
                {'> INITIALIZING_PLAYER_BADGE...'}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaProvider>
  );
}
