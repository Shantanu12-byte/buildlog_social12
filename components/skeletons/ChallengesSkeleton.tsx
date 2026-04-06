import React from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { SkeletonRect, SkeletonCircle } from '@/components/ui/Skeleton';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

export function ChallengesSkeleton() {
  const { theme, isDark } = useTheme();
  const { isDesktop } = useResponsive();
  const s = React.useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

  const Sidebar = () => (
    <View style={s.sidebar}>
      <SkeletonRect width="100%" height={200} borderRadius={24} style={{ marginBottom: 24 }} />
      <View style={s.statsRow}>
        <SkeletonRect width={80} height={60} borderRadius={16} />
        <SkeletonRect width={80} height={60} borderRadius={16} />
        <SkeletonRect width={80} height={60} borderRadius={16} />
      </View>
      <View style={s.quickActions}>
        <SkeletonRect width={120} height={50} borderRadius={16} />
        <SkeletonRect width={120} height={50} borderRadius={16} />
      </View>
    </View>
  );

  const MainContent = () => (
    <View style={s.mainContent}>
      <SkeletonRect width={150} height={32} style={{ marginBottom: 24 }} />
      <View style={s.filterRow}>
        <SkeletonRect width={70} height={36} borderRadius={12} style={{ marginRight: 8 }} />
        <SkeletonRect width={70} height={36} borderRadius={12} style={{ marginRight: 8 }} />
        <SkeletonRect width={70} height={36} borderRadius={12} />
      </View>
      <View style={s.list}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={s.listItem}>
            <SkeletonCircle size={40} style={{ marginRight: 16 }} />
            <View style={{ flex: 1 }}>
              <SkeletonRect width="60%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonRect width="40%" height={12} />
            </View>
            <SkeletonRect width={20} height={20} />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      {isDesktop ? (
        <View style={s.desktopLayout}>
          <Sidebar />
          <MainContent />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          <Sidebar />
          <MainContent />
        </ScrollView>
      )}
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean, isDesktop: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  desktopLayout: {
    flexDirection: 'row',
    gap: 32,
    padding: 32,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  sidebar: {
    width: isDesktop ? 340 : '100%',
    gap: 24,
  },
  statsRow: { flexDirection: 'row', gap: 12 },
  quickActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  mainContent: { flex: 1 },
  filterRow: { flexDirection: 'row', marginBottom: 24 },
  list: {
    backgroundColor: theme.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
});
