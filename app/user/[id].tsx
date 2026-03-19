import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Pressable
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { AvatarBlock } from '@/components/AvatarBlock';
import { ProjectCard } from '@/components/ProjectCard';

export default function PublicPlayerCard() {
  const { id: targetUserId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userProfile } = useUserStore();
  
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    
    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();
      
      if (profileError) throw profileError;
      setProfile(profileData);

      // 2. Fetch Quests
      const { data: questsData, error: questsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });
      
      if (questsError) throw questsError;
      setProjects(questsData || []);

      // 3. Fetch Follow Status
      if (userProfile?.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', userProfile.id)
          .eq('following_id', targetUserId)
          .maybeSingle();
        
        setIsFollowing(!!followData);
      }

      // 4. Fetch Stats
      const { count, error: countError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);
      
      if (!countError) setFollowersCount(count || 0);

    } catch (error) {
      Alert.alert('DATABASE_ERROR', 'COULD_NOT_RETRIEVE_PLAYER_DATA');
    } finally {
      setLoading(false);
    }
  }, [targetUserId, userProfile?.id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleFollowToggle = async () => {
    if (!userProfile?.id || actionLoading) return;
    setActionLoading(true);

    try {
      if (isFollowing) {
        // DROP_ALLY
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', userProfile.id)
          .eq('following_id', targetUserId);
        
        if (error) throw error;
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        // ADD_ALLY
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: userProfile.id,
            following_id: targetUserId
          });
        
        if (error) throw error;
        
        // Trigger Notification
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          type: 'follow',
          sender_id: userProfile.id,
          content: `@${userProfile.username || 'BUILDER'} HAS_JOINED_YOUR_NETWORK.`
        });

        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      Alert.alert('TRANSMISSION_FAILED', 'COULD_NOT_UPDATE_ALLY_STATUS');
    } finally {
      setActionLoading(false);
    }
  };

  const renderHeader = () => {
    const isMe = targetUserId === userProfile?.id;

    return (
      <View style={styles.header}>
        {/* Dynamic Header Block */}
        <View style={styles.playerCardTop}>
          <AvatarBlock 
            url={profile?.avatar_url} 
            username={profile?.username} 
            size={80}
            tier={profile?.level || 'Default'}
          />
          <View style={styles.playerInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image 
                source={require('../../assets/developer_emblem.png')}
                style={{ width: 20, height: 20, marginRight: 8 }}
                tintColor={profile?.level === 'Architect' ? '#00E5FF' : profile?.level === 'Legend' ? '#FFD700' : '#55FF55'}
              />
              <Text style={styles.usernameText}>{profile?.username?.toUpperCase() || 'UNKNOWN_UNIT'}</Text>
            </View>
            <Text style={styles.rankText}>LVL {profile?.level || '1'} {profile?.level === 'Architect' ? 'MASTER_BUILDER' : 'RECRUIT'}</Text>
            <Text style={styles.statsText}>{followersCount} ALLIES // {projects.length} PROJECTS</Text>
          </View>
        </View>

        {/* Action Button */}
        {isMe ? (
          <View style={[styles.actionButton, styles.dropButton, { opacity: 0.5 }]}>
            <Text style={styles.actionButtonText}>[ THIS_IS_YOU ]</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              isFollowing ? styles.dropButton : styles.addButton
            ]}
            onPress={handleFollowToggle}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={isFollowing ? "#FFF" : "#000"} />
            ) : (
              <Text style={[styles.actionButtonText, !isFollowing && { color: '#000' }]}>
                {isFollowing ? '[ DROP_ALLY ]' : '[ ADD_ALLY ]'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>{'> PUBLIC_PROJECTS...'}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#55FF55" />
          <Text style={styles.loadingText}>PULLING_PLAYER_PROFILE...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Feather name="arrow-left" size={24} color="#FFF" />
      </TouchableOpacity>
      
      <FlatList
        data={projects}
        ListHeaderComponent={renderHeader}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.projectWrapper}>
            <ProjectCard project={{
              id: item.id,
              title: item.title,
              type: 'code',
              currentDay: 1,
              totalDays: item.challenge_duration || 30,
              status: item.status
            }} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{'> THIS_PLAYER_HAS_NO_ACTIVE_PROJECTS.'}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    padding: 16,
    zIndex: 10,
  },
  header: {
    padding: 20,
  },
  playerCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderWidth: 4,
    borderTopColor: '#333',
    borderLeftColor: '#333',
    borderBottomColor: '#000',
    borderRightColor: '#000',
    padding: 16,
    gap: 16,
    marginBottom: 16,
  },
  playerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  usernameText: {
    fontFamily: 'monospace',
    color: '#00E5FF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  rankText: {
    fontFamily: 'monospace',
    color: '#FFD700',
    fontSize: 10,
    marginTop: 4,
  },
  statsText: {
    fontFamily: 'monospace',
    color: '#555',
    fontSize: 8,
    marginTop: 8,
  },
  actionButton: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    marginBottom: 32,
  },
  addButton: {
    backgroundColor: '#55FF55',
    borderTopColor: '#FFF',
    borderLeftColor: '#FFF',
    borderBottomColor: '#000',
    borderRightColor: '#000',
  },
  dropButton: {
    backgroundColor: '#222',
    borderTopColor: '#444',
    borderLeftColor: '#444',
    borderBottomColor: '#000',
    borderRightColor: '#000',
  },
  actionButtonText: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sectionTitle: {
    fontFamily: 'monospace',
    color: '#FFD700',
    fontSize: 14,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  projectWrapper: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  loadingText: {
    fontFamily: 'monospace',
    color: '#55FF55',
    marginTop: 16,
    fontSize: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'monospace',
    color: '#333',
    fontSize: 12,
    textAlign: 'center',
  },
});
