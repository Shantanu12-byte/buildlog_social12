import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/context/ThemeContext';

interface CampusGroup {
  id: string;
  name: string;
  description: string;
  member_count: number;
}

export default function CampusGroupController() {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();
  const { userProfile } = useUserStore();
  const [groups, setGroups] = useState<CampusGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isJoinedToCampus = userProfile?.is_joined_to_campus;
  const campusName = userProfile?.campus_name;

  useEffect(() => {
    if (isJoinedToCampus && campusName) {
      // Mocking specific campus groups
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
      <View style={styles.lockedContainer}>
        <View style={styles.lockedCard}>
          <Text style={styles.lockedIcon}>🎓</Text>
          <Text style={styles.lockedTitle}>Campus Hub Locked</Text>
          <Text style={styles.lockedSub}>
            You must select and officially join a campus community to access chat groups and projects.
          </Text>
          <TouchableOpacity 
            style={styles.joinBtn}
            onPress={() => router.push('/(auth)/CampusOnboarding')}
          >
            <Text style={styles.joinBtnText}>Join Community</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Unlocked State (List of groups)
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.campusBanner}>Welcome to {campusName} Hub</Text>
        <TouchableOpacity style={styles.createBtn}>
          <Text style={styles.createBtnText}>+ Create Group</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={theme.purple} /></View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.groupCard}>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupDesc}>{item.description}</Text>
                <Text style={styles.groupMembers}>👥 {item.member_count} members</Text>
              </View>
              <TouchableOpacity style={styles.enterBtn}>
                <Text style={styles.enterBtnText}>Join</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

function getStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  lockedCard: {
    backgroundColor: theme.bgCard,
    padding: Spacing.xxxl,
    borderRadius: Radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    width: '100%'
  },
  lockedIcon: { fontSize: 48, marginBottom: Spacing.md },
  lockedTitle: { color: theme.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '700', marginBottom: Spacing.sm },
  lockedSub: { color: theme.textSecondary, fontSize: Typography.sizes.sm, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 },
  joinBtn: { backgroundColor: theme.purple, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.md },
  joinBtnText: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: '700' },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: Spacing.lg, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border 
  },
  campusBanner: { color: theme.purple, fontSize: Typography.sizes.base, fontWeight: '700' },
  createBtn: { 
    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.05)', 
    paddingHorizontal: Spacing.md, 
    paddingVertical: Spacing.sm, 
    borderRadius: Radius.sm 
  },
  createBtnText: { color: theme.purple, fontSize: Typography.sizes.sm, fontWeight: '600' },
  list: { padding: Spacing.lg, gap: Spacing.md },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  groupInfo: { flex: 1, paddingRight: Spacing.md },
  groupName: { color: theme.textPrimary, fontSize: Typography.sizes.base, fontWeight: '600', marginBottom: 2 },
  groupDesc: { color: theme.textSecondary, fontSize: Typography.sizes.sm, marginBottom: 8 },
  groupMembers: { color: theme.textMuted, fontSize: Typography.sizes.xs },
  enterBtn: { 
    backgroundColor: theme.bgInput, 
    borderWidth: 1, 
    borderColor: theme.border, 
    paddingHorizontal: Spacing.lg, 
    paddingVertical: 8, 
    borderRadius: Radius.md 
  },
  enterBtnText: { color: theme.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '600' }
  });
}
