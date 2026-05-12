import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Dimensions, 
  TouchableOpacity, Linking, Platform, Image, Animated
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

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

const categoryVisuals: Record<string, string[]> = {
  'AI/ML': [
    'vibrant glowing neural network',
    'colorful AI brain visualization',
    'electric blue purple synapses',
    'neon digital mind map',
    'glowing matrix particles cyan',
  ],
  'WEB DEV': [
    'vibrant colorful browser UI design',
    'neon code editor dark theme',
    'floating 3d UI components glow',
    'colorful web design elements',
    'electric blue frontend code visual',
  ],
  'DEVOPS': [
    'colorful cloud infrastructure nodes',
    'vibrant server network diagram',
    'neon blue server room glowing',
    'electric cloud computing visual',
    'bright kubernetes pod network',
  ],
  'OPEN SRC': [
    'vibrant open source community',
    'colorful GitHub contribution graph',
    'glowing green code collaboration',
    'neon network of developers',
    'bright git branch visualization',
  ],
  'LANGUAGES': [
    'vibrant colorful code syntax',
    'neon programming language symbols',
    'electric colored data structures',
    'glowing algorithm visualization',
    'bright colorful terminal output',
  ],
  'INDUSTRY': [
    'vibrant tech startup workspace',
    'colorful innovation concept art',
    'neon city tech skyline',
    'bright modern tech office',
    'electric product launch visual',
  ],
};

const categoryEmoji: Record<string, string> = {
  'AI/ML': '🤖',
  'WEB DEV': '🌐',
  'DEVOPS': '☁️',
  'OPEN SRC': '🔓',
  'LANGUAGES': '💻',
  'INDUSTRY': '🚀',
  'DEV': '⚡',
};

const fallbackGradients: Record<string, string[]> = {
  'AI/ML': ['#4c1d95', '#1e1b4b'],
  'WEB DEV': ['#1e3a8a', '#0c4a6e'],
  'DEVOPS': ['#7c2d12', '#431407'],
  'OPEN SRC': ['#14532d', '#052e16'],
  'LANGUAGES': ['#713f12', '#1c1500'],
  'INDUSTRY': ['#701a75', '#2d0a2e'],
  'DEV': ['#1e3a8a', '#0f172a'],
};

const categoryShimmerColors: Record<string, string[]> = {
  'AI/ML': ['#1a0533', '#3b0764', '#1a0533'],
  'WEB DEV': ['#0c1a4a', '#1e3a8a', '#0c1a4a'],
  'DEVOPS': ['#2a0f00', '#7c2d12', '#2a0f00'],
  'OPEN SRC': ['#042f0e', '#14532d', '#042f0e'],
  'LANGUAGES': ['#1c1500', '#713f12', '#1c1500'],
  'INDUSTRY': ['#2d0a2e', '#701a75', '#2d0a2e'],
};

export const generateNewsImage = (title: string, category: string) => {
  const visuals = categoryVisuals[category.toUpperCase()] || categoryVisuals['AI/ML'];
  const visual = visuals[title.length % visuals.length];

  const stopWords = ['the','a','an','is','are','was','were','be','been','has',
    'have','had','do','does','did','will','would','could','should','may','might',
    'to','of','in','on','at','by','for','with','about','into','from'];

  const keyWords = title
    .toLowerCase()
    .split(' ')
    .filter(w => !stopWords.includes(w))
    .slice(0, 3)
    .join(' ');

  const prompt = encodeURIComponent(
    `${visual}, ${keyWords}, ultra vibrant colors, cinematic lighting, 4k quality, dramatic, eye catching, professional photography style, no text, no words, no letters, sharp focus, high contrast`
  );

  return `https://image.pollinations.ai/prompt/${prompt}?width=900&height=500&seed=${Math.abs(title.charCodeAt(0) * title.length)}&model=flux&enhance=true&nologo=true`;
};

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

