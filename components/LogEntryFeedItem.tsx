import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ViewStyle, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import UsernameLink from './UsernameLink';
import { Avatar } from './ui/UI';
import { submitReport } from '@/services/analyticsService';
import { useUserStore } from '@/store/userStore';

interface PostData {
  id?: string;
  username?: string;
  userAvatar?: string;
  timestamp?: string;
  status?: string;
  collabStatus?: string;
  projectTitle?: string;
  title?: string;
  caption?: string;
  description?: string;
  image_url?: string;
  imageUrl?: string;
  achievements?: string[];
  tags?: string[];
  repoName?: string;
  language?: string;
  likes_count?: number;
  likes?: number;
  comments?: number;
  progress?: number;
  isLiked?: boolean;
}

interface LogEntryFeedItemProps {
  post: PostData;
  onHypePress?: () => void;
  onCommentPress?: () => void;
  onSharePress?: () => void;
  style?: ViewStyle;
}

/**
 * LogEntryFeedItem - Professional 'Cyber-Noir' Project Card
 * Precisely matched to the high-fidelity design from image_10.png, now theme-aware.
 */
function LogEntryFeedItem({ 
  post = {}, 
  onHypePress = () => {}, 
  onCommentPress = () => {}, 
  onSharePress = () => {},
  style
}: LogEntryFeedItemProps) {
  const { theme, isDark } = useTheme();
  const { userId } = useUserStore();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const handleReport = () => {
    if (!userId || !post.id) return;
    
    Alert.alert(
      "Report Content",
      "Why are you reporting this post?",
      [
        { text: "Spam", onPress: () => sendReport("Spam Content") },
        { text: "Inappropriate", onPress: () => sendReport("Inappropriate Content") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const sendReport = async (reason: string) => {
    const { success } = await submitReport(userId!, post.id!, 'post', reason);
    if (success) {
      Alert.alert("Reported", "Thank you for helping us keep the community safe.");
    }
  };

  const {
    username = post.username || 'builder',
    userAvatar = post.userAvatar,
    timestamp = post.timestamp || '3d ago',
    status = post.status || 'Building',
    collabStatus = post.collabStatus || 'Open to collab',
    repoName = post.repoName,
    language = post.language,
    achievements = post.achievements || [],
    tags = post.tags || ['React', 'Node', 'Open AI'],
    likes = post.likes_count ?? post.likes ?? 0,
    comments = post.comments ?? 0,
    isLiked = post.isLiked || false
  } = post;

  // Manual fallback resolution for key fields that might be null in DB
  const title = post.projectTitle || post.title || 'untitled project';
  const description = post.caption || post.description || 'show';
  const imageUrl = post.image_url || post.imageUrl || null;

  const isBuilding = status?.toLowerCase().includes('build');
  const isOpenToCollab = collabStatus?.toLowerCase().includes('collab');

  return (
    <View style={[s.card, style]}>
      {/* 1. Professional Header Row */}
      <View style={s.header}>
        <Avatar username={username} uri={userAvatar} size={48} style={s.avatar} />
        <View style={s.headerInfo}>
          <UsernameLink username={username} size="md" showBadge />
          <View style={s.metaRow}>
            <Text style={s.timestamp}>{timestamp}</Text>
            <View style={s.dot} />
            <View style={[s.statusPill, isBuilding && !isDark && s.buildingPillLight]}>
              <Text style={[s.statusText, isBuilding && !isDark && s.buildingTextLight]}>{(status || '').toUpperCase()}</Text>
            </View>
            <View style={[s.statusPill, s.collabPill, isOpenToCollab && !isDark && s.collabPillLight]}>
              <Text style={[s.collabText, isOpenToCollab && !isDark && s.collabTextLight]}>{(collabStatus || '').toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={s.moreBtn} 
          onPress={handleReport}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="dots-vertical" size={24} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* 2. Visual Project Content Section */}
      <View style={s.contentSection}>
          <View style={s.visualCard}>
            <View style={s.visualPlaceholder}>
               {imageUrl ? (
                 <Image 
                   source={{ uri: imageUrl }} 
                   style={s.visualImage} 
                   contentFit="cover" 
                   transition={200}
                 />
               ) : (
                 <View style={s.overlayContent}>
                    {achievements.slice(0, 4).map((item: string, i: number) => (
                      <View key={i} style={s.achievementRow}>
                        <View style={s.bullet} />
                        <Text style={s.achievementText}>{item}</Text>
                      </View>
                    ))}
                    {achievements.length === 0 && (
                      <View style={{ alignItems: 'center', opacity: 0.2 }}>
                         <Feather name="code" size={40} color={theme.textPrimary} />
                         <Text style={[s.achievementText, { marginTop: 8 }]}>Show your progress</Text>
                      </View>
                    )}
                 </View>
               )}
            </View>
          </View>

         {/* Title & Description & Meta */}
         <View style={s.textInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              {repoName && (
                <View style={[s.statusPill, { backgroundColor: theme.bgInput }]}>
                   <Text style={s.statusText}>{(repoName || '').toUpperCase()}</Text>
                </View>
              )}
              {language && <Text style={s.timestamp}>{"// "} {(language || '').toUpperCase()}</Text>}
            </View>
            <Text style={s.title}>{(title || '').toUpperCase()}</Text>
            <Text style={s.description}>{description}</Text>
         </View>

         {/* Technical Tags */}
         <View style={s.tagRow}>
            {tags.slice(0, 3).map((tag: string, i: number) => (
              <View key={i} style={s.tagPill}>
                <Text style={s.tagText}>{(tag || '').toUpperCase()}</Text>
              </View>
            ))}
         </View>
      </View>

      {/* 3. Interaction Bar */}
      <View style={s.interactions}>
        <TouchableOpacity 
          style={[s.hypeBtn, isLiked && s.hypeBtnActive]} 
          onPress={onHypePress}
          activeOpacity={0.7}
        >
          <Feather name="zap" size={16} color={isLiked ? (isDark ? "#000" : "#FFF") : theme.purple} />
          <Text style={[s.hypeText, isLiked && s.hypeTextActive]}>HYPE • {likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.commentBtn} onPress={onCommentPress}>
          <Feather name="message-square" size={16} color={theme.textSecondary} />
          <Text style={s.commentCount}>{comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.shareBtn} onPress={onSharePress}>
          <Feather name="upload" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Optimized comparison function to prevent redundant re-renders
const areEqual = (prev: LogEntryFeedItemProps, next: LogEntryFeedItemProps) => {
  return (
    prev.post.id === next.post.id &&
    prev.post.likes === next.post.likes &&
    prev.post.likes_count === next.post.likes_count &&
    prev.post.isLiked === next.post.isLiked &&
    prev.post.comments === next.post.comments &&
    prev.post.username === next.post.username &&
    prev.post.userAvatar === next.post.userAvatar &&
    prev.style === next.style
  );
};

export default memo(LogEntryFeedItem, areEqual);

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  card: {
    backgroundColor: theme.bgCard,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: isDark ? theme.border : '#e2e8f0',
    marginBottom: 20,
    ...(Platform.OS === 'web' && {
      maxWidth: 680,
      width: '100%',
      alignSelf: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 8,
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerInfo: {
    marginLeft: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.textMuted,
    marginHorizontal: 8,
    opacity: 0.5,
  },
  statusPill: {
    backgroundColor: theme.purpleGlow,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 6,
  },
  statusText: {
    color: theme.purple,
    fontSize: 9,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  collabPill: {
    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
    borderColor: theme.border,
  },
  collabPillLight: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  collabTextLight: {
    color: '#15803d',
  },
  buildingPillLight: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  buildingTextLight: {
    color: '#1d4ed8',
  },
  collabText: {
    color: theme.green,
    fontSize: 9,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  contentSection: {
    marginBottom: Spacing.md,
  },
  visualCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: theme.bgInput,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  visualPlaceholder: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    backgroundColor: theme.bgInput,
  },
  visualImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlayContent: {
    gap: 8,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.purple,
    marginRight: 12,
  },
  achievementText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  textInfo: {
    marginBottom: Spacing.md,
  },
  title: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  description: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  tagPill: {
    backgroundColor: theme.bgInput,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tagText: {
    color: theme.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  interactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hypeText: {
    color: theme.purple,
    fontWeight: '900',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  hypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'white',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? theme.border : theme.purple + '40',
    gap: 8,
  },
  hypeBtnActive: {
    backgroundColor: theme.purple,
    borderColor: theme.purple,
  },
  hypeTextActive: {
    color: isDark ? '#000' : '#FFF',
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? theme.bgInput : 'white',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? theme.border : theme.border + '80',
    gap: 8,
  },
  commentCount: {
    color: theme.textSecondary,
    fontWeight: '900',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  shareBtn: {
    backgroundColor: theme.bgInput,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreBtn: {
    padding: 8,
    marginRight: -Spacing.md,
  }
});
