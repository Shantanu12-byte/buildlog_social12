import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import { router } from 'expo-router';
import { authorize } from 'react-native-app-auth';
import { Colors, Shadows } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { githubService } from '@/services/githubService';
import { AuthConfiguration } from '@/constants/AuthConfiguration';
import { Github } from 'lucide-react-native';

const GITHUB_CLIENT_ID = AuthConfiguration.clientId;
const config = AuthConfiguration;

export default function ConnectGitHubScreen() {
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
        // Web Flow: Manual Redirect
        const redirectUri = config.redirectUrl!;
        const authUrl = `${config.serviceConfiguration.authorizationEndpoint}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${config.scopes.join('%20')}`;
        
        console.log('--- DEBUG GITHUB OAUTH ---');
        console.log('Client ID:', config.clientId);
        console.log('Redirect URI:', redirectUri);
        console.log('Full Auth URL:', authUrl);
        console.log('---------------------------');
        
        window.location.assign(authUrl);
        return;
      }

      // Native Flow: Standard OAuth
      const authState = await authorize(config);

      if (authState.accessToken && authState.authorizationCode) {
        await githubService.exchangeGithubCode(authState.authorizationCode, userId!);
        Alert.alert('Success', 'GitHub account linked!');
        router.push('/(stack)/repo-picker');
      }
    } catch (error: any) {
      console.error('GitHub Connection Error:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Connection Failed', 'Could not connect to GitHub. Please check your credentials.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Web Callback Handling
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
          .catch(err => {
            console.error('Web callback error:', err);
            Alert.alert('Import Failed', 'Failed to exchange GitHub code.');
          })
          .finally(() => setIsConnecting(false));
      }
    }
  }, [userId]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Github size={60} color="#FFF" />
        </View>
        <Text style={styles.title}>Proof of Work</Text>
        <Text style={styles.subtitle}>
          Connect your GitHub account to import repositories and link them to your log entries.
        </Text>

        <TouchableOpacity 
          style={[styles.button, isConnecting && styles.buttonDisabled]} 
          onPress={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Github size={20} color="#000" style={styles.btnIcon} />
              <Text style={styles.buttonText}>Connect with GitHub</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.skipButton}>
          <Text style={styles.skipText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.soft,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
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
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 20,
  },
  skipText: {
    color: Colors.text.tertiary,
    fontSize: 14,
  },
});
