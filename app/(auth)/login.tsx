import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Spacing } from '@/constants/theme';

export default function AuthGateway() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !username)) {
      setError('FIELD_REQUIRED: EMAIL, PASSWORD' + (!isLogin ? ' & USERNAME' : ''));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = isLogin 
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ 
            email: email.trim(), 
            password,
            options: {
              data: {
                username: username.trim().toLowerCase(),
              }
            }
          });

      if (authError) {
        throw authError;
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      const message = e.message || 'An unknown network error occurred';
      setError(message.toUpperCase());
      Alert.alert('Authentication Error', message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuth = (mode: boolean) => {
    setIsLogin(mode);
    setError(null);
  };

  const activeColor = isLogin ? '#00E5FF' : '#55FF55';
  const buttonText = isLogin ? '[ INITIATE_LOGIN ]' : '[ CREATE_ACCOUNT ]';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>[ TERMINAL_ACCESS ]</Text>
          </View>

          <View style={styles.formBox}>
            {/* ... TABS ... */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, isLogin && styles.activeTab]} 
                onPress={() => toggleAuth(true)}
              >
                <Text style={[styles.tabText, isLogin ? styles.activeTabText : styles.inactiveTabText]}>
                  [ LOGIN ]
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, !isLogin && styles.activeTab]} 
                onPress={() => toggleAuth(false)}
              >
                <Text style={[styles.tabText, !isLogin ? styles.activeTabTextSignup : styles.inactiveTabText]}>
                  [ FORGE_ID ]
                </Text>
              </TouchableOpacity>
            </View>

            {/* INPUTS */}
            {!isLogin && (
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>CHOOSE_HANDLE</Text>
                <View style={styles.inputBevel}>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="> CREATE_USERNAME..."
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>EMAIL_ADDRESS</Text>
              <View style={styles.inputBevel}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="> ENTER_EMAIL..."
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>SECURITY_KEY</Text>
              <View style={styles.inputBevel}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="> ENTER_PASSWORD..."
                  placeholderTextColor="#666"
                  secureTextEntry
                />
              </View>
            </View>

            {/* ERROR DISPLAY */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>!! ERROR: {error}</Text>
              </View>
            )}

            {/* ACTION BUTTON */}
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: activeColor }]} 
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.actionButtonText}>{buttonText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  headerText: {
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
  },
  formBox: {
    width: '100%',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#333',
  },
  activeTab: {
    borderColor: '#FFF',
    borderTopColor: '#FFF',
    borderLeftColor: '#FFF',
    borderBottomColor: '#888',
    borderRightColor: '#888',
  },
  tabText: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeTabText: {
    color: '#00E5FF',
  },
  activeTabTextSignup: {
    color: '#55FF55',
  },
  inactiveTabText: {
    color: '#555',
  },
  inputWrapper: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: 'monospace',
    color: '#AAA',
    fontSize: 10,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputBevel: {
    borderWidth: 4,
    borderTopColor: '#555',
    borderLeftColor: '#555',
    borderBottomColor: '#AAA',
    borderRightColor: '#AAA',
    backgroundColor: '#111',
  },
  input: {
    fontFamily: 'monospace',
    color: '#FFF',
    padding: 12,
    fontSize: 14,
  },
  errorBox: {
    borderWidth: 2,
    borderColor: '#F00',
    padding: 10,
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  errorText: {
    fontFamily: 'monospace',
    color: '#F00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButton: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 4,
    borderTopColor: '#FFF',
    borderLeftColor: '#FFF',
    borderBottomColor: 'rgba(0,0,0,0.5)',
    borderRightColor: 'rgba(0,0,0,0.5)',
    marginTop: Spacing.md,
  },
  actionButtonText: {
    fontFamily: 'monospace',
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});