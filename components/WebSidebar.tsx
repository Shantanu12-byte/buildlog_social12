import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { FontSizes, Spacing } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/context/ThemeContext';

export function WebSidebar() {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();
  const pathname = usePathname();
  const { userProfile } = useUserStore();
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);

  const navItems = [
    { name: 'Feed', route: '/(tabs)', icon: 'home' },
    { name: 'Campus', route: '/(tabs)/tavern', icon: 'message-circle' },
    { name: 'Challenges', route: '/(tabs)/challenges', icon: 'zap' },
    { name: 'Profile', route: '/(tabs)/profile', icon: 'user' },
  ];

  if (Platform.OS !== 'web') return null;

  return (
    <View style={s.sidebarContainer}>
      <View style={s.logoContainer}>
        <Text style={s.logoText}>BUILDLOG</Text>
      </View>

      <View style={s.navContainer}>
        {navItems.map((item) => {
          const isActive = 
            (item.route === '/(tabs)' && (pathname === '/' || pathname === '/(tabs)')) ||
            pathname.includes(item.route.replace('/(tabs)', ''));

          const isHovered = hoveredRoute === item.route;

          return (
            <TouchableOpacity
              key={item.route}
              style={[
                s.navItem,
                isHovered && s.navItemHovered,
              ]}
              onMouseEnter={() => setHoveredRoute(item.route)}
              onMouseLeave={() => setHoveredRoute(null)}
              onPress={() => {
                router.push(item.route as any);
              }}
              activeOpacity={0.7}
              {...({} as any)} 
            >
              <Feather 
                name={item.icon as any} 
                size={24} 
                color={isActive ? theme.purple : theme.textSecondary} 
              />
              <Text 
                style={[
                  s.navText,
                  isActive && s.navTextActive
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.footerContainer}>
        <TouchableOpacity 
          style={s.postButton}
          onPress={() => router.push('/(stack)/new-post')}
        >
          <Feather name="plus-square" size={20} color={isDark ? "#000" : "#FFF"} />
          <Text style={s.postButtonText}>NEW_LOG</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  sidebarContainer: {
    width: 240,
    height: '100%',
    backgroundColor: theme.bg,
    borderRightWidth: 1,
    borderRightColor: theme.border,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
  },
  logoContainer: {
    marginBottom: Spacing['3xl'],
    paddingHorizontal: Spacing.sm,
  },
  logoText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: FontSizes['2xl'],
    fontWeight: 'bold',
    color: theme.textPrimary,
    letterSpacing: 2,
  },
  navContainer: {
    flex: 1,
    gap: Spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    gap: 16,
  },
  navItemHovered: {
    backgroundColor: theme.bgInput,
  },
  navText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  navTextActive: {
    color: theme.purple,
    fontWeight: 'bold',
  },
  footerContainer: {
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.purple,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    gap: 8,
  },
  postButtonText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: isDark ? '#000000' : '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
