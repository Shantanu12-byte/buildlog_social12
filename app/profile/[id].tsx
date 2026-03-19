import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing } from '@/constants/theme';
import { Avatar, LoadingScreen } from '@/components/ui/UI';

const ACCENT_PURPLE = '#5D3FD3';
const CARD_BG = '#1A1A1A';

export default function OtherProfileScreen() {
  const router = useRouter();
  const { id: targetUserId } = useLocalSearchParams<{ id: string }>();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [stats, setStats] = useState({ followerCount: 0, followingCount: 0, postCount: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    init();
  }, [targetUserId]);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      if (user.id === targetUserId) {
        router.replace('/(tabs)/profile');
        return;
      }
      checkFollow(user.id);
    }
    loadData();
  }

  const checkFollow = async (uid: string) => {
    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', uid)
      .eq('following_id', targetUserId)
      .maybeSingle();
    
    setIsFollowing(!!data);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();
      setProfileData(profile);

      const [f1, f2, posts] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', targetUserId),
      ]);

      setStats({
        followerCount: f1.count || 0,
        followingCount: f2.count || 0,
        postCount: posts.count || 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId || actionLoading) return;
    setActionLoading(true);

    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', targetUserId);
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followerCount: prev.followerCount - 1 }));
      } else {
        await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetUserId });
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followerCount: prev.followerCount + 1 }));
        
        // Notification
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          type: 'follow',
          sender_id: currentUserId,
          content: 'Started following you.'
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not update follow status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = () => {
    router.push('/(stack)/messages');
  };

  if (isLoading) return <LoadingScreen />;

  const username = profileData?.username || 'builder';

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>PROFILE</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Identity */}
        <View style={s.identity}>
          <Avatar username={username} size={90} style={s.avatar} />
          <Text style={s.nameText}>{username}</Text>
          <Text style={s.handleText}>@{username.toLowerCase()}</Text>
          
          <Text style={s.bioText}>
            {profileData?.bio || 'No bio available.'}
          </Text>

          {/* Social Row */}
          <View style={s.socialRow}>
            <TouchableOpacity 
              style={s.socialPill}
              onPress={() => profileData?.github_url && Linking.openURL(profileData.github_url)}
            >
              <FontAwesome5 name="github" size={14} color={ACCENT_PURPLE} />
              <Text style={s.socialText}>GitHub</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[s.socialPill, { borderColor: '#34D399' }]}
              onPress={() => profileData?.linkedin_url && Linking.openURL(profileData.linkedin_url)}
            >
              <FontAwesome5 name="linkedin" size={14} color="#34D399" />
              <Text style={[s.socialText, { color: '#34D399' }]}>LinkedIn</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsBox}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{stats.postCount}</Text>
            <Text style={s.statLab}>Posts</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{stats.followerCount}</Text>
            <Text style={s.statLab}>Followers</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{stats.followingCount}</Text>
            <Text style={s.statLab}>Following</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={s.actionsRow}>
          <TouchableOpacity 
            style={[s.btnPrimary, isFollowing && s.btnFollowing]} 
            onPress={handleFollow}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={s.btnTextPrimary}>{isFollowing ? 'Following' : 'Follow'}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={handleMessage}>
            <Text style={s.btnTextSecondary}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Stack */}
        <View style={s.stackWrap}>
          <Text style={s.stackHeader}>STACK</Text>
          <View style={s.stackGrid}>
            {(profileData?.skills || ['React Native', 'Supabase', 'Node.js']).map((u: string, i: number) => (
              <View key={i} style={s.pill}>
                <Text style={s.pillTxt}>{u}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>- END_OF_TRANSMISSION -</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0B' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  identity: { alignItems: 'center', marginTop: 10, paddingHorizontal: 20 },
  avatar: { marginBottom: 16, borderWidth: 2, borderColor: '#1A1A1A' },
  nameText: { color: '#FFF', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  handleText: { color: '#888', fontSize: 16, fontWeight: '500', marginBottom: 12 },
  bioText: { color: '#CCC', fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  socialRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: ACCENT_PURPLE,
    backgroundColor: 'rgba(93, 63, 211, 0.05)',
  },
  socialText: { color: ACCENT_PURPLE, fontSize: 13, fontWeight: '600' },
  statsBox: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingVertical: 18,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statSep: { width: 1, height: '60%', backgroundColor: '#333', alignSelf: 'center' },
  statVal: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  statLab: { color: '#888', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24, paddingHorizontal: 20 },
  btnPrimary: {
    flex: 1,
    backgroundColor: ACCENT_PURPLE,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFollowing: {
    backgroundColor: '#333',
  },
  btnTextPrimary: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextSecondary: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  stackWrap: { paddingHorizontal: 20 },
  stackHeader: { color: '#444', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  stackGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(93, 63, 211, 0.1)',
    borderColor: 'rgba(93, 63, 211, 0.2)',
  },
  pillTxt: { color: '#A5B4FC', fontWeight: '700', fontSize: 13 },
  footer: { marginTop: 60, paddingBottom: 40, alignItems: 'center', opacity: 0.2 },
  footerText: { color: '#FFF', fontSize: 9, fontFamily: 'monospace' },
});
