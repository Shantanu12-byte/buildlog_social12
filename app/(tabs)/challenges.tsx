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

const { width } = Dimensions.get('window');

interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'coding' | 'mcq' | 'bug_fix' | 'output_predict';
  tags: string[];
  companies: string[];
  status?: 'solved' | 'attempted' | 'none';
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
      // 1. Fetch Daily Challenge
      const { data: dailyData } = await supabase
        .from('daily_challenges')
        .select('problem_id, problems(*)')
        .eq('date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (dailyData?.problems) {
        setDailyChallenge(dailyData.problems as any);
      } else {
        // Deterministic fallback: pick a problem based on the date
        const { data: all } = await supabase.from('problems').select('*');
        if (all && all.length > 0) {
          const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
          const index = dayOfYear % all.length;
          setDailyChallenge(all[index] as any);
        }
      }

      // 2. Fetch User Progress
      const { data: progress } = await supabase
        .from('user_problems')
        .select('problem_id, status')
        .eq('user_id', userId);

      const progressMap: Record<string, 'solved' | 'attempted'> = {};
      progress?.forEach(p => {
        progressMap[p.problem_id] = p.status as any;
      });
      setUserProgress(progressMap);

      // 3. Fetch All Problems
      let query = supabase.from('problems').select('*').order('created_at', { ascending: false });
      const { data: allProblems } = await query;
      
      if (allProblems) {
        setProblems(allProblems.map(p => ({
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

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={theme.purple} />
          <Text style={s.loadingText}>INITIALIZING CHALLENGES...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* Header Section */}
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
          
          <View style={s.headerProgressWrap}>
            <View style={s.headerProgressBarBg}>
              <View style={[s.headerProgressBarFill, { width: `${(solvedCount / totalProblems) * 100}%` }]} />
            </View>
            <View style={s.headerProgressTextRow}>
              <Text style={s.headerProgressStatus}>{solvedCount} problems solved</Text>
              <Text style={s.headerProgressCount}>{solvedCount}/{totalProblems}</Text>
            </View>
          </View>
        </View>

        {/* Daily Challenge Card */}
        {dailyChallenge && (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => router.push({ pathname: '/(stack)/problem-solver', params: { id: dailyChallenge.id } } as any)}
          >
            <LinearGradient
              colors={isDark ? ['#1a0a2e', '#0f0a1a'] : ['#f5f3ff', '#ede9fe']}
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
                <View style={s.companyTags}>
                  {dailyChallenge.companies?.slice(0, 2).map((c, i) => (
                    <View key={i} style={s.companyPill}>
                      <Text style={s.companyPillText}>{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={s.dailyAction}>
                <Text style={s.dailyActionText}>Solve Today →</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Quick Actions Row */}
        <View style={s.quickActions}>
          <TouchableOpacity 
            style={s.actionCard} 
            onPress={() => router.push('/(stack)/daily-memos')}
          >
            <View style={[s.actionIconBox, { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)' }]}>
              <MaterialCommunityIcons name="brain" size={24} color={theme.purple} />
            </View>
            <Text style={s.actionTitle}>Daily Memos</Text>
            <Text style={s.actionSubtitle}>3/10 Today</Text>
            <View style={s.actionProgressBg}>
              <View style={[s.actionProgressFill, { width: '30%', backgroundColor: theme.purple }]} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={s.actionCard}
            onPress={() => router.push('/(stack)/company-tracks')}
          >
            <View style={[s.actionIconBox, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)' }]}>
              <Feather name="briefcase" size={20} color={theme.green} />
            </View>
            <Text style={s.actionTitle}>Company Tracks</Text>
            <Text style={s.actionSubtitle}>{dailyChallenge?.companies?.[0] || 'TCS'}, etc.</Text>
            <View style={s.tracksBadge}>
              <Text style={s.tracksBadgeText}>4 tracks</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Your Progress Section */}
        <View style={s.progressSection}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>YOUR PROGRESS</Text>
            <View style={s.streakBadge}>
              <Text style={s.streakText}>🔥 {streakCount} DAY STREAK</Text>
            </View>
          </View>
          
          <View style={s.statsStatRow}>
            <View style={s.statsCard}>
              <Text style={s.statsValLarge}>{userProfile?.easy_solved || 0}</Text>
              <Text style={[s.statsLabelSmall, { color: theme.green }]}>Easy</Text>
              <Text style={s.statsSubLabel}>solved</Text>
            </View>
            <View style={s.statsCard}>
              <Text style={s.statsValLarge}>{userProfile?.medium_solved || 0}</Text>
              <Text style={[s.statsLabelSmall, { color: theme.amber }]}>Medium</Text>
              <Text style={s.statsSubLabel}>solved</Text>
            </View>
            <View style={s.statsCard}>
              <Text style={s.statsValLarge}>{userProfile?.hard_solved || 0}</Text>
              <Text style={[s.statsLabelSmall, { color: theme.red }]}>Hard</Text>
              <Text style={s.statsSubLabel}>solved</Text>
            </View>
          </View>

          <View style={s.totalProgressWrap}>
            <View style={s.totalProgressHeader}>
              <Text style={s.totalProgressStatus}>Total: {solvedCount}/{totalProblems}</Text>
              <Text style={s.totalProgressPercent}>{Math.round((solvedCount/totalProblems)*100)}%</Text>
            </View>
            <View style={s.totalProgressBarBg}>
              <View style={[s.totalProgressBarFill, { width: `${(solvedCount/totalProblems)*100}%` }]} />
            </View>
          </View>
        </View>

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

        {/* Problem List Cluster */}
        <View style={s.listWrapper}>
          <View style={s.problemList}>
            {filteredProblems.map((p, index) => {
              const isFirst = index === 0;
              const isLast = index === filteredProblems.length - 1;
              
              return (
                <TouchableOpacity 
                  key={p.id} 
                  style={[
                    s.problemCard,
                    isFirst && s.problemCardFirst,
                    isLast && s.problemCardLast
                  ]}
                  onPress={() => router.push({ pathname: '/(stack)/problem-solver', params: { id: p.id } } as any)}
                >
                  <View style={[
                    s.statusCircle,
                    { backgroundColor: p.status === 'solved' ? theme.green : p.status === 'attempted' ? theme.amber : isDark ? theme.border : theme.bgInput }
                  ]}>
                    {p.status === 'solved' ? (
                      <Feather name="check" size={16} color={isDark ? '#000' : '#FFF'} />
                    ) : p.status === 'attempted' ? (
                      <Feather name="refresh-cw" size={16} color={isDark ? '#000' : '#FFF'} />
                    ) : (
                      <Feather name="lock" size={16} color={theme.textMuted} />
                    )}
                  </View>
                  
                  <View style={s.problemInfo}>
                    <Text style={s.problemTitle}>{p.title}</Text>
                    <View style={s.problemTagsRow}>
                      {p.tags?.slice(0, 2).map((t, ti) => (
                        <View key={ti} style={s.listTag}><Text style={s.listTagText}>{t}</Text></View>
                      ))}
                      <View style={s.companyTagsInline}>
                        {p.companies?.slice(0, 1).map((c, ci) => (
                          <View key={ci} style={s.listCompanyPill}><Text style={s.listCompanyPillText}>{c}</Text></View>
                        ))}
                        {p.companies && p.companies.length > 1 && (
                          <Text style={s.moreCompanies}>+{p.companies.length - 1} more</Text>
                        )}
                      </View>
                    </View>
                  </View>
                  
                  <View style={s.problemMeta}>
                    <Text style={[s.difficultyBadgeText, { color: getDifficultyColor(p.difficulty) }]}>
                      {p.difficulty}
                    </Text>
                    <Text style={s.companyCount}>{p.companies?.length || 0} Comp.</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {filteredProblems.length === 0 && (
              <View style={s.emptyState}>
                <MaterialCommunityIcons name="script-text-outline" size={48} color={theme.border} />
                <Text style={s.emptyText}>No problems matching your selection</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    
    // Section Labels
    sectionTitle: { color: textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
    
    // Header
    header: { marginBottom: 32, paddingVertical: 10 },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    headerSubtitle: { color: theme.purple, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
    headerTitle: { color: textPrimary, fontSize: 28, fontWeight: '800' },
    xpBadge: { backgroundColor: theme.purple, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    xpText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
    
    headerProgressWrap: { marginTop: 8 },
    headerProgressBarBg: { height: 4, backgroundColor: border, borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
    headerProgressBarFill: { height: '100%', backgroundColor: theme.purple, borderRadius: 2 },
    headerProgressTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerProgressStatus: { color: textSecondary, fontSize: 12, fontWeight: '600' },
    headerProgressCount: { color: textMuted, fontSize: 12, fontWeight: '700' },

    // Daily Challenge
    dailyCard: { borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: isDark ? 'rgba(124, 58, 237, 0.25)' : 'rgba(124, 58, 237, 0.15)', position: 'relative', overflow: 'hidden', ...shadow },
    dailyAccent: { position: 'absolute', left: 0, top: 24, bottom: 24, width: 3, backgroundColor: theme.purple, borderRadius: 2 },
    dailyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    dailyHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
    dailyLabel: { color: isDark ? '#f97316' : theme.purple, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    dailyCountdown: { color: textMuted, fontSize: 11, fontWeight: '600' },
    dailyTitle: { color: textPrimary, fontSize: 24, fontWeight: '800', marginBottom: 16 },
    dailyMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
    tagPill: { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: border },
    tagText: { fontSize: 11, fontWeight: '700', color: textSecondary },
    companyTags: { flexDirection: 'row', gap: 6 },
    companyPill: { backgroundColor: border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    companyPillText: { color: textSecondary, fontSize: 10, fontWeight: '800' },
    dailyAction: { marginTop: 24, alignSelf: 'flex-end' },
    dailyActionText: { color: theme.purple, fontSize: 15, fontWeight: '800' },

    // Quick Actions
    quickActions: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    actionCard: { flex: 1, backgroundColor: bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border, ...shadow },
    actionIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    actionTitle: { color: textPrimary, fontSize: 15, fontWeight: '800' },
    actionSubtitle: { color: textSecondary, fontSize: 11, marginTop: 4, marginBottom: 12 },
    actionProgressBg: { height: 4, backgroundColor: border, borderRadius: 2, overflow: 'hidden' },
    actionProgressFill: { height: '100%', borderRadius: 2 },
    tracksBadge: { alignSelf: 'flex-start', backgroundColor: border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
    tracksBadgeText: { color: textSecondary, fontSize: 10, fontWeight: '800' },

    // Your Progress
    progressSection: { marginBottom: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    streakBadge: { backgroundColor: isDark ? '#7c2d12' : '#fff7ed', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    streakText: { color: isDark ? '#f97316' : '#ea580c', fontSize: 11, fontWeight: '800' },
    
    statsStatRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    statsCard: { flex: 1, alignItems: 'center', backgroundColor: bgCard, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: border, ...shadow },
    statsValLarge: { color: textPrimary, fontSize: 20, fontWeight: '800' },
    statsLabelSmall: { fontSize: 10, fontWeight: '900', marginTop: 4, textTransform: 'uppercase' },
    statsSubLabel: { color: textMuted, fontSize: 9, fontWeight: '600' },

    totalProgressWrap: { marginTop: 4 },
    totalProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    totalProgressStatus: { color: textSecondary, fontSize: 12, fontWeight: '600' },
    totalProgressPercent: { color: textPrimary, fontSize: 12, fontWeight: '800' },
    totalProgressBarBg: { height: 8, backgroundColor: border, borderRadius: 4, overflow: 'hidden' },
    totalProgressBarFill: { height: '100%', backgroundColor: theme.purple, borderRadius: 4 },

    // Filters
    filterWrapper: { marginBottom: 20, gap: 12 },
    filterRow: { gap: 8, paddingRight: 20 },
    filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: bgCard, borderWidth: 1, borderColor: border, ...shadow },
    filterBtnActive: { backgroundColor: theme.purple, borderColor: theme.purple },
    typeFilterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: bgCard, borderWidth: 1, borderColor: border, ...shadow },
    typeFilterBtnActive: { backgroundColor: theme.purple, borderColor: theme.purple },
    filterBtnText: { color: textSecondary, fontSize: 13, fontWeight: '600' },
    filterBtnTextActive: { color: '#ffffff', fontWeight: '700' },

    // List Wrapper
    listWrapper: { backgroundColor: bgCard, borderRadius: 16, borderWidth: 1, borderColor: border, overflow: 'hidden', ...shadow },
    problemList: {},
    problemCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: isDark ? border : '#f1f5f9', gap: 16 },
    problemCardFirst: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    problemCardLast: { borderBottomWidth: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
    
    statusCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    problemInfo: { flex: 1 },
    problemTitle: { color: textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 },
    problemTagsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
    listTag: { backgroundColor: isDark ? border : '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    listTagText: { color: textSecondary, fontSize: 10, fontWeight: '600' },
    companyTagsInline: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 4 },
    listCompanyPill: { backgroundColor: border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    listCompanyPillText: { color: textSecondary, fontSize: 10, fontWeight: '700' },
    moreCompanies: { color: textMuted, fontSize: 10, fontWeight: '600' },
    
    problemMeta: { alignItems: 'flex-end' },
    difficultyBadgeText: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
    companyCount: { color: textMuted, fontSize: 10, fontWeight: '600' },
    
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyText: { color: textMuted, fontSize: 14, textAlign: 'center', maxWidth: 200 }
  });
};
