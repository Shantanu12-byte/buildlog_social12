import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Animated, Easing, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { COURSE_DATA } from '@/constants/courseData';

export default function LearnScreen() {
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
  
  // Progress State
  const [learningStats, setLearningStats] = useState<Record<string, number>>({});
  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [isRoundFinished, setIsRoundFinished] = useState(false);

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
      Alert.alert('Module Unavailable', `We are still compiling the ${topic} ${level} modules. Try HTML, CSS or Python!`);
      return;
    }

    // Complexity mapping: 1 for Beginner, 2 for Pro, 3 for Expert
    const complexity = level === 'Beginner' ? '1' : level === 'Pro' ? '2' : '3';
    console.log(`Starting ${topic} ${level} (Complexity: ${complexity})`);

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
    try {
      // Using a public high-quality victory sound URI as asset might not exist
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.myinstants.com/media/sounds/victory-royal_1.mp3' }
      );
      await sound.playAsync();
    } catch (e) {
      console.log('Victory sound fail:', e);
    }
  };

  const submitAnswer = async (optIdx: number) => {
    if (isAnswered) return;
    
    const correctIdx = sessionQuestions[questionIndex].answer;
    const correct = optIdx === correctIdx;
    
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

      // Save Progress
      const key = `progress_${learningFocus}_${skillLevel}`;
      const currentProgress = learningStats[key] || 0;
      const newPercent = Math.max(currentProgress, percent);
      
      try {
        await AsyncStorage.setItem(key, newPercent.toString());
        // Force refresh stats
        await loadProgress();
      } catch (e) {
        console.error('Save progress error:', e);
      }
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
        <Text style={styles.loadingText}>Compiling Modules...</Text>
      </View>
    );
  }

  // 1. Course Selection Dashboard
  if (!learningFocus || !skillLevel) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.dashboardContainer}>
          <Text style={styles.headerTitle}>CHOOSE YOUR PATH</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {TOPICS.map(topic => {
              const bgBeg = learningStats[`${topic}_Beginner`] || 0;
              const bgPro = learningStats[`${topic}_Pro`] || 0;
              const bgExp = learningStats[`${topic}_Expert`] || 0;
              const overall = Math.round((bgBeg + bgPro + bgExp) / 3);
              const color = COURSE_THEMES[topic];
              
              return (
                <View key={topic} style={styles.materialCard}>
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    style={styles.cardHeader}
                    onPress={() => startRound(topic, 'Beginner')}
                  >
                    <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
                      <Feather name={(TOPIC_ICONS as any)[topic]} size={24} color={color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={styles.cardTopicTitle}>{topic}</Text>
                      <Text style={styles.cardTopicSub}>{overall}% Overall Progress</Text>
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
                </View>
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
          <Feather name={roundScore === 5 ? "star" : "award"} size={80} color={roundScore === 5 ? Colors.accent.glow : "#888"} />
        </Animated.View>
        <Text style={[styles.title, { marginTop: Spacing.xl }]}>
          {roundScore === 5 ? "PERFECT SCORE!" : "ROUND COMPLETE"}
        </Text>
        <Text style={styles.subtitle}>You scored {roundScore}/5 in {learningFocus} {skillLevel}.</Text>
        
        <TouchableOpacity 
          style={styles.nextBtnCorrect} 
          onPress={() => { setLearningFocus(null); setSkillLevel(null); }}
        >
          <Text style={styles.submitBtnText}>BACK TO DASHBOARD</Text>
        </TouchableOpacity>

        {showConfetti && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 999, pointerEvents: 'none' }]}>
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
        <Text style={styles.headerTitle}>{learningFocus} • {skillLevel}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(questionIndex / 5) * 100}%` }]} />
        </View>
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
            {currentQ.options?.map((opt: string, idx: number) => {
              const isSelected = selectedOption === opt;
              let btnStyle: any = [styles.mcqBtn];
              let textStyle: any = [styles.mcqBtnText];

              if (isAnswered) {
                if (idx === currentQ.answer) {
                  btnStyle.push(styles.mcqBtnCorrect);
                  textStyle.push(styles.mcqBtnTextSelected);
                } else if (isSelected && !isCorrect) {
                  btnStyle.push(styles.mcqBtnWrong);
                  textStyle.push(styles.mcqBtnTextSelected);
                }
              } else if (isSelected) {
                btnStyle.push(styles.mcqBtnSelected);
                textStyle.push(styles.mcqBtnTextSelected);
              }

              return (
                <TouchableOpacity 
                  key={opt} 
                  style={btnStyle}
                  onPress={() => setSelectedOption(opt)}
                  disabled={isAnswered}
                >
                  <Text style={textStyle}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {isAnswered && (
            <View style={styles.feedbackContainer}>
              {isCorrect ? (
                <>
                  <Text style={styles.feedbackCorrectTitle}>Correct!</Text>
                  <Text style={styles.feedbackText}>Module processed successfully.</Text>
                </>
              ) : (
                <>
                  <Text style={styles.feedbackWrongTitle}>Incorrect</Text>
                  <Text style={styles.feedbackText}>The correct answer was: {currentQ.options[currentQ.answer]}</Text>
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
            <Text style={styles.submitBtnText}>SUBMIT ANSWER</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={isCorrect ? styles.nextBtnCorrect : styles.nextBtnWrong}
            onPress={handleNext}
          >
            <Text style={styles.submitBtnText}>
              {questionIndex === 4 ? "FINISH ROUND" : "NEXT QUESTION"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' }, // Deep noir bg
  center: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  loadingText: { color: Colors.accent.glow, marginTop: Spacing.md, fontFamily: 'monospace' },
  
  title: { fontSize: 22, fontWeight: '800', color: '#FFF', fontFamily: 'monospace', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: Spacing.sm, fontFamily: 'monospace' },
  
  surveyContainer: { flex: 1, padding: Spacing.xl, justifyContent: 'center' },
  surveyHeader: { color: Colors.accent.glow, textAlign: 'center', letterSpacing: 4, fontSize: 12, marginBottom: 40, fontFamily: 'monospace' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.lg, justifyContent: 'center' },
  surveyOption: { paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#333', backgroundColor: '#111', width: '45%', alignItems: 'center', borderRadius: 8 },
  surveyOptionSelected: { borderColor: Colors.accent.primary, backgroundColor: 'rgba(57,255,20,0.1)', shadowColor: Colors.accent.primary, shadowOpacity: 0.5, shadowRadius: 10 },
  surveyOptionText: { color: '#888', fontWeight: 'bold', fontFamily: 'monospace' },
  surveyOptionTextSelected: { color: Colors.accent.glow },
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
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
  headerTitle: { color: '#888', fontSize: 12, fontWeight: '800', fontFamily: 'monospace', textAlign: 'center', marginBottom: Spacing.md, letterSpacing: 2 },
  progressBar: { height: 4, backgroundColor: '#222', width: '100%', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.accent.primary },
  
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

  questionText: { color: '#FFF', fontSize: 20, fontWeight: '700', lineHeight: 28 },
  
  // Multiple Choice
  mcqContainer: { gap: Spacing.md, marginTop: Spacing.xl },
  mcqBtn: { backgroundColor: '#1A1A1A', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  mcqBtnSelected: { borderColor: Colors.accent.primary, backgroundColor: 'rgba(57,255,20,0.05)' },
  mcqBtnCorrect: { borderColor: '#1D9E75', backgroundColor: 'rgba(29,158,117,0.1)' },
  mcqBtnWrong: { borderColor: '#FF4444', backgroundColor: 'rgba(255,68,68,0.1)' },
  mcqBtnText: { color: '#AAA', fontSize: 16, fontWeight: '600' },
  mcqBtnTextSelected: { color: '#FFF' },

  // Feedback
  feedbackContainer: { marginTop: Spacing.xl, padding: Spacing.lg, backgroundColor: '#0A0A0A', borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  feedbackCorrectTitle: { color: '#1D9E75', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace', marginBottom: 8 },
  feedbackWrongTitle: { color: '#FF4444', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace', marginBottom: 8 },
  feedbackText: { color: '#CCC', fontSize: 14, lineHeight: 20 },

  // Footer Buttons
  footer: { padding: Spacing.xl, backgroundColor: '#0A0A0A', borderTopWidth: 1, borderTopColor: '#222' },
  submitBtn: { backgroundColor: Colors.accent.primary, padding: 18, alignItems: 'center', borderRadius: 30 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1, fontFamily: 'monospace' },
  nextBtnCorrect: { backgroundColor: '#1D9E75', padding: 18, alignItems: 'center', borderRadius: 30 },
  nextBtnWrong: { backgroundColor: '#FF4444', padding: 18, alignItems: 'center', borderRadius: 30 },
});
