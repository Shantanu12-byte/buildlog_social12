import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SkeletonRect, SkeletonCircle } from '@/components/ui/Skeleton';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/constants/theme';

export function FeedSkeleton() {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <SkeletonCircle size={48} />
        <View style={s.headerInfo}>
          <SkeletonRect width={120} height={14} style={{ marginBottom: 6 }} />
          <View style={s.metaRow}>
            <SkeletonRect width={60} height={10} style={{ marginRight: 8 }} />
            <SkeletonRect width={80} height={14} borderRadius={Radius.sm} />
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={s.contentSection}>
        <SkeletonRect width="100%" height={200} borderRadius={Radius.md} style={{ marginBottom: Spacing.lg }} />
        
        <View style={s.textInfo}>
          <SkeletonRect width={150} height={20} style={{ marginBottom: 12 }} />
          <SkeletonRect width="90%" height={14} style={{ marginBottom: 8 }} />
          <SkeletonRect width="80%" height={14} />
        </View>

        <View style={s.tagRow}>
          <SkeletonRect width={60} height={20} borderRadius={Radius.sm} />
          <SkeletonRect width={70} height={20} borderRadius={Radius.sm} />
          <SkeletonRect width={55} height={20} borderRadius={Radius.sm} />
        </View>
      </View>

      {/* Interactions */}
      <View style={s.interactions}>
        <SkeletonRect width={100} height={40} borderRadius={12} />
        <SkeletonRect width={60} height={40} borderRadius={12} />
        <SkeletonRect width={40} height={40} borderRadius={12} />
      </View>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  card: {
    backgroundColor: theme.bgCard,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: isDark ? theme.border : '#e2e8f0',
    marginBottom: 20,
    ...(Platform.OS === 'web' && {
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerInfo: {
    marginLeft: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentSection: {
    marginBottom: Spacing.md,
  },
  textInfo: {
    marginBottom: Spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  interactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
