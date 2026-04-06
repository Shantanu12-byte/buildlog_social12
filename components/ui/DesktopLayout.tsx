import React from 'react';
import { View, StyleSheet, Platform, TextInput, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/context/ThemeContext';
import { WebSidebar } from '@/components/WebSidebar';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { Avatar } from '@/components/ui/UI';
import { supabase } from '@/lib/supabase';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const { isDesktop, isTablet, showSidebar } = useResponsive();
  const { theme, isDark } = useTheme();
  const { userProfile } = useUserStore();
  const router = useRouter();

  const [search, setSearch] = React.useState('');
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (Platform.OS === 'web' && (isDesktop || isTablet)) {
      fetchUnreadCount();
      const channel = supabase
        .channel('desktop-notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchUnreadCount())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isDesktop, isTablet]);

  const fetchUnreadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  };

  if (Platform.OS !== 'web' || (!isDesktop && !isTablet)) {
    return <>{children}</>;
  }

  const borderCol = isDark ? '#1f2937' : '#e2e8f0';
  const bgCol = isDark ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.8)';

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.bg }]}>
      {/* Sidebar */}
      {showSidebar && <WebSidebar />}
      
      <View style={styles.mainWrapper}>
        {/* Sticky Top Bar */}
        <View style={[
          styles.topBar, 
          { 
            backgroundColor: bgCol,
            borderBottomColor: borderCol,
          }
        ]}>
          <View style={styles.topBarContent}>
            {/* Search Area */}
            <View style={[styles.searchBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: borderCol }]}>
              <Feather name="search" size={18} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search resources, builders, or logs..."
                placeholderTextColor={theme.textMuted}
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={() => router.push({ pathname: '/(tabs)/search', params: { q: search } } as any)}
              />
            </View>

            {/* Right Side Actions */}
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.iconBtn, { borderColor: borderCol }]}
                onPress={() => router.push('/(stack)/notifications')}
              >
                <Feather name="bell" size={20} color={theme.textPrimary} />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.profileBtn}
                onPress={() => router.push(`/(stack)/${userProfile?.username}` as any)}
              >
                <Avatar username={userProfile?.username || ''} uri={userProfile?.avatar_url} size={36} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Page Content */}
        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          <View style={styles.contentBox}>
            {children}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    flex: 1,
    height: '100vh' as any,
    overflow: 'hidden',
  },
  mainWrapper: {
    flex: 1,
    height: '100vh' as any,
  },
  topBar: {
    height: 70,
    borderBottomWidth: 1,
    zIndex: 100,
    justifyContent: 'center',
    paddingHorizontal: 32,
    ...Platform.select({
      web: {
        // @ts-ignore
        backdropFilter: 'blur(12px)',
      }
    })
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 450,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    ...Platform.select({
      web: {
        // @ts-ignore
        outlineStyle: 'none',
      }
    }) as any,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profileBtn: {
    marginLeft: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollArea: {
    flex: 1,
  },
  contentBox: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 60,
  }
});
