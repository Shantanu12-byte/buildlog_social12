// SkillsLabQuizController.js - Controls logic for BuildLog Skills Lab (Zero-Cost Tutor)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LESSON_DATA } from '../constants/BulkLessonData'; 
import { updateProfileWithSkillsData } from '../services/ProfilePersistenceManager';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';
import TutorModal from './TutorModal';

/**
 * SkillsLabQuizController
 * @param {string} language - Course topic (e.g., 'HTML')
 * @param {string} initialLevel - Difficulty (Beginner, Pro, Expert)
 */
const SkillsLabQuizController = ({ language = "HTML", initialLevel = "Beginner" }) => {
  const [level, setLevel] = useState(initialLevel);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [tutorFeedback, setTutorFeedback] = useState("");
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);

  const currentQuestions = LESSON_DATA[language]?.[level] || [];
  const currentQuestion = currentQuestions[questionIndex];

  const handleOptionSelect = (index) => {
    if (selectedOption !== null || roundCompleted || !currentQuestion) return;
    
    setSelectedOption(index);
    
    if (index === currentQuestion.correctAnswerIndex) {
      setScore(prevScore => prevScore + 1);
      setTimeout(goToNextQuestion, 1000);
    } else {
      setIncorrectAttempts(prev => prev + 1);
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
    const results = await updateProfileWithSkillsData({}, {
      topic: language,
      level: level,
      score: score,
      total: currentQuestions.length
    });

    if (score === currentQuestions.length) {
      // Perfect Score
      console.log('🏆 MASTERY ACHIEVED');
    }
  };

  if (!currentQuestion && !roundCompleted) {
    return (
      <View style={s.container}>
        <Text style={s.header}>Syncing Lab...</Text>
      </View>
    );
  }

  if (roundCompleted) {
    return (
      <View style={s.container}>
        <View style={s.completionCard}>
          <Feather name="zap" size={64} color={Colors.accent.primary} style={s.zapIcon} />
          <Text style={s.header}>Lab Complete!</Text>
          <Text style={s.scoreText}>{score} / {currentQuestions.length}</Text>
          <Text style={s.subtitle}>
            {score === currentQuestions.length 
              ? "🏆 PERFECT! You've mastered this tier." 
              : "Keep building! Review your tips and try again."}
          </Text>
          <TouchableOpacity style={s.primaryBtn} onPress={() => console.log('Exit')}>
            <Text style={s.btnText}>Return to Skills Hub</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header / Progress */}
      <View style={s.topNav}>
        <View style={s.levelBadge}>
          <Text style={s.levelText}>{level.toUpperCase()}</Text>
        </View>
        <Text style={s.progressText}>Question {questionIndex + 1} of {currentQuestions.length}</Text>
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
                    name={isCorrect ? "check-circle" : "x-circle"} 
                    size={16} 
                    color={isCorrect ? "#FFF" : "#FFF"} 
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

const s = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.bg.primary, 
    padding: Spacing.lg 
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  levelBadge: {
    backgroundColor: 'rgba(47, 129, 247, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accent.primary,
  },
  levelText: {
    color: Colors.accent.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  progressText: {
    color: Colors.text.tertiary,
    fontSize: 12,
    fontFamily: 'System',
  },
  scrollArea: {
    flex: 1,
  },
  questionText: {
    fontSize: 22,
    color: Colors.text.primary,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: Spacing.xl,
  },
  codeSnippetContainer: {
    backgroundColor: Colors.bg.secondary,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  codeSnippetText: {
    fontFamily: 'monospace',
    color: Colors.accent.glow,
    fontSize: 14,
  },
  optionsGrid: {
    gap: Spacing.md,
  },
  optionButton: {
    backgroundColor: Colors.bg.secondary,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '600',
    flex: 1,
  },
  optionTextActive: {
    color: '#FFF',
  },
  optionCorrect: {
    backgroundColor: Colors.github.green,
    borderColor: Colors.github.green,
  },
  optionWrong: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
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
    color: Colors.text.primary,
    marginVertical: Spacing.md,
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  primaryBtn: {
    backgroundColor: Colors.accent.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: Radius.full,
    width: '100%',
  },
  btnText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
  }
});

export default SkillsLabQuizController;
