import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ActivityIndicator, Platform, Linking
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface CampusPickerProps {
  visible: boolean;
  onConfirm: (campusId: string, campusName: string) => void;
  isLoading: boolean;
}

const COLLEGES = [
  { id: 'ram_meghe_eng', name: 'Prof Ram Meghe (PRMITR)', icon: '🏛️' },
  { id: 'sipna_eng', name: 'Sipna College of Engineering (SCOET)', icon: '🏛️' },
];

export default function CampusPicker({ visible, onConfirm, isLoading }: CampusPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    const campus = COLLEGES.find(c => c.id === selectedId);
    if (campus) {
      onConfirm(campus.id, campus.name);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.content}>
          <View style={s.badge}>
            <Text style={s.badgeText}>STEP 1/1: CAMPUS_JOIN</Text>
          </View>
          
          <Text style={s.title}>Select Your Campus</Text>
          <Text style={s.subtitle}>
            You must choose an official campus community to begin building and networking.
          </Text>

          <View style={s.options}>
            {COLLEGES.map((college) => {
              const isActive = selectedId === college.id;
              return (
                <TouchableOpacity
                  key={college.id}
                  style={[s.optionCard, isActive && s.optionCardActive]}
                  onPress={() => setSelectedId(college.id)}
                  activeOpacity={0.8}
                >
                  <View style={s.optionIconWrap}>
                    <Text style={s.optionIcon}>{college.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.optionName, isActive && s.optionNameActive]}>{college.name}</Text>
                    {isActive && <Text style={s.selectedTag}>SELECTED</Text>}
                  </View>
                  {isActive && <Feather name="check-circle" size={20} color="#7c3aed" />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.footer}>
            <Text style={s.disclaimer}>
              <Text style={{ color: '#ef4444', fontWeight: '800' }}>⚠️ IMPORTANT:</Text> Once you select your campus, it cannot be changed. You will be permanently assigned to this college's private community.
            </Text>

            <TouchableOpacity 
              onPress={() => Linking.openURL('https://buildlog.dev/guidelines')}
              style={s.linkBtn}
            >
              <Text style={s.linkText}>By joining, you agree to our Community Guidelines</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.confirmBtn, (!selectedId || isLoading) && s.confirmBtnDisabled]}
              disabled={!selectedId || isLoading}
              onPress={handleConfirm}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={s.confirmBtnText}>Confirm & Join</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 24 },
  content: { 
    backgroundColor: '#111111', 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: '#1f2937',
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%'
  },
  badge: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#1e1b4b', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    marginBottom: 16 
  },
  badgeText: { color: '#818cf8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#ffffff', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#6b7280', fontSize: 14, lineHeight: 20, marginBottom: 24 },
  
  options: { gap: 12, marginBottom: 24 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 16
  },
  optionCardActive: { borderColor: '#7c3aed', backgroundColor: '#111111' },
  optionIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  optionIcon: { fontSize: 20 },
  optionName: { color: '#6b7280', fontSize: 15, fontWeight: '600' },
  optionNameActive: { color: '#ffffff' },
  selectedTag: { color: '#7c3aed', fontSize: 10, fontWeight: '800', marginTop: 2 },

  footer: { borderTopWidth: 1, borderTopColor: '#1f2937', paddingTop: 20 },
  disclaimer: { color: '#71717a', fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  linkBtn: { alignSelf: 'center', marginBottom: 24 },
  linkText: { color: '#7c3aed', fontSize: 13, textDecorationLine: 'underline' },
  
  confirmBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmBtnDisabled: { opacity: 0.5, backgroundColor: '#3f3f46' },
  confirmBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' }
});
