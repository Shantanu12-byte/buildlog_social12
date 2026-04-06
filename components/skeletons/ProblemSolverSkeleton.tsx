import React from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { SkeletonRect, SkeletonCircle } from '@/components/ui/Skeleton';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

export function ProblemSolverSkeleton() {
  const { theme, isDark } = useTheme();
  const { isDesktop } = useResponsive();
  const s = React.useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

  return (
    <View style={s.container}>
      <View style={s.header}>
          <SkeletonRect width={200} height={32} style={{ marginBottom: 12 }} />
          <View style={s.tagRow}>
              <SkeletonRect width={60} height={20} borderRadius={Radius.sm} />
              <SkeletonRect width={80} height={20} borderRadius={Radius.sm} />
          </View>
      </View>
      
      <View style={s.content}>
          <View style={s.descriptionBlock}>
              <SkeletonRect width="90%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonRect width="95%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonRect width="85%" height={16} style={{ marginBottom: 24 }} />
              
              <SkeletonRect width={120} height={20} style={{ marginBottom: 12 }} />
              <SkeletonRect width="100%" height={100} borderRadius={Radius.md} />
          </View>
          
          <View style={s.editorPlaceholder}>
              <SkeletonRect width="100%" height={400} borderRadius={Radius.md} />
          </View>
      </View>

      <View style={s.footer}>
          <SkeletonRect width={120} height={48} borderRadius={12} />
          <SkeletonRect width={150} height={48} borderRadius={12} />
      </View>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean, isDesktop: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
  tagRow: { flexDirection: 'row', gap: 8 },
  content: {
    flex: 1,
    padding: 20,
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 20,
  },
  descriptionBlock: {
    flex: 1,
  },
  editorPlaceholder: {
    flex: isDesktop ? 1.5 : 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    justifyContent: 'flex-end',
  },
});
