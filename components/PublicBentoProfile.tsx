import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Avatar, Tag } from '@/components/ui/UI';

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
  const displayName = user.full_name || user.username || 'Builder';
  const bio = user.bio || 'Building the future, one core at a time.';
  const streak = user.streak_count || 0;

  const openURL = (url?: string) => {
    if (url) Linking.openURL(url);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Bento Grid */}
      <View style={s.grid}>
        
        {/* Profile Card (Large) */}
        <View style={[s.card, s.profileCard]}>
          <View style={s.profileHeader}>
            <Avatar username={user.username} uri={user.avatar_url} size={80} style={s.avatar} />
            <View style={s.profileInfo}>
              <Text style={s.name}>{displayName}</Text>
              <Text style={s.handle}>@{user.username}</Text>
            </View>
          </View>
          <Text style={s.bio}>{bio}</Text>
          {user.college && (
            <View style={s.collegeTag}>
              <Feather name="map-pin" size={12} color={Colors.text.secondary} />
              <Text style={s.collegeText}>{user.college}</Text>
            </View>
          )}
        </View>

        {/* Streak Card (Small) */}
        <View style={[s.card, s.streakCard]}>
          <View style={s.streakIconContainer}>
            <FontAwesome5 name="fire-alt" size={32} color="#FF5F1F" />
          </View>
          <Text style={s.streakCount}>{streak}</Text>
          <Text style={s.streakLabel}>DAY STREAK</Text>
        </View>

        {/* Socials Card */}
        <View style={[s.card, s.socialsCard]}>
          <TouchableOpacity 
            style={[s.socialButton, { backgroundColor: '#24292e' }]} 
            onPress={() => openURL(user.github_url)}
          >
            <FontAwesome5 name="github" size={20} color="#FFF" />
            <Text style={s.socialButtonText}>GitHub</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.socialButton, { backgroundColor: '#0077b5' }]} 
            onPress={() => openURL(user.linkedin_url)}
          >
            <FontAwesome5 name="linkedin" size={20} color="#FFF" />
            <Text style={s.socialButtonText}>LinkedIn</Text>
          </TouchableOpacity>
        </View>

        {/* Follow Card */}
        <TouchableOpacity style={[s.card, s.followCard]} activeOpacity={0.8}>
          <Text style={s.followText}>Follow on Buildlog</Text>
          <Feather name="plus-circle" size={20} color="#FFF" />
        </TouchableOpacity>

        {/* Pinned Project (Wide) */}
        {pinnedProject && (
          <View style={[s.card, s.wideCard]}>
            <View style={s.cardHeader}>
              <Feather name="star" size={16} color="#FFD700" />
              <Text style={s.sectionTitle}>PINNED PROJECT</Text>
            </View>
            <View style={s.projectContent}>
              {pinnedProject.image_url && (
                <Image source={{ uri: pinnedProject.image_url }} style={s.projectImage} />
              )}
              <View style={s.projectInfo}>
                <Text style={s.projectTitle}>{pinnedProject.title}</Text>
                <Text style={s.projectDesc} numberOfLines={2}>{pinnedProject.description}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={[s.card, s.wideCard, s.activityCard]}>
          <View style={s.cardHeader}>
            <Feather name="clock" size={16} color={Colors.accent.primary} />
            <Text style={s.sectionTitle}>RECENT ACTIVITY</Text>
          </View>
          <View style={s.postsList}>
            {recentPosts.length > 0 ? (
              recentPosts.slice(0, 3).map((post, idx) => (
                <View key={post.id || idx} style={s.postItem}>
                  <View style={s.postDot} />
                  <View style={s.postTextContainer}>
                    <Text style={s.postTitle} numberOfLines={1}>{post.title || post.caption || 'New Update'}</Text>
                    <Text style={s.postDate}>{new Date(post.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={s.emptyText}>No recent posts.</Text>
            )}
          </View>
        </View>

      </View>

      {/* Footer Logo */}
      <View style={s.footer}>
        <Text style={s.footerText}>built with BUILDLOG</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
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
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Platform.select({
      web: {
        transition: 'transform 0.2s ease-in-out',
        cursor: 'default',
      },
    }),
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
    borderColor: Colors.accent.primary,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  handle: {
    color: Colors.accent.primary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  bio: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.base,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  collegeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bg.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  collegeText: {
    color: Colors.text.secondary,
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
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
  },
  streakLabel: {
    color: '#888',
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
    backgroundColor: Colors.accent.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
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
    color: '#888',
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
    backgroundColor: Colors.bg.tertiary,
  },
  projectInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  projectTitle: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    marginBottom: 4,
  },
  projectDesc: {
    color: Colors.text.secondary,
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
    backgroundColor: Colors.accent.primary,
  },
  postTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTitle: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.md,
  },
  postDate: {
    color: Colors.text.tertiary,
    fontSize: Typography.sizes.xs,
  },
  emptyText: {
    color: Colors.text.tertiary,
    fontSize: Typography.sizes.sm,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.text.tertiary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
