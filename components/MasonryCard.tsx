import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, Radius, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from './ui/UI';

const { width: windowWidth } = Dimensions.get('window');
const COLUMN_WIDTH = (windowWidth - Spacing.lg * 3) / 2;

interface PostData {
  id: string;
  type?: 'featured' | 'medium' | 'small';
  username?: string;
  userAvatar?: string;
  title?: string;
  description?: string;
  tech?: string[];
  likes?: number;
  comments?: number;
  thumbnail?: string;
  gradient?: string[];
  buildTime?: string;
  isLiked?: boolean;
}

interface MasonryCardProps {
  post: PostData;
  onPress?: (id: string) => void;
  onHypePress?: (id: string) => void;
  onCommentPress?: (id: string) => void;
  onSharePress?: (id: string) => void;
  style?: ViewStyle;
}

/**
 * MasonryCard - A versatile project card for the BuildLog feed.
 * Supports 'featured', 'medium', and 'small' variants, now theme-aware.
 */
export default function MasonryCard({ 
  post, 
  onPress, 
  onHypePress, 
  onCommentPress, 
  onSharePress,
  style
}: MasonryCardProps) {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const {
    id,
    type = 'medium',
    username = 'builder',
    userAvatar,
    title = 'Untitled Project',
    description = '',
    tech = [],
    likes = 0,
    comments = 0,
    thumbnail = '💻',
    gradient = isDark ? ['#7c3aed', '#4c1d95'] : ['#ede9fe', '#7c3aed'],
    buildTime = '1 week',
    isLiked = false
  } = post;

  const isFeatured = type === 'featured';
  const isSmall = type === 'small';

  const renderInteractions = () => (
    <View style={s.interactions}>
      <TouchableOpacity 
        style={s.actionBtn} 
        onPress={() => onHypePress?.(id)}
      >
        <Feather name="zap" size={14} color={isLiked ? theme.purple : theme.textMuted} />
        <Text style={[s.actionText, isLiked && { color: theme.purple }]}>{likes}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={s.actionBtn} 
        onPress={() => onCommentPress?.(id)}
      >
        <Feather name="message-square" size={14} color={theme.textMuted} />
        <Text style={s.actionText}>{comments}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={s.actionBtn} 
        onPress={() => onSharePress?.(id)}
      >
        <Feather name="share-2" size={14} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => onPress?.(id)}
      style={[
        s.card, 
        isFeatured ? s.featuredCard : s.standardCard,
        style
      ]}
    >
      {/* Visual Header / Thumbnail */}
      <LinearGradient
        colors={gradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          s.visualHeader,
          isFeatured ? s.featuredVisual : isSmall ? s.smallVisual : s.mediumVisual
        ]}
      >
        <Text style={[s.thumbnailEmoji, isFeatured && { fontSize: 64 }]}>{thumbnail}</Text>
        
        {isFeatured && (
          <View style={s.buildBadge}>
            <Text style={s.buildBadgeText}>⏱️ {buildTime}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Content */}
      <View style={s.content}>
        <View style={s.builderRow}>
          <Avatar username={username} uri={userAvatar} size={24} style={s.avatar} />
          <Text style={s.username} numberOfLines={1}>{username}</Text>
        </View>

        <Text style={[s.title, isFeatured && s.featuredTitle]} numberOfLines={2}>
          {title.toUpperCase()}
        </Text>
        
        {!isSmall && description ? (
          <Text style={s.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}

        {/* Tech Stack */}
        <View style={s.techRow}>
          {tech.slice(0, isFeatured ? 3 : 2).map((t, i) => (
            <View key={i} style={s.techPill}>
              <Text style={s.techText}>{t.toUpperCase()}</Text>
            </View>
          ))}
          {tech.length > (isFeatured ? 3 : 2) && (
            <Text style={s.moreTech}>+{tech.length - (isFeatured ? 3 : 2)}</Text>
          )}
        </View>

        {/* Interactions */}
        {renderInteractions()}
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  card: {
    backgroundColor: theme.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  featuredCard: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  standardCard: {
    width: COLUMN_WIDTH,
  },
  visualHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  featuredVisual: {
    height: 200,
  },
  mediumVisual: {
    height: 140,
  },
  smallVisual: {
    height: 100,
  },
  thumbnailEmoji: {
    fontSize: 40,
  },
  buildBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  buildBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: Spacing.md,
  },
  builderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatar: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  username: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  title: {
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  featuredTitle: {
    fontSize: 18,
    lineHeight: 22,
  },
  description: {
    color: theme.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.md,
    fontWeight: '500',
  },
  techRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  techPill: {
    backgroundColor: theme.bgInput,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: theme.border,
  },
  techText: {
    color: theme.purple,
    fontSize: 9,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  moreTech: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
  },
  interactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  }
});
