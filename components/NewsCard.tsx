import React from 'react';
import { 
  View, Text, StyleSheet, Dimensions, 
  TouchableOpacity, Linking, Platform, StatusBar
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/context/ThemeContext';
import { Spacing } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

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
}: { 
  item: NewsItem;
}) {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

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
      // Article open error handled silently
      if (Platform.OS === 'web') window.open(targetUrl, '_blank');
      else Linking.openURL(targetUrl);
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'ai/ml': return theme.aiColor || theme.purple;
      case 'web dev': return theme.webColor || theme.purple;
      case 'open source': return theme.osColor || theme.green;
      case 'devops': return theme.devopsColor || theme.orange;
      case 'languages': return theme.langColor || theme.amber;
      default: return theme.textMuted;
    }
  };

  const tagColor = getTagColor(item.tag);

  return (
    <View style={s.card}>
      <View style={s.contentContainer}>
        {/* Category & Read Time */}
        <View style={s.metaTop}>
          <View style={[s.tagPill, { backgroundColor: tagColor + '20', borderColor: tagColor }]}>
            <Text style={[s.tagText, { color: tagColor }]}>{item.tag.toUpperCase()}</Text>
          </View>
          <Text style={s.readTime}>4 MIN READ</Text>
        </View>

        {/* Headline */}
        <Text style={s.headline} numberOfLines={3}>
          {item.title.toUpperCase()}
        </Text>

        {/* Summary */}
        <Text style={s.summary} numberOfLines={5}>
          {(item.description || '').slice(0, 220)}
          {item.description && item.description.length > 220 ? '...' : ''}
        </Text>

        <View style={s.divider} />

        {/* Author & Source Row */}
        <View style={s.sourceRow}>
          <View style={s.authorBadge}>
            <View>
              <Text style={s.sourceName}>NEWS // {item.source.toUpperCase()}</Text>
              <View style={s.statsSubRow}>
                <Text style={s.statsText}>T-{formatTimeAgo(item.time).toUpperCase()}</Text>
                <Text style={s.statsText}>  //  </Text>
                <Text style={s.statsText}>SCORE: {formatScore(item.score)}</Text>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={s.readButton} 
            onPress={handleOpenArticle}
            activeOpacity={0.7}
          >
            <Text style={s.readButtonText}>READ_TRANSMISSION →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtle Bottom Swipe Hint */}
      <View style={s.swipeHint}>
        <Text style={s.swipeHintText}>↑ SWIPE_NEXT</Text>
      </View>
    </View>
  );
}

// Skeleton Component
export function NewsCardSkeleton() {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={[s.card, { backgroundColor: theme.bg }]}>
      <View style={s.contentContainer}>
        <View style={s.metaTop}>
          <View style={[s.skeleton, { width: 80, height: 24, backgroundColor: theme.bgInput }]} />
          <View style={[s.skeleton, { width: 60, height: 16, backgroundColor: theme.bgInput }]} />
        </View>
        <View style={[s.skeleton, { width: '90%', height: 32, marginTop: 20, marginHorizontal: 20, backgroundColor: theme.bgInput }]} />
        <View style={[s.skeleton, { width: '80%', height: 32, marginTop: 10, marginHorizontal: 20, backgroundColor: theme.bgInput }]} />
        <View style={[s.skeleton, { width: '95%', height: 16, marginTop: 24, marginHorizontal: 20, backgroundColor: theme.bgInput }]} />
        <View style={[s.skeleton, { width: '90%', height: 16, marginTop: 8, marginHorizontal: 20, backgroundColor: theme.bgInput }]} />
        <View style={[s.skeleton, { height: 1, marginVertical: 20, marginHorizontal: 20, backgroundColor: theme.border }]} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20 }}>
          <View style={[s.skeleton, { width: 120, height: 32, backgroundColor: theme.bgInput }]} />
          <View style={[s.skeleton, { width: 100, height: 32, borderRadius: 20, backgroundColor: theme.bgInput }]} />
        </View>
      </View>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  card: {
    width: width,
    height: Platform.OS === 'web' ? '100%' : height,
    backgroundColor: theme.bg,
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
    paddingHorizontal: 20,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  readTime: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  headline: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.textPrimary,
    lineHeight: 34,
    marginTop: 24,
    paddingHorizontal: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: -1,
  },
  summary: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
    fontWeight: '500',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginHorizontal: 20,
    marginVertical: 24,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceName: {
    color: theme.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statsSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statsText: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  readButton: {
    borderWidth: 1,
    borderColor: theme.purple,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.purpleGlow,
  },
  readButtonText: {
    color: theme.purple,
    fontSize: 11,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  swipeHint: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintText: {
    color: theme.border,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  skeleton: {
    borderRadius: 4,
    opacity: 0.5,
  },
});