const Shimmer = ({ category }: { category: string }) => {
  const anim = React.useRef(new Animated.Value(0.4)).current;
  const tagUpper = category.toUpperCase();
  const colors = categoryShimmerColors[tagUpper] || categoryShimmerColors['AI/ML'];
  const emoji = categoryEmoji[tagUpper] || categoryEmoji['DEV'];

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim, justifyContent: 'center', alignItems: 'center' }]}>
      <LinearGradient colors={colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
      <Text style={{ fontSize: 48, opacity: 0.3 }}>{emoji}</Text>
    </Animated.View>
  );
};

export default function NewsCard({ 
  item, 
}: { 
  item: NewsItem;
}) {
  const { theme, isDark } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    
    // Add timeout to fallback if image takes too long (8 seconds)
    const timer = setTimeout(() => {
      if (!imageLoaded) setImageError(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [item.id]);

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
      if (Platform.OS === 'web') window.open(targetUrl, '_blank');
      else Linking.openURL(targetUrl);
    }
  };

  const getCategoryStyles = (tag: string) => {
    switch (tag.toUpperCase()) {
      case 'AI/ML': return { bg: '#7c3aed40', text: '#a78bfa', border: '#7c3aed60' };
      case 'WEB DEV': return { bg: '#1d4ed840', text: '#60a5fa', border: '#1d4ed860' };
      case 'DEVOPS': return { bg: '#ea580c40', text: '#fb923c', border: '#ea580c60' };
      case 'OPEN SRC': return { bg: '#16a34a40', text: '#4ade80', border: '#16a34a60' };
      case 'LANGUAGES': return { bg: '#ca8a0440', text: '#fbbf24', border: '#ca8a0460' };
      case 'INDUSTRY': return { bg: '#db277740', text: '#f472b6', border: '#db277760' };
      default: return { bg: '#4b556340', text: '#9ca3af', border: '#4b556360' };
    }
  };

  const catStyle = getCategoryStyles(item.tag);
  const imageUrl = generateNewsImage(item.title, item.tag);
  
  const tagUpper = item.tag.toUpperCase();
  const fbGradient = fallbackGradients[tagUpper] || fallbackGradients['DEV'];
  const fbEmoji = categoryEmoji[tagUpper] || categoryEmoji['DEV'];

  return (
    <View style={s.card}>
      <View style={s.imageSection}>
        {!imageError ? (
          <>
            {!imageLoaded && (
              <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
                <Shimmer category={item.tag} />
              </View>
            )}
            <Image 
              source={{ uri: imageUrl }} 
              style={s.image} 
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {/* Subtle Vignette Overlay for Web */}
            {Platform.OS === 'web' && (
              <View style={[StyleSheet.absoluteFill, { 
                backgroundImage: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)' 
              } as any]} pointerEvents="none" />
            )}
            {/* Simple dark overlay for Native to simulate vignette */}
            {Platform.OS !== 'web' && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} pointerEvents="none" />
            )}
          </>
        ) : (
          <LinearGradient colors={fbGradient as any} style={s.fallbackGradient}>
            <Text style={s.fallbackEmoji}>{fbEmoji}</Text>
            <Text style={s.fallbackText}>{tagUpper}</Text>
          </LinearGradient>
        )}
        
        <LinearGradient 
          colors={['transparent', isDark ? '#0a0a0a' : '#f0f2f5']} 
          style={s.gradientOverlay} 
          pointerEvents="none"
        />
        
        <View style={[s.categoryPill, { backgroundColor: catStyle.bg, borderColor: catStyle.border }]}>
          <Text style={[s.categoryText, { color: catStyle.text }]}>{tagUpper}</Text>
        </View>
      </View>

      <View style={s.contentSection}>
        <View style={s.readTimeRow}>
          <Text style={s.readTime}>4 MIN READ</Text>
        </View>

        <Text style={s.headline} numberOfLines={3}>
          {item.title.toUpperCase()}
        </Text>

        <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
          <Text style={s.summary} numberOfLines={expanded ? undefined : 3}>
            {item.description || 'No description available for this transmission.'}
          </Text>
        </TouchableOpacity>

        <View style={s.divider} />

        <View style={s.sourceRow}>
          <View style={s.authorBadge}>
            <Text style={s.sourceName}>NEWS {"//"} {item.source.toUpperCase()}</Text>
            <Text style={s.statsText}>{formatTimeAgo(item.time).toUpperCase()} {"//"} SCORE: {formatScore(item.score)}</Text>
          </View>

          <TouchableOpacity 
            style={[s.readButton, { borderColor: catStyle.border }]} 
            onPress={handleOpenArticle}
            activeOpacity={0.7}
          >
            <Text style={[s.readButtonText, { color: catStyle.text }]}>READ TRANSMISSION →</Text>
          </TouchableOpacity>
        </View>

        <View style={s.swipeHint}>
          <Text style={s.swipeHintText}>↑ SWIPE_NEXT</Text>
        </View>
      </View>
    </View>
  );
}

