import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ActivityIndicator, Platform, Linking, TextInput, ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface CampusPickerProps {
  visible: boolean;
  onConfirm: (campusId: string, campusName: string) => void;
  isLoading: boolean;
}

const COLLEGES = [
  { id: 'ram_meghe_eng', name: 'Prof Ram Meghe (PRMITR)', icon: '🏛️' },
  { id: 'sipna_eng', name: 'Sipna College of Engineering (SCOET)', icon: '🏛️' },
  { id: 'p_r_pote', name: 'P.R. Pote Patil College of Engineering', icon: '🏛️' },
  { id: 'gvish', name: 'Govt. Vidarbha Institute of Science & Humanities', icon: '🏛️' },
];

export default function CampusPicker({ visible, onConfirm, isLoading }: CampusPickerProps) {
  const [step, setStep] = useState<'disclaimer' | 'selection'>('disclaimer');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, isDark } = useTheme();
  const s = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const filteredColleges = useMemo(() => {
    if (!searchQuery.trim()) return COLLEGES;
    return COLLEGES.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleConfirm = () => {
    const campus = COLLEGES.find(c => c.id === selectedId);
    if (campus) {
      onConfirm(campus.id, campus.name);
    }
  };

  const resetAndClose = () => {
    // We don't have a close prop, but we reset internal state if hidden
    setStep('disclaimer');
    setSelectedId(null);
    setSearchQuery('');
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide"
      onShow={() => setStep('disclaimer')}
    >
      <View style={s.overlay}>
        <View style={s.content}>
          {/* Header Badge */}
          <View style={s.badge}>
            <Text style={s.badgeText}>
              {step === 'disclaimer' ? 'STEP 1/2: AGREEMENT' : 'STEP 2/2: SELECTION'}
            </Text>
          </View>
          
          {step === 'disclaimer' ? (
            <View>
              <Text style={s.title}>Protocol Required</Text>
              <Text style={s.subtitle}>
                Before joining the network, you must understand the rules of the campus community.
              </Text>

              <View style={s.disclaimerCard}>
                <View style={s.warningHeader}>
                  <Feather name="alert-triangle" size={20} color={theme.red} />
                  <Text style={s.warningTitle}>PERMANENT ASSIGNMENT</Text>
                </View>
                <Text style={s.disclaimerBody}>
                  Once you select your campus, you will be <Text style={{fontWeight: '800', color: theme.textPrimary}}>permanently linked</Text> to its private chat rooms and leaderboards. This action <Text style={{fontWeight: '800', color: theme.red}}>cannot be undone</Text>.
                </Text>
              </View>

              <TouchableOpacity 
                onPress={() => Linking.openURL('https://buildlog.dev/guidelines')}
                style={s.linkBtn}
              >
                <Feather name="external-link" size={14} color={theme.purple} style={{marginRight: 6}} />
                <Text style={s.linkText}>Review Community Guidelines</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.confirmBtn}
                onPress={() => setStep('selection')}
              >
                <Text style={s.confirmBtnText}>I Understand & Continue →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={s.selectionHeader}>
                <TouchableOpacity onPress={() => setStep('disclaimer')} style={s.backBtn}>
                  <Feather name="arrow-left" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={s.titleSmall}>Select Campus</Text>
              </View>

              <View style={s.searchBar}>
                <Feather name="search" size={18} color={theme.textMuted} style={{marginRight: 10}} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Search for your college..."
                  placeholderTextColor={theme.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Feather name="x" size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView 
                style={s.optionsScroll} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                {filteredColleges.length > 0 ? (
                  filteredColleges.map((college) => {
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
                          {isActive && <Text style={s.selectedTag}>TARGET IDENTIFIED</Text>}
                        </View>
                        {isActive && <Feather name="check-circle" size={20} color={theme.purple} />}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={s.emptySearch}>
                    <Text style={s.emptySearchText}>No campus found matching "{searchQuery}"</Text>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity
                style={[s.confirmBtn, (!selectedId || isLoading) && s.confirmBtnDisabled]}
                disabled={!selectedId || isLoading}
                onPress={handleConfirm}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.confirmBtnText}>Finalize Join</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function getStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    content: { 
      backgroundColor: theme.bgCard, 
      borderRadius: 28, 
      padding: 24, 
      borderWidth: 1, 
      borderColor: theme.border,
      maxWidth: 500,
      alignSelf: 'center',
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
    badge: { 
      alignSelf: 'flex-start', 
      backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : theme.purple, 
      paddingHorizontal: 12, 
      paddingVertical: 5, 
      borderRadius: 8, 
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(124, 58, 237, 0.3)' : 'transparent'
    },
    badgeText: { color: isDark ? theme.purple : '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
    title: { color: theme.textPrimary, fontSize: 28, fontWeight: '900', marginBottom: 10, letterSpacing: -0.5 },
    titleSmall: { color: theme.textPrimary, fontSize: 20, fontWeight: '800' },
    subtitle: { color: theme.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 28 },
    
    disclaimerCard: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
      marginBottom: 24,
    },
    warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    warningTitle: { color: theme.red, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    disclaimerBody: { color: theme.textSecondary, fontSize: 14, lineHeight: 22 },

    selectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
    backBtn: { padding: 4 },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.bgInput,
      borderRadius: 16,
      paddingHorizontal: 16,
      height: 54,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 20,
    },
    searchInput: { flex: 1, color: theme.textPrimary, fontSize: 16, fontWeight: '500' },

    optionsScroll: { maxHeight: 350, marginBottom: 20 },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.bg,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 16,
      marginBottom: 10,
    },
    optionCardActive: { borderColor: theme.purple, backgroundColor: isDark ? 'rgba(124, 58, 237, 0.05)' : 'rgba(124, 58, 237, 0.02)' },
    optionIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
    optionIcon: { fontSize: 22 },
    optionName: { color: theme.textSecondary, fontSize: 16, fontWeight: '700' },
    optionNameActive: { color: theme.textPrimary },
    selectedTag: { color: theme.purple, fontSize: 10, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 },

    emptySearch: { paddingVertical: 40, alignItems: 'center' },
    emptySearchText: { color: theme.textMuted, fontSize: 14, textAlign: 'center' },

    linkBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginBottom: 32 },
    linkText: { color: theme.purple, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
    
    confirmBtn: {
      backgroundColor: theme.purple,
      height: 60,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.purple,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    confirmBtnDisabled: { opacity: 0.4, backgroundColor: theme.textMuted },
    confirmBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '900' }
  });
}
