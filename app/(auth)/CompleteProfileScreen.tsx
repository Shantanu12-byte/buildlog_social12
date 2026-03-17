import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { Colors, FontSizes, Spacing } from '@/constants/theme';

export default function CompleteProfileScreen() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { fetchUserProfile } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    const getInitialUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUser(session.user);
    };
    getInitialUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setUser(session.user);
      else setUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCompleteProfile = async () => {
    if (!username.trim()) {
      Alert.alert('ERROR', 'PLEASE ENTER A USERNAME');
      return;
    }

    setLoading(true);
    try {
      let finalUserId = user?.id;

      // Fallback if state hasn't updated yet
      if (!finalUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        finalUserId = session?.user?.id;
      }

      if (!finalUserId) {
        throw new Error('SESSION_NOT_FOUND. PLEASE RE-LOGIN.');
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: finalUserId,
          username: username.trim().toLowerCase(),
        });

      if (error) throw error;
      
      // Update global state to trigger redirect in RootLayout
      await fetchUserProfile();
      
      Alert.alert('SUCCESS', 'PROFILE_DATA_SYNCED');
      // Root layout will transition once isProfileComplete state updates
    } catch (error: any) {
      console.error('Profile Completion Error:', error);
      Alert.alert('ERROR', error.message || 'FAILED_TO_SYNC_PROFILE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pixelBox}>
        <Text style={styles.title}>CHARACTER_SETUP</Text>
        <Text style={styles.subtitle}>CHOOSE_YOUR_HANDLE</Text>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>USERNAME</Text>
            <TextInput
              style={styles.pixelInput}
              value={username}
              onChangeText={setUsername}
              placeholder="ENTER_NAME..."
              placeholderTextColor="#666666"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.pixelButton, loading && styles.buttonDisabled]}
            onPress={handleCompleteProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.buttonText}>INITIALIZE_QUESTER</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  pixelBox: {
    backgroundColor: '#1E1E1E',
    borderWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#555555',
    borderRightColor: '#555555',
    padding: Spacing.xl,
    borderRadius: 0,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: FontSizes['2xl'],
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#888888',
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#666666',
    marginBottom: Spacing.xs,
  },
  pixelInput: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#333333',
    padding: Spacing.md,
    fontFamily: 'monospace',
    fontSize: 16,
    color: '#00FF00', // Retro Green
    borderRadius: 0,
  },
  pixelButton: {
    backgroundColor: '#FFD700', // Gold
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    borderWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#B8860B',
    borderRightColor: '#B8860B',
    borderRadius: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'monospace',
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});