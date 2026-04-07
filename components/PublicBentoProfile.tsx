import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { Avatar } from '@/components/ui/UI';
import { useTheme } from '@/context/ThemeContext';

interface PublicBentoProfileProps {
  user: {
    username: string;
    full_name?: string;
    bio?: string;
    college?: string;
    avatar_url?: string;
    github_url?: string;
    linkedin_url?: string;
    streak_count?: number;
  };
  pinnedProject?: {
    id: string;
    title: string;
    description: string;
    image_url?: string;
  };
  recentPosts: any[];
}

export function PublicBentoProfile({ user, pinnedProject, recentPosts }: PublicBentoProfileProps) {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  
  const displayName = user.full_name || user.username || 'Builder';
  const bio = user.bio || 'Building the future, one core at a time.';
  const streak = user.streak_count || 0;

  const openURL = (url?: string) => {
    if (url) Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Bento Grid */}
      <View style={styles.grid}>
        
        {/* Profile Card (Large) */}
        <View style={[styles.card, styles.profileCard]}>
          <View style={styles.profileHeader}>
            <Avatar username={user.username} uri={user.avatar_url} size={80} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.handle}>@{user.username}</Text>
            </View>
          </View>
          <Text style={styles.bio}>{bio}</Text>
          {user.college && (
            <View style={styles.collegeTag}>
              <Feather name="map-pin" size={12} color={theme.textSecondary} />
              <Text style={styles.collegeText}>{user.college}</Text>
            </View>
          )}
        </View>

        {/* Streak Card (Small) */}
        <View style={[styles.card, styles.streakCard]}>
          <View style={styles.streakIconContainer}>
            <FontAwesome5 name="fire-alt" size={32} color="#FF5F1F" />
          </View>
          <Text style={styles.streakCount}>{streak}</Text>
          <Text style={styles.streakLabel}>DAY STREAK</Text>
        </View>

        {/* Socials Card */}
        <View style={[styles.card, styles.socialsCard]}>
          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: '#24292e' }]} 
            onPress={() => openURL(user.github_url)}
          >
            <FontAwesome5 name="github" size={20} color="#FFF" />
            <Text style={styles.socialButtonText}>GitHub</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: '#0077b5' }]} 
            onPress={() => openURL(user.linkedin_url)}
          >
            <FontAwesome5 name="linkedin" size={20} color="#FFF" />
            <Text style={styles.socialButtonText}>LinkedIn</Text>
          </TouchableOpacity>
        </View>

        {/* Follow Card */}
        <TouchableOpacity style={[styles.card, styles.followCard]} activeOpacity={0.8}>
          <Text style={styles.followText}>Follow on CodeNid</Text>
          <Feather name="plus-circle" size={20} color="#FFF" />
        </TouchableOpacity>

        {/* Pinned Project (Wide) */}
        {pinnedProject && (
          <View style={[styles.card, styles.wideCard]}>
            <View style={styles.cardHeader}>
              <Feather name="star" size={16} color="#FFD700" />
              <Text style={styles.sectionTitle}>PINNED PROJECT</Text>
            </View>
            <View style={styles.projectContent}>
              {pinnedProject.image_url && (
                <Image source={{ uri: pinnedProject.image_url }} style={styles.projectImage} />
              )}
              <View style={styles.projectInfo}>
                <Text style={styles.projectTitle}>{pinnedProject.title}</Text>
                <Text style={styles.projectDesc} numberOfLines={2}>{pinnedProject.description}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={[styles.card, styles.wideCard, styles.activityCard]}>
          <View style={styles.cardHeader}>
            <Feather name="clock" size={16} color={theme.purple} />
            <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
          </View>
          <View style={styles.postsList}>
            {recentPosts.length > 0 ? (
              recentPosts.slice(0, 3).map((post, idx) => (
                <View key={post.id || idx} style={styles.postItem}>
                  <View style={styles.postDot} />
                  <View style={styles.postTextContainer}>
                    <Text style={styles.postTitle} numberOfLines={1}>{post.title || post.caption || 'New Update'}</Text>
                    <Text style={styles.postDate}>{new Date(post.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No recent posts.</Text>
            )}
          </View>
        </View>

      </View>

      {/* Footer Logo */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>built with CODENID</Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: Spacing.md,
    paddingTop: Platform.OS === 'web' ? 40 : 20,
    paddingBottom: 60,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  card: {
    backgroundColor: theme.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileCard: {
    width: '100%',
    minHeight: 180,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: theme.purple,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: theme.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  handle: {
    color: theme.purple,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  bio: {
    color: theme.textSecondary,
    fontSize: Typography.sizes.base,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  collegeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.bgInput,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  collegeText: {
    color: theme.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '500',
  },
  streakCard: {
    width: '47%',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },
  streakIconContainer: {
    marginBottom: Spacing.sm,
  },
  streakCount: {
    color: theme.textPrimary,
    fontSize: 32,
    fontWeight: '900',
  },
  streakLabel: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  socialsCard: {
    width: '47%',
    justifyContent: 'center',
    gap: Spacing.sm,
    aspectRatio: 1,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  socialButtonText: {
    color: '#FFF',
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
  },
  followCard: {
    width: '100%',
    backgroundColor: theme.purple,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderColor: theme.purple,
  },
  followText: {
    color: '#FFF',
    fontSize: Typography.sizes.md,
    fontWeight: '800',
  },
  wideCard: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  projectContent: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  projectImage: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    backgroundColor: theme.bgInput,
  },
  projectInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  projectTitle: {
    color: theme.textPrimary,
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    marginBottom: 4,
  },
  projectDesc: {
    color: theme.textSecondary,
    fontSize: Typography.sizes.sm,
    lineHeight: 18,
  },
  activityCard: {
    minHeight: 150,
  },
  postsList: {
    gap: Spacing.md,
  },
  postItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  postDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.purple,
  },
  postTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTitle: {
    color: theme.textPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.md,
  },
  postDate: {
    color: theme.textMuted,
    fontSize: Typography.sizes.xs,
  },
  emptyText: {
    color: theme.textMuted,
    fontSize: Typography.sizes.sm,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
