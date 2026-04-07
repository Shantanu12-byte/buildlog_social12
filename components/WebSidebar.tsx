import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Switch, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { FontSizes, Spacing, Radius } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from './ui/UI';

export function WebSidebar() {
  const { theme, isDark, toggleTheme } = useTheme();
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
      <View>
        {/* Logo Section */}
        <View style={s.logoContainer}>
          <View style={s.logoIcon}>
            <Image 
              source={require('../assets/codenid_logo.png')}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </View>
          <Text style={s.logoText}>CODENID</Text>
        </View>

        <View style={s.divider} />

        {/* Navigation Section */}
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
                  isActive && s.navItemActive,
                  !isActive && isHovered && s.navItemHovered,
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
                  size={20} 
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

        <View style={s.divider} />

        {/* Theme Toggle Section */}
        <View style={s.themeSection}>
          <View style={s.themeRow}>
            <Text style={s.themeEmoji}>☀️</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ 
                false: '#7c3aed', 
                true: '#374151' 
              }}
              thumbColor='#ffffff'
              style={{ marginHorizontal: 12, transform: [{ scale: 0.8 }] }}
            />
            <Text style={s.themeEmoji}>🌙</Text>
          </View>
        </View>

        {/* Action Section */}
        <View style={s.actionSection}>
          <TouchableOpacity 
            style={s.postButton}
            onPress={() => router.push('/(stack)/new-post')}
          >
            <Feather name="plus-circle" size={18} color="#FFF" />
            <Text style={s.postButtonText}>NEW LOG</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Pill Section */}
      <View style={s.footerContainer}>
        <View style={s.divider} />
        <TouchableOpacity 
          style={s.userPill} 
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <Avatar username={userProfile?.username || 'you'} size={32} />
          <View style={s.userInfo}>
            <Text style={s.userName} numberOfLines={1}>@{userProfile?.username || 'builder'}</Text>
          </View>
          <Feather name="chevron-up" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  sidebarContainer: {
    width: 260,
    height: '100%',
    backgroundColor: theme.bg,
    borderRightWidth: 1,
    borderRightColor: theme.border,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: isDark ? '#FFF' : '#0f172a',
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginHorizontal: 12,
    marginVertical: 12,
    opacity: 0.5,
  },
  navContainer: {
    paddingHorizontal: 12,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : '#f5f3ff',
    borderLeftWidth: 3,
    borderLeftColor: theme.purple,
    borderRadius: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  navItemHovered: {
    backgroundColor: theme.bgInput,
  },
  navText: {
    fontSize: 15,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  navTextActive: {
    color: theme.purple,
    fontWeight: '600',
  },
  themeSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bgInput,
    paddingVertical: 8,
    borderRadius: 12,
  },
  themeEmoji: {
    fontSize: 14,
  },
  actionSection: {
    paddingHorizontal: 12,
    marginTop: 24,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.purple,
    paddingVertical: 14,
    borderRadius: Radius.md,
    gap: 8,
    shadowColor: theme.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  footerContainer: {
    paddingHorizontal: 12,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 10,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
