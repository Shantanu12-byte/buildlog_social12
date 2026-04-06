import React from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { SkeletonRect, SkeletonCircle } from '@/components/ui/Skeleton';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

export function ProfileSkeleton() {
  const { theme, isDark } = useTheme();
  const { isDesktop } = useResponsive();
  const s = React.useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

  const Sidebar = () => (
    <View style={s.sidebar}>
      <SkeletonCircle size={isDesktop ? 120 : 80} style={{ alignSelf: 'center', marginBottom: 20 }} />
      <SkeletonRect width={180} height={24} style={{ alignSelf: 'center', marginBottom: 8 }} />
      <SkeletonRect width={140} height={16} style={{ alignSelf: 'center', marginBottom: 24 }} />
      <View style={s.statsRow}>
        <SkeletonRect width={60} height={40} borderRadius={Radius.md} />
        <SkeletonRect width={60} height={40} borderRadius={Radius.md} />
        <SkeletonRect width={60} height={40} borderRadius={Radius.md} />
      </View>
      <SkeletonRect width="100%" height={100} borderRadius={Radius.md} style={{ marginTop: 24 }} />
    </View>
  );

  const MainContent = () => (
     <View style={s.mainContent}>
        <View style={s.tabBarPlaceholder}>
          <SkeletonRect width={100} height={40} style={{ marginRight: 20 }} />
          <SkeletonRect width={100} height={40} style={{ marginRight: 20 }} />
          <SkeletonRect width={100} height={40} />
        </View>
        <View style={s.list}>
          {[1, 2, 3].map(i => (
             <View key={i} style={s.listItem}>
                <SkeletonRect width="100%" height={140} borderRadius={Radius.md} />
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
        <ScrollView showsVerticalScrollIndicator={false}>
          <Sidebar />
          <MainContent />
        </ScrollView>
      )}
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean, isDesktop: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  desktopLayout: {
    flexDirection: 'row',
    padding: 32,
    gap: 32,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  sidebar: {
    width: isDesktop ? 300 : '100%',
    padding: isDesktop ? 0 : 20,
    backgroundColor: isDesktop ? 'transparent' : theme.bgCard,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  mainContent: {
    flex: 1,
    padding: isDesktop ? 0 : 16,
  },
  tabBarPlaceholder: {
    flexDirection: 'row',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingBottom: 10,
  },
  list: {
    gap: 16,
  },
  listItem: {
    marginBottom: 16,
  },
});
