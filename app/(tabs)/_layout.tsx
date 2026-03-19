import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { useEffect, useState } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const { userProfile } = useUserStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userProfile?.id) return;

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile.id)
        .eq('is_read', false);
      
      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    const channel = supabase
      .channel(`unread_notifications:${userProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: [
          styles.tabBar,
          Platform.OS === 'web' && {
            maxWidth: 600,
            width: '100%',
            alignSelf: 'center',
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: '#333333',
            left: 'auto',
            right: 'auto',
          }
        ],
        tabBarLabelStyle: { fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold' },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tavern"
        options={{
          title: 'Tavern',
          tabBarIcon: ({ color, size }) => (
            <Feather name="coffee" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Feather name="mail" size={size} color={color} />
              {unreadCount > 0 && (
                <View style={styles.unreadBadge} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000',
    borderTopWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#555555',
    borderBottomColor: '#555555',
    height: 85,
    paddingBottom: 20,
    paddingTop: 10,
  },
  newPostIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8,
    backgroundColor: '#8B8B8B',
    borderWidth: 2,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#333333',
    borderRightColor: '#333333',
    width: 48,
    height: 48,
  },
  newPostLabel: {
    fontFamily: 'monospace',
    color: '#888888',
    fontSize: 10,
    marginTop: -4,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 6,
    height: 6,
    backgroundColor: '#FF0000',
    borderWidth: 1,
    borderColor: '#FFF',
  },
});