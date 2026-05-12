import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, ActivityIndicator, Alert, ScrollView, TextInput, Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

const COLLEGES = [
  { id: 'ram_meghe_eng', name: 'Prof Ram Meghe (PRMITR)' },
  { id: 'sipna_eng', name: 'Sipna College of Engineering (SCOET)' },
];

export default function CampusOnboardingScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const { userProfile, updateUserProfile } = useUserStore();
  const [selectedCampus, setSelectedCampus] = useState<string | null>(
    userProfile?.campus_id || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredColleges = useMemo(() => {
    return COLLEGES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  async function handleJoin() {
    if (!selectedCampus) {
      Alert.alert('Selection Required', 'Please select a campus to join the Hub.');
      return;
    }

    const campus = COLLEGES.find(c => c.id === selectedCampus);
    if (!campus) return;

    setIsLoading(true);
    console.log('[CampusOnboarding] Starting join for:', campus.name);

    try {
      // 1. Update Profile with clean payload
      const { data, error } = await supabase
        .from('profiles')
        .update({
          campus_id: campus.id,
          campus_name: campus.name,
          is_joined_to_campus: true,
          college: campus.id // Keep for compatibility
        })
        .eq('id', userProfile?.id)
        .select()
        .single();

      if (error || !data) throw new Error(error?.message || 'Update failed');

      console.log('[CampusOnboarding] DB update success. Refreshing store...');

      // 2. Refresh Zustand store and wait
      await useUserStore.getState().refreshProfile();

      console.log('[CampusOnboarding] Store refreshed. Finalizing...');

      // 3. Navigate after state update
      Alert.alert('Success', `You have successfully joined ${campus.name}!`, [
        { 
          text: 'Enter Hub', 
          onPress: () => {
            console.log('[CampusOnboarding] Navigating to tavern...');
            router.replace('/(tabs)/tavern');
          }
        }
      ]);
    } catch (err: any) { 
      console.error('[CampusOnboarding] Join failed:', err);
      Alert.alert('Error', err.message || 'Could not join campus.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.title}>Select Your Campus</Text>
        <Text style={s.subtitle}>
          Join your official college community to access exclusive chat groups, projects, and peers.
        </Text>

        <View style={s.searchContainer}>
          <Feather name="search" size={20} color={theme.textMuted} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Search for your campus..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={s.cardContainer}>
          {filteredColleges.length > 0 ? (
            filteredColleges.map((college) => {
              const isSelected = selectedCampus === college.id;
              return (
                <TouchableOpacity
                  key={college.id}
                  style={[s.card, isSelected && s.cardSelected]}
                  onPress={() => setSelectedCampus(college.id)}
                  activeOpacity={0.8}
                >
                  <View style={[s.radioOuter, isSelected && s.radioOuterSelected]}>
                    {isSelected && <View style={s.radioInner} />}
                  </View>
                  <View style={s.cardContent}>
                    <Text style={[s.cardTitle, isSelected && s.cardTitleSelected]}>
                      {college.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={s.noResults}>No campus found for &quot;{searchQuery}&quot;</Text>
          )}
        </View>

      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.joinBtn, (!selectedCampus || isLoading) && s.joinBtnDisabled]}
          onPress={handleJoin}
          disabled={!selectedCampus || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={isDark ? "#000" : "#fff"} />
          ) : (
            <Text style={s.joinBtnText}>Join Community</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: Spacing.xl },
  header: { marginBottom: Spacing.xl },
  backBtn: { padding: Spacing.xs },
  backIcon: { color: theme.textPrimary, fontSize: 24 },
  title: { color: theme.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: Spacing.sm },
  subtitle: { color: theme.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: Spacing.xl },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bgInput, borderRadius: Radius.md, borderWidth: 1, borderColor: theme.border, paddingHorizontal: Spacing.md, marginBottom: Spacing.xl, height: 50 },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, color: theme.textPrimary, fontSize: 16 },
  cardContainer: { gap: Spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  cardSelected: {
    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.05)',
    borderColor: theme.purple,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioOuterSelected: {
    borderColor: theme.purple,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.purple,
  },
  cardContent: { flex: 1 },
  cardTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: '600' },
  cardTitleSelected: { color: theme.purple },
  noResults: { color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.xl },
  footer: { padding: Spacing.xl, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.bg },
  joinBtn: {
    backgroundColor: theme.purple,
    paddingVertical: 18,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  joinBtnDisabled: {
    opacity: 0.5,
  },
  joinBtnText: { color: isDark ? "#000" : "#fff", fontSize: 16, fontWeight: '700' },
});
