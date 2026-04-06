import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SkeletonRect, SkeletonCircle } from '@/components/ui/Skeleton';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/constants/theme';

export function FormSkeleton() {
  const { theme, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={styles.header}>
        <SkeletonRect width={40} height={40} borderRadius={20} />
        <SkeletonRect width={150} height={24} />
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <SkeletonCircle size={100} style={{ alignSelf: 'center', marginBottom: 32 }} />
        
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.inputGroup}>
            <SkeletonRect width={80} height={12} style={{ marginBottom: 12 }} />
            <SkeletonRect width="100%" height={50} borderRadius={Radius.md} />
          </View>
        ))}
        
        <SkeletonRect width="100%" height={56} borderRadius={Radius.md} style={{ marginTop: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
});
