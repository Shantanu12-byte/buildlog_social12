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

  // Stats & Mocks
  const solvedCount = userProfile?.problems_solved || 2;
  const streakCount = userProfile?.streak_count || 5; 
  const totalProblems = 50; 
  
  // Timer & Pulse
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  const headerProgressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    const updateCountdown = () => {
      const { timeStr, hours } = getTimeLeft();
      setTimeLeft(timeStr);
      setIsUrgent(hours < 1);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, [userId]);

  useEffect(() => {
    if (isUrgent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
          Animated.timing(timerPulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      timerPulseAnim.setValue(1);
    }
  }, [isUrgent]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(headerProgressAnim, {
        toValue: Math.min(solvedCount / totalProblems, 1),
        duration: 1000,
        useNativeDriver: false
      }).start();
    }
  }, [loading, solvedCount]);

  const getTimeLeft = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24,0,0,0);
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { timeStr: `${hours}h ${mins}m`, hours };
  };

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [dailyRes, progressRes, problemsRes] = await Promise.all([
        supabase.from('daily_challenges').select('problem_id, problems(*)').eq('date', new Date().toISOString().split('T')[0]).maybeSingle(),
        supabase.from('user_problems').select('problem_id, status').eq('user_id', userId),
        supabase.from('problems').select('*').order('created_at', { ascending: false }).limit(50)
      ]);

      if (dailyRes.data?.problems) {
        setDailyChallenge(dailyRes.data.problems as any);
      } else if (problemsRes.data && problemsRes.data.length > 0) {
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        const index = dayOfYear % problemsRes.data.length;
        setDailyChallenge(problemsRes.data[index] as any);
      }

      const progressMap: Record<string, 'solved' | 'attempted'> = {};
      progressRes.data?.forEach(p => { progressMap[p.problem_id] = p.status as any; });
      setUserProgress(progressMap);

      if (problemsRes.data) {
        setProblems(problemsRes.data.map(p => ({ ...p, status: progressMap[p.id] || 'none' })) as any);
      }
    } catch (error) {
      console.error('[challenges] Error loading data:', error);
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
      case 'Easy': return '#16a34a';
      case 'Medium': return '#ca8a04';
      case 'Hard': return '#dc2626';
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

  const getDifficultyPillStyle = (diff: string) => {
    switch (diff) {
      case 'Easy': return { bg: isDark ? '#052e16' : '#dcfce7', text: isDark ? '#4ade80' : '#16a34a' };
      case 'Medium': return { bg: isDark ? '#1c1500' : '#fef9c3', text: isDark ? '#fbbf24' : '#ca8a04' };
      case 'Hard': return { bg: isDark ? '#1f0000' : '#fee2e2', text: isDark ? '#f87171' : '#dc2626' };
      default: return { bg: isDark ? '#1f2937' : '#e2e8f0', text: isDark ? '#9ca3af' : '#475569' };
    }
  };

  const renderDailyAndStats = () => (
    <View style={isDesktop ? s.desktopSidebar : { paddingBottom: 24 }}>
      {/* 1. HEADER REDESIGN */}
      {!isDesktop && (
        <View style={s.header}>
          <Text style={s.headerSubtitle}>OP_PLACEMENT_PREP</Text>
          <View style={s.headerTopRow}>
            <Text style={s.headerTitle}>CHALLENGES</Text>
            <View style={s.xpBadge}>
              <Text style={s.xpText}>⚡ {userProfile?.xp || 0} XP</Text>
            </View>
          </View>
          
          <View style={s.headerProgressRow}>
            <View style={s.headerProgressBarBg}>
              <Animated.View style={[s.headerProgressBarFill, {
                width: headerProgressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
              }]} />
            </View>
            <Text style={s.headerProgressText}>{solvedCount}/{totalProblems} solved</Text>
          </View>
          <Text style={s.streakText}>Keep going! 🔥 {streakCount} day streak</Text>
        </View>
      )}

      {/* 2. DAILY CHALLENGE CARD */}
      {dailyChallenge && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push({ pathname: '/(stack)/problem-solver', params: { id: dailyChallenge.id } } as any)}>
          <LinearGradient
            colors={isDark ? ['#0c1a3a', '#060d1f'] : ['#eff6ff', '#dbeafe']}
            style={s.dailyCard}
          >
            <View style={s.dailyHeader}>
              <View style={s.dailyHeaderLeft}>
                <Text style={s.dailyLabel}>🔥 DAILY CHALLENGE</Text>
              </View>
              <Animated.Text style={[s.dailyCountdown, isUrgent && { color: '#dc2626', transform: [{ scale: timerPulseAnim }] }]}>
                ⏱ {timeLeft}
              </Animated.Text>
            </View>
            
            <Text style={s.dailyTitle}>{dailyChallenge.title}</Text>
            
            <View style={s.dailyMeta}>
              <View style={[s.diffPill, { backgroundColor: getDifficultyPillStyle(dailyChallenge.difficulty).bg }]}>
                <Text style={[s.diffPillText, { color: getDifficultyPillStyle(dailyChallenge.difficulty).text }]}>{dailyChallenge.difficulty}</Text>
              </View>
              {dailyChallenge.tags?.slice(0, 2).map((t, i) => (
                <View key={i} style={s.subtlePill}><Text style={s.subtlePillText}>{t}</Text></View>
              ))}
              {dailyChallenge.companies?.slice(0, 2).map((c, i) => (
                <View key={i} style={s.subtlePill}><Text style={s.subtlePillText}>{c}</Text></View>
              ))}
            </View>

            <View style={s.dailyProgressRow}>
              <View style={s.dailyProgressBarBg}>
                <View style={[s.dailyProgressBarFill, { width: '67%' }]} />
              </View>
              <Text style={s.dailyProgressText}>67% solved today</Text>
            </View>
            
            <View style={s.solveBtn}>
              <Text style={s.solveBtnText}>SOLVE TODAY →</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <Text style={s.sectionLabel}>YOUR PROGRESS</Text>
      
      {/* 3. STATS ROW */}
      <View style={s.statsStatRow}>
        <View style={s.statsCard}>
          <Text style={[s.statsValLarge, { color: '#16a34a' }]}>{userProfile?.easy_solved || 0}</Text>
          <Text style={s.statsLabelSmall}>EASY</Text>
          <View style={s.miniProgressRow}>
            <Text style={s.miniProgressText}>{userProfile?.easy_solved || 0}/20</Text>
            <View style={s.miniProgressBarBg}>
              <View style={[s.miniProgressBarFill, { backgroundColor: '#16a34a', width: `${((userProfile?.easy_solved || 0)/20)*100}%` }]} />
            </View>
          </View>
        </View>
        <View style={s.statsCard}>
          <Text style={[s.statsValLarge, { color: '#ca8a04' }]}>{userProfile?.medium_solved || 0}</Text>
          <Text style={s.statsLabelSmall}>MEDIUM</Text>
          <View style={s.miniProgressRow}>
            <Text style={s.miniProgressText}>{userProfile?.medium_solved || 0}/20</Text>
            <View style={s.miniProgressBarBg}>
              <View style={[s.miniProgressBarFill, { backgroundColor: '#ca8a04', width: `${((userProfile?.medium_solved || 0)/20)*100}%` }]} />
            </View>
          </View>
        </View>
        <View style={s.statsCard}>
          <Text style={[s.statsValLarge, { color: '#dc2626' }]}>{userProfile?.hard_solved || 0}</Text>
          <Text style={s.statsLabelSmall}>HARD</Text>
          <View style={s.miniProgressRow}>
            <Text style={s.miniProgressText}>{userProfile?.hard_solved || 0}/10</Text>
            <View style={s.miniProgressBarBg}>
              <View style={[s.miniProgressBarFill, { backgroundColor: '#dc2626', width: `${((userProfile?.hard_solved || 0)/10)*100}%` }]} />
            </View>
          </View>
        </View>
      </View>

      <Text style={[s.sectionLabel, { marginTop: 24 }]}>QUICK ACCESS</Text>

      {/* 4. MEMOS & TRACKS CARDS */}
      <View style={s.quickActions}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/(stack)/daily-memos')} activeOpacity={0.8}>
          <LinearGradient
            colors={isDark ? ['#1a0a2e', '#0a0a0a'] : ['#f5f3ff', '#ede9fe']}
            style={[s.quickActionCard, { borderColor: '#7c3aed30' }]}
          >
            <View style={[s.quickActionIconBox, { backgroundColor: '#7c3aed20' }]}>
              <Text style={{ fontSize: 20 }}>🧠</Text>
            </View>
            <Text style={s.quickActionTitle}>Daily Memos</Text>
            <Text style={s.quickActionSub}>3/10 Today</Text>
            <View style={s.quickActionProgressBg}>
              <View style={[s.quickActionProgressFill, { backgroundColor: '#7c3aed', width: '30%' }]} />
              <Text style={s.quickActionProgressText}>30%</Text>
            </View>
            <Text style={[s.quickActionLink, { color: '#7c3aed' }]}>Start →</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/(stack)/company-tracks')} activeOpacity={0.8}>
          <LinearGradient
            colors={isDark ? ['#0a1a0a', '#0a0a0a'] : ['#f0fdf4', '#dcfce7']}
            style={[s.quickActionCard, { borderColor: '#16a34a30' }]}
          >
            <View style={[s.quickActionIconBox, { backgroundColor: '#16a34a20' }]}>
              <Text style={{ fontSize: 20 }}>🏢</Text>
            </View>
            <Text style={s.quickActionTitle}>Company Tracks</Text>
            <Text style={s.quickActionSub}>TCS · Infosys</Text>
            <Text style={[s.quickActionSub, { marginBottom: 12 }]}>Wipro +2 more</Text>
            <View style={{ flex: 1 }} />
            <Text style={[s.quickActionLink, { color: '#16a34a' }]}>Browse →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </View>
  );

  const renderFilters = () => (
    <View style={s.filterWrapper}>
      <Text style={s.sectionLabel}>PROBLEM SET</Text>
      {/* 5. FILTER PILLS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow} style={{ marginBottom: 12 }}>
        {['All', 'Easy', 'Medium', 'Hard'].map((f) => (
          <TouchableOpacity 
            key={f} 
            style={[s.filterPill, filter === f && s.filterPillActive]}
            onPress={() => setFilter(f as any)}
            activeOpacity={0.7}
          >
            <Text style={[s.filterPillText, filter === f && s.filterPillTextActive]}>
              {f === 'All' ? '● ' : ''}{f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {[
          { id: 'coding', label: '</> Coding' },
          { id: 'mcq', label: '? MCQ' },
          { id: 'bug_fix', label: '🐛 Bug Fix' },
          { id: 'output_predict', label: '▷ Output' }
        ].map((t) => (
          <TouchableOpacity 
            key={t.id} 
            style={[s.filterPill, typeFilter === t.id && s.filterPillActive]}
            onPress={() => setTypeFilter(typeFilter === t.id ? null : t.id)}
            activeOpacity={0.7}
          >
            <Text style={[s.filterPillText, typeFilter === t.id && s.filterPillTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderList = () => (
    <View style={s.listWrapper}>
      {/* 6. PROBLEM LIST CARDS */}
      {filteredProblems.map((p, index) => (
        <TouchableOpacity 
          key={p.id} 
          style={[
            s.problemCard,
            index === 0 && { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
            index === filteredProblems.length - 1 && { borderBottomWidth: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }
          ]}
          onPress={() => router.push({ pathname: '/(stack)/problem-solver', params: { id: p.id } } as any)}
          activeOpacity={0.7}
        >
          <View style={[
            s.statusIconBox,
            p.status === 'solved' ? s.statusIconBoxSolved : 
            p.status === 'attempted' ? s.statusIconBoxAttempted : 
            s.statusIconBoxLocked
          ]}>
            {p.status === 'solved' ? <Feather name="check" size={18} color="#16a34a" /> :
             p.status === 'attempted' ? <Feather name="refresh-cw" size={16} color="#ca8a04" /> :
             <Feather name="lock" size={16} color={isDark ? '#6b7280' : '#94a3b8'} />}
          </View>
          
          <View style={s.problemInfo}>
            <View style={s.problemTitleRow}>
              <Text style={s.problemTitle} numberOfLines={1}>{p.title}</Text>
            </View>
            <View style={s.problemMetaRow}>
              <Text style={[s.inlineDifficulty, { color: getDifficultyColor(p.difficulty) }]}>{p.difficulty}</Text>
              {p.companies?.slice(0, 2).map((c, ci) => (
                <View key={ci} style={s.tinyCompanyPill}><Text style={s.tinyCompanyPillText}>{c}</Text></View>
              ))}
              {p.companies && p.companies.length > 2 && (
                <View style={s.tinyCompanyPill}><Text style={s.tinyCompanyPillText}>+{p.companies.length - 2}</Text></View>
              )}
            </View>
            <View style={s.problemBottomInfo}>
              <Text style={s.bottomInfoText}>⏱ ~15 min</Text>
              <Text style={s.bottomInfoDot}>·</Text>
              <Text style={s.bottomInfoSolved}>234 solved</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
      {filteredProblems.length === 0 && (
        <View style={s.emptyState}>
          <Text style={s.emptyText}>No problems matching filters</Text>
        </View>
      )}
    </View>
  );

  return (
    <DesktopLayout scrollable={false}>
      <SafeAreaView style={s.container} edges={['top']}>
        {isDesktop ? (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={s.desktopLayoutContainer}>
              {renderDailyAndStats()}
              <View style={s.desktopListColumn}>
                {isDesktop && (
                  <View style={s.desktopHeader}>
                    <Text style={s.headerTitle}>Problems</Text>
                    <View style={s.xpBadge}>
                      <Text style={s.xpText}>⚡ {userProfile?.xp || 0} XP</Text>
                    </View>
                  </View>
                )}
                {renderFilters()}
                {renderList()}
              </View>
            </View>
          </ScrollView>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={s.content}
            stickyHeaderIndices={[1]} 
          >
            {renderDailyAndStats()}
            {renderFilters()}
            {renderList()}
          </ScrollView>
        )}
      </SafeAreaView>
    </DesktopLayout>
  );
}

const getStyles = (theme: any, isDark: boolean) => {
  const bg = isDark ? '#0a0a0a' : '#f0f2f5';
  const bgCard = isDark ? '#111111' : '#ffffff';
  const border = isDark ? '#1f2937' : '#e2e8f0';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? '#9ca3af' : '#475569';
  const textMuted = isDark ? '#6b7280' : '#94a3b8';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    content: { padding: 20, paddingBottom: 100 },
    
    desktopLayoutContainer: {
      flex: 1, flexDirection: 'row', gap: 32, padding: 32, maxWidth: 1400, alignSelf: 'center', width: '100%',
    },
    desktopSidebar: { width: 340, paddingBottom: 24 },
    desktopListColumn: { flex: 1 },
    desktopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },

    // SECTION LABELS
    sectionLabel: { color: textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 12, marginTop: 8 },

    // HEADER REDESIGN
    header: { marginBottom: 24 },
    headerSubtitle: { color: '#1d4ed8', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4, textTransform: 'uppercase' },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerTitle: { color: textPrimary, fontSize: 28, fontWeight: '900' },
    xpBadge: { backgroundColor: '#1d4ed8', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
    xpText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
    headerProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    headerProgressBarBg: { flex: 1, height: 6, backgroundColor: border, borderRadius: 3, overflow: 'hidden' },
    headerProgressBarFill: { height: '100%', backgroundColor: '#1d4ed8', borderRadius: 3 },
    headerProgressText: { color: textSecondary, fontSize: 12, fontWeight: '600' },
    streakText: { color: '#f97316', fontSize: 13, fontWeight: '700' },

    // DAILY CHALLENGE
    dailyCard: { borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#1d4ed830', position: 'relative', overflow: 'hidden' },
    dailyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    dailyHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
    dailyLabel: { color: '#f97316', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
    dailyCountdown: { color: '#f97316', fontSize: 12, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    dailyTitle: { color: textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 16 },
    dailyMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 },
    diffPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    diffPillText: { fontSize: 12, fontWeight: '800' },
    subtlePill: { backgroundColor: isDark ? '#1f2937' : '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: border },
    subtlePillText: { fontSize: 11, fontWeight: '600', color: textSecondary },
    dailyProgressRow: { marginBottom: 20 },
    dailyProgressBarBg: { height: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
    dailyProgressBarFill: { height: '100%', backgroundColor: '#1d4ed8', borderRadius: 3 },
    dailyProgressText: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },
    solveBtn: { backgroundColor: '#1d4ed8', borderRadius: 10, height: 48, justifyContent: 'center', alignItems: 'center', shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 6 },
    solveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

    // STATS ROW
    statsStatRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    statsCard: { flex: 1, backgroundColor: bgCard, padding: 14, borderRadius: 14, position: 'relative', overflow: 'hidden' },
    statsValLarge: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
    statsLabelSmall: { color: textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12 },
    miniProgressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    miniProgressText: { color: textMuted, fontSize: 10, fontWeight: '700', marginRight: 6 },
    miniProgressBarBg: { flex: 1, height: 4, backgroundColor: border, borderRadius: 2, overflow: 'hidden' },
    miniProgressBarFill: { height: '100%', borderRadius: 2 },

    // MEMOS & TRACKS CARDS
    quickActions: { flexDirection: 'row', gap: 12 },
    quickActionCard: { height: 140, borderRadius: 16, padding: 16, borderWidth: 1 },
    quickActionIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    quickActionTitle: { color: textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 4 },
    quickActionSub: { color: textSecondary, fontSize: 12, fontWeight: '600' },
    quickActionProgressBg: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 8 },
    quickActionProgressFill: { height: 4, borderRadius: 2 },
    quickActionProgressText: { color: textMuted, fontSize: 10, fontWeight: '700' },
    quickActionLink: { fontSize: 13, fontWeight: '800' },

    // FILTER PILLS
    filterWrapper: { backgroundColor: bg, paddingBottom: 16, paddingTop: 16, zIndex: 10 },
    filterRow: { gap: 10, paddingRight: 20 },
    filterPill: { backgroundColor: bgCard, borderWidth: 1, borderColor: border, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    filterPillActive: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
    filterPillText: { color: textSecondary, fontSize: 13, fontWeight: '700' },
    filterPillTextActive: { color: '#ffffff' },

    // PROBLEM LIST
    listWrapper: { backgroundColor: 'transparent', borderRadius: 16, overflow: 'hidden' },
    problemCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: isDark ? '#111111' : '#ffffff', borderBottomWidth: 1, borderBottomColor: isDark ? '#1a1a1a' : '#f1f5f9', gap: 16 },
    statusIconBox: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    statusIconBoxSolved: { backgroundColor: isDark ? '#052e16' : '#dcfce7', borderColor: '#16a34a' },
    statusIconBoxAttempted: { backgroundColor: isDark ? '#1c1500' : '#fef9c3', borderColor: '#ca8a04' },
    statusIconBoxLocked: { backgroundColor: bgCard, borderColor: border },
    
    problemInfo: { flex: 1 },
    problemTitleRow: { marginBottom: 6 },
    problemTitle: { color: textPrimary, fontSize: 16, fontWeight: '700' },
    problemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    inlineDifficulty: { fontSize: 13, fontWeight: '800' },
    tinyCompanyPill: { backgroundColor: isDark ? '#1f2937' : '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: border },
    tinyCompanyPillText: { color: textSecondary, fontSize: 11, fontWeight: '600' },
    
    problemBottomInfo: { flexDirection: 'row', alignItems: 'center' },
    bottomInfoText: { color: textMuted, fontSize: 11, fontWeight: '600' },
    bottomInfoDot: { color: textMuted, fontSize: 11, marginHorizontal: 6 },
    bottomInfoSolved: { color: '#16a34a', fontSize: 11, fontWeight: '700' },
    
    emptyState: { alignItems: 'center', paddingVertical: 80, backgroundColor: bgCard, borderRadius: 16, marginTop: 12 },
    emptyText: { color: textMuted, fontSize: 15, fontWeight: '600' }
  });
};
