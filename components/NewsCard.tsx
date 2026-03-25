import React from 'react';
import { 
  View, Text, StyleSheet, Dimensions, 
  TouchableOpacity, Linking, Platform, Image 
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/UI';
import { Colors } from '@/constants/theme';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  FadeInDown
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const NEWS_COLORS: any = {
  'AI/ML': '#7c3aed',
  'Web Dev': '#2563eb',
  'Open Source': '#16a34a',
  'DevOps': '#ea580c',
  'Languages': '#ca8a04',
  'Dev': '#374151',
  'purple': '#7c3aed',
  'bg': '#0a0a0a',
  'border': '#1a1a1a',
  'textSecondary': '#9ca3af',
  'textTertiary': '#6b7280',
};

export interface NewsItem {
  id: string | number;
  title: string;
  url: string;
  canonical_url?: string;
  time: number;
  source: string;
  tag: string;
  score?: number;
  comments?: number;
  description?: string;
}

function formatTimeAgo(timestamp: number): string {
  const diff = Math.floor(Date.now() / 1000) - timestamp;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 84600) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatScore(score?: number): string {
  if (!score) return '0';
  if (score >= 1000) return (score / 1000).toFixed(1) + 'k';
  return score.toString();
}

export default function NewsCard({ 
  item, 
  isFirst = false,
  showSwipeHint = true // Show on every card now
}: { 
  item: NewsItem;
  isFirst?: boolean;
  showSwipeHint?: boolean;
}) {
  const handleOpenArticle = async () => {
    const targetUrl = item.source === 'dev.to' ? (item.canonical_url || item.url) : item.url;
    try {
      if (Platform.OS !== 'web') {
        const result = await WebBrowser.openBrowserAsync(targetUrl);
        if (result.type !== 'opened') {
          await Linking.openURL(targetUrl);
        }
      } else {
        window.open(targetUrl, '_blank');
      }
    } catch (e) {
      console.error('OPEN_ARTICLE_ERROR:', e);
      if (Platform.OS === 'web') window.open(targetUrl, '_blank');
      else Linking.openURL(targetUrl);
    }
  };

  const tagColor = NEWS_COLORS[item.tag] || NEWS_COLORS['Dev'];

  return (
    <View style={s.card}>
      <View style={s.contentContainer}>
        {/* Category & Read Time */}
        <View style={s.metaTop}>
          <View style={[s.tagPill, { backgroundColor: tagColor }]}>
            <Text style={s.tagText}>{item.tag.toUpperCase()}</Text>
          </View>
          <Text style={s.readTime}>4 min read</Text>
        </View>

        {/* Headline */}
        <Text style={s.headline} numberOfLines={3}>
          {item.title}
        </Text>

        {/* Summary */}
        <Text style={s.summary} numberOfLines={5}>
          {(item.description || '').slice(0, 220)}
          {item.description && item.description.length > 220 ? '...' : ''}
        </Text>

        <View style={s.divider} />

        {/* Author & Source Row (Aligned with Button) */}
        <View style={s.sourceRow}>
          <View style={s.authorBadge}>
            <View>
              <Text style={s.sourceName}>News · {item.source}</Text>
              <View style={s.statsSubRow}>
                <Text style={s.statsText}>🕐 {formatTimeAgo(item.time)}</Text>
                <Text style={s.statsText}>  ·  </Text>
                <Text style={s.statsText}>⬆ {formatScore(item.score)}</Text>
              </View>
            </View>
          </View>

          {/* Action Button (Small Outlined) */}
          <TouchableOpacity 
            style={s.readButton} 
            onPress={handleOpenArticle}
            activeOpacity={0.7}
          >
            <Text style={s.readButtonText}>Read Article →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtle Bottom Swipe Hint */}
      <View style={s.swipeHint}>
        <Text style={s.swipeHintText}>↑ swipe</Text>
      </View>
    </View>
  );
}

// Skeleton Component
export function NewsCardSkeleton() {
  return (
    <View style={s.card}>
      <View style={s.contentContainer}>
        <View style={s.metaTop}>
          <View style={[s.tagPill, s.skeleton, { width: 80, height: 24 }]} />
          <View style={[s.skeleton, { width: 60, height: 16 }]} />
        </View>
        <View style={[s.skeleton, s.headlineSkeleton, { height: 32, marginTop: 20 }]} />
        <View style={[s.skeleton, s.headlineSkeleton, { height: 32 }]} />
        <View style={[s.skeleton, s.summarySkeleton, { height: 16, marginTop: 16 }]} />
        <View style={[s.skeleton, s.summarySkeleton, { height: 16 }]} />
        <View style={[s.skeleton, { height: 1, marginVertical: 20, backgroundColor: '#1a1a1a' }]} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={[s.skeleton, { width: 120, height: 32 }]} />
          <View style={[s.skeleton, { width: 100, height: 32, borderRadius: 20 }]} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: width,
    height: Platform.OS === 'web' ? '100%' : height,
    backgroundColor: NEWS_COLORS.bg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  contentContainer: {
    flex: 1,
  },
  metaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginHorizontal: 20,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  readTime: {
    color: NEWS_COLORS.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 30 * 1.25,
    marginTop: 20,
    marginHorizontal: 20,
  },
  summary: {
    fontSize: 15,
    color: '#9ca3af',
    lineHeight: 15 * 1.65,
    fontWeight: '400',
    marginTop: 16,
    marginHorizontal: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statsText: {
    color: NEWS_COLORS.textTertiary,
    fontSize: 13,
  },
  readButton: {
    borderWidth: 1,
    borderColor: '#7c3aed',
    height: 36,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  readButtonText: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '700',
  },
  swipeHint: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '600',
  },
  skeleton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    opacity: 0.6,
  },
  headlineSkeleton: {
    width: '100%',
    marginBottom: 8,
    marginHorizontal: 20,
  },
  summarySkeleton: {
    width: '90%',
    marginBottom: 6,
    marginHorizontal: 20,
  },
});
