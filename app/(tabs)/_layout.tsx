import React from 'react';
import { Tabs, Slot } from 'expo-router';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

import { supabase } from '@/lib/supabase';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    fetchUnreadCount();
    
    // Real-time listener for new notifications
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    } catch (e) {
      console.error('FETCH_UNREAD_ERROR:', e);
    }
  };

  // ── LAYOUT SELECTION ──────────────────────────────
  // We use Tabs for both mobile and web to keep the navigator stable,
  // but we hide the tab bar on desktop web.
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isWeb ? { display: 'none' } : s.tabBar,
        tabBarActiveTintColor: Colors.accent.primary,
        tabBarInactiveTintColor: Colors.text.tertiary,
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ title: 'Feed', tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="tavern" 
        options={{ title: 'Campus', tabBarIcon: ({ color }) => <Feather name="message-circle" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="challenges" 
        options={{ 
          title: 'Challenges', 
          tabBarIcon: ({ color }) => <Feather name="zap" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="search" 
        options={{ href: null }} 
      />
      <Tabs.Screen 
        name="inbox" 
        options={{ href: null }} 
      />
      <Tabs.Screen 
        name="learn" 
        options={{ href: null }} 
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  webRoot: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  tabBar: {
    backgroundColor: Colors.bg.primary,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border.subtle,
    height: 60,
    paddingBottom: 8,
  },
});