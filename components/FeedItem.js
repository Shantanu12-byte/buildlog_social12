import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';

/**
 * FeedItem component for high-fidelity feed cards.
 * @param {Object} props
 * @param {Object} props.post - The post object containing all necessary data.
 * @param {Function} props.onLikePress - Callback for like button.
 * @param {Function} props.onCommentPress - Callback for comment button.
 * @param {Function} props.onSharePress - Callback for share button.
 * @param {Boolean} props.isSubmitting - Loading state for interactions.
 */
export default function FeedItem({ 
  post = {}, 
  onLikePress, 
  onCommentPress, 
  onSharePress,
  isSubmitting = false 
}) {
  const {
    username = post.username || 'shantanu',
    userAvatar = post.userAvatar,
    timestamp = post.timestamp || '3d ago',
    location = post.location || 'Sipna Campus',
    status = post.status || 'Open to collab',
    repoName = post.repoName || 'Glosscut-React',
    language = post.language || 'React',
    ragAchievements = post.ragAchievements || [
      'Added real-time Socket.io chat',
      'Implemented dark mode grid'
    ],
    title = post.title || 'building gloss cut',
    description = post.caption || post.description || 'Working on a modern grid-based social feed with real-time updates and dark mode support.',
    tags = post.skills || post.tags || ['React', 'NodeJS', 'Socket.io'],
    likes = post.cheers || 2,
    comments = post.comments || 8,
    isLiked = post.liked_by_user || false
  } = post;

  return (
    <View style={styles.card}>
      {/* 1. Header */}
      <View style={styles.header}>
        <Image 
          source={userAvatar ? { uri: userAvatar } : { uri: `https://ui-avatars.com/api/?name=${username}&background=0D1117&color=fff` }}
          style={styles.avatar} 
        />
        <View style={styles.headerText}>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.metadata}>
            {timestamp} • {location} • {status}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Feather name="more-horizontal" size={18} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {/* 2. Content: Proof of Work Block */}
      <View style={styles.powBlock}>
        <View style={styles.powHeader}>
          <View style={styles.repoInfo}>
            <Feather name="github" size={14} color={Colors.github.text} style={styles.powIcon} />
            <Text style={styles.repoName} numberOfLines={1}>{repoName}</Text>
          </View>
          <View style={styles.languageBadge}>
            <MaterialCommunityIcons name="react" size={12} color={Colors.github.blue} />
            <Text style={styles.languageText}>{language}</Text>
          </View>
        </View>
        
        <View style={styles.ragContainer}>
          {ragAchievements.map((item, index) => (
            <View key={index} style={styles.ragItem}>
              <View style={[styles.ragDot, { backgroundColor: Colors.rag.success.text }]} />
              <Text style={styles.ragText} numberOfLines={1}>{item}</Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity style={styles.nextStepBtn}>
          <Text style={styles.nextStepText}>View Technical Log</Text>
          <Feather name="arrow-right" size={12} color={Colors.accent.primary} />
        </TouchableOpacity>
      </View>

      {/* 3. Post Details */}
      <View style={styles.details}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
        <View style={styles.tagRow}>
          {tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 4. Interactions */}
      <View style={styles.interactions}>
        <TouchableOpacity 
          style={[
            styles.interactionBtn, 
            styles.postBtn, 
            isLiked && styles.postBtnActive,
            isSubmitting && styles.btnDisabled
          ]}
          onPress={() => onLikePress?.(post.id)}
          disabled={isSubmitting}
        >
          <Feather name="plus" size={16} color={isLiked ? '#FFF' : Colors.accent.primary} />
          <Text style={[styles.interactionText, isLiked && styles.interactionTextActive]}>
            Hype • {likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.interactionBtn, isSubmitting && styles.btnDisabled]}
          onPress={() => onCommentPress?.(post.id)}
          disabled={isSubmitting}
        >
          <Feather name="message-square" size={16} color={Colors.text.secondary} />
          <Text style={styles.interactionText}>{comments} comments</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.interactionBtn, styles.iconOnlyBtn, isSubmitting && styles.btnDisabled]}
          onPress={() => onSharePress?.(post.id)}
          disabled={isSubmitting}
        >
          <Feather name="share-2" size={16} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg, // 16pt instead of 12pt
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bg.tertiary,
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.md, // 12pt? I'll change Spacing.md in theme.ts to 16 if I can, or use 16 here.
  },
  username: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
    fontWeight: '700',
  },
  metadata: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  moreBtn: {
    padding: Spacing.xs,
  },
  powBlock: {
    backgroundColor: Colors.github.bg,
    borderRadius: Radius.md,
    padding: Spacing.lg, // 16pt instead of 12pt
    borderWidth: 1,
    borderColor: Colors.github.border,
    marginBottom: Spacing.lg, // 16pt
  },
  powHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md, // 12pt? maybe I should use 8 or 16. I'll use 8.
  },
  repoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm, // 8pt
  },
  powIcon: {
    marginRight: 6,
  },
  repoName: {
    color: Colors.github.text,
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    flex: 1,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 139, 253, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 139, 253, 0.2)',
  },
  languageText: {
    color: Colors.github.blue,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  ragContainer: {
    marginVertical: Spacing.sm, // 8pt
  },
  ragItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ragDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  ragText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    flex: 1,
  },
  nextStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm, // 8pt
    alignSelf: 'flex-start',
  },
  nextStepText: {
    color: Colors.accent.primary,
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4,
  },
  details: {
    marginBottom: Spacing.lg, // 16pt
  },
  title: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.sm, // 8pt
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm, // 8pt
  },
  tagPill: {
    backgroundColor: Colors.bg.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  tagText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '500',
  },
  interactions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
    paddingTop: Spacing.lg, // 16pt
    gap: Spacing.lg, // 16pt
  },
  interactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  iconOnlyBtn: {
    paddingHorizontal: 12,
  },
  postBtn: {
    backgroundColor: 'rgba(47, 129, 247, 0.1)',
    borderColor: 'rgba(47, 129, 247, 0.2)',
  },
  postBtnActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  interactionText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    marginLeft: 8,
  },
  interactionTextActive: {
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
