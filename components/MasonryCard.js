import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - Spacing.lg * 3) / 2;

/**
 * MasonryCard - A versatile project card for the BuildLog feed.
 * Supports 'featured', 'medium', and 'small' variants.
 */
export default function MasonryCard({ 
  post, 
  onPress, 
  onHypePress, 
  onCommentPress, 
  onSharePress 
}) {
  const {
    id,
    type = 'medium', // featured, medium, small
    username = 'builder',
    userAvatar,
    title = 'Project Title',
    description = 'No description provided.',
    tech = [],
    likes = 0,
    comments = 0,
    thumbnail = '💻',
    gradient = ['#00d9ff', '#0099ff'],
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
        <Feather name="plus" size={14} color={isLiked ? Colors.accent.primary : Colors.text.tertiary} />
        <Text style={[s.actionText, isLiked && { color: Colors.accent.primary }]}>{likes}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={s.actionBtn} 
        onPress={() => onCommentPress?.(id)}
      >
        <Feather name="message-square" size={14} color={Colors.text.tertiary} />
        <Text style={s.actionText}>{comments}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={s.actionBtn} 
        onPress={() => onSharePress?.(id)}
      >
        <Feather name="share-2" size={14} color={Colors.text.tertiary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => onPress?.(id)}
      style={[
        s.card, 
        isFeatured ? s.featuredCard : s.standardCard
      ]}
    >
      {/* Visual Header / Thumbnail */}
      <LinearGradient
        colors={gradient}
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
          <Image 
            source={userAvatar ? { uri: userAvatar } : { uri: `https://ui-avatars.com/api/?name=${username}&background=0D1117&color=fff` }}
            style={s.avatar} 
          />
          <Text style={s.username} numberOfLines={1}>{username}</Text>
        </View>

        <Text style={[s.title, isFeatured && s.featuredTitle]} numberOfLines={2}>
          {title}
        </Text>
        
        {!isSmall && (
          <Text style={s.description} numberOfLines={2}>
            {description}
          </Text>
        )}

        {/* Tech Stack */}
        <View style={s.techRow}>
          {tech.slice(0, isFeatured ? 3 : 2).map((t, i) => (
            <View key={i} style={s.techPill}>
              <Text style={s.techText}>{t}</Text>
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

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.bg.tertiary,
    marginRight: 8,
  },
  username: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 4,
  },
  featuredTitle: {
    fontSize: 20,
    lineHeight: 24,
  },
  description: {
    color: Colors.text.tertiary,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.md,
  },
  techRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  techPill: {
    backgroundColor: 'rgba(47, 129, 247, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(47, 129, 247, 0.2)',
  },
  techText: {
    color: Colors.accent.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  moreTech: {
    color: Colors.text.tertiary,
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
    borderTopColor: Colors.border.subtle,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: Colors.text.tertiary,
    fontSize: 12,
    fontWeight: '700',
  }
});
