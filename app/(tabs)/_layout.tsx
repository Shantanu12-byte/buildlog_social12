import React from 'react';
import { Tabs } from 'expo-router';
import { useWindowDimensions, StyleSheet, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    fetchUnreadCount();
    
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
    } catch {
      // Silently handle fetch errors
    }
  };

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      <Tabs
        screenOptions={{
        headerShown: false,
        tabBarStyle: isWeb ? { display: 'none' } : [
          styles.tabBar,
          { 
            backgroundColor: theme.bg,
            borderTopColor: theme.border,
          }
        ],
        tabBarActiveTintColor: theme.purple,
        tabBarInactiveTintColor: theme.textMuted,
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

      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0.5,
    height: 60,
    paddingBottom: 8,
  },
});