import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, 
  Dimensions, Animated, Easing, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function DailyMemosScreen() {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const { userId, userProfile } = useUserStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data } = await supabase
        .from('problems')
        .select('*')
        .eq('type', 'mcq')
        .limit(10);
      
      if (data) setQuestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentQ = questions[currentIndex];

  const handleAnswer = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    
    if (currentQ.mcq_options[idx].correct) {
      setScore(s => s + 1);
      updateXP(5); // 5 XP per correct MCQ
    }
  };

  const updateXP = async (amount: number) => {
    if (!userId) return;
    try {
      const currentXP = userProfile?.xp || 0;
      await supabase.from('profiles').update({ xp: currentXP + amount }).eq('id', userId);
    } catch (e) {}
  };

  const nextQuestion = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad)
    }).start(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        fadeAnim.setValue(1);
      } else {
        // Finished
        setIsAnswered(true); // Final state
      }
    });
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={theme.purple} />
    </View>
  );

  if (currentIndex >= questions.length || (isAnswered && currentIndex === questions.length - 1 && selectedOption !== null && !fadeAnim.hasListeners)) {
    // Show results if finished
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="x" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerTitleBox}>
          <Text style={s.headerTitle}>DAILY MEMOS</Text>
          <Text style={s.headerSub}>{currentIndex + 1}/{questions.length} TODAY</Text>
        </View>
        <View style={s.scoreBadge}>
          <Text style={s.scoreText}>🏆 {score}</Text>
        </View>
      </View>

      <Animated.View style={[s.content, { opacity: fadeAnim }]}>
        {currentQ ? (
          <View style={s.card}>
            <Text style={s.questionText}>{currentQ.description}</Text>
            
            <View style={s.optionsContainer}>
              {currentQ.mcq_options.map((opt: any, idx: number) => {
                const isSelected = selectedOption === idx;
                const isCorrect = opt.correct;
                const showSuccess = isAnswered && isCorrect;
                const showFailure = isAnswered && isSelected && !isCorrect;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      s.optionBox,
                      isSelected && s.optionBoxSelected,
                      showSuccess && s.optionBoxCorrect,
                      showFailure && s.optionBoxWrong
                    ]}
                    onPress={() => handleAnswer(idx)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      s.optionText,
                      (showSuccess || showFailure || isSelected) && s.optionTextActive
                    ]}>{opt.text}</Text>
                    {showSuccess && <Feather name="check" size={18} color={isDark ? '#000' : '#FFF'} />}
                    {showFailure && <Feather name="x" size={18} color="#FFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {isAnswered && (
              <Animated.View style={s.explanationBox}>
                <Text style={s.explanationTitle}>
                  {currentQ.mcq_options[selectedOption!].correct ? '✅ CORRECT!' : '❌ INCORRECT'}
                </Text>
                <Text style={s.explanationText}>{currentQ.explanation}</Text>
                
                <TouchableOpacity style={s.nextBtn} onPress={nextQuestion}>
                  <Text style={s.nextBtnText}>NEXT QUESTION →</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        ) : (
          <View style={s.emptyState}>
            <MaterialCommunityIcons name="check-circle" size={80} color={theme.green} />
            <Text style={s.emptyTitle}>ALL MEMOS COMPLETE!</Text>
            <Text style={s.emptySub}>You've earned +{score * 5} XP today.</Text>
            <TouchableOpacity style={s.returnBtn} onPress={() => router.back()}>
              <Text style={s.returnBtnText}>Back to Challenges</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
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
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: border, paddingTop: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
    headerTitleBox: { flex: 1, alignItems: 'center' },
    headerTitle: { color: textPrimary, fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
    headerSub: { color: theme.purple, fontSize: 10, fontWeight: '800', marginTop: 2 },
    scoreBadge: { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    scoreText: { color: textPrimary, fontSize: 12, fontWeight: '800' },

    content: { flex: 1, padding: 20, justifyContent: 'center' },
    card: { 
      backgroundColor: bgCard, 
      borderRadius: 30, 
      padding: 30, 
      borderWidth: 1, 
      borderColor: border,
      minHeight: 450,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 20,
      elevation: 10
    },
    questionText: { color: textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 40, lineHeight: 30 },
    
    optionsContainer: { gap: 12 },
    optionBox: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: 18, 
      borderRadius: 20, 
      backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', 
      borderWidth: 1, 
      borderColor: border 
    },
    optionBoxSelected: { borderColor: theme.purple, backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.05)' },
    optionBoxCorrect: { backgroundColor: theme.green, borderColor: theme.green },
    optionBoxWrong: { backgroundColor: theme.red, borderColor: theme.red },
    optionText: { color: textSecondary, fontSize: 16, fontWeight: '700' },
    optionTextActive: { color: '#ffffff' },

    explanationBox: { marginTop: 30, padding: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 20, borderWidth: 1, borderColor: border },
    explanationTitle: { color: textPrimary, fontSize: 14, fontWeight: '900', marginBottom: 8 },
    explanationText: { color: textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 20 },
    nextBtn: { backgroundColor: theme.purple, paddingVertical: 14, borderRadius: 15, alignItems: 'center' },
    nextBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },

    emptyState: { alignItems: 'center' },
    emptyTitle: { color: textPrimary, fontSize: 24, fontWeight: '900', marginTop: 24 },
    emptySub: { color: textSecondary, fontSize: 16, marginTop: 8, marginBottom: 40 },
    returnBtn: { backgroundColor: theme.purple, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
    returnBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' }
  });
};
