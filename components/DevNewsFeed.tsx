import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Memory cache for news
let newsCache: { data: NewsItem[], timestamp: number } | null = null;
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
const STORAGE_KEY = 'codenid_dev_news_cache';

export interface NewsItem {
  id: string | number;
  title: string;
  url: string;
  time: number;
  source: string;
  tag: string;
  score?: number;
  comments?: number;
  text?: string;
  description?: string;
  canonical_url?: string; // For Dev.to fallback
}

// Reduced to top 6 tags to minimize network requests (from 12)
const DEVTO_TAGS = [
  'javascript', 'webdev', 'react', 'python',
  'ai', 'typescript', 'rust', 'golang', 'devops',
  'backend', 'frontend', 'softwareengineering', 'architecture'
];

const BASE_DEVTO = 'https://dev.to/api/articles';

function isStrictlyDevRelated(story: { title: string }) {
  const title = story.title.toLowerCase();
  
  // Relaxed filtering for better availability
  if (title.split(' ').length <= 1) return false;
  if (title.length < 12) return false; // Reduced from 20 to 12
  
  const BLACKLIST_KEYWORDS = [
    'exercise', 'tutorial', 'quiz', 'problem', 'solution', 
    'practice', 'homework', 'assignment', 'query', 'sql console'
  ];
  if (BLACKLIST_KEYWORDS.some(kw => title.includes(kw))) return false;

  const STRICT_DEV_KEYWORDS = [
    'javascript', 'typescript', 'python', 'rust', 'golang', 'react', 'vue', 'nextjs', 'nodejs',
    'css', 'html', 'tailwind', 'api', 'github', 'git', 'coding', 'programming', 'devops',
    'docker', 'kubernetes', 'aws', 'llm', 'gpt', 'claude', 'gemini', 'ai model', 'machine learning',
    'backend', 'frontend', 'fullstack', 'architecture', 'database', 'sql', 'nosql', 'cloud', 'server',
    'deploy', 'engineering', 'startup', 'software', 'agile', 'scrum', 'debugging', 'testing',
    'security', 'hacker', 'linux', 'unix', 'macos', 'windows', 'ios', 'android', 'swift', 'kotlin',
    'dart', 'flutter', 'react-native', 'expo', 'serverless', 'microservices', 'graphql', 'rest',
    'performance', 'optimization', 'scaling', 'infrastructure', 'monitoring', 'logging'
  ];
  return STRICT_DEV_KEYWORDS.some(kw => title.includes(kw));
}

function isBlacklisted(url?: string) {
  if (!url) return false;
  const NEWS_SITE_BLACKLIST = ['bbc', 'cnn', 'guardian', 'nytimes', 'reuters', 'bloomberg'];
  return NEWS_SITE_BLACKLIST.some(site => url.toLowerCase().includes(site));
}

function getCategory(title: string) {
  const t = title.toLowerCase();
  if (t.match(/llm|gpt|claude|gemini|ai model|machine learning|neural/)) return 'AI/ML';
  if (t.match(/react|vue|angular|css|html|frontend|nextjs/)) return 'Web Dev';
  if (t.match(/github|open source|repository|git/)) return 'Open Source';
  if (t.match(/docker|kubernetes|aws|devops|linux|cloud/)) return 'DevOps';
  if (t.match(/python|rust|golang|java|typescript|javascript/)) return 'Languages';
  return 'Dev';
}

function normalizeHN(d: any): NewsItem {
  const source = d.url ? d.url.split('/')[2].replace('www.', '') : 'Hacker News';
  return {
    id: d.id,
    title: d.title,
    url: d.url || `https://news.ycombinator.com/item?id=${d.id}`,
    time: d.time,
    source: source,
    tag: getCategory(d.title),
    score: d.score,
    comments: d.descendants,
    description: d.text || ''
  };
}

function normalizeDevTo(d: any): NewsItem {
  return {
    id: `devto-${d.id}`,
    title: d.title,
    url: d.url,
    canonical_url: d.canonical_url,
    time: Math.floor(new Date(d.published_at).getTime() / 1000),
    source: 'dev.to',
    tag: getCategory(d.title),
    score: d.public_reactions_count, // Dev.to reactions
    comments: d.comments_count,
    description: d.description
  };
}

