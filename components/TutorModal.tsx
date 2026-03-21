import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { Feather } from '@expo/vector-icons';

interface TutorModalProps {
  visible: boolean;
  onClose: () => void;
  feedback: string;
  codeSnippet?: string | null;
}

export default function TutorModal({ visible, onClose, feedback, codeSnippet }: TutorModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.modal}>
          <View style={s.tutorHeader}>
            <View style={s.avatarContainer}>
              <Text style={s.avatarEmoji}>🦉</Text>
            </View>
            <View>
              <Text style={s.tutorName}>Codey the Owl</Text>
              <Text style={s.tutorTagline}>Thinking tutor</Text>
            </View>
          </View>

          {codeSnippet && (
            <View style={s.codeContainer}>
              <Text style={s.codeText}>{codeSnippet}</Text>
            </View>
          )}
          
          <Text style={s.feedbackText}>{feedback}</Text>
          
          <TouchableOpacity style={s.dismissBtn} onPress={onClose}>
            <Text style={s.dismissText}>Let's Try Again!</Text>
            <Feather name="arrow-right" size={16} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: Spacing.xl },
  modal: { 
    backgroundColor: '#111', 
    borderRadius: Radius.lg, 
    padding: Spacing.xl, 
    borderWidth: 1, 
    borderColor: Colors.accent.primary,
    shadowColor: Colors.accent.primary,
    shadowOpacity: 0.3,
    shadowRadius: 20
  },
  tutorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: 12 },
  avatarContainer: { 
    width: 50, height: 50, borderRadius: 25, 
    backgroundColor: 'rgba(57,255,20,0.1)', 
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.accent.glow
  },
  avatarEmoji: { fontSize: 24 },
  tutorName: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  tutorTagline: { color: Colors.accent.glow, fontSize: 12, opacity: 0.7, fontFamily: 'monospace' },
  codeContainer: {
    backgroundColor: '#000',
    padding: Spacing.md,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.primary,
  },
  codeText: {
    color: '#39FF14',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  feedbackText: { color: '#CCC', fontSize: 16, lineHeight: 24, marginBottom: Spacing.xl },
  dismissBtn: { 
    backgroundColor: Colors.accent.primary, 
    padding: 16, borderRadius: Radius.md, 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
  },
  dismissText: { fontWeight: '900', color: '#000', letterSpacing: 1 }
});
