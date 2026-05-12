import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { Spacing, Radius } from '../constants/theme';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface TutorModalProps {
  visible: boolean;
  onClose: () => void;
  feedback: string;
  codeSnippet?: string | null;
}

export default function TutorModal({ visible, onClose, feedback, codeSnippet }: TutorModalProps) {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.tutorHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>🦉</Text>
            </View>
            <View>
              <Text style={styles.tutorName}>Codey the Owl</Text>
              <Text style={styles.tutorTagline}>Thinking tutor</Text>
            </View>
          </View>

          {codeSnippet && (
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{codeSnippet}</Text>
            </View>
          )}
          
          <Text style={styles.feedbackText}>{feedback}</Text>
          
          <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
            <Text style={styles.dismissText}>Let&apos;s Try Again!</Text>
            <Feather name="arrow-right" size={16} color={isDark ? "#000" : "#FFF"} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
    overlay: { 
      flex: 1, 
      backgroundColor: 'rgba(0,0,0,0.85)', 
      justifyContent: 'center', 
      padding: Spacing.xl 
    },
    modal: { 
      backgroundColor: theme.bgCard, 
      borderRadius: Radius.lg, 
      padding: Spacing.xl, 
      borderWidth: 1, 
      borderColor: theme.purple,
      ...(Platform.OS === 'web' ? {
        boxShadow: `0 0 20px ${theme.purple}4D`
      } : {
        shadowColor: theme.purple,
        shadowOpacity: 0.3,
        shadowRadius: 20
      })
    },
    tutorHeader: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginBottom: Spacing.lg, 
      gap: 12 
    },
    avatarContainer: { 
      width: 50, 
      height: 50, 
      borderRadius: 25, 
      backgroundColor: isDark ? 'rgba(57,255,20,0.1)' : 'rgba(124,58,237,0.1)', 
      alignItems: 'center', 
      justifyContent: 'center',
      borderWidth: 1, 
      borderColor: isDark ? '#39FF14' : theme.purple
    },
    avatarEmoji: { fontSize: 24 },
    tutorName: { 
      color: theme.textPrimary, 
      fontWeight: 'bold', 
      fontSize: 18 
    },
    tutorTagline: { 
      color: theme.purple, 
      fontSize: 12, 
      opacity: 0.7, 
      fontFamily: 'monospace' 
    },
    codeContainer: {
      backgroundColor: theme.bgInput,
      padding: Spacing.md,
      borderRadius: Radius.sm,
      marginBottom: Spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: theme.purple,
    },
    codeText: {
      color: isDark ? '#39FF14' : theme.textPrimary,
      fontFamily: 'monospace',
      fontSize: 14,
    },
    feedbackText: { 
      color: theme.textSecondary, 
      fontSize: 16, 
      lineHeight: 24, 
      marginBottom: Spacing.xl 
    },
    dismissBtn: { 
      backgroundColor: theme.purple, 
      padding: 16, 
      borderRadius: Radius.md, 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: 8
    },
    dismissText: { 
      fontWeight: '900', 
      color: isDark ? '#000' : '#FFF', 
      letterSpacing: 1 
    }
  });
}