// Skeleton Component
export function NewsCardSkeleton() {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={s.card}>
      <View style={s.imageSection}>
         <Shimmer category="DEV" />
      </View>
      <View style={s.contentSection}>
        <View style={[s.skeleton, { width: 80, height: 12, alignSelf: 'flex-end', marginTop: 16 }]} />
        <View style={[s.skeleton, { width: '90%', height: 28, marginTop: 16 }]} />
        <View style={[s.skeleton, { width: '70%', height: 28, marginTop: 8 }]} />
        <View style={[s.skeleton, { width: '100%', height: 14, marginTop: 24 }]} />
        <View style={[s.skeleton, { width: '80%', height: 14, marginTop: 8 }]} />
        <View style={s.divider} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <View style={[s.skeleton, { width: 100, height: 12 }]} />
            <View style={[s.skeleton, { width: 140, height: 12, marginTop: 6 }]} />
          </View>
          <View style={[s.skeleton, { width: 140, height: 36, borderRadius: 4 }]} />
        </View>
      </View>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => {
  const bg = isDark ? '#0a0a0a' : '#f0f2f5';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? '#9ca3af' : '#475569';
  const textMuted = isDark ? '#4b5563' : '#94a3b8';

  return StyleSheet.create({
    card: {
      width: '100%',
      height: '100%',
      backgroundColor: bg,
    },
    imageSection: {
      height: height * 0.42,
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#0a0a0a',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    fallbackGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fallbackEmoji: {
      fontSize: 64,
      marginBottom: 10,
    },
    fallbackText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 2,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    gradientOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 120,
    },
    categoryPill: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      zIndex: 10,
    },
    categoryText: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    contentSection: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
      position: 'relative',
    },
    readTimeRow: {
      alignItems: 'flex-end',
      marginBottom: 8,
    },
    readTime: {
      color: textMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    headline: {
      fontSize: 24,
      fontWeight: '900',
      color: textPrimary,
      lineHeight: 28.8, 
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    summary: {
      fontSize: 14,
      color: textSecondary,
      lineHeight: 22.4, 
      marginTop: 12,
      fontWeight: '400',
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? '#1f2937' : '#e2e8f0',
      marginVertical: 16,
    },
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    authorBadge: {
      flex: 1,
    },
    sourceName: {
      color: textMuted,
      fontSize: 11,
      fontWeight: '800',
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    statsText: {
      color: textMuted,
      fontSize: 11,
      marginTop: 2,
      fontWeight: '800',
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    readButton: {
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    readButtonText: {
      fontSize: 11,
      fontWeight: '900',
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    swipeHint: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    swipeHintText: {
      color: isDark ? '#374151' : '#cbd5e1', 
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 2,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    skeleton: {
      borderRadius: 4,
      backgroundColor: isDark ? '#1f2937' : '#e2e8f0',
      opacity: 0.5,
    },
  });
};
