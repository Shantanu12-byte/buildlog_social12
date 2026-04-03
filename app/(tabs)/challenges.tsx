import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Animated, Easing, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/context/ThemeContext';
import { COURSE_DATA } from '@/constants/courseData';
import AnimatedProgressBar from '@/components/AnimatedProgressBar';
import QuizOption from '@/components/QuizOption';
import TutorModal from '@/components/TutorModal';
import { getTutoringFeedback } from '@/services/TutorController';
import { manageLanguageProgress } from '@/services/AsyncProgressManager';

export default function ChallengesScreen() {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const { userProfile } = useUserStore();
  const [loading, setLoading] = useState(true);
  
  // Onboarding State
  const [learningFocus, setLearningFocus] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<string | null>(null);

  // Challenge Engine State
  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [isRoundFinished, setIsRoundFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Validation State
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // Animation
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<LottieView>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Constants
  const TOPICS = ['HTML', 'CSS', 'Python', 'React', 'Java', 'DSA', 'Web3'];
  const COURSE_THEMES: Record<string, string> = {
    HTML: '#E34F26', CSS: '#1572B6', Python: '#FFD43B',
    React: '#61DAFB', Java: '#f89820', DSA: '#FF2A2A', Web3: '#5D3FD3'
  };
  const TOPIC_ICONS: Record<string, string> = {
    HTML: 'code', CSS: 'feather', Python: 'terminal',
    React: 'layers', Java: 'coffee', DSA: 'share-2', Web3: 'link'
  };
  const LEVELS = ['Beginner', 'Pro', 'Expert'];
  
  // Dashboard & Quiz Animations
  const dashboardAnims = useRef(TOPICS.map(() => new Animated.Value(0))).current;
  const optionRefs = useRef<any[]>([]);

  useEffect(() => {
    if (!learningFocus || !skillLevel) {
      dashboardAnims.forEach(anim => anim.setValue(0));
      Animated.stagger(100, dashboardAnims.map(anim => Animated.timing(anim, {
        toValue: 1, duration: 600, easing: Easing.out(Easing.exp), useNativeDriver: true
      }))).start();
    }
  }, [learningFocus, skillLevel, dashboardAnims]);
  
  // Progress State
  const [learningStats, setLearningStats] = useState<Record<string, number>>({});
  
  // Tutor State
  const [showTutor, setShowTutor] = useState(false);
  const [tutorText, setTutorText] = useState('');
  const [tutorSnippet, setTutorSnippet] = useState<string | null>(null);

  // Audio Players
  const successPlayer = useAudioPlayer('https://www.myinstants.com/media/sounds/level-up-191997.mp3');
  const victoryPlayer = useAudioPlayer('https://www.myinstants.com/media/sounds/victory-royal_1.mp3');

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter(k => k.startsWith('progress_'));
      const values = await AsyncStorage.multiGet(progressKeys);
      
      const stats: Record<string, number> = {};
      values.forEach(([key, val]) => {
        const cleanKey = key.replace('progress_', '');
        stats[cleanKey] = val ? parseInt(val, 10) : 0;
      });
      setLearningStats(stats);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const isLevelLocked = (topic: string, level: string) => {
    if (level === 'Beginner') return false;
    if (level === 'Pro') return (learningStats[`${topic}_Beginner`] || 0) < 100;
    if (level === 'Expert') return (learningStats[`${topic}_Pro`] || 0) < 100;
    return true;
  };

  const startRound = (topic: string, level: string) => {
    const questions = (COURSE_DATA as any)[topic]?.[level];
    
    if (!questions) {
      Alert.alert('Quest Unavailable', `We are still compiling the ${topic} ${level} challenges.`);
      return;
    }

    setLearningFocus(topic);
    setSkillLevel(level);
    setSessionQuestions(questions.slice(0, 5));
    setQuestionIndex(0);
    setRoundScore(0);
    setIsRoundFinished(false);
    setIsAnswered(false);
    setIsCorrect(null);
    setSelectedOption(null);
  };

  const submitAnswer = async (optIdx: number) => {
    if (isAnswered) return;
    
    const correctIdx = sessionQuestions[questionIndex].answer;
    const correct = optIdx === correctIdx;
    
    if (correct) {
      optionRefs.current[optIdx]?.playCorrectAnimation();
      successPlayer.play();
    } else {
      optionRefs.current[optIdx]?.playIncorrectAnimation();
      optionRefs.current[correctIdx]?.playCorrectAnimation();
      
      const feedback = getTutoringFeedback(`${learningFocus}_${skillLevel}`, sessionQuestions[questionIndex].id, optIdx);
      if (feedback) {
        setTutorText(feedback.feedback);
        setTutorSnippet(feedback.codeSnippet || null);
        setTimeout(() => setShowTutor(true), 600);
      }
    }

    setIsAnswered(true);
    setIsCorrect(correct);
    if (correct) setRoundScore(s => s + 1);
  };

  const handleNext = async () => {
    if (questionIndex < 4) {
      setQuestionIndex(i => i + 1);
      setIsAnswered(false);
      setIsCorrect(null);
      setSelectedOption(null);
    } else {
      setIsRoundFinished(true);
      const totalCorrect = roundScore; 
      const percent = Math.round((totalCorrect / 5) * 100);
      
      if (totalCorrect === 5) {
        victoryPlayer.play();
      }

      if (userProfile?.id) {
        await manageLanguageProgress(userProfile.id, learningFocus!, skillLevel!, percent);
      }
      
      await loadProgress();
    }
  };

  useEffect(() => {
    if (isRoundFinished && roundScore === 5) {
      triggerConfetti();
    }
  }, [isRoundFinished, roundScore]);

  const triggerConfetti = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 250, easing: Easing.bounce, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();

    setShowConfetti(true);
    setTimeout(() => {
        animationRef.current?.play();
    }, 50);
  };

  if (loading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={theme.purple} />
        <Text style={styles.loadingText}>Loading Quests...</Text>
      </View>
    );
  }

  // 1. Course Selection Dashboard
  if (!learningFocus || !skillLevel) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.dashboardContainer}>
          <Text style={styles.headerTitle}>DARE TO CHALLENGE</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {TOPICS.map((topic, index) => {
              const bgBeg = learningStats[`${topic}_Beginner`] || 0;
              const bgPro = learningStats[`${topic}_Pro`] || 0;
              const bgExp = learningStats[`${topic}_Expert`] || 0;
              const overall = Math.round((bgBeg + bgPro + bgExp) / 3);
              const color = COURSE_THEMES[topic];
              
              const translateY = dashboardAnims[index].interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              });

              return (
                <Animated.View 
                  key={topic} 
                  style={[styles.materialCard, { opacity: dashboardAnims[index], transform: [{ translateY }] }]}
                >
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    style={styles.cardHeader}
                    onPress={() => startRound(topic, 'Beginner')}
                  >
                    <View style={[styles.iconBox, { backgroundColor: isDark ? `${color}20` : `${color}10` }]}>
                      <FontAwesome5 name={(TOPIC_ICONS as any)[topic]} size={20} color={color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={styles.cardTopicTitle}>{topic}</Text>
                      <Text style={styles.cardTopicSub}>{overall}% XP Earned</Text>
                    </View>
                    <View style={[styles.overallRing, { borderColor: theme.border }]}>
                      <Text style={[styles.overallText, { color }]}>{overall}%</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.pillRow}>
                    {LEVELS.map(level => {
                      const locked = isLevelLocked(topic, level);
                      const isLevelActive = learningStats[`${topic}_${level}`] === 100;
                      
                      return (
                        <TouchableOpacity
                          key={level}
                          activeOpacity={locked ? 1 : 0.6}
                          style={[
                            styles.pillBtn,
                            locked && styles.pillBtnLocked
                          ]}
                          onPress={() => !locked && startRound(topic, level)}
                        >
                          {locked && <Feather name="lock" size={10} color={theme.textMuted} style={{ marginRight: 4 }} />}
                          <Text style={[styles.pillText, locked && styles.pillTextLocked, isLevelActive && { color: theme.green }]}>
                            {level}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Animated.View>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Round Completion
  if (isRoundFinished) {
    return (
      <SafeAreaView style={styles.center}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Feather name={roundScore === 5 ? "zap" : "award"} size={80} color={roundScore === 5 ? theme.purple : theme.textMuted} />
        </Animated.View>
        <Text style={[styles.title, { marginTop: Spacing.xl }]}>
          {roundScore === 5 ? "CHALLENGE CONQUERED!" : "QUEST COMPLETE"}
        </Text>
        <Text style={styles.subtitle}>You scored {roundScore}/5 in {learningFocus} {skillLevel}.</Text>
        
        <TouchableOpacity 
          style={styles.nextBtnCorrect} 
          onPress={() => { setLearningFocus(null); setSkillLevel(null); }}
        >
          <Text style={styles.submitBtnText}>RETURN TO QUESTS</Text>
        </TouchableOpacity>

        {showConfetti && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 999, pointerEvents: 'none' } as any]}>
            <LottieView
              ref={animationRef}
              source={{ uri: 'https://lottie.host/7ae6588f-4ba0-42f5-b6d1-cd4cd1540854/D5eJ0lWe36.json' }}
              style={{ flex: 1 }}
              loop={false}
              onAnimationFinish={() => setShowConfetti(false)}
            />
          </View>
        )}
      </SafeAreaView>
    );
  }

  const currentQ = sessionQuestions[questionIndex];

  // 3. Adaptive Challenge Engine
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.challengeHeader}>
        <TouchableOpacity 
           onPress={() => { setLearningFocus(null); setSkillLevel(null); }} 
           style={{ position: 'absolute', left: 20, top: 18, zIndex: 10 }}
        >
            <Feather name="arrow-left" size={24} color={theme.textMuted} />
        </TouchableOpacity>
        <Text style={styles.challengeHeaderTitle}>{learningFocus} QUEST • {skillLevel}</Text>
        <AnimatedProgressBar progress={questionIndex / 5} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[
          styles.card, 
          isAnswered && isCorrect && styles.cardCorrect,
          isAnswered && isCorrect === false && styles.cardWrong,
        ]}>
          <Text style={styles.questionText}>
            {currentQ.q}
          </Text>

          <View style={styles.mcqContainer}>
            {currentQ.options?.map((opt: string, idx: number) => (
              <QuizOption
                key={opt}
                ref={(el) => { optionRefs.current[idx] = el; }}
                opt={opt}
                idx={idx}
                isSelected={selectedOption === opt}
                isAnswered={isAnswered}
                isCorrect={isCorrect}
                correctIdx={currentQ.answer}
                onPress={() => setSelectedOption(opt)}
              />
            ))}
          </View>

          {isAnswered && (
            <View style={styles.feedbackContainer}>
              {isCorrect ? (
                <>
                  <Text style={styles.feedbackCorrectTitle}>Success!</Text>
                  <Text style={styles.feedbackText}>Knowledge verified.</Text>
                </>
              ) : (
                <>
                  <Text style={styles.feedbackWrongTitle}>Failed</Text>
                  <Text style={styles.feedbackText}>Correct syntax: {currentQ.options[currentQ.answer]}</Text>
                </>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        {!isAnswered ? (
          <TouchableOpacity 
            style={[styles.submitBtn, !selectedOption && styles.btnDisabled]}
            onPress={() => {
              const idx = currentQ.options.indexOf(selectedOption);
              submitAnswer(idx);
            }}
            disabled={!selectedOption}
          >
            <Text style={styles.submitBtnText}>VERIFY ANSWER</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={isCorrect ? styles.nextBtnCorrect : styles.nextBtnWrong}
            onPress={handleNext}
          >
            <Text style={styles.submitBtnText}>
              {questionIndex === 4 ? "COMPLETE QUEST" : "NEXT CHALLENGE"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TutorModal 
        visible={showTutor} 
        feedback={tutorText} 
        codeSnippet={tutorSnippet}
        onClose={() => setShowTutor(false)} 
      />
    </SafeAreaView>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    center: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    centerLoading: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: theme.purple, marginTop: Spacing.md, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    
    title: { fontSize: 22, fontWeight: '800', color: theme.textPrimary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'center' },
    subtitle: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.sm, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    
    btnDisabled: { opacity: 0.5 },

    // Course Dashboard
    dashboardContainer: { flex: 1, padding: 20 },
    headerTitle: { color: theme.textMuted, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
    materialCard: { 
      backgroundColor: theme.bgCard, 
      borderRadius: 20, 
      padding: 20, 
      marginBottom: 20, 
      borderWidth: 1, 
      borderColor: theme.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    cardTopicTitle: { color: theme.textPrimary, fontSize: 18, fontWeight: '800', letterSpacing: 1 },
    cardTopicSub: { color: theme.textSecondary, fontSize: 13, marginTop: 2 },
    overallRing: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    overallText: { fontSize: 11, fontWeight: 'bold' },

    pillRow: { flexDirection: 'row', backgroundColor: theme.bgInput, borderRadius: 30, padding: 4, gap: 4 },
    pillBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 25, backgroundColor: theme.bg, flexDirection: 'row' },
    pillBtnLocked: { backgroundColor: 'transparent', opacity: 0.6 },
    pillText: { color: theme.textSecondary, fontSize: 12, fontWeight: '700' },
    pillTextLocked: { color: theme.textMuted },

    // Header
    challengeHeader: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.border, justifyContent: 'center' },
    challengeHeaderTitle: { color: theme.textMuted, fontSize: 11, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'center', marginBottom: Spacing.md, letterSpacing: 2 },
    
    // Card
    scrollContent: { padding: Spacing.lg, paddingBottom: 100 },
    card: { 
      backgroundColor: theme.bgCard, 
      borderRadius: 16, 
      padding: Spacing.xl, 
      borderWidth: 1, 
      borderColor: theme.border
    },
    cardCorrect: { borderColor: theme.green },
    cardWrong: { borderColor: theme.red },

    questionText: { color: theme.textPrimary, fontSize: 18, fontWeight: '700', lineHeight: 26 },
    
    // Multiple Choice
    mcqContainer: { gap: Spacing.md, marginTop: Spacing.xl },
    
    // Feedback
    feedbackContainer: { marginTop: Spacing.xl, padding: Spacing.lg, backgroundColor: theme.bg, borderRadius: 8, borderWidth: 1, borderColor: theme.border },
    feedbackCorrectTitle: { color: theme.green, fontSize: 16, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 8 },
    feedbackWrongTitle: { color: theme.red, fontSize: 16, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 8 },
    feedbackText: { color: theme.textSecondary, fontSize: 13, lineHeight: 18 },

    // Footer Buttons
    footer: { padding: Spacing.xl, backgroundColor: theme.bg, borderTopWidth: 1, borderTopColor: theme.border },
    submitBtn: { backgroundColor: theme.purple, padding: 18, alignItems: 'center', borderRadius: 30 },
    submitBtnText: { color: isDark ? '#000' : '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    nextBtnCorrect: { backgroundColor: theme.green, padding: 18, alignItems: 'center', borderRadius: 30 },
    nextBtnWrong: { backgroundColor: theme.red, padding: 18, alignItems: 'center', borderRadius: 30 },
});
