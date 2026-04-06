import React from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { SkeletonRect, SkeletonCircle } from '@/components/ui/Skeleton';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

export function TavernSkeleton() {
  const { theme, isDark } = useTheme();
  const { isDesktop } = useResponsive();
  const s = React.useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

  const Sidebar = () => (
    <View style={s.sidebar}>
      <SkeletonRect width="100%" height={240} borderRadius={24} style={{ marginBottom: 24 }} />
      <SkeletonRect width="100%" height={100} borderRadius={24} />
    </View>
  );

  const MainContent = () => (
    <View style={s.mainContent}>
      <View style={s.tabBarPlaceholder}>
          <SkeletonRect width={100} height={40} style={{ marginRight: 20 }} />
          <SkeletonRect width={100} height={40} />
      </View>
      <View style={s.list}>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={s.roomCard}>
            <SkeletonCircle size={44} style={{ marginRight: 16 }} />
            <View style={{ flex: 1 }}>
              <SkeletonRect width="50%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonRect width="80%" height={12} style={{ marginBottom: 8 }} />
              <SkeletonRect width="40%" height={10} />
            </View>
            <SkeletonRect width={80} height={28} borderRadius={14} />
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
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
    width: 320,
  },
  mainContent: { flex: 1 },
  tabBarPlaceholder: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingBottom: 10,
  },
  list: {
    gap: 12,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
});
