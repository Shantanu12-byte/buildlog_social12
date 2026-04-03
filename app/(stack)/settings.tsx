import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { FontSizes, Spacing } from '@/constants/theme';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      if (Platform.OS === 'web') alert('Error signing out');
      else Alert.alert('Error', 'An unexpected error occurred during sign out.');
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/profile' as any)}>
          <Feather name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <View style={styles.menuItemLeft}>
              <Feather name="user" size={20} color={theme.textPrimary} />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color={theme.red} />
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
            <Feather name="refresh-cw" size={16} color={theme.textSecondary} />
            <Text style={styles.updateButtonText}>CHECK FOR UPDATES</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function getStyles(theme: any, isDark: boolean) {
  const highlightColor = isDark ? '#FFFFFF' : theme.textSecondary;
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.bgCard,
      borderBottomWidth: 4,
      borderBottomColor: theme.border,
    },
    backButton: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.bgInput,
      borderWidth: 2,
      borderTopColor: highlightColor,
      borderLeftColor: highlightColor,
      borderBottomColor: theme.border,
      borderRightColor: theme.border,
      marginRight: Spacing.md,
    },
    headerTitle: {
      fontFamily: 'monospace',
      fontSize: FontSizes.xl,
      fontWeight: 'bold',
      color: theme.textPrimary,
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
      color: theme.textSecondary,
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
      backgroundColor: theme.bgCard,
      borderWidth: 2,
      borderTopColor: theme.border,
      borderLeftColor: theme.border,
      borderBottomColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
      borderRightColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    menuItemText: {
      fontFamily: 'monospace',
      color: theme.textPrimary,
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
      backgroundColor: theme.bgInput,
      borderWidth: 4,
      borderTopColor: highlightColor,
      borderLeftColor: highlightColor,
      borderBottomColor: theme.border,
      borderRightColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xl,
    },
    logoutButtonText: {
      fontFamily: 'monospace',
      color: theme.red,
      fontSize: FontSizes.base,
      fontWeight: 'bold',
    },
    systemInfoContainer: {
      marginTop: Spacing.xl,
      paddingTop: Spacing.xl,
      borderTopWidth: 2,
      borderTopColor: theme.border,
    },
    versionBox: {
      backgroundColor: theme.bgCard,
      padding: Spacing.md,
      borderWidth: 2,
      borderTopColor: theme.border,
      borderLeftColor: theme.border,
      borderBottomColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
      borderRightColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
      marginBottom: Spacing.md,
    },
    versionText: {
      fontFamily: 'monospace',
      color: theme.textSecondary,
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
      color: theme.textSecondary,
      fontSize: 10,
      fontWeight: 'bold',
      letterSpacing: 1,
      textDecorationLine: 'underline',
    },
  });
}