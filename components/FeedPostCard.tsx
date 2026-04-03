import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { AvatarBlock } from './AvatarBlock';
import { router } from 'expo-router';
import { VerifiedSkillChip, SkillLevel } from './VerifiedSkillChip';
import { useTheme } from '@/context/ThemeContext';

export interface FeedPost {
  id: string;
  username: string;
  userAvatar?: string;
  author_id?: string;
  timestamp?: string;
  created_at?: string;
  projectTitle?: string;
  title?: string;
  caption?: string;
  description?: string;
  imageUrl?: string;
  image_url?: string;
  github_url?: string;
  hasGithubLink?: boolean;
  cheers?: number;
  comments?: number;
  skills?: string[];
  needed_skills?: string[];
  status?: string;
  looking_for_collabs?: boolean;
  progress?: number;
  author_verified_skills?: Record<string, SkillLevel>;
}

interface FeedPostCardProps {
  post: FeedPost;
  likeCount?: number;
  isLiked?: boolean;
  onLikePress?: (postId: string) => void;
  onCheerPress?: (postId: string) => void;
  onCommentPress?: (postId: string) => void;
  onProfilePress?: (userId: string) => void;
}

const IMAGE_ASPECT_RATIO = 16 / 9;

export function FeedPostCard({ post, likeCount, isLiked, onLikePress, onCheerPress, onCommentPress, onProfilePress }: FeedPostCardProps) {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const [isLiking, setIsLiking] = useState(false);
  
  const displayLikeCount = likeCount ?? (post.cheers || 0);

  const handleLikePress = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (onLikePress) await onLikePress(post.id);
      else if (onCheerPress) await onCheerPress(post.id);
    } catch (e) {
      // Like error handled silently
    } finally {
      setIsLiking(false);
    }
  };

  const handleProfilePress = () => {
    if (post.author_id) {
      if (onProfilePress) {
        onProfilePress(post.author_id);
      } else {
        router.push({ pathname: '/profile/[id]', params: { id: post.author_id } });
      }
    }
  };

  const displayTitle = post.projectTitle || post.title || 'Untitled Project';
  const displayDesc = post.caption || post.description || '';
  const displayImage = post.imageUrl || post.image_url;
  
  const getRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.round(diffHours / 24)}d ago`;
  };
  
  const timeText = post.timestamp || (post.created_at ? getRelativeTime(post.created_at) : 'Just now');
  const skillsList = post.skills || post.needed_skills || [];
  const progressVal = post.progress ?? 0;
  const isCollab = post.looking_for_collabs !== false;
  const statusText = post.status || 'Building';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerLeft} onPress={handleProfilePress}>
          <AvatarBlock 
            url={post.userAvatar} 
            username={post.username} 
            size={40} 
          />
          <View style={styles.headerText}>
            <Text style={styles.username}>{post.username}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.timestamp}>{timeText}</Text>
              <Text style={styles.dot}>•</Text>
              
              <View style={[styles.pill, { borderColor: theme.purple }]}>
                <Text style={[styles.pillText, { color: theme.purple }]}>{statusText}</Text>
              </View>
              
              {isCollab && (
                <View style={[styles.pill, { borderColor: theme.green }]}>
                  <Text style={[styles.pillText, { color: theme.green }]}>Open to collab</Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </View>

      {/* Content && Image Wrapper for clickability */}
      <TouchableOpacity 
        style={styles.clickableArea} 
        onPress={() => onCommentPress?.(post.id)}
        activeOpacity={0.9}
      >
        {/* Image Preview */}
        <View style={styles.imageContainer}>
          {displayImage ? (
            <Image
              source={{ uri: displayImage }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Feather name="image" size={32} color={theme.textMuted} />
            </View>
          )}
          <View style={styles.inProgressBadge}>
            <Text style={styles.inProgressText}>In Progress</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{displayTitle}</Text>
          {!!displayDesc && (
            <Text style={styles.description} numberOfLines={3}>
              {displayDesc}
            </Text>
          )}

          {/* Skills */}
          {skillsList.length > 0 && (
            <View style={styles.skillsRow}>
              {skillsList.slice(0, 5).map((skill, i) => (
                <VerifiedSkillChip
                  key={i}
                  skill={skill}
                  level={post.author_verified_skills?.[skill] ?? 'claimed'}
                  size="sm"
                />
              ))}
            </View>
          )}

          {/* Github Link */}
          {(post.hasGithubLink || post.github_url) && (
            <View style={styles.githubRow}>
              <Feather name="github" size={14} color={theme.textSecondary} />
              <Text style={styles.githubText}>{post.github_url ? post.github_url.split('://').pop() : `github.com/${post.username}/${displayTitle.toLowerCase().replace(/\s+/g, '')}`}</Text>
            </View>
          )}

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressPercentage}>{progressVal}%</Text>
            </div>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progressVal}%` }]} />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Bar */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.hypeBtn, isLiked && styles.hypeBtnActive]}
          onPress={handleLikePress}
        >
          <Feather 
            name="plus" 
            size={16} 
            color={isLiked ? "#FFFFFF" : theme.purple} 
            style={{ fontWeight: 'bold' }}
          />
          <Text style={[styles.hypeText, isLiked && styles.hypeTextActive]}>
            Hype • {displayLikeCount}
          </Text>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <Pressable
            style={styles.actionBtnSmall}
            onPress={() => onCommentPress?.(post.id)}
          >
            <Feather name="message-square" size={16} color={theme.textPrimary} />
            <Text style={styles.actionText}>{post.comments || 0}</Text>
          </Pressable>
          
          <Pressable style={styles.actionBtnSmall}>
            <Feather name="upload" size={16} color={theme.textPrimary} />
          </Pressable>
        </View>
      </View>
      
      {/* Separator Line */}
      <View style={styles.separator} />
    </View>
  );
}

function getStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
  card: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    backgroundColor: theme.bg,
  },
  clickableArea: {
    marginVertical: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  username: {
    color: theme.textPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  timestamp: {
    color: theme.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  dot: {
    color: theme.textMuted,
    fontSize: Typography.sizes.xs,
  },
  pill: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: IMAGE_ASPECT_RATIO,
    backgroundColor: theme.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: theme.border,
    marginBottom: Spacing.md,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inProgressBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: theme.purple,
  },
  inProgressText: {
    color: theme.purple,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  title: {
    color: theme.textPrimary,
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  description: {
    color: theme.textSecondary,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 2,
  },
  githubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  githubText: {
    color: theme.purple, // Theme color for important links
    fontSize: Typography.sizes.sm,
  },
  progressContainer: {
    marginTop: Spacing.xs,
    gap: 4,
  },
  progressLabel: {
    color: theme.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  progressPercentage: {
    color: theme.purple,
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
  },
  track: {
    height: 4,
    backgroundColor: theme.bgInput,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: theme.purple,
    borderRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  hypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.05)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 6,
    minWidth: 120,
  },
  hypeBtnActive: {
    backgroundColor: theme.purple,
    borderColor: theme.purple,
  },
  hypeText: {
    color: theme.purple,
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
  },
  hypeTextActive: {
    color: '#FFFFFF',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bgCard,
    borderWidth: 0.5,
    borderColor: theme.border,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  actionText: {
    color: theme.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: theme.border,
    opacity: 0.5,
  },
  });
}
