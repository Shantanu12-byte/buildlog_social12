import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, ActivityIndicator, Alert, ScrollView, TextInput, Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

const COLLEGES = [
  { id: 'ram_meghe_eng', name: 'Prof Ram Meghe' },
  { id: 'sipna_eng', name: 'Sipna College of Engineering' },
];

export default function CampusOnboardingScreen() {
  const router = useRouter();
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
    try {
      await updateUserProfile({
        campus_id: campus.id,
        campus_name: campus.name,
        is_joined_to_campus: true
      });

      if (Platform.OS === 'web') {
        window.alert(`You have successfully joined ${campus.name}!`);
        router.replace('/(tabs)/tavern');
      } else {
        Alert.alert('Success', `You have successfully joined ${campus.name}!`, [
          { text: 'Enter Hub', onPress: () => router.replace('/(tabs)/tavern') }
        ]);
      }
    } catch (err: any) {
      console.error('Campus onboarding error:', err);
      Alert.alert('Error', err.message || 'Could not join campus.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />

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
          <Feather name="search" size={20} color={Colors.text.tertiary} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Search for your campus..."
            placeholderTextColor={Colors.text.tertiary}
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
            <Text style={s.noResults}>No campus found for "{searchQuery}"</Text>
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
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.joinBtnText}>Join Community</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { padding: Spacing.xl },
  header: { marginBottom: Spacing.xl },
  backBtn: { padding: Spacing.xs },
  backIcon: { color: Colors.text.primary, fontSize: 24 },
  title: { color: Colors.text.primary, fontSize: 28, fontWeight: '800', marginBottom: Spacing.sm },
  subtitle: { color: Colors.text.secondary, fontSize: 15, lineHeight: 22, marginBottom: Spacing.xl },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.secondary, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border.default, paddingHorizontal: Spacing.md, marginBottom: Spacing.xl, height: 50 },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, color: Colors.text.primary, fontSize: 16 },
  cardContainer: { gap: Spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  cardSelected: {
    backgroundColor: 'rgba(93, 63, 211, 0.1)', // ACCENT_PURPLE with opacity
    borderColor: Colors.accent.primary,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioOuterSelected: {
    borderColor: Colors.accent.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent.primary,
  },
  cardContent: { flex: 1 },
  cardTitle: { color: Colors.text.primary, fontSize: 16, fontWeight: '600' },
  cardTitleSelected: { color: Colors.accent.primary },
  noResults: { color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing.xl },
  footer: { padding: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border.subtle, backgroundColor: Colors.bg.primary },
  joinBtn: {
    backgroundColor: Colors.accent.primary,
    paddingVertical: 18,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  joinBtnDisabled: {
    opacity: 0.5,
  },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
