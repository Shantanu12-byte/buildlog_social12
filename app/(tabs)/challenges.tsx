import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

export default function ChallengesScreen() {
  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <Text style={s.title}>CHALLENGES</Text>
          <Text style={s.subtitle}>Level up your skills with community quests.</Text>
        </View>

        <View style={s.placeholder}>
          <Feather name="zap" size={48} color={Colors.accent.primary} style={{ marginBottom: 20 }} />
          <Text style={s.placeholderTitle}>System Calibration in Progress</Text>
          <Text style={s.placeholderText}>
            The global task engine is currently being optimized for high-performance builders. 
            Check back soon for daily streaks and skill-based bounties.
          </Text>
        </View>

        <View style={s.upcomingSection}>
          <Text style={s.sectionHeader}>UPCOMING FEATURES</Text>
          {[
            { icon: 'code', title: 'Code Golf', desc: 'Shortest solution wins.' },
            { icon: 'users', title: 'Team Sprints', desc: 'Build with a squad.' },
            { icon: 'award', title: 'Skill Bounties', desc: 'Earn reputation points.' },
          ].map((item, i) => (
            <View key={i} style={s.featCard}>
              <Feather name={item.icon as any} size={20} color={Colors.text.secondary} />
              <View>
                <Text style={s.featTitle}>{item.title}</Text>
                <Text style={s.featDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  content: {
    padding: Spacing.xl,
  },
  header: {
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitle: {
    color: Colors.text.tertiary,
    fontSize: 14,
    marginTop: 4,
  },
  placeholder: {
    backgroundColor: Colors.bg.secondary,
    borderWidth: 1,
    borderColor: 'rgba(93, 63, 211, 0.2)',
    borderRadius: Radius.lg,
    padding: 30,
    alignItems: 'center',
    marginBottom: 40,
  },
  placeholderTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  placeholderText: {
    color: Colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  upcomingSection: {
    gap: 16,
  },
  sectionHeader: {
    color: Colors.text.tertiary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },
  featCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    padding: 16,
    borderRadius: Radius.md,
    gap: 16,
    borderWidth: 0.5,
    borderColor: Colors.border.subtle,
  },
  featTitle: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  featDesc: {
    color: Colors.text.tertiary,
    fontSize: 13,
    marginTop: 2,
  },
});
