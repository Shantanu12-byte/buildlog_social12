import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LESSON_DATA } from '../constants/BulkLessonData'; 
import { updateProfileWithSkillsData } from '../services/ProfilePersistenceManager';
import { Spacing, Radius } from '../constants/theme';
import TutorModal from './TutorModal';
import { useTheme } from '@/context/ThemeContext';

interface Question {
  question: string;
  codeSnippet?: string;
  options: string[];
  correctAnswerIndex: number;
  incorrectAnswerFeedback: string[];
}

interface SkillsLabQuizControllerProps {
  language?: string;
  initialLevel?: string;
  onClose?: () => void;
}

/**
 * SkillsLabQuizController
 * Theme-aware TypeScript version of the quiz engine.
 */
const SkillsLabQuizController = ({ 
  language = "HTML", 
  initialLevel = "Beginner",
  onClose
}: SkillsLabQuizControllerProps) => {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const [level, setLevel] = useState(initialLevel);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [tutorFeedback, setTutorFeedback] = useState("");
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [roundCompleted, setRoundCompleted] = useState(false);

  // @ts-ignore - LESSON_DATA is heavily nested and dynamic
  const currentQuestions: Question[] = LESSON_DATA[language]?.[level] || [];
  const currentQuestion = currentQuestions[questionIndex];

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null || roundCompleted || !currentQuestion) return;
    
    setSelectedOption(index);
    
    if (index === currentQuestion.correctAnswerIndex) {
      setScore(prevScore => prevScore + 1);
      setTimeout(goToNextQuestion, 1000);
    } else {
      const feedbackPill = currentQuestion.incorrectAnswerFeedback[index];
      setTutorFeedback(feedbackPill || "That's not quite right. Look closer!");
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

  const handleRoundCompletion = async () => {
    try {
      await updateProfileWithSkillsData({}, {
        topic: language,
        level: level,
        score: score,
        total: currentQuestions.length
      });
    } catch (e) {
      // Persistence error handled silently
    }
  };

  if (!currentQuestion && !roundCompleted) {
    return (
      <View style={s.container}>
        <Text style={s.header}>SYNCING_LAB...</Text>
      </View>
    );
  }

  if (roundCompleted) {
    return (
      <View style={s.container}>
        <View style={s.completionCard}>
          <Feather name="zap" size={64} color={theme.purple} style={s.zapIcon} />
          <Text style={s.header}>LAB_COMPLETE</Text>
          <Text style={s.scoreText}>{score} / {currentQuestions.length}</Text>
          <Text style={s.subtitle}>
            {score === currentQuestions.length 
              ? "🏆 PERFECT! MASTERY_ACHIEVED." 
              : "KEEP_BUILDING. REVIEW_FEEDBACK_LOOPS."}
          </Text>
          <TouchableOpacity style={s.primaryBtn} onPress={onClose}>
            <Text style={s.btnText}>EXIT_TERMINAL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.topNav}>
        <View style={s.levelBadge}>
          <Text style={s.levelText}>{level.toUpperCase()}</Text>
        </View>
        <Text style={s.progressText}>QUE {questionIndex + 1} // {currentQuestions.length}</Text>
      </View>
      
      <ScrollView style={s.scrollArea} showsVerticalScrollIndicator={false}>
        <Text style={s.questionText}>{currentQuestion.question}</Text>
        
        {currentQuestion.codeSnippet && (
          <View style={s.codeSnippetContainer}>
            <Text style={s.codeSnippetText}>{currentQuestion.codeSnippet}</Text>
          </View>
        )}
        
        <View style={s.optionsGrid}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrect = index === currentQuestion.correctAnswerIndex;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  s.optionButton, 
                  isSelected && (isCorrect ? s.optionCorrect : s.optionWrong)
                ]}
                onPress={() => handleOptionSelect(index)}
                disabled={selectedOption !== null}
                activeOpacity={0.7}
              >
                <Text style={[s.optionText, isSelected && s.optionTextActive]}>{option}</Text>
                {isSelected && (
                  <Feather 
                    name={isCorrect ? "check-circle" : "alert-circle"} 
                    size={16} 
                    color={isDark || isCorrect ? "#000" : "#FFF"} 
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TutorModal 
        visible={showTutorModal}
        feedback={tutorFeedback}
        onClose={() => {
          setShowTutorModal(false);
          goToNextQuestion();
        }}
      />
    </View>
  );
};

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.bg, 
    padding: Spacing.lg 
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingBottom: Spacing.md,
  },
  levelBadge: {
    backgroundColor: theme.purpleGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: theme.purple,
  },
  levelText: {
    color: theme.purple,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  progressText: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scrollArea: {
    flex: 1,
  },
  questionText: {
    fontSize: 20,
    color: theme.textPrimary,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: Spacing.xl,
  },
  codeSnippetContainer: {
    backgroundColor: theme.bgInput,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: theme.border,
  },
  codeSnippetText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: theme.purple,
    fontSize: 13,
    fontWeight: '700',
  },
  optionsGrid: {
    gap: Spacing.md,
  },
  optionButton: {
    backgroundColor: theme.bgCard,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 15,
    color: theme.textSecondary,
    fontWeight: '700',
    flex: 1,
  },
  optionTextActive: {
    color: isDark ? '#000' : '#FFF',
  },
  optionCorrect: {
    backgroundColor: theme.green,
    borderColor: theme.green,
  },
  optionWrong: {
    backgroundColor: theme.red,
    borderColor: theme.red,
  },
  completionCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  zapIcon: {
    marginBottom: Spacing.lg,
  },
  scoreText: {
    fontSize: 64,
    fontWeight: '900',
    color: theme.textPrimary,
    marginVertical: Spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  header: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'monospace',
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    fontWeight: '600',
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: theme.purple,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: Radius.md,
    width: '100%',
  },
  btnText: {
    color: isDark ? '#000' : '#FFF',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  }
});

export default SkillsLabQuizController;
