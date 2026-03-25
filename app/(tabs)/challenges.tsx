import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Animated, Easing, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { COURSE_DATA } from '@/constants/courseData';
import AnimatedProgressBar from '@/components/AnimatedProgressBar';
import QuizOption from '@/components/QuizOption';
import TutorModal from '@/components/TutorModal';
import { getTutoringFeedback } from '@/services/TutorController';
import { manageLanguageProgress } from '@/services/AsyncProgressManager';

export default function ChallengesScreen() {
  const { userProfile, updateUserProfile } = useUserStore();
  const [loading, setLoading] = useState(true);
  
  // Onboarding State
  const [learningFocus, setLearningFocus] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<string | null>(null);
  const [savingSurvey, setSavingSurvey] = useState(false);

  // Challenge Engine State
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fillInAnswer, setFillInAnswer] = useState('');
  
  // Validation State
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const challengeStartTime = useRef<number>(0);
  
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
  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [isRoundFinished, setIsRoundFinished] = useState(false);
  
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
    } catch (e) {
      console.error(e);
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
    // Select 5 questions from the data
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

  const playVictorySound = async () => {
    victoryPlayer.play();
  };

  const playSuccessSound = async () => {
    successPlayer.play();
  };

  const submitAnswer = async (optIdx: number) => {
    if (isAnswered) return;
    
    const correctIdx = sessionQuestions[questionIndex].answer;
    const correct = optIdx === correctIdx;
    
    if (correct) {
      optionRefs.current[optIdx]?.playCorrectAnimation();
      playSuccessSound();
    } else {
      optionRefs.current[optIdx]?.playIncorrectAnimation();
      optionRefs.current[correctIdx]?.playCorrectAnimation();
      
      // Zero-Cost Tutor Fetch
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
      // Round Complete
      setIsRoundFinished(true);
      
      // Use the latest score (roundScore + current isCorrect)
      const totalCorrect = roundScore; 
      const percent = Math.round((totalCorrect / 5) * 100);
      
      if (totalCorrect === 5) {
        playVictorySound();
      }

      // Save Progress using AsyncProgressManager (Persistent Achievements)
      if (userProfile?.id) {
        await manageLanguageProgress(userProfile.id, learningFocus!, skillLevel!, percent);
      }
      
      // Refresh local stats
      await loadProgress();
    }
  };

  useEffect(() => {
    if (isRoundFinished && roundScore === 5) {
      triggerConfetti();
    }
  }, [isRoundFinished]);


  const triggerConfetti = () => {
    // Show Success Modal
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 250, easing: Easing.bounce, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();

    // 1. Make the confetti visible
    setShowConfetti(true);

    // 2. Start the party! (Give a slight delay for render)
    setTimeout(() => {
        animationRef.current?.play();
    }, 50);
  };

  // --- RENDERERS ---

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent.primary} />
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
                    <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
                      <FontAwesome5 name={(TOPIC_ICONS as any)[topic]} size={20} color={color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={styles.cardTopicTitle}>{topic}</Text>
                      <Text style={styles.cardTopicSub}>{overall}% XP Earned</Text>
                    </View>
                    <View style={styles.overallRing}>
                      <Text style={[styles.overallText, { color }]}>{overall}%</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.pillRow}>
                    {LEVELS.map(level => {
                      const locked = isLevelLocked(topic, level);
                      const isExpert = level === 'Expert';
                      
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
                          {locked && isExpert && <Feather name="lock" size={10} color="#666" style={{ marginRight: 4 }} />}
                          <Text style={[styles.pillText, locked && styles.pillTextLocked]}>{level}</Text>
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
          <Feather name={roundScore === 5 ? "zap" : "award"} size={80} color={roundScore === 5 ? Colors.accent.glow : "#888"} />
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

  // 3. Adaptive Challenge Engine - Cyber-Noir "Mimo" Card
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
           onPress={() => { setLearningFocus(null); setSkillLevel(null); }} 
           style={{ position: 'absolute', left: 20, top: 18, zIndex: 10 }}
        >
            <Feather name="arrow-left" size={24} color="#888" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{learningFocus} QUEST • {skillLevel}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' }, // Deep noir bg
  center: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  loadingText: { color: Colors.accent.glow, marginTop: Spacing.md, fontFamily: 'monospace' },
  
  title: { fontSize: 22, fontWeight: '800', color: '#FFF', fontFamily: 'monospace', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: Spacing.sm, fontFamily: 'monospace' },
  
  startBtn: { marginTop: 60, backgroundColor: Colors.accent.primary, padding: 18, alignItems: 'center', borderRadius: 4, shadowColor: Colors.accent.glow, shadowOpacity: 0.6, shadowRadius: 15 },
  startBtnText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 2, fontFamily: 'monospace' },
  btnDisabled: { opacity: 0.5, shadowOpacity: 0 },

  // Course Dashboard
  dashboardContainer: { flex: 1, padding: 20, paddingTop: 40 },
  materialCard: { 
    backgroundColor: '#151515', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#222',
    ...Shadows.soft
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTopicTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  cardTopicSub: { color: '#666', fontSize: 13, marginTop: 2 },
  overallRing: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 2, borderColor: '#222', justifyContent: 'center', alignItems: 'center' },
  overallText: { fontSize: 11, fontWeight: 'bold' },

  pillRow: { flexDirection: 'row', backgroundColor: '#0A0A0A', borderRadius: 30, padding: 4, gap: 4 },
  pillBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 25, backgroundColor: '#1A1A1A', flexDirection: 'row' },
  pillBtnLocked: { backgroundColor: '#0D0D0D', opacity: 0.6 },
  pillText: { color: Colors.accent.glow, fontSize: 12, fontWeight: '700' },
  pillTextLocked: { color: '#666' },

  // Header
  header: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', justifyContent: 'center' },
  headerTitle: { color: '#888', fontSize: 11, fontWeight: '800', fontFamily: 'monospace', textAlign: 'center', marginBottom: Spacing.md, letterSpacing: 2 },
  
  // Card
  scrollContent: { padding: Spacing.lg, paddingBottom: 100 },
  card: { 
    backgroundColor: '#111', 
    borderRadius: 16, 
    padding: Spacing.xl, 
    borderWidth: 1, 
    borderColor: '#333'
  },
  cardCorrect: { borderColor: '#1D9E75' },
  cardWrong: { borderColor: '#FF4444' },

  questionText: { color: '#FFF', fontSize: 18, fontWeight: '700', lineHeight: 26 },
  
  // Multiple Choice
  mcqContainer: { gap: Spacing.md, marginTop: Spacing.xl },
  
  // Feedback
  feedbackContainer: { marginTop: Spacing.xl, padding: Spacing.lg, backgroundColor: '#0A0A0A', borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  feedbackCorrectTitle: { color: '#1D9E75', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace', marginBottom: 8 },
  feedbackWrongTitle: { color: '#FF4444', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace', marginBottom: 8 },
  feedbackText: { color: '#CCC', fontSize: 13, lineHeight: 18 },

  // Footer Buttons
  footer: { padding: Spacing.xl, backgroundColor: '#0A0A0A', borderTopWidth: 1, borderTopColor: '#222' },
  submitBtn: { backgroundColor: Colors.accent.primary, padding: 18, alignItems: 'center', borderRadius: 30 },
  submitBtnText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 1, fontFamily: 'monospace' },
  nextBtnCorrect: { backgroundColor: '#1D9E75', padding: 18, alignItems: 'center', borderRadius: 30 },
  nextBtnWrong: { backgroundColor: '#FF4444', padding: 18, alignItems: 'center', borderRadius: 30 },
});
