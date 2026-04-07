import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { Spacing, Typography, Radius } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface CustomNotificationModalProps {
  visible: boolean;
  onAuthorize: () => void;
  onCancel: () => void;
}

export function CustomNotificationModal({ visible, onAuthorize, onCancel }: CustomNotificationModalProps) {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <div style={styles.header}>
            <View style={styles.glitchBox}>
              <Image 
                source={require('../assets/codenid_logo.png')}
                style={{ width: 24, height: 24, tintColor: isDark ? "#00FF41" : theme.purple }}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>SYSTEM_AUTHORIZATION</Text>
          </div>

          <Text style={styles.message}>
            Activate <Text style={styles.highlight}>SECRET_SCROLL</Text> protocol? {"\n"}
            Receive real-time mission updates and build logs directly to your neural interface.
          </Text>

          <Text style={styles.message}>
            Activate <Text style={styles.highlight}>News</Text> protocol? {"\n"}
            Want to be updated with the latest news and updates?.
          </Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{`> STATUS: PENDING`}</Text>
            <Text style={styles.codeText}>{`> MODULE: NOTIFICATIONS_v1.0.4`}</Text>
            <Text style={styles.codeText}>{`> ENCRYPTION: ENABLED`}</Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel]}
              onPress={onCancel}
            >
              <Text style={styles.btnTextCancel}>LATER</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnConfirm]}
              onPress={onAuthorize}
            >
              <Text style={styles.btnTextConfirm}>AUTHORIZE</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>// ENCRYPTED_CONNECTION_SECURED</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(theme: any, isDark: boolean) {
  const cyberAccent = isDark ? '#00FF41' : theme.purple;

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    container: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: isDark ? '#050505' : theme.bgCard,
      borderWidth: 2,
      borderColor: isDark ? '#1A1A1A' : theme.border,
      borderRadius: 4,
      padding: 30,
      ...(Platform.OS === 'web'
        ? { boxShadow: `0 0 15px ${cyberAccent}33` }
        : {
          shadowColor: cyberAccent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 15,
        }
      ),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
      marginBottom: 25,
      display: 'flex',
    },
    glitchBox: {
      padding: 8,
      borderWidth: 1,
      borderColor: cyberAccent,
      backgroundColor: isDark ? 'rgba(0, 255, 65, 0.05)' : 'rgba(124, 58, 237, 0.05)',
    },
    title: {
      color: cyberAccent,
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 2,
      fontFamily: 'monospace',
    },
    message: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 25,
      fontFamily: 'monospace',
    },
    highlight: {
      color: cyberAccent,
      fontWeight: 'bold',
    },
    codeBox: {
      backgroundColor: isDark ? '#0A0A0A' : theme.bgInput,
      padding: 15,
      borderRadius: 2,
      borderLeftWidth: 3,
      borderLeftColor: cyberAccent,
      marginBottom: Spacing.xl,
    },
    codeText: {
      color: theme.textMuted,
      fontFamily: 'monospace',
      fontSize: 10,
      marginBottom: 4,
    },
    btnRow: {
      flexDirection: 'row',
      gap: 15,
    },
    btn: {
      flex: 1,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    btnConfirm: {
      backgroundColor: cyberAccent,
      borderColor: cyberAccent,
    },
    btnCancel: {
      backgroundColor: 'transparent',
      borderColor: theme.border,
    },
    btnTextConfirm: {
      color: isDark ? '#000' : '#FFF',
      fontWeight: '900',
      fontFamily: 'monospace',
      letterSpacing: 1,
    },
    btnTextCancel: {
      color: theme.textSecondary,
      fontWeight: '800',
      fontFamily: 'monospace',
    },
    footer: {
      marginTop: 25,
      alignItems: 'center',
      opacity: 0.3,
    },
    footerText: {
      color: cyberAccent,
      fontSize: 8,
      fontFamily: 'monospace',
    },
  });
}
