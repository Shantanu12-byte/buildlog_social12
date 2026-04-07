import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, 
  ScrollView, Platform, Animated, Image, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { trackPageView } from '@/services/analyticsService';
import { useResponsive } from '@/hooks/useResponsive';
import { DesktopLayout } from '@/components/ui/DesktopLayout';
import { LoadingScreen } from '@/components/ui/UI';

const { width } = Dimensions.get('window');

interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'coding' | 'mcq' | 'bug_fix' | 'output_predict';
  tags: string[];
  companies: string[];
  status?: 'solved' | 'attempted' | 'none';
  xp?: number;
}

export default function ChallengesScreen() {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const { userProfile, userId } = useUserStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [dailyChallenge, setDailyChallenge] = useState<Problem | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, 'solved' | 'attempted'>>({});
  const [filter, setFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Stats
  const solvedCount = userProfile?.problems_solved || 0;
  const streakCount = userProfile?.streak_count || 5; // Fallback for UI demo
  const totalProblems = 50; // Mock total

  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    loadData();
    const updateCountdown = () => setTimeLeft(getTimeLeft());
    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, [userId]);

  const getTimeLeft = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24,0,0,0);
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m left`;
  };

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Parallelize all initial data fetching
      const [dailyRes, progressRes, problemsRes] = await Promise.all([
        supabase
          .from('daily_challenges')
          .select('problem_id, problems(*)')
          .eq('date', new Date().toISOString().split('T')[0])
          .maybeSingle(),
        supabase
          .from('user_problems')
          .select('problem_id, status')
          .eq('user_id', userId),
        supabase
          .from('problems')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50) // Don't fetch everything at once
      ]);

      // 1. Process Daily Challenge
      if (dailyRes.data?.problems) {
        setDailyChallenge(dailyRes.data.problems as any);
      } else {
        // Efficient fallback: Pick from first few problems instead of fetching all
        if (problemsRes.data && problemsRes.data.length > 0) {
          const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
          const index = dayOfYear % problemsRes.data.length;
          setDailyChallenge(problemsRes.data[index] as any);
        }
      }

      // 2. Process User Progress
      const progressMap: Record<string, 'solved' | 'attempted'> = {};
      progressRes.data?.forEach(p => {
        progressMap[p.problem_id] = p.status as any;
      });
      setUserProgress(progressMap);

      // 3. Process Problems
      if (problemsRes.data) {
        setProblems(problemsRes.data.map(p => ({
          ...p,
          status: progressMap[p.id] || 'none'
        })) as any);
      }

    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProblems = problems.filter(p => {
    const diffMatch = filter === 'All' || p.difficulty === filter;
    const typeMatch = !typeFilter || p.type === typeFilter;
    return diffMatch && typeMatch;
  });

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return theme.green;
      case 'Medium': return theme.amber;
      case 'Hard': return theme.red;
      default: return theme.textMuted;
    }
  };

  const { isDesktop } = useResponsive();
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowSkeleton(false), 500);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
    }
  }, [loading]);

  if (showSkeleton) return <LoadingScreen type="challenges" />;

  const renderDailyAndStats = () => (
    <View style={isDesktop ? s.desktopSidebar : undefined}>
      {/* Header Section (Mobile) */}
      {!isDesktop && (
        <View style={s.header}>
          <View style={s.headerTopRow}>
            <View>
              <Text style={s.headerSubtitle}>OP_PLACEMENT_PREP</Text>
              <Text style={s.headerTitle}>CHALLENGES</Text>
            </View>
            <View style={s.xpBadge}>
              <Text style={s.xpText}>⚡ {userProfile?.xp || 0} XP</Text>
            </View>
          </View>
        </View>
      )}

      {/* Daily Challenge Card */}
      {dailyChallenge && (
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: '/(stack)/problem-solver', params: { id: dailyChallenge.id } } as any)}
        >
          <LinearGradient
            colors={isDark ? ['#1a0a2e', '#0f0a1a'] : ['#ffffff', '#f5f3ff']}
            style={s.dailyCard}
          >
            <View style={s.dailyAccent} />
            <View style={s.dailyHeader}>
              <View style={s.dailyHeaderLeft}>
                <Text style={s.dailyLabel}>🔥 DAILY CHALLENGE</Text>
              </View>
              <Text style={s.dailyCountdown}>⏰ {timeLeft}</Text>
            </View>
            
            <Text style={s.dailyTitle}>{dailyChallenge.title}</Text>
            
            <View style={s.dailyMeta}>
              <View style={s.tagPill}><Text style={[s.tagText, { color: getDifficultyColor(dailyChallenge.difficulty) }]}>{dailyChallenge.difficulty}</Text></View>
              {dailyChallenge.tags?.[0] && <View style={s.tagPill}><Text style={s.tagText}>{dailyChallenge.tags[0]}</Text></View>}
            </View>
            
            <View style={s.dailyAction}>
              <Text style={s.dailyActionText}>Solve Today →</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Stats Cluster (Simplified for Sidebar) */}
      <View style={s.statsStatRow}>
        <View style={s.statsCard}>
          <Text style={[s.statsValLarge, { color: theme.green }]}>{userProfile?.easy_solved || 0}</Text>
          <Text style={s.statsLabelSmall}>Easy</Text>
        </View>
        <View style={s.statsCard}>
          <Text style={[s.statsValLarge, { color: theme.amber }]}>{userProfile?.medium_solved || 0}</Text>
          <Text style={s.statsLabelSmall}>Medium</Text>
        </View>
        <View style={s.statsCard}>
          <Text style={[s.statsValLarge, { color: theme.red }]}>{userProfile?.hard_solved || 0}</Text>
          <Text style={s.statsLabelSmall}>Hard</Text>
        </View>
      </View>

      <View style={s.quickActions}>
        <TouchableOpacity style={s.actionCard} onPress={() => router.push('/(stack)/daily-memos')}>
          <MaterialCommunityIcons name="brain" size={20} color={theme.purple} />
          <Text style={s.actionTitle}>Memos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionCard} onPress={() => router.push('/(stack)/company-tracks')}>
          <Feather name="briefcase" size={18} color={theme.green} />
          <Text style={s.actionTitle}>Tracks</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilterAndList = () => (
    <View style={isDesktop ? s.desktopListColumn : undefined}>
      {isDesktop && (
        <View style={s.desktopHeader}>
          <Text style={s.headerTitle}>Problems</Text>
          <View style={s.xpBadge}>
            <Text style={s.xpText}>⚡ {userProfile?.xp || 0} XP</Text>
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={s.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {['All', 'Easy', 'Medium', 'Hard'].map((f) => (
            <TouchableOpacity 
              key={f} 
              style={[s.filterBtn, filter === f && s.filterBtnActive]}
              onPress={() => setFilter(f as any)}
            >
              <Text style={[s.filterBtnText, filter === f && s.filterBtnTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {[
            { id: 'coding', label: 'Coding' },
            { id: 'mcq', label: 'MCQ' },
            { id: 'bug_fix', label: 'Bug Fix' },
            { id: 'output_predict', label: 'Output' }
          ].map((t) => (
            <TouchableOpacity 
              key={t.id} 
              style={[s.typeFilterBtn, typeFilter === t.id && s.typeFilterBtnActive]}
              onPress={() => setTypeFilter(typeFilter === t.id ? null : t.id)}
            >
              <Text style={[s.filterBtnText, typeFilter === t.id && s.filterBtnTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Problem List */}
      <View style={s.listWrapper}>
        {filteredProblems.map((p, index) => (
          <TouchableOpacity 
            key={p.id} 
            style={s.problemCard}
            onPress={() => router.push({ pathname: '/(stack)/problem-solver', params: { id: p.id } } as any)}
          >
            <View style={[
              s.statusCircle,
              { backgroundColor: p.status === 'solved' ? theme.green : p.status === 'attempted' ? theme.amber : isDark ? theme.border : theme.bgInput }
            ]}>
              {p.status === 'solved' ? (
                <Feather name="check" size={16} color="#FFF" />
              ) : (
                <Feather name="play" size={14} color={theme.textMuted} />
              )}
            </View>
            
            <View style={s.problemInfo}>
              <Text style={s.problemTitle}>{p.title}</Text>
              <View style={s.problemTagsRow}>
                <Text style={[s.difficultyText, { color: getDifficultyColor(p.difficulty) }]}>{p.difficulty}</Text>
                {p.companies?.slice(0, 2).map((c, ci) => (
                  <View key={ci} style={s.listCompanyPill}><Text style={s.listCompanyPillText}>{c}</Text></View>
                ))}
              </View>
            </View>
            
            <Feather name="chevron-right" size={20} color={theme.border} />
          </TouchableOpacity>
        ))}
        {filteredProblems.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyText}>No problems matching filters</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <DesktopLayout scrollable={false}>
      <SafeAreaView style={s.container} edges={['top']}>
        {isDesktop ? (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={s.desktopLayoutContainer}>
              {renderDailyAndStats()}
              {renderFilterAndList()}
            </View>
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
            {renderDailyAndStats()}
            {renderFilterAndList()}
          </ScrollView>
        )}
      </SafeAreaView>
    </DesktopLayout>
  );
}

const getStyles = (theme: any, isDark: boolean) => {
  const bg = isDark ? '#0a0a0a' : '#f0f2f5';
  const bgCard = isDark ? '#111111' : '#ffffff';
  const bgCardAlt = isDark ? '#161616' : '#f8fafc';
  const border = isDark ? '#1f2937' : '#e2e8f0';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? '#9ca3af' : '#475569';
  const textMuted = isDark ? '#6b7280' : '#94a3b8';

  const shadow = !isDark ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  } : {};

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: theme.purple, marginTop: 16, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    content: { padding: 20, paddingBottom: 100 },
    
    // Desktop Layout
    desktopLayoutContainer: {
      flex: 1,
      flexDirection: 'row',
      gap: 32,
      padding: 32,
      maxWidth: 1400,
      alignSelf: 'center',
      width: '100%',
    },
    desktopSidebar: {
      width: 340,
      gap: 24,
    },
    desktopListColumn: {
      flex: 1,
    },
    desktopHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },

    // Header
    header: { marginBottom: 32, paddingVertical: 10 },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    headerSubtitle: { color: theme.purple, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
    headerTitle: { color: textPrimary, fontSize: 28, fontWeight: '800' },
    xpBadge: { backgroundColor: theme.purple, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    xpText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
    
    // Daily Challenge
    dailyCard: { borderRadius: 24, padding: 24, marginBottom: 0, borderWidth: 1, borderColor: isDark ? 'rgba(124, 58, 237, 0.25)' : 'rgba(124, 58, 237, 0.15)', backgroundColor: bgCard, ...shadow },
    dailyAccent: { position: 'absolute', left: 0, top: 24, bottom: 24, width: 4, backgroundColor: theme.purple, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
    dailyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    dailyHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
    dailyLabel: { color: theme.purple, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    dailyCountdown: { color: textMuted, fontSize: 11, fontWeight: '600' },
    dailyTitle: { color: textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 16 },
    dailyMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
    tagPill: { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: border },
    tagText: { fontSize: 10, fontWeight: '700', color: textSecondary },
    dailyAction: { marginTop: 20, alignSelf: 'flex-end' },
    dailyActionText: { color: theme.purple, fontSize: 14, fontWeight: '800' },

    // Stats
    statsStatRow: { flexDirection: 'row', gap: 12 },
    statsCard: { flex: 1, alignItems: 'center', backgroundColor: bgCard, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: border, ...shadow },
    statsValLarge: { fontSize: 24, fontWeight: '800' },
    statsLabelSmall: { color: textMuted, fontSize: 10, fontWeight: '800', marginTop: 4, textTransform: 'uppercase' },

    // Quick Actions
    quickActions: { flexDirection: 'row', gap: 12 },
    actionCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border, ...shadow },
    actionTitle: { color: textPrimary, fontSize: 14, fontWeight: '700' },

    // Filters
    filterWrapper: { marginBottom: 24, gap: 12 },
    filterRow: { gap: 10 },
    filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: bgCard, borderWidth: 1, borderColor: border, ...shadow },
    filterBtnActive: { backgroundColor: theme.purple, borderColor: theme.purple },
    typeFilterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: bgCard, borderWidth: 1, borderColor: border, ...shadow },
    typeFilterBtnActive: { backgroundColor: theme.purple, borderColor: theme.purple },
    filterBtnText: { color: textSecondary, fontSize: 13, fontWeight: '600' },
    filterBtnTextActive: { color: '#ffffff', fontWeight: '700' },

    // List
    listWrapper: { backgroundColor: bgCard, borderRadius: 20, borderWidth: 1, borderColor: border, overflow: 'hidden', ...shadow },
    problemCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: border, gap: 16 },
    statusCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    problemInfo: { flex: 1 },
    problemTitle: { color: textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 4 },
    problemTagsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    difficultyText: { fontSize: 12, fontWeight: '800' },
    listCompanyPill: { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: border },
    listCompanyPillText: { color: textSecondary, fontSize: 10, fontWeight: '700' },
    
    emptyState: { alignItems: 'center', paddingVertical: 80 },
    emptyText: { color: textMuted, fontSize: 15, fontWeight: '600' }
  });
};
