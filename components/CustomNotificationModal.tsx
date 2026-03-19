import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

interface CustomNotificationModalProps {
  visible: boolean;
  onAuthorize: () => void;
  onCancel: () => void;
}

export function CustomNotificationModal({ visible, onAuthorize, onCancel }: CustomNotificationModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={s.overlay}>
        <View style={s.container}>
          <View style={s.header}>
            <View style={s.glitchBox}>
              <Feather name="zap" size={24} color={Colors.cyber.accent} />
            </View>
            <Text style={s.title}>SYSTEM_AUTHORIZATION</Text>
          </View>

          <Text style={s.message}>
            Activate <Text style={s.highlight}>SECRET_SCROLL</Text> protocol? {"\n"}
            Receive real-time mission updates and build logs directly to your neural interface.
          </Text>

          <View style={s.codeBox}>
            <Text style={s.codeText}>{`> STATUS: PENDING`}</Text>
            <Text style={s.codeText}>{`> MODULE: NOTIFICATIONS_v1.0.4`}</Text>
            <Text style={s.codeText}>{`> ENCRYPTION: ENABLED`}</Text>
          </View>

          <View style={s.btnRow}>
            <TouchableOpacity 
              style={[s.btn, s.btnCancel]} 
              onPress={onCancel}
            >
              <Text style={s.btnTextCancel}>LATER</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[s.btn, s.btnConfirm]} 
              onPress={onAuthorize}
            >
              <Text style={s.btnTextConfirm}>AUTHORIZE</Text>
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>// ENCRYPTED_CONNECTION_SECURED</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
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
    backgroundColor: '#050505',
    borderWidth: 2,
    borderColor: '#1A1A1A',
    borderRadius: 4,
    padding: 30,
    shadowColor: Colors.cyber.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 25,
  },
  glitchBox: {
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.cyber.accent,
    backgroundColor: 'rgba(0, 255, 65, 0.05)',
  },
  title: {
    color: Colors.cyber.accent,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  message: {
    color: '#AAA',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 25,
    fontFamily: 'monospace',
  },
  highlight: {
    color: Colors.cyber.accent,
    fontWeight: 'bold',
  },
  codeBox: {
    backgroundColor: '#0A0A0A',
    padding: 15,
    borderRadius: 2,
    borderLeftWidth: 3,
    borderLeftColor: Colors.cyber.accent,
    marginBottom: Spacing.xl,
  },
  codeText: {
    color: '#666',
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
    backgroundColor: Colors.cyber.accent,
    borderColor: Colors.cyber.accent,
  },
  btnCancel: {
    backgroundColor: 'transparent',
    borderColor: '#333',
  },
  btnTextConfirm: {
    color: '#000',
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  btnTextCancel: {
    color: '#666',
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  footer: {
    marginTop: 25,
    alignItems: 'center',
    opacity: 0.3,
  },
  footerText: {
    color: Colors.cyber.accent,
    fontSize: 8,
    fontFamily: 'monospace',
  },
});
