import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, TouchableOpacity, Linking, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { ProjectCard, Project } from '@/components/ProjectCard';
import { AuroraBackground } from '@/components/AuroraBackground';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { getThemeColors } from '@/constants/theme';
import { useState, useEffect, useCallback } from 'react';

const glassBorder = { borderWidth: 1, borderColor: Colors.border };
const textGlow = { textShadowColor: 'rgba(255,255,255,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 };

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string }>();
  
  // Determine if viewing own profile or another user's
  // Global state
  const { userProfile, userId: storeUserId, fetchUserProfile, isEnderMode } = useUserStore();
  const colors = getThemeColors(isEnderMode);
  
  // Local state for projects and other user views
  const [profileData, setProfileData] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ followers: 0, following: 0 });

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  const handleOpenLink = async (url: string | null | undefined) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log("Don't know how to open URI: " + url);
      }
    } catch (error) {
      console.error("An error occurred", error);
    }
  };

  // Fetch profile data from Supabase
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (data) {
        console.log("Profile Refreshed:", data.username);
      }
      return data;
    } catch (e) {
      console.error('Network error fetching profile:', e);
      return null;
    }
  }, []);

  const fetchProjects = useCallback(async (userId: string) => {
    // ... same logic ...
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return [];
      }

      if (!data) return [];

      const projectsData: Project[] = data.map((project: any) => {
        const createdDate = new Date(project.created_at);
        const now = new Date();
        const diffTime = now.getTime() - createdDate.getTime();
        const currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const totalDays = project.challenge_duration || 30;

        return {
          id: project.id,
          title: project.title,
          type: project.needed_skills && project.needed_skills.length > 0 ? 'code' : 'other',
          currentDay: Math.min(currentDay, totalDays),
          totalDays: totalDays,
          status: project.status as 'active' | 'completed',
        };
      });

      return projectsData;
    } catch (e) {
      console.error('Network error fetching projects:', e);
      return [];
    }
  }, []);

  const fetchStats = useCallback(async (userId: string) => {
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    setStats({
      followers: followersCount || 0,
      following: followingCount || 0,
    });
  }, []);

  // Initialize: get current user and fetch profile data
  const loadProfileData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Robust session retrieval
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data: rData } = await supabase.auth.refreshSession();
        session = rData.session;
      }

      if (!session) {
        setIsLoading(false);
        return;
      }

      const userId = session.user.id;
      
      const isOwnProfile = !params.userId || params.userId === userId;
      const targetUserId = params.userId || userId;
      
      if (isOwnProfile) {
        // We sync local display state with global store
        setProfileData(userProfile);
      } else {
        const profile = await fetchProfile(targetUserId);
        setProfileData(profile);
      }

      const userProjects = await fetchProjects(targetUserId);
      setProjects(userProjects);
      fetchStats(targetUserId);
    } catch (e) {
      console.error('Error loading profile data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [params.userId, fetchProfile, fetchProjects, userProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData, userProfile]) // Add userProfile to deps to react to global changes
  );

  const isOwnProfile = !params.userId || params.userId === storeUserId;
  const displayProfile = isOwnProfile ? userProfile : profileData;

  const handleFollowPress = () => {
    console.log('Follow pressed for user:', params.userId || storeUserId);
  };

  const handleMessagePress = () => {
    console.log('Message pressed for user:', params.userId || storeUserId);
  };

  const renderProject = ({ item }: { item: Project }) => (
    <ProjectCard project={item} />
  );
  const renderHeader = () => {
    return (
      <View style={styles.headerSection}>
        {/* Top Bar with Retro Title and Settings */}
        <View style={styles.topBar}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>PROFILE</Text>
          <TouchableOpacity 
            style={[styles.pixelButtonSmall, { backgroundColor: colors.primaryDark, borderTopColor: colors.primary, borderLeftColor: colors.primary }]} 
            onPress={() => router.push('/(stack)/settings')}
          >
            <Feather name="settings" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Avatar with Pixel Block Bevel */}
        <View style={styles.avatarPixelBlock}>
          {displayProfile?.avatar_url ? (
            <Image 
              source={{ uri: displayProfile.avatar_url }} 
              style={styles.avatarImage} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Feather name="user" size={48} color={Colors.textSecondary} />
            </View>
          )}
        </View>

        {/* User Info with Monospace */}
        <Text style={[styles.username, { color: colors.primary }]}>{displayProfile?.username || 'BUILDLOG_USER'}</Text>
        
        {/* STATS ROW */}
        <View style={styles.statsRow}>
          <View style={[styles.statBlock, { backgroundColor: colors.surface, borderTopColor: colors.borderSubtle, borderLeftColor: colors.borderSubtle }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{projects.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>PROJECTS</Text>
          </View>
          <TouchableOpacity 
            style={[styles.statBlock, { backgroundColor: colors.surface, borderTopColor: colors.borderSubtle, borderLeftColor: colors.borderSubtle }]}
            onPress={() => router.push({ pathname: '/(stack)/network', params: { type: 'followers' } })}
          >
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.followers}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ALLIES</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statBlock, { backgroundColor: colors.surface, borderTopColor: colors.borderSubtle, borderLeftColor: colors.borderSubtle }]}
            onPress={() => router.push({ pathname: '/(stack)/network', params: { type: 'following' } })}
          >
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.following}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>FOLLOWING</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.bio, { color: colors.textSecondary }]}>{displayProfile?.bio || 'NO BIO YET...'}</Text>

        {/* ACTION MENU - The New Command Center */}
        <View style={styles.actionMenu}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primaryDark, borderTopColor: colors.primary, borderLeftColor: colors.primary }]}
            onPress={() => router.push('/(stack)/new-post')}
          >
            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>📝 NEW POST</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primaryDark, borderTopColor: colors.primary, borderLeftColor: colors.primary }]}
            onPress={() => router.push('/(stack)/create-project')}
          >
            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>⚔️ NEW QUEST</Text>
          </TouchableOpacity>
        </View>

        {/* SKILLS SECTION */}
        {displayProfile?.skills && displayProfile.skills.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.skillsTitle}>SKILLS</Text>
            <View style={styles.skillsContainer}>
              {displayProfile.skills.map((skill: string, index: number) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillBadgeText}>{skill.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Edit Button - Moved below skills */}
        <TouchableOpacity 
          style={[styles.pixelButtonLarge, { backgroundColor: colors.surface, borderTopColor: colors.borderSubtle, borderLeftColor: colors.borderSubtle }]}
          onPress={() => router.push('/(stack)/edit-profile')}
        >
          <Text style={[styles.pixelButtonText, { color: colors.primary }]}>EDIT CHARACTER</Text>
        </TouchableOpacity>

        {/* Social Links Row - MOVED BELOW EDIT BUTTON */}
        <View style={styles.socialRow}>
          {displayProfile?.github_url ? (
            <TouchableOpacity 
              style={[styles.pixelButtonSocial, styles.githubButton]} 
              onPress={() => handleOpenLink(displayProfile.github_url)}
            >
              <Feather name="github" size={20} color="#FFFFFF" />
              <Text style={styles.pixelButtonTextSmall}>GITHUB</Text>
            </TouchableOpacity>
          ) : null}
          {displayProfile?.linkedin_url ? (
            <TouchableOpacity 
              style={[styles.pixelButtonSocial, styles.linkedinButton]} 
              onPress={() => handleOpenLink(displayProfile.linkedin_url)}
            >
              <Feather name="linkedin" size={20} color="#FFFFFF" />
              <Text style={styles.pixelButtonTextSmall}>LINKEDIN</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={[styles.sectionHeader, { backgroundColor: colors.surface, borderTopColor: colors.borderSubtle }]}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>QUEST_LOG</Text>
            <Text style={[styles.projectCount, { color: colors.textSecondary }]}>{projects.length} BUILDS</Text>
          </View>
          <TouchableOpacity 
            style={[styles.pixelButtonMini, { backgroundColor: colors.primary, borderBottomColor: colors.primaryDark, borderRightColor: colors.primaryDark }]}
            onPress={() => router.push('/(stack)/create-project')}
          >
            <Feather name="plus" size={14} color={colors.background} />
            <Text style={[styles.pixelButtonTextMini, { color: colors.background }]}>NEW_QUEST</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
 

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="folder" size={48} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.primary }]}>No projects yet</Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Start your first project to see it here</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadProfileData}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