export default function DevNewsFeed({ 
  onOpenReader,
  onRefreshStart,
  onRefreshEnd,
  forceRefreshKey = 0
}: { 
  onOpenReader?: (data: NewsItem[], updatedText?: string) => void,
  onRefreshStart?: () => void,
  onRefreshEnd?: () => void,
  forceRefreshKey?: number
}) {
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Load from cache immediately for "Instant-on" experience
    loadCachedNews();
    
    // 2. Fetch fresh news in background
    loadAllNews();
    
    intervalRef.current = setInterval(() => loadAllNews(true), CACHE_EXPIRY) as unknown as NodeJS.Timeout;
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const loadCachedNews = async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Serve cache even if expired, then update in background
        if (onOpenReader) onOpenReader(parsed.data, "Loading fresh news...");
        newsCache = parsed;
      }
    } catch (e) {
      // Cached news load error handled silently
    }
  };

  useEffect(() => { if (forceRefreshKey > 0) loadAllNews(true); }, [forceRefreshKey]);

  const loadAllNews = async (force: boolean = false) => {
    if (loading) return;
    try {
      if (!force && newsCache && (Date.now() - newsCache.timestamp < CACHE_EXPIRY)) {
        if (onOpenReader) onOpenReader(newsCache.data);
        return;
      }
      
      setLoading(true);
      if (onRefreshStart) onRefreshStart();
      
      const news = await fetchFreshNews();
      
      if (news && news.length > 0) {
        newsCache = { data: news, timestamp: Date.now() };
        // Persist to storage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newsCache));
        
        if (onOpenReader) onOpenReader(news, "Updated just now");
      }
      
      if (onRefreshEnd) onRefreshEnd();
      setLoading(false);
    } catch (err) {
      // News load error handled silently
      setLoading(false);
      if (onRefreshEnd) onRefreshEnd();
    }
  };

  const fetchFreshNews = async (): Promise<NewsItem[]> => {
    try {
      // 1. Fetch from Dev.to using a single "top" request to avoid 429 rate limits
      // We fetch more items initially since we're using a single endpoint, then filter aggressively
      const devToUrl = `${BASE_DEVTO}?top=7&per_page=100`;
      const devToRes = await fetch(devToUrl);
      
      let devToItems: NewsItem[] = [];
      if (devToRes.ok) {
        const rawDevTo = await devToRes.json();
        devToItems = rawDevTo
          .filter((d: any) => (d.public_reactions_count || d.positive_reactions_count || 0) >= 2)
          .map(normalizeDevTo)
          .filter((d: any) => isStrictlyDevRelated(d));
      } else {
        console.warn(`Dev.to API error: ${devToRes.status}`);
      }

      // 2. Fetch from HN (Increased from top 30 to 50)
      const hnRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      const hnIds = await hnRes.json();
      const hnTop50 = hnIds.slice(0, 50); // Increased from 30 to 50

      const hnItemsRaw = await Promise.all(
        hnTop50.map(async (id: number) => {
          const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          return itemRes.json();
        })
      );

      const hnItems = hnItemsRaw
        .filter(d => d && d.score >= 30 && isStrictlyDevRelated(d) && !isBlacklisted(d.url)) // Lowered score from 40 to 30
        .map(normalizeHN);

      // 3. Merge and Deduplicate
      const merged = [...devToItems, ...hnItems];
      merged.sort((a, b) => b.time - a.time);

      const seenTitles = new Set();
      const finalNews: NewsItem[] = [];

      for (const item of merged) {
        const normalizedTitle = item.title.toLowerCase().trim().slice(0, 40);
        if (!seenTitles.has(normalizedTitle)) {
          seenTitles.add(normalizedTitle);
          finalNews.push(item);
        }
        if (finalNews.length >= 25) break;
      }

      return finalNews;
    } catch (err) {
      // Fresh news fetch error handled silently
      return [];
    }
  };

  return null;
}
