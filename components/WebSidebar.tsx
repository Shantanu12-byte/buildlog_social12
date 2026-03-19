import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';

export function WebSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { userProfile } = useUserStore();
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);

  const navItems = [
    { name: 'Feed', route: '/(tabs)', icon: 'home' },
    { name: 'Search', route: '/(tabs)/search', icon: 'search' },
    { name: 'Tavern', route: '/(tabs)/tavern', icon: 'coffee' },
    { name: 'Inbox', route: '/(tabs)/inbox', icon: 'mail' },
    { name: 'Profile', route: '/(tabs)/profile', icon: 'user' },
  ];

  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.sidebarContainer}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>BUILDLOG</Text>
      </View>

      <View style={styles.navContainer}>
        {navItems.map((item) => {
          // Basic active state check. Pathname can be '/' or '/search', etc.
          const isActive = 
            (item.route === '/(tabs)' && (pathname === '/' || pathname === '/(tabs)')) ||
            pathname.includes(item.route.replace('/(tabs)', ''));

          const isHovered = hoveredRoute === item.route;

          return (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.navItem,
                isHovered && styles.navItemHovered,
              ]}
              onMouseEnter={() => setHoveredRoute(item.route)}
              onMouseLeave={() => setHoveredRoute(null)}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
              {...({} as any)} // Cast for RN Web props
            >
              <Feather 
                name={item.icon as any} 
                size={24} 
                color={isActive ? '#FFFFFF' : '#888888'} 
              />
              <Text 
                style={[
                  styles.navText,
                  isActive && styles.navTextActive
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={styles.postButton}
          onPress={() => router.push('/(stack)/new-post')}
        >
          <Feather name="plus-square" size={20} color="#000" />
          <Text style={styles.postButtonText}>NEW_LOG</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarContainer: {
    width: 240,
    height: '100%',
    backgroundColor: '#000000',
    borderRightWidth: 1,
    borderRightColor: '#333333',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
  },
  logoContainer: {
    marginBottom: Spacing['3xl'],
    paddingHorizontal: Spacing.sm,
  },
  logoText: {
    fontFamily: 'monospace',
    fontSize: FontSizes['2xl'],
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    transitionDuration: '0.2s',
  },
  navItemHovered: {
    backgroundColor: '#1A1A1A',
  },
  navText: {
    fontFamily: 'monospace',
    fontSize: 16,
    color: '#888888',
    fontWeight: '600',
  },
  navTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  footerContainer: {
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.md,
    borderRadius: 8,
    gap: 8,
  },
  postButtonText: {
    fontFamily: 'monospace',
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
