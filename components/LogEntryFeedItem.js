import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';

/**
 * LogEntryFeedItem - Professional 'Cyber-Noir' Project Card
 * Precisely matched to the high-fidelity design from image_10.png.
 */
export default function LogEntryFeedItem({ 
  post = {}, 
  onHypePress = () => {}, 
  onCommentPress = () => {}, 
  onSharePress = () => {} 
}) {
  const {
    id,
    username = post.username || 'builder',
    userAvatar = post.userAvatar,
    timestamp = post.timestamp || '3d ago',
    status = post.status || 'Building',
    collabStatus = post.collabStatus || 'Open to collab',
    title = post.projectTitle || post.title || 'untitled project', // Prefer projectTitle from schema
    description = post.caption || post.description || 'show', // Map caption to description
    imageUrl = post.image_url,
    achievements = post.achievements || [
      'No real-time queue visibility',
      "Customers don't know wait time",
      'Revenue tracking – headache 😫',
      'Staff earnings? Mystery 👤'
    ],
    tags = post.tags || ['React', 'Node', 'Open AI'],
    likes = post.likes_count ?? post.likes ?? 0, // Prefer likes_count from schema
    comments = post.comments ?? 0, // Map comments (integer) from schema
    progress = post.progress || 65,
    isLiked = post.isLiked || false
  } = post;

  return (
    <View style={s.card}>
      {/* 1. Professional Header Row */}
      <View style={s.header}>
        <View style={s.avatarContainer}>
           <Image 
            source={userAvatar ? { uri: userAvatar } : { uri: `https://ui-avatars.com/api/?name=${username}&background=0D1117&color=fff` }} 
            style={s.avatar} 
          />
        </View>
        <View style={s.headerInfo}>
          <Text style={s.username}>{username}</Text>
          <View style={s.metaRow}>
            <Text style={s.timestamp}>{timestamp}</Text>
            <View style={s.dot} />
            <View style={s.statusPill}>
              <Text style={s.statusText}>{status}</Text>
            </View>
            <View style={[s.statusPill, s.collabPill]}>
              <Text style={s.collabText}>{collabStatus}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. Visual Project Content Section */}
      <View style={s.contentSection}>
          <View style={s.visualCard}>
            {/* 1. Visual project focus: Image (Preferred) or Deep Space Card (Fallback) */}
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
                    {achievements.map((item, i) => (
                      <View key={i} style={s.achievementRow}>
                        <View style={s.bullet} />
                        <Text style={s.achievementText}>{item}</Text>
                      </View>
                    ))}
                 </View>
               )}
               
            </View>
          </View>

         {/* Title & Description */}
         <View style={s.textInfo}>
            <Text style={s.title}>{title}</Text>
            <Text style={s.description}>{description}</Text>
         </View>

         {/* Technical Tags */}
         <View style={s.tagRow}>
            {tags.map((tag, i) => (
              <View key={i} style={s.tagPill}>
                <Text style={s.tagText}>{tag}</Text>
              </View>
            ))}
         </View>

      </View>

      {/* 3. Interaction Bar (Exactly like image_10.png) */}
      <View style={s.interactions}>
        <TouchableOpacity 
          style={[s.hypeBtn, isLiked && s.hypeBtnActive]} 
          onPress={onHypePress}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={18} color={isLiked ? "#FFF" : "#A855F7"} />
          <Text style={[s.hypeText, isLiked && s.hypeTextActive]}>Hype • {likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.commentBtn} onPress={onCommentPress}>
          <Feather name="message-square" size={18} color={Colors.text.primary} />
          <Text style={s.commentCount}>{comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.shareBtn} onPress={onSharePress}>
          <Feather name="upload" size={18} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#090909',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#333',
    padding: 2,
    backgroundColor: '#111',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.sm - 2,
  },
  headerInfo: {
    marginLeft: Spacing.md,
  },
  username: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    color: '#888',
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#444',
    marginHorizontal: 8,
  },
  statusPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    marginRight: 6,
  },
  statusText: {
    color: '#A855F7',
    fontSize: 10,
    fontWeight: 'bold',
  },
  collabPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  collabText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentSection: {
    marginBottom: Spacing.lg,
  },
  visualCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#0a0e27',
    marginBottom: Spacing.lg,
  },
  visualPlaceholder: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
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
    backgroundColor: '#FF3B30',
    marginRight: 12,
  },
  achievementText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  textInfo: {
    marginBottom: Spacing.md,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  description: {
    color: '#AAA',
    fontSize: 14,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  tagPill: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  tagText: {
    color: '#666',
    fontSize: 11,
    fontWeight: 'bold',
  },
  interactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    gap: 8,
  },
  hypeBtnActive: {
    backgroundColor: '#A855F7',
  },
  hypeText: {
    color: '#A855F7',
    fontWeight: '800',
    fontSize: 14,
  },
  hypeTextActive: {
    color: '#FFF',
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radius.xl,
    gap: 8,
  },
  commentCount: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 14,
  },
  shareBtn: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
