import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, 
  ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/lib/supabase';
import { runTestCases, submitSolution } from '@/services/challengeController';
import { useResponsive } from '@/hooks/useResponsive';
import { DesktopLayout } from '@/components/ui/DesktopLayout';
import { LoadingScreen } from '@/components/ui/UI';

const unescape = (str: string) => (str || '').replace(/\\n/g, '\n');

type TabType = 'Problem' | 'Solution' | 'Discuss';

export default function ProblemSolverScreen() {
  const { id } = useLocalSearchParams();
  const { theme, isDark } = useTheme();
  const { isDesktop } = useResponsive();
  const s = React.useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);
  const { userProfile, userId } = useUserStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('Problem');
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    loadProblem();
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [id]);

  const loadProblem = async () => {
    try {
      const { data, error } = await supabase
        .from('problems')
        .select('*, user_problems(status)')
        .eq('id', id)
        .single();
      
      if (data) {
        setProblem(data);
        const starter = data.starter_code?.[language] || '';
        setCode(starter);
        // Unlock if user has solved or attempted this problem before
        const status = data.user_problems?.[0]?.status;
        if (status === 'solved' || status === 'attempted') {
          setIsUnlocked(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleRun = async () => {
    if (!code.trim() || executing) return;
    setExecuting(true);
    setResults(null);
    try {
      const testResults = await runTestCases(code, language, problem);
      setResults(testResults);
    } catch (error) {
      Alert.alert('Execution Error', 'Failed to run code. Check your connection.');
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmit = async () => {
    if (!userId || !results || executing) return;
    setExecuting(true);
    try {
      const res = await submitSolution(userId, problem, code, language, results);
      if (res.success) {
        setIsUnlocked(true);
        if (res.allPassed) {
          Alert.alert('Success!', `Congratulations! You've solved this challenge. +${problem.difficulty === 'Easy' ? 10 : 25} XP`, [
            { text: 'Return', onPress: () => router.back() }
          ]);
        } else {
          Alert.alert('Failed', 'Some test cases did not pass. Try again!');
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to submit solution.');
    } finally {
      setExecuting(false);
    }
  };

  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    if (!loading && problem) {
      const timer = setTimeout(() => setShowSkeleton(false), 500);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
    }
  }, [loading, problem]);

  if (showSkeleton) return <LoadingScreen type="problem" />;


  const renderLeftPanel = () => (
    <View style={isDesktop ? s.desktopLeftPanel : { flex: 1 }}>
      {/* Tabs */}
      <View style={s.tabs}>
        {(['Problem', 'Solution', 'Discuss'] as TabType[]).map(t => (
          <TouchableOpacity 
            key={t} 
            onPress={() => setActiveTab(t)}
            style={[s.tab, activeTab === t && s.activeTab]}
          >
            <Text style={[s.tabText, activeTab === t && s.activeTabText]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'Problem' ? (
          <View style={s.problemContainer}>
            <Text style={s.description}>{unescape(problem.description)}</Text>
            
            {results && (
              <View style={s.resultsSection}>
                <Text style={s.resultsHeader}>Test Case Results:</Text>
                {results.map((res, i) => (
                  <View key={i} style={s.resultItem}>
                    <View style={s.resultTitleRow}>
                      <Feather 
                        name={res.passed ? "check-circle" : "x-circle"} 
                        size={16} 
                        color={res.passed ? theme.green : theme.red} 
                      />
                      <Text style={s.resultText}>Case {i + 1}: {res.passed ? 'PASSED' : 'FAILED'}</Text>
                    </View>
                    {!res.passed && (
                      <Text style={s.resultDetail}>Expected: {unescape(res.expected)}, Got: {unescape(res.got)}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : isUnlocked ? (
          <View style={s.solutionContainer}>
            {activeTab === 'Solution' ? (
              <>
                <Text style={s.sectionHeader}>EXPLANATION</Text>
                <Text style={s.explanationText}>{unescape(problem.explanation) || 'No explanation available for this problem yet.'}</Text>
                
                {problem.solution?.[language] && (
                  <>
                    <Text style={[s.sectionHeader, { marginTop: 32 }]}>OPTIMAL SOLUTION ({language.toUpperCase()})</Text>
                    <View style={s.solutionCodeBox}>
                      <Text style={s.solutionCodeText}>{problem.solution[language]}</Text>
                    </View>
                  </>
                )}
              </>
            ) : (
              <View style={s.discussPlaceholder}>
                <Feather name="message-square" size={48} color={theme.border} />
                <Text style={s.discussTitle}>COMMUNITY DISCUSSION</Text>
                <Text style={s.discussSubtitle}>The discussion forum is being initialized. Check back soon!</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={s.emptyTab}>
            <MaterialCommunityIcons name="lock-outline" size={48} color={theme.border} />
            <Text style={s.emptyTabText}>Submit your first attempt to unlock {activeTab.toLowerCase()}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderRightPanel = () => (
    <View style={isDesktop ? s.desktopRightPanel : { flex: 1 }}>
      <View style={s.editorWrapper}>
        {/* Language Selector */}
        <View style={s.langHeader}>
          <View style={s.langSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {['python', 'javascript', 'java', 'cpp'].map(l => (
                <TouchableOpacity 
                  key={l}
                  onPress={() => {
                    setLanguage(l);
                    setCode(problem.starter_code?.[l] || '');
                  }}
                  style={[s.langBtn, language === l && s.langBtnActive]}
                >
                  <Text style={[s.langBtnText, language === l && s.langBtnTextActive]}>{l.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Code Editor */}
        <TextInput
          style={s.editor}
          multiline
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          placeholder="Write your solution here..."
          placeholderTextColor={theme.textMuted}
        />
      </View>

      {/* Footer / Actions */}
      <View style={s.footer}>
        <TouchableOpacity 
          style={[s.runBtn, executing && s.btnDisabled]} 
          onPress={handleRun}
          disabled={executing}
        >
          {executing ? <ActivityIndicator size="small" color={theme.purple} /> : <Text style={s.runBtnText}>Run Code</Text>}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.submitBtn, (!results || executing) && s.btnDisabled]} 
          onPress={handleSubmit}
          disabled={!results || executing}
        >
          <Text style={s.submitBtnText}>Submit ✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <DesktopLayout>
      <SafeAreaView style={s.container} edges={['top', 'bottom']}>
        {/* Header (Branded for both) */}
        <LinearGradient
          colors={isDark ? ['#111111', '#0a0a0a'] : ['#ffffff', '#f8fafc']}
          style={s.header}
        >
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={s.headerInfo}>
            <Text style={s.title}>{problem.title}</Text>
            <View style={s.headerMeta}>
              <View style={[s.diffLabel, { backgroundColor: problem.difficulty === 'Easy' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)' }]}>
                <Text style={[s.difficulty, { color: problem.difficulty === 'Easy' ? theme.green : theme.amber }]}>
                  {problem.difficulty}
                </Text>
              </View>
              <Text style={s.timer}>⏱ {formatTime(timer)}</Text>
            </View>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          {isDesktop ? (
            <View style={s.desktopLayout}>
              {renderLeftPanel()}
              {renderRightPanel()}
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {activeTab === 'Problem' && renderLeftPanel()}
              {activeTab !== 'Problem' && renderLeftPanel()}
              {/* Note: In mobile, we actually show one or the other but the current logic is a bit more complex. 
                  Let's stick to a simpler mobile fallback for now. */}
              {activeTab === 'Problem' && renderRightPanel()}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </DesktopLayout>
  );
}

const getStyles = (theme: any, isDark: boolean, isDesktop?: boolean) => {
  const bg = isDark ? '#0a0a0a' : '#f0f2f5';
  const bgCard = isDark ? '#111111' : '#ffffff';
  const border = isDark ? '#1f2937' : '#e2e8f0';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? '#9ca3af' : '#475569';
  const textMuted = isDark ? '#6b7280' : '#94a3b8';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: border, height: isDesktop ? 70 : 80 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', marginRight: 12 },
    headerInfo: { flex: 1 },
    title: { color: textPrimary, fontSize: 18, fontWeight: '800' },
    headerMeta: { flexDirection: 'row', gap: 12, marginTop: 4, alignItems: 'center' },
    diffLabel: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    difficulty: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    timer: { color: textMuted, fontSize: 12, fontWeight: '700' },
    
    // Desktop Split Layout
    desktopLayout: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: bg,
    },
    desktopLeftPanel: {
      width: '40%',
      borderRightWidth: 1,
      borderRightColor: border,
    },
    desktopRightPanel: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#ffffff',
    },

    tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: border, backgroundColor: bgCard },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: theme.purple },
    tabText: { color: textSecondary, fontSize: 13, fontWeight: '700' },
    activeTabText: { color: theme.purple },

    content: { flex: 1 },
    problemContainer: { padding: 24 },
    description: { color: textPrimary, fontSize: 15, lineHeight: 26, marginBottom: 24 },
    
    editorWrapper: {
      flex: 1,
    },
    langHeader: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: border,
      backgroundColor: bgCard,
    },
    langSelector: { flexDirection: 'row', alignItems: 'center' },
    langBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: border },
    langBtnActive: { backgroundColor: theme.purple, borderColor: theme.purple },
    langBtnText: { color: textSecondary, fontSize: 12, fontWeight: '700' },
    langBtnTextActive: { color: '#ffffff' },

    editor: { 
      flex: 1,
      color: isDark ? '#4ade80' : '#0f172a', 
      fontFamily: Platform.OS === 'web' ? 'JetBrains Mono, Fira Code, monospace' : (Platform.OS === 'ios' ? 'Courier' : 'monospace'),
      fontSize: 16,
      lineHeight: 24,
      padding: 24,
      textAlignVertical: 'top',
    },

    resultsSection: { marginTop: 24, padding: 20, backgroundColor: bgCard, borderRadius: 16, borderWidth: 1, borderColor: border },
    resultsHeader: { color: textPrimary, fontSize: 13, fontWeight: '900', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
    resultItem: { marginBottom: 16, gap: 8 },
    resultTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    resultText: { color: textPrimary, fontSize: 14, fontWeight: '700' },
    resultDetail: { color: textMuted, fontSize: 12, marginLeft: 26, padding: 12, backgroundColor: isDark ? '#000' : '#f8fafc', borderRadius: 8, fontFamily: 'monospace' },

    footer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: border, backgroundColor: bgCard, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
    runBtn: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: theme.purple, alignItems: 'center', justifyContent: 'center' },
    runBtnText: { color: theme.purple, fontSize: 15, fontWeight: '800' },
    submitBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: theme.purple, alignItems: 'center', justifyContent: 'center' },
    submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
    btnDisabled: { opacity: 0.5 },

    emptyTab: { padding: 100, alignItems: 'center' },
    emptyTabText: { color: textMuted, marginTop: 16, fontWeight: '700', fontSize: 14, textAlign: 'center' },

    solutionContainer: { padding: 32 },
    sectionHeader: { color: theme.purple, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 16, textTransform: 'uppercase' },
    explanationText: { color: textPrimary, fontSize: 15, lineHeight: 26 },
    solutionCodeBox: { backgroundColor: isDark ? '#000' : '#f8fafc', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: border, marginTop: 12 },
    solutionCodeText: { color: isDark ? '#4ade80' : '#475569', fontFamily: 'monospace', fontSize: 13, lineHeight: 22 },
    
    discussPlaceholder: { padding: 80, alignItems: 'center' },
    discussTitle: { color: textPrimary, fontSize: 14, fontWeight: '900', marginTop: 24, letterSpacing: 1 },
    discussSubtitle: { color: textMuted, fontSize: 13, textAlign: 'center', marginTop: 16, lineHeight: 22 }
  });
};
