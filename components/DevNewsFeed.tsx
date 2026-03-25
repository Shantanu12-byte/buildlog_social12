import React, { useEffect, useState } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  StyleSheet, ActivityIndicator, Dimensions 
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

const NEWS_CACHE_KEY = '@buildlog_news_cache';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
const { width } = Dimensions.get('window');

interface NewsItem {
  id: number;
  title: string;
  url: string;
  time: number;
  source: string;
  tag: string;
}

function getSourceFromUrl(url: string): string {
  if (!url) return 'Hacker News';
  try {
    const domain = url.split('/')[2];
    return domain.startsWith('www.') ? domain.slice(4) : domain;
  } catch {
    return 'Web';
  }
}

function getTagFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('ai') || t.includes('gpt') || t.includes('llm') || t.includes('open-ai')) return 'AI';
  if (t.includes('web') || t.includes('js') || t.includes('react') || t.includes('browser')) return 'Web';
  if (t.includes('opensource') || t.includes('open source') || t.includes('github')) return 'Open Source';
  return 'Dev';
}

function formatTimeAgo(timestamp: number): string {
  const diffInSeconds = Math.floor(Date.now() / 1000 - timestamp);
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default function DevNewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(NEWS_CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          setNews(data);
          setLoading(false);
          return;
        }
      }
      fetchFromHN();
    } catch (e) {
      fetchFromHN();
    }
  };

  const fetchFromHN = async () => {
    try {
      const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      const ids = await res.json();
      const top10 = ids.slice(0, 10);

      const items = await Promise.all(
        top10.map(async (id: number) => {
          const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          const d = await itemRes.json();
          return {
            id: d.id,
            title: d.title,
            url: d.url || `https://news.ycombinator.com/item?id=${d.id}`,
            time: d.time,
            source: getSourceFromUrl(d.url),
            tag: getTagFromTitle(d.title),
          };
        })
      );

      setNews(items);
      setLoading(false);
      
      // Save to cache
      await AsyncStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({
        data: items,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Fetch news error:', err);
      setLoading(false);
    }
  };

  const handleOpenNews = (url: string) => {
    WebBrowser.openBrowserAsync(url);
  };

  if (loading) {
    return (
      <View style={s.loaderSection}>
        <ActivityIndicator color="#FF6600" />
        <Text style={s.loaderText}>FETCHING_TECH_PULSE...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <Text style={s.title}>TODAY_IN_TECH</Text>
        <Feather name="trending-up" size={14} color="#FF6600" />
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        snapToInterval={width * 0.8 + 15}
        decelerationRate="fast"
      >
        {news.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={s.card} 
            activeOpacity={0.8}
            onPress={() => handleOpenNews(item.url)}
          >
            <View style={s.cardHeader}>
              <View style={s.tagPill}>
                <Text style={s.tagText}>{item.tag.toUpperCase()}</Text>
              </View>
              <Text style={s.timeText}>{formatTimeAgo(item.time)}</Text>
            </View>
            <Text style={s.newsTitle} numberOfLines={2}>{item.title}</Text>
            <View style={s.cardFooter}>
              <Feather name="globe" size={10} color="#888" style={{ marginRight: 4 }} />
              <Text style={s.sourceText}>{item.source}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
    backgroundColor: '#090909',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    gap: 8,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    color: '#FF6600',
    letterSpacing: 1.5,
  },
  loaderSection: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#888',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: 15,
  },
  card: {
    width: width * 0.8,
    backgroundColor: '#151515',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tagPill: {
    backgroundColor: 'rgba(255,102,0,0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(255,102,0,0.3)',
  },
  tagText: {
    color: '#FF6600',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  timeText: {
    color: '#666',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  newsTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  sourceText: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'monospace',
    textDecorationLine: 'underline',
  },
});
