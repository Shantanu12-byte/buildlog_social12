import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { authorize } from 'react-native-app-auth';
import { Colors, Shadows } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { githubService } from '@/services/githubService';
import { Github } from 'lucide-react-native';

const config = {
  issuer: 'https://github.com',
  clientId: 'YOUR_GITHUB_CLIENT_ID', // User needs to replace this
  redirectUrl: 'com.buildlog://oauth',
  scopes: ['read:user', 'repo'],
  serviceConfiguration: {
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
    revocationEndpoint: 'https://github.com/settings/connections/applications/YOUR_GITHUB_CLIENT_ID',
  },
};

export default function ConnectGitHubScreen() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { userId } = useUserStore();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // 1. Launch standard OAuth flow
      const authState = await authorize(config);

      if (authState.accessToken) {
        // 2. Exchange code via backend (using authorizationCode if available, or token directly if preferred)
        // Note: react-native-app-auth usually handles the exchange, but for added security 
        // and to store it server-side, we send the authorizatonCode to our backend.
        if (authState.authorizationCode) {
          await githubService.exchangeGithubCode(authState.authorizationCode, userId!);
          
          Alert.alert('Success', 'GitHub account linked!');
          router.push('/(stack)/repo-picker');
        } else {
          throw new Error('No authorization code returned');
        }
      }
    } catch (error: any) {
      console.error('GitHub Connection Error:', error);
      Alert.alert('Connection Failed', 'Could not connect to GitHub. Please check your credentials.');
    } finally {
      setIsConnecting(false);
    }
  };

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