// Helper functions to calculate stats
function calculateStreaks(projects: Project[]): number {
  return projects.filter(p => p.status === 'active').length;
}

function calculateCollabs(projects: Project[]): number {
  return projects.filter(p => p.type === 'code').length;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    backgroundColor: '#000000',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontSize: FontSizes['3xl'],
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarPixelBlock: {
    width: 104,
    height: 104,
    backgroundColor: '#8B8B8B',
    borderWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#555555',
    borderRightColor: '#555555',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarImage: {
    width: 96,
    height: 96,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    width: '90%',
    gap: 8,
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  statBlock: {
    flex: 1,
    backgroundColor: '#111111',
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 3,
    borderTopColor: '#333333',
    borderLeftColor: '#333333',
    borderBottomColor: '#000000',
    borderRightColor: '#000000',
  },
  statValue: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statLabel: {
    fontFamily: 'monospace',
    color: '#888888',
    fontSize: 8,
    marginTop: 2,
    letterSpacing: 1,
  },
  bio: {
    fontFamily: 'monospace',
    color: '#AAAAAA',
    fontSize: FontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
    justifyContent: 'center',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  pixelButtonSocial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 4,
    borderRadius: 0,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#555555',
    borderRightColor: '#555555',
  },
  githubButton: {
    backgroundColor: '#333333',
  },
  linkedinButton: {
    backgroundColor: '#0077B5',
  },
  pixelButtonTextSmall: {
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionMenu: {
    flexDirection: 'row',
    width: '90%',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#8B8B8B',
    paddingVertical: 14,
    borderWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#333333',
    borderRightColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  skillsSection: {
    width: '90%',
    marginBottom: Spacing.xl,
    alignItems: 'flex-start',
  },
  skillsTitle: {
    fontFamily: 'monospace',
    color: '#888888',
    fontSize: 10,
    marginBottom: 8,
    letterSpacing: 2,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#444444',
  },
  skillBadgeText: {
    fontFamily: 'monospace',
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pixelButtonLarge: {
    width: '90%',
    backgroundColor: '#111111',
    paddingVertical: Spacing.md,
    borderWidth: 4,
    borderTopColor: '#333333',
    borderLeftColor: '#333333',
    borderBottomColor: '#000000',
    borderRightColor: '#000000',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  pixelButtonText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: FontSizes.base,
    fontWeight: 'bold',
  },
  pixelButtonSmall: {
    backgroundColor: '#8B8B8B',
    padding: Spacing.xs,
    borderWidth: 3,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#555555',
    borderRightColor: '#555555',
  },
  sectionHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#111111',
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderTopColor: '#333333',
    borderBottomColor: '#000000',
  },
  sectionTitleRow: {
    flexDirection: 'column',
    gap: 2,
  },
  sectionTitle: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
  },
  projectCount: {
    fontFamily: 'monospace',
    color: '#888888',
    fontSize: 10,
  },
  pixelButtonMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2F81F7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderWidth: 3,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#1A4D94',
    borderRightColor: '#1A4D94',
    gap: 4,
  },
  pixelButtonTextMini: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: Spacing['5xl'],
    backgroundColor: '#111111',
  },
  row: {
    justifyContent: 'flex-start',
    paddingHorizontal: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontFamily: 'monospace',
    color: '#666666',
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
  },
});
