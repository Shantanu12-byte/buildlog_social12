import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BULK_LESSON_DATA } from '@/constants/BulkLessonData'; 
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface Question {
  q: string;
  codeSnippet?: string;
  options: string[];
  answer: number;
  incorrectAnswerFeedback: string[];
}

interface SkillsLabControllerProps {
  language?: string;
  initialLevel?: string;
  onClose?: () => void;
}

const SkillsLabController = ({ 
  language = "HTML", 
  initialLevel = "Beginner",
  onClose 
}: SkillsLabControllerProps) => {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const [level, setLevel] = useState(initialLevel);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [tutorFeedback, setTutorFeedback] = useState("");
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [roundCompleted, setRoundCompleted] = useState(false);

  const topicKey = `${language}_${level}`;
  // @ts-ignore - BULK_LESSON_DATA is a loose object
  const currentQuestions: Question[] = BULK_LESSON_DATA[topicKey] || [];
  const currentQuestion = currentQuestions[questionIndex];

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null || roundCompleted || !currentQuestion) return;
    
    setSelectedOption(index);
    
    if (index === currentQuestion.answer) {
      setScore(prevScore => prevScore + 1);
      setTimeout(goToNextQuestion, 800);
    } else {
      const feedbackPill = currentQuestion.incorrectAnswerFeedback[index];
      setTutorFeedback(feedbackPill || "Not quite! Keep learning.");
      setShowTutorModal(true);
    }
  };

  const goToNextQuestion = () => {
    setSelectedOption(null);
    if (questionIndex + 1 < currentQuestions.length) {
      setQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      setRoundCompleted(true);
      handleRoundCompletion();
    }
  };

  const handleRoundCompletion = () => {
    if (score >= currentQuestions.length - 1) {
      if (Platform.OS !== 'web') {
        Alert.alert(
          `Round Mastered!`,
          `Congratulations on completing ${level}! Your profile has been updated.`
        );
      }
    }
  };

  if (!currentQuestion && !roundCompleted) {
    return (
      <View style={s.container}>
        <ActivityIndicator color={theme.purple} />
        <Text style={s.header}>INITIALIZING_LAB...</Text>
      </View>
    );
  }

  if (roundCompleted) {
    return (
      <View style={s.container}>
        <View style={s.completionBadge}>
          <Feather name="award" size={60} color={theme.purple} />
        </View>
        <Text style={s.header}>LAB_COMPLETE</Text>
        <Text style={s.subHeader}>You finished the {level} tier for {language}.</Text>
        <View style={s.scoreCard}>
          <Text style={s.scoreValue}>{score} / {currentQuestions.length}</Text>
          <Text style={s.scoreLabel}>ACCURACY_SCORE</Text>
        </View>
        <TouchableOpacity style={s.primaryButton} onPress={() => onClose?.()}>
          <Text style={s.primaryButtonText}>EXIT_TERMINAL</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <Text style={s.header}>{language.toUpperCase()} {"//"} {level.toUpperCase()}</Text>
        <Text style={s.progressText}>{questionIndex + 1} OF {currentQuestions.length}</Text>
      </View>
      
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.questionBox}>
          <Text style={s.questionText}>{currentQuestion.q}</Text>
          
          {currentQuestion.codeSnippet && (
            <View style={s.codeSnippetContainer}>
              <Text style={s.codeText}>{currentQuestion.codeSnippet}</Text>
            </View>
          )}
        </View>
        
        <View style={s.optionsGrid}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrect = index === currentQuestion.answer;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  s.optionButton,
                  isSelected && (isCorrect ? s.correctOption : s.incorrectOption)
                ]}
                onPress={() => handleOptionSelect(index)}
                disabled={selectedOption !== null}
              >
                <Text style={[
                  s.optionText, 
                  isSelected && { color: isDark || isCorrect ? '#000' : '#FFF' }
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showTutorModal}
        onRequestClose={() => setShowTutorModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.avatarPlaceholder}>
               <Text style={{ fontSize: 32 }}>🦉</Text>
            </View>
            <Text style={s.tutorHeader}>TUTOR_ADVICE</Text>
            <Text style={s.feedbackText}>{tutorFeedback}</Text>
            <TouchableOpacity
              style={s.modalCloseButton}
              onPress={() => {
                setShowTutorModal(false);
                goToNextQuestion();
              }}
            >
              <Text style={s.primaryButtonText}>RESUME_SESSION</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: Spacing.xl },
  headerRow: {
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  header: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: theme.textPrimary, 
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'monospace',
    letterSpacing: 1,
  },
  progressText: { 
    fontSize: 10, 
    color: theme.textMuted, 
    marginTop: 4, 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '800',
  },
  scroll: { flex: 1 },
  questionBox: {
    backgroundColor: theme.bgInput,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: theme.border,
  },
  questionText: { 
    fontSize: 16, 
    color: theme.textPrimary, 
    lineHeight: 24, 
    fontWeight: '700' 
  },
  subHeader: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    fontWeight: '600',
  },
  codeSnippetContainer: { 
    backgroundColor: isDark ? '#000' : '#f1f5f9', 
    padding: 15, 
    borderRadius: 8, 
    marginTop: 15, 
    borderLeftWidth: 4, 
    borderLeftColor: theme.purple 
  },
  codeText: { 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', 
    color: theme.purple, 
    fontSize: 13,
    fontWeight: '700',
  },
  optionsGrid: {
    gap: 12,
  },
  optionButton: { 
    backgroundColor: theme.bgCard, 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: theme.border 
  },
  optionText: { 
    fontSize: 15, 
    color: theme.textPrimary, 
    textAlign: 'center', 
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  correctOption: { backgroundColor: theme.green, borderColor: theme.green },
  incorrectOption: { backgroundColor: theme.red, borderColor: theme.red },
  
  completionBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.purpleGlow,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xl,
    marginTop: 40,
    borderWidth: 1,
    borderColor: theme.purple,
  },
  scoreCard: {
    backgroundColor: theme.bgInput,
    paddingVertical: 32,
    borderRadius: Radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: Spacing.xxl,
  },
  scoreValue: { 
    fontSize: 48, 
    fontWeight: '900', 
    color: theme.purple,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scoreLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  primaryButton: { 
    backgroundColor: theme.purple, 
    padding: 18, 
    borderRadius: Radius.md, 
    alignItems: 'center',
  },
  primaryButtonText: { 
    color: isDark ? '#000' : '#FFF', 
    fontWeight: '900', 
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)' },
  modalContent: { 
    width: '85%', 
    backgroundColor: theme.bgCard, 
    borderRadius: Radius.lg, 
    padding: 25, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: theme.purple 
  },
  avatarPlaceholder: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    backgroundColor: theme.purpleGlow, 
    marginBottom: 15, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: theme.purple 
  },
  tutorHeader: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: theme.purple, 
    marginBottom: 15, 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  feedbackText: { 
    fontSize: 15, 
    color: theme.textSecondary, 
    textAlign: 'center', 
    marginBottom: 25, 
    lineHeight: 22,
    fontWeight: '600',
  },
  modalCloseButton: { 
    backgroundColor: theme.purple, 
    padding: 16, 
    borderRadius: Radius.md, 
    width: '100%',
    alignItems: 'center',
  },
});

export default SkillsLabController;
