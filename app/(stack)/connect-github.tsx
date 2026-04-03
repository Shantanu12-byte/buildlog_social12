import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { authorize } from 'react-native-app-auth';
import { Spacing } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { githubService } from '@/services/githubService';
import { AuthConfiguration } from '@/constants/AuthConfiguration';
import { Github } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

const GITHUB_CLIENT_ID = AuthConfiguration.clientId;
const config = AuthConfiguration;

export default function ConnectGitHubScreen() {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const [isConnecting, setIsConnecting] = useState(false);
  const { userId } = useUserStore();

  const handleConnect = async () => {
    if (GITHUB_CLIENT_ID === 'your_github_client_id') {
      Alert.alert('Configuration Missing', 'Please set EXPO_PUBLIC_GITHUB_CLIENT_ID in your .env file.');
      return;
    }

    setIsConnecting(true);
    try {
      if (Platform.OS === 'web') {
        const redirectUri = config.redirectUrl!;
        const authUrl = `${config.serviceConfiguration.authorizationEndpoint}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${config.scopes.join('%20')}`;     window.location.assign(authUrl);
        return;
      }

      const authState = await authorize(config);

      if (authState.accessToken && authState.authorizationCode) {
        await githubService.exchangeGithubCode(authState.authorizationCode, userId!);
        Alert.alert('Success', 'GitHub account linked!');
        router.push('/(stack)/repo-picker');
      }
    } catch (error: any) { if (Platform.OS !== 'web') {
        Alert.alert('Connection Failed', 'Could not connect to GitHub. Please check your credentials.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code && userId) {
        setIsConnecting(true);
        githubService.exchangeGithubCode(code, userId)
          .then(() => {
            Alert.alert('Success', 'GitHub account linked!');
            router.replace('/(stack)/repo-picker');
          })
          .catch(err => { Alert.alert('Import Failed', 'Failed to exchange GitHub code.');
          })
          .finally(() => setIsConnecting(false));
      }
    }
  }, [userId]);

  return (
    <View style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      <View style={s.content}>
        <View style={s.iconContainer}>
          <Github size={60} color={isDark ? "#FFF" : theme.textPrimary} />
        </View>
        <Text style={s.title}>Proof of Work</Text>
        <Text style={s.subtitle}>
          Connect your GitHub account to import repositories and link them to your log entries.
        </Text>

        <TouchableOpacity 
          style={[s.button, isConnecting && s.buttonDisabled]} 
          onPress={handleConnect}
          disabled={isConnecting}
          activeOpacity={0.8}
        >
          {isConnecting ? (
            <ActivityIndicator color={isDark ? "#000" : "#FFF"} />
          ) : (
            <>
              <Github size={20} color={isDark ? "#000" : "#FFF"} style={s.btnIcon} />
              <Text style={s.buttonText}>Connect with GitHub</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={s.skipButton}>
          <Text style={s.skipText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.bgInput,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'monospace',
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: isDark ? "#FFF" : theme.textPrimary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  btnIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: isDark ? "#000" : theme.bg,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 20,
  },
  skipText: {
    color: theme.textMuted,
    fontSize: 14,
  },
});
