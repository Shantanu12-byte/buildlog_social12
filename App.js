import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './lib/supabase';

// Screens
// IMPORT_NOTE: Ensure these components handle navigation correctly
import LoginScreen from './app/(auth)/login'; 
import InterestsScreen from './components/InterestsScreen';
import MainFeed from './components/MainFeed';

const Stack = createNativeStackNavigator();

/**
 * App - The root navigation controller for the Buildlog app.
 * Handles the 3-step authentication flow: Logged Out, Onboarding, and Main Feed.
 */
export default function App() {
  const [session, setSession] = useState(null);
  const [onboardingComplete, setOnboardingComplete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Unified Onboarding Check implementation
  const checkOnboarding = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setOnboardingComplete(!!data?.onboarding_complete);
    } catch (err) { // Fallback if no profile is found
      if (onboardingComplete === null) setOnboardingComplete(false); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Single source of truth: Listen for auth state changes 
    // This fires immediately on mount with the current session in Supabase v2.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session) {
        await checkOnboarding(session.user.id);
      } else {
        setOnboardingComplete(null);
        setIsLoading(false);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session === null ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : onboardingComplete === false ? (
          <Stack.Screen name="Interests" component={InterestsScreen} />
        ) : (
          <Stack.Screen name="MainFeed" component={MainFeed} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000', // Matches Buildlog design system
  },
});
