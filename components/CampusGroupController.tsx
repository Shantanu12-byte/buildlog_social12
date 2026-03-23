import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';

interface CampusGroup {
  id: string;
  name: string;
  description: string;
  member_count: number;
}

export default function CampusGroupController() {
  const router = useRouter();
  const { userProfile } = useUserStore();
  const [groups, setGroups] = useState<CampusGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isJoinedToCampus = userProfile?.is_joined_to_campus;
  const campusName = userProfile?.campus_name;

  useEffect(() => {
    if (isJoinedToCampus && campusName) {
      // Fetch groups securely from our Node API (or Supabase directly if rules are solid)
      // For now, mocking specific campus groups based on the college selected.
      setTimeout(() => {
        setGroups([
          { id: 'g1', name: `C++ Builders - ${campusName}`, description: 'Mastering DSA together', member_count: 142 },
          { id: 'g2', name: 'MERN Stack Beginners', description: 'Web Dev questions & answers', member_count: 85 },
          { id: 'g3', name: 'Hackathon Prep 2026', description: 'Team building and ideation', member_count: 56 },
        ]);
        setIsLoading(false);
      }, 800);
    } else {
      setIsLoading(false);
    }
  }, [isJoinedToCampus, campusName]);

  // Locked State
  if (!isJoinedToCampus) {
    return (
      <View style={s.lockedContainer}>
        <View style={s.lockedCard}>
          <Text style={s.lockedIcon}>🎓</Text>
          <Text style={s.lockedTitle}>Campus Hub Locked</Text>
          <Text style={s.lockedSub}>
            You must select and officially join a campus community to access chat groups and projects.
          </Text>
          <TouchableOpacity 
            style={s.joinBtn}
            onPress={() => router.push('/(auth)/CampusOnboarding')}
          >
            <Text style={s.joinBtnText}>Join Community</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Unlocked State (List of groups)
  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <Text style={s.campusBanner}>Welcome to {campusName} Hub</Text>
        <TouchableOpacity style={s.createBtn}>
          <Text style={s.createBtnText}>+ Create Group</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator color={Colors.accent.primary} /></View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <View style={s.groupCard}>
              <View style={s.groupInfo}>
                <Text style={s.groupName}>{item.name}</Text>
                <Text style={s.groupDesc}>{item.description}</Text>
                <Text style={s.groupMembers}>👥 {item.member_count} members</Text>
              </View>
              <TouchableOpacity style={s.enterBtn}>
                <Text style={s.enterBtnText}>Join</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  lockedCard: {
    backgroundColor: Colors.bg.secondary,
    padding: Spacing.xxxl,
    borderRadius: Radius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
    width: '100%'
  },
  lockedIcon: { fontSize: 48, marginBottom: Spacing.md },
  lockedTitle: { color: Colors.text.primary, fontSize: Typography.sizes.lg, fontWeight: '700', marginBottom: Spacing.sm },
  lockedSub: { color: Colors.text.secondary, fontSize: Typography.sizes.sm, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 },
  joinBtn: { backgroundColor: Colors.accent.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.md },
  joinBtnText: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: '700' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  campusBanner: { color: Colors.accent.primary, fontSize: Typography.sizes.base, fontWeight: '700' },
  createBtn: { backgroundColor: 'rgba(93, 63, 211, 0.1)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm },
  createBtnText: { color: Colors.accent.primary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  list: { padding: Spacing.lg, gap: Spacing.md },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  groupInfo: { flex: 1, paddingRight: Spacing.md },
  groupName: { color: Colors.text.primary, fontSize: Typography.sizes.base, fontWeight: '600', marginBottom: 2 },
  groupDesc: { color: Colors.text.secondary, fontSize: Typography.sizes.sm, marginBottom: 8 },
  groupMembers: { color: Colors.text.tertiary, fontSize: Typography.sizes.xs },
  enterBtn: { backgroundColor: Colors.bg.tertiary, borderWidth: 1, borderColor: Colors.border.default, paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: Radius.md },
  enterBtnText: { color: Colors.text.primary, fontSize: Typography.sizes.sm, fontWeight: '600' }
});
