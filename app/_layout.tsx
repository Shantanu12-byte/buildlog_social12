import { Slot, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, Platform, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { WebSidebar } from '@/components/WebSidebar';
import { MinecraftLoader } from '@/components/MinecraftLoader';

// 🛡️ SECURITY: Strip logs in production
if (!__DEV__) {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
}

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const segments = useSegments();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  const { userProfile, fetchUserProfile, initialize: initializeStore } = useUserStore();

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
            // Already onboarded: Go to Tabs if in auth or on root
            if (inAuthGroup || segs.length === 0 || segs[0] === '') {
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
    <SafeAreaProvider style={{ backgroundColor: '#000', flex: 1 }}>
      <View style={[styles.root, { flexDirection: isDesktop ? 'row' : 'column' }]}>
        
        {/* Fixed Left Sidebar for Web */}
        {Platform.OS === 'web' && isDesktop && <WebSidebar />}

        {/* Center Wrapper: Ensures the 600px app is centered in remaining space */}
        <View style={styles.centerWrapper}>
          <View style={styles.mainContent}>
            <Slot />
            <StatusBar style="light" />
          </View>
        </View>

      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
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
    backgroundColor: '#000',
  },
  centerWrapper: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#000',
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#1A1A1A',
  },
});
