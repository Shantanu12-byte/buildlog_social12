import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { ProjectCard, Project } from '@/components/ProjectCard';

export default function OtherProfileScreen() {
  const router = useRouter();
  const { id: targetUserId } = useLocalSearchParams<{ id: string }>();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setCurrentUserId(session.user.id);
        if (session.user.id === targetUserId) {
           router.replace('/(tabs)/profile');
           return;
        }
        checkFollow(session.user.id);
      }
      loadData();
    };
    init();
  }, [targetUserId]);

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
       // Profile
       const { data: profile } = await supabase
         .from('profiles')
         .select('*')
         .eq('id', targetUserId)
         .single();
       setProfileData(profile);

       // Projects
       const { data: projectsData } = await supabase
         .from('projects')
         .select('*')
         .eq('user_id', targetUserId)
         .order('created_at', { ascending: false });
       
       if (projectsData) {
         setProjects(projectsData.map(p => ({
           id: p.id,
           title: p.title,
           type: (p.needed_skills && p.needed_skills.length > 0) ? 'code' : 'other',
           currentDay: 1, // Simplified for now
           totalDays: p.challenge_duration || 30,
           status: p.status
         })));
       }

       // Stats
       const { count: f1 } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId);
       const { count: f2 } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId);
       setStats({ followers: f1 || 0, following: f2 || 0 });

     } catch (e) {
       // Silent error in production
     } finally {
       setIsLoading(false);
     }
  };

  const handleFollow = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      Alert.alert("Error", "Please log in again");
      return;
    }

    const uid = session.user.id;

    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', uid).eq('following_id', targetUserId);
      setIsFollowing(false);
      setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
    } else {
      await supabase.from('follows').upsert({ follower_id: uid, following_id: targetUserId });
      setIsFollowing(true);
      setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
    }
    setIsSaving(false);
  };

  const handleMessage = () => {
      // Find a project to message about or go to inbox
      router.push('/(tabs)/chat');
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Feather name="arrow-left" size={24} color="#FFF" />
      </TouchableOpacity>

      <View style={styles.avatarPixelBlock}>
        {profileData?.avatar_url ? (
          <Image source={{ uri: profileData.avatar_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Feather name="user" size={48} color="#666" />
          </View>
        )}
      </View>

      <Text style={styles.username}>{profileData?.username?.toUpperCase() || 'BUILDER'}</Text>

      {/* STATS ROW */}
      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{projects.length}</Text>
          <Text style={styles.statLabel}>PROJECTS</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{stats.followers}</Text>
          <Text style={styles.statLabel}>FOLLOWERS</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{stats.following}</Text>
          <Text style={styles.statLabel}>FOLLOWING</Text>
        </View>
      </View>

      <Text style={styles.bio}>{profileData?.bio || 'NO_BIO_AVAILABLE'}</Text>

      {/* ACTION MENU */}
      <View style={styles.actionMenu}>
        <TouchableOpacity 
          style={[styles.actionButton, isFollowing ? styles.unfollowButton : styles.followButton]} 
          onPress={handleFollow}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionButtonText}>{isFollowing ? '⚔️ UNFOLLOW' : '🗡️ FOLLOW'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
          <Text style={styles.actionButtonText}>💬 MESSAGE</Text>
        </TouchableOpacity>
      </View>

      {/* SKILLS */}
      {profileData?.skills && profileData.skills.length > 0 && (
        <View style={styles.skillsSection}>
          <Text style={styles.skillsTitle}>SKILLS</Text>
          <View style={styles.skillsContainer}>
            {profileData.skills.map((s: string, i: number) => (
              <View key={i} style={styles.skillBadge}>
                <Text style={styles.skillBadgeText}>{s.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.questLogTitle}>QUEST_LOG</Text>
    </View>
  );

  if (isLoading) return <View style={styles.loading}><ActivityIndicator size="large" color="#FFF" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={projects}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={{ width: '50%', padding: 4 }}>
            <ProjectCard project={item} />
          </View>
        )}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={{ justifyContent: 'flex-start' }}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  headerContainer: { alignItems: 'center', padding: 20 },
  backButton: { alignSelf: 'flex-start', marginBottom: 10 },
  avatarPixelBlock: {
    width: 104, height: 104, backgroundColor: '#8B8B8B', borderWidth: 4,
    borderTopColor: '#FFF', borderLeftColor: '#FFF', borderBottomColor: '#555', borderRightColor: '#555',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16
  },
  avatarImage: { width: 96, height: 96 },
  avatarPlaceholder: { width: 96, height: 96, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  username: { fontFamily: 'monospace', color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  statsRow: { flexDirection: 'row', width: '100%', gap: 8, marginBottom: 20 },
  statBlock: {
    flex: 1, backgroundColor: '#111', paddingVertical: 10, alignItems: 'center',
    borderWidth: 3, borderTopColor: '#333', borderLeftColor: '#333', borderBottomColor: '#000', borderRightColor: '#000'
  },
  statValue: { fontFamily: 'monospace', color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  statLabel: { fontFamily: 'monospace', color: '#888', fontSize: 8, marginTop: 2 },
  bio: { fontFamily: 'monospace', color: '#AAA', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  actionMenu: { flexDirection: 'row', width: '100%', gap: 12, marginBottom: 24 },
  actionButton: {
    flex: 1, backgroundColor: '#8B8B8B', paddingVertical: 14, alignItems: 'center',
    borderWidth: 4, borderTopColor: '#FFF', borderLeftColor: '#FFF', borderBottomColor: '#333', borderRightColor: '#333'
  },
  followButton: { backgroundColor: '#4CAF50' },
  unfollowButton: { backgroundColor: '#FF5252' },
  actionButtonText: { fontFamily: 'monospace', color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  skillsSection: { width: '100%', marginBottom: 20 },
  skillsTitle: { fontFamily: 'monospace', color: '#888', fontSize: 10, marginBottom: 8 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillBadge: { backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderWidth: 2, borderColor: '#444' },
  skillBadgeText: { fontFamily: 'monospace', color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  questLogTitle: { alignSelf: 'flex-start', fontFamily: 'monospace', color: '#FFF', fontSize: 14, fontWeight: 'bold', borderBottomWidth: 2, borderBottomColor: '#FFF', paddingBottom: 4, marginBottom: 10 },
  listContent: { paddingHorizontal: 10, paddingBottom: 40 }
});
