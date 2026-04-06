import React from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { SkeletonRect, SkeletonCircle } from '@/components/ui/Skeleton';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

export function SearchSkeleton() {
  const { theme, isDark } = useTheme();
  const { isDesktop } = useResponsive();
  const s = React.useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

  return (
    <View style={s.container}>
      <View style={s.tabBarPlaceholder}>
          <SkeletonRect width={100} height={40} style={{ marginRight: 20 }} />
          <SkeletonRect width={100} height={40} />
      </View>
      <View style={s.list}>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={s.searchCard}>
            <SkeletonCircle size={50} style={{ marginRight: 16 }} />
            <View style={{ flex: 1 }}>
              <SkeletonRect width="40%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonRect width="70%" height={12} style={{ marginBottom: 8 }} />
              <SkeletonRect width="30%" height={10} style={{ marginBottom: 16 }} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <SkeletonRect width={50} height={20} borderRadius={Radius.sm} />
                <SkeletonRect width={60} height={20} borderRadius={Radius.sm} />
              </View>
            </View>
            <SkeletonRect width={38} height={38} borderRadius={10} />
          </View>
        ))}
      </View>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean, isDesktop: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: isDesktop ? 32 : 0 },
  tabBarPlaceholder: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingBottom: 10,
    paddingHorizontal: isDesktop ? 0 : 16,
  },
  list: {
    gap: 12,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isDesktop ? 24 : 16,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    backgroundColor: isDesktop ? theme.bgCard : 'transparent',
    borderRadius: isDesktop ? 16 : 0,
    borderWidth: isDesktop ? 1 : 0,
    borderColor: theme.border,
  },
});
