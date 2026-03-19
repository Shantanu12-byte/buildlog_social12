import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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

  useEffect(() => {
    // 1. INITIAL_LOAD: Check for existing auth session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        if (session) {
          // If logged in, check database for onboarding status
          await checkUserOnboarding(session.user.id);
        } else {
          // No session, ready to show Login
          setIsLoading(false);
        }
      } catch (err) {
        console.error('AUTH_INIT_ERROR:', err);
        setIsLoading(false);
      }
    };

    initializeAuth();

    // 2. AUTH_LISTENER: Hub for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session) {
        // Trigger onboarding check on fresh login or session refresh
        await checkUserOnboarding(session.user.id);
      } else {
        // Clear state on logout
        setOnboardingComplete(null);
        setIsLoading(false);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  /**
   * checkUserOnboarding - Queries the profiles table to see if user has finished setup.
   * @param {string} userId - The Supabase user UUID.
   */
  const checkUserOnboarding = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setOnboardingComplete(!!data?.onboarding_complete);
    } catch (err) {
      console.error('ONBOARDING_CHECK_FAILURE:', err);
      // Fallback to false to ensure user completes profile if check fails
      setOnboardingComplete(false); 
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * TRAFFIC_COP: Conditional Rendering for Authentication Flow
   */
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
          // STEP 1: LOGGED_OUT (Auth Stack)
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : onboardingComplete === false ? (
          // STEP 2: ONBOARDING (Profile Setup)
          <Stack.Screen name="Interests" component={InterestsScreen} />
        ) : (
          // STEP 3: MAIN_APP (Production Feed)
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
