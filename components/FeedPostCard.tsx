import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, NeubrutalismShadow } from '@/constants/theme';

export interface FeedPost {
  id: string;
  username: string;
  userAvatar?: string;
  timestamp: string;
  projectTitle: string;
  caption: string;
  imageUrl?: string;
  hasGithubLink?: boolean;
  cheers: number;
  comments: number;
}

interface FeedPostCardProps {
  post: FeedPost;
  onCheerPress?: (postId: string) => void;
  onCommentPress?: (postId: string) => void;
}

export function FeedPostCard({ post, onCheerPress, onCommentPress }: FeedPostCardProps) {
  return (
    <View style={styles.container}>
      {/* Header: Avatar, Username, Timestamp */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {post.userAvatar ? (
            <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{post.username.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </View>
      </View>

      {/* Project Badge - stark cyan rectangular tag, uppercase black text */}
      <View style={styles.projectBadge}>
        <Text style={styles.projectBadgeText}>{post.projectTitle.toUpperCase()}</Text>
      </View>

      {/* Progress Image */}
      <View style={styles.imageContainer}>
        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Feather name="image" size={48} color={Colors.textSecondary} />
            <Text style={styles.imagePlaceholderText}>Progress Image</Text>
          </View>
        )}
      </View>

      {/* Caption */}
      <Text style={styles.caption}>{post.caption}</Text>

      {/* Footer: Interaction Icons - square grey boxes with thick black borders */}
      <View style={styles.footer}>
        <Pressable
          style={styles.interactionButton}
          onPress={() => onCheerPress?.(post.id)}
        >
          <Feather name="heart" size={20} color={Colors.textSecondary} />
          <Text style={styles.interactionText}>{post.cheers}</Text>
        </Pressable>

        <Pressable
          style={styles.interactionButton}
          onPress={() => onCommentPress?.(post.id)}
        >
          <Feather name="message-square" size={20} color={Colors.textSecondary} />
          <Text style={styles.interactionText}>{post.comments}</Text>
        </Pressable>

        {post.hasGithubLink && (
          <Pressable style={styles.githubButton}>
            <MaterialIcons name="link" size={18} color={Colors.primary} />
            <Text style={styles.githubText}>View Repo</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderWidth: 4,
    borderColor: '#000000',
    borderRadius: 0,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    ...NeubrutalismShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 0,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 0,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  avatarText: {
    color: '#000000',
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  username: {
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  timestamp: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  projectBadge: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 0,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: '#000000',
  },
  projectBadgeText: {
    color: '#000000',
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  imageContainer: {
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 4,
    borderColor: '#000000',
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  imagePlaceholderText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
  },
  caption: {
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
    lineHeight: 22,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 4,
    borderTopColor: '#000000',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.xl,
    backgroundColor: Colors.surface,
    borderWidth: 4,
    borderColor: '#000000',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 0,
  },
  interactionText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginLeft: Spacing.xs,
  },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  githubText: {
    color: Colors.primary,
    fontSize: FontSizes.sm,
    marginLeft: Spacing.xs,
  },
});
