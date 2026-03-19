import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

import { useUserStore } from '@/store/userStore';

export default function SettingsScreen() {
  const router = useRouter();
  const clearUser = useUserStore(state => state.clearUser);

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          Alert.alert('Error signing out', error.message);
        } else {
          clearUser();
          // The onAuthStateChange listener in root _layout.tsx 
          // will detect the session is null and auto-redirect to /login
        }
      } catch (err: any) {
        Alert.alert('Error', 'An unexpected error occurred during sign out.');
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (confirmed) {
        await performLogout();
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    }
  };

  const handleEditProfile = () => {
    router.push('/(stack)/edit-profile');
  };

  const handleCheckUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert('[ NEW_PATCH_DETECTED ]', 'A new update is available. Download now?', [
          { text: 'LATER', style: 'cancel' },
          { text: 'UPDATE', onPress: async () => await Updates.fetchUpdateAsync() }
        ]);
      } else {
        Alert.alert('[ SYSTEM_UP_TO_DATE ]', 'You are running the latest version.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not check for updates.');
    }
  };

  const version = Constants.expoConfig?.version || '1.0.0';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <View style={styles.menuItemLeft}>
              <Feather name="user" size={20} color={Colors.textPrimary} />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.systemInfoContainer}>
          <Text style={styles.sectionLabel}>SYSTEM_INFO</Text>
          <View style={styles.versionBox}>
            <Text style={styles.versionText}>BUILD_VERSION: v{version}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.updateButton} 
            onPress={handleCheckUpdates}
          >
            <Feather name="refresh-cw" size={16} color={Colors.textSecondary} />
            <Text style={styles.updateButtonText}>CHECK FOR UPDATES</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#111111',
    borderBottomWidth: 4,
    borderBottomColor: '#222222',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderWidth: 2,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#000000',
    borderRightColor: '#000000',
    marginRight: Spacing.md,
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontFamily: 'monospace',
    color: '#666666',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#222222',
    borderWidth: 2,
    borderTopColor: '#444444',
    borderLeftColor: '#444444',
    borderBottomColor: '#111111',
    borderRightColor: '#111111',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuItemText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: FontSizes.base,
    fontWeight: 'bold',
  },
  spacer: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: Spacing.lg,
    backgroundColor: '#333333',
    borderWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#111111',
    borderRightColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  logoutButtonText: {
    fontFamily: 'monospace',
    color: '#EF4444',
    fontSize: FontSizes.base,
    fontWeight: 'bold',
  },
  systemInfoContainer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 2,
    borderTopColor: '#222222',
  },
  versionBox: {
    backgroundColor: '#111111',
    padding: Spacing.md,
    borderWidth: 2,
    borderTopColor: '#000000',
    borderLeftColor: '#000000',
    borderBottomColor: '#333333',
    borderRightColor: '#333333',
    marginBottom: Spacing.md,
  },
  versionText: {
    fontFamily: 'monospace',
    color: '#AAAAAA',
    fontSize: 12,
    letterSpacing: 1,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  updateButtonText: {
    fontFamily: 'monospace',
    color: '#666666',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
});