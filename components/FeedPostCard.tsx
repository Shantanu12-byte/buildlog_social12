import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { AvatarBlock } from './AvatarBlock';
import { router } from 'expo-router';

export interface FeedPost {
  id: string;
  username: string;
  userAvatar?: string;
  author_id?: string;
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
  likeCount?: number;
  isLiked?: boolean;
  onLikePress?: (postId: string) => void;
  onCheerPress?: (postId: string) => void;
  onCommentPress?: (postId: string) => void;
  onProfilePress?: (userId: string) => void;
}

const IMAGE_ASPECT_RATIO = 4 / 5; // width : height (4:5 portrait)

const LIKED_COLOR = '#EF4444'; // Red for liked heart

export function FeedPostCard({ post, likeCount, isLiked, onLikePress, onCheerPress, onCommentPress, onProfilePress }: FeedPostCardProps) {
  const displayLikeCount = likeCount ?? post.cheers;
  const handleLikePress = () => {
    if (onLikePress) onLikePress(post.id);
    else onCheerPress?.(post.id);
  };
  const handleProfilePress = () => {
    if (post.author_id) {
      if (onProfilePress) {
        onProfilePress(post.author_id);
      } else {
        router.push({ pathname: '/user/[id]', params: { id: post.author_id } });
      }
    }
  };

  return (
    <View style={styles.card}>
      {/* Header: Avatar, Username, Project tag, 3-dot menu */}
      <View style={styles.header}>
        <Pressable style={styles.headerLeft} onPress={handleProfilePress}>
          <AvatarBlock 
            url={post.userAvatar} 
            username={post.username} 
            size={36} 
          />
          <View style={styles.headerText}>
            <Text style={styles.username}>{post.username}</Text>
            <View style={styles.projectTag}>
              <Text style={styles.projectTagText}>{post.projectTitle}</Text>
            </View>
          </View>
        </Pressable>
        <Pressable hitSlop={12} style={styles.menuButton}>
          <Feather name="more-horizontal" size={20} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* Full-width image: edge-to-edge, 4:5 aspect ratio */}
      <View style={styles.imageWrap}>
        {post.imageUrl ? (
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Feather name="image" size={48} color={Colors.textSecondary} />
            <Text style={styles.imagePlaceholderText}>Progress Image</Text>
          </View>
        )}
      </View>

      {/* Action bar: Heart, Message-Circle, Send */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <Pressable
            style={styles.actionBtn}
            onPress={handleLikePress}
          >
            <Feather 
              name="heart" 
              size={24} 
              color={isLiked ? LIKED_COLOR : Colors.textPrimary}
              fill={isLiked ? LIKED_COLOR : 'transparent'}
            />
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() => onCommentPress?.(post.id)}
          >
            <Feather name="message-circle" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Feather name="send" size={22} color={Colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Caption area: "Liked by X people", username + caption, timestamp */}
      <View style={styles.captionArea}>
        {displayLikeCount > 0 && (
          <Text style={styles.likedBy}>
            Liked by <Text style={styles.likedByBold}>{displayLikeCount} people</Text>
          </Text>
        )}
        <Text style={styles.captionBlock}>
          <Text style={styles.captionUsername}>{post.username}</Text>
          {' '}
          <Text style={styles.captionText}>{post.caption}</Text>
        </Text>
        <Text style={styles.timestamp}>{post.timestamp}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.xl,
    backgroundColor: '#333333',
    borderWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#111111',
    borderRightColor: '#111111',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#222222',
    borderBottomWidth: 2,
    borderBottomColor: '#444444',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  headerText: {
    flex: 1,
  },
  username: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  projectTag: {
    marginTop: 2,
  },
  projectTagText: {
    color: '#AAAAAA',
    fontSize: 10,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  menuButton: {
    padding: Spacing.xs,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: IMAGE_ASPECT_RATIO,
    backgroundColor: '#000000',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#111111',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#666666',
    fontSize: FontSizes.sm,
    fontFamily: 'monospace',
    marginTop: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#222222',
    borderBottomWidth: 2,
    borderBottomColor: '#444444',
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  actionBtn: {
    padding: Spacing.xs,
  },
  captionArea: {
    padding: Spacing.md,
    backgroundColor: '#333333',
  },
  likedBy: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: Spacing.xs,
  },
  likedByBold: {
    fontWeight: 'bold',
  },
  captionBlock: {
    marginBottom: Spacing.xs,
  },
  captionUsername: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  captionText: {
    color: '#DDDDDD',
    fontSize: FontSizes.sm,
    fontFamily: 'monospace',
  },
  timestamp: {
    color: '#888888',
    fontSize: 8,
    fontFamily: 'monospace',
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
