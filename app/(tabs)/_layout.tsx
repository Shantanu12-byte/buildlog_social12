import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: styles.tabBar,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-post"
        options={{
          title: 'New Post',
          tabBarIcon: ({ color }) => (
            <View style={styles.newPostIcon}>
              <Ionicons name="add-circle" size={42} color={Colors.primary} />
            </View>
          ),
          tabBarLabelStyle: styles.newPostLabel,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: '#000000',
    borderTopWidth: 4,
    height: 85,
    paddingBottom: 20,
    paddingTop: 10,
  },
  newPostIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8,
  },
  newPostLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: -4,
  },
});