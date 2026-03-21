// SkillsLabController.js - Controls logic for BuildLog Skills Lab (Zero-Cost Tutor)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BULK_LESSON_DATA } from '@/constants/BulkLessonData'; 
import { Colors, Spacing, Radius } from '@/constants/theme';

const SkillsLabController = ({ language = "HTML", initialLevel = "Beginner" }) => {
  // --- 1. State Management ---
  const [level, setLevel] = useState(initialLevel);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [tutorFeedback, setTutorFeedback] = useState("");
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [roundCompleted, setRoundCompleted] = useState(false);

  // --- 2. Load the Question Batch ---
  const topicKey = `${language}_${level}`;
  const currentQuestions = BULK_LESSON_DATA[topicKey] || [];
  const currentQuestion = currentQuestions[questionIndex];

  // --- 3. Zero-Cost Answer Check Logic ---
  const handleOptionSelect = (index) => {
    if (selectedOption !== null || roundCompleted || !currentQuestion) return;
    
    setSelectedOption(index);
    
    if (index === currentQuestion.answer) {
      setScore(prevScore => prevScore + 1);
      if (Platform.OS !== 'web') {
        Alert.alert("Correct!", "Well done! Move to the next question.");
      }
      setTimeout(goToNextQuestion, 1000);
    } else {
      const feedbackPill = currentQuestion.incorrectAnswerFeedback[index];
      setTutorFeedback(feedbackPill || "Not quite! Keep learning.");
      setShowTutorModal(true);
    }
  };

  // --- 4. Progression Logic ---
  const goToNextQuestion = () => {
    setSelectedOption(null);
    if (questionIndex + 1 < currentQuestions.length) {
      setQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      setRoundCompleted(true);
      handleRoundCompletion();
    }
  };

  // --- 5. Mock Profile Persistence ---
  const handleRoundCompletion = () => {
    console.log(`Finished ${level} round. Score: ${score}/${currentQuestions.length}`);
    
    if (score >= currentQuestions.length - 1) {
      Alert.alert(
        `Round Mastered!`,
        `Congratulations on completing ${level}! Your profile has been updated. The Pro level is now unlocked!`
      );
    } else {
        Alert.alert(
            `Round Not Mastered`,
            `Your tutor suggested you review this round to make your progress 100% smooth!`
        );
    }
  };

  if (!currentQuestion && !roundCompleted) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Loading Skills Lab...</Text>
      </View>
    );
  }

  // --- 6. The UI Rendering ---
  if (roundCompleted) {
    return (
      <View style={styles.container}>
        <Feather name="award" size={80} color={Colors.accent.primary} style={{ alignSelf: 'center', marginBottom: 20 }} />
        <Text style={styles.header}>Skills Lab Complete!</Text>
        <Text style={styles.questionText}>You finished the {level} tier for {language}.</Text>
        <Text style={styles.scoreText}>Final Score: {score} / {currentQuestions.length}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => console.log('Go to Dashboard')}>
          <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{language} Skills Lab - {level}</Text>
      <Text style={styles.progressText}>Question {questionIndex + 1} of {currentQuestions.length}</Text>
      
      <ScrollView style={styles.questionContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.questionText}>{currentQuestion.q}</Text>
        
        {currentQuestion.codeSnippet && (
          <View style={styles.codeSnippetContainer}>
            <Text style={styles.codeText}>{currentQuestion.codeSnippet}</Text>
          </View>
        )}
        
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCorrect = index === currentQuestion.answer;
          
          let buttonStyle = [styles.optionButton];
          if (isSelected) {
            buttonStyle.push(isCorrect ? styles.correctOption : styles.incorrectOption);
          }

          return (
            <TouchableOpacity
              key={index}
              style={buttonStyle}
              onPress={() => handleOptionSelect(index)}
              disabled={selectedOption !== null}
            >
              <Text style={[styles.optionText, isSelected && { color: '#000' }]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showTutorModal}
        onRequestClose={() => setShowTutorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.avatarPlaceholder}>
               <Text style={{ fontSize: 32 }}>🦉</Text>
            </View>
            <Text style={styles.tutorHeader}>Tutor Tip!</Text>
            <Text style={styles.feedbackText}>{tutorFeedback}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowTutorModal(false);
                goToNextQuestion();
              }}
            >
              <Text style={styles.primaryButtonText}>Got it, try next!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#000', justifyContent: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 10, fontFamily: 'monospace' },
  progressText: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 20, fontFamily: 'monospace' },
  questionContainer: { flex: 1 },
  questionText: { fontSize: 18, color: '#DDD', marginBottom: 20, lineHeight: 26 },
  codeSnippetContainer: { backgroundColor: '#111', padding: 15, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: Colors.accent.primary },
  codeText: { fontFamily: 'monospace', color: Colors.accent.glow, fontSize: 14 },
  optionButton: { backgroundColor: '#1A1A1A', padding: 18, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  optionText: { fontSize: 16, color: '#FFF', textAlign: 'center', fontWeight: '600' },
  correctOption: { backgroundColor: Colors.accent.primary, borderColor: Colors.accent.primary },
  incorrectOption: { backgroundColor: '#FF4444', borderColor: '#FF4444' },
  scoreText: { fontSize: 42, fontWeight: 'bold', color: Colors.accent.primary, textAlign: 'center', marginVertical: 20 },
  primaryButton: { backgroundColor: Colors.accent.primary, padding: 18, borderRadius: 12, marginTop: 10 },
  primaryButtonText: { color: '#000', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  // Modal Styling
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.9)' },
  modalContent: { width: '85%', backgroundColor: '#111', borderRadius: 20, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: Colors.accent.primary },
  avatarPlaceholder: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(57,255,20,0.1)', marginBottom: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.accent.primary },
  tutorHeader: { fontSize: 22, fontWeight: 'bold', color: Colors.accent.primary, marginBottom: 15, fontFamily: 'monospace' },
  feedbackText: { fontSize: 16, color: '#CCC', textAlign: 'center', marginBottom: 25, lineHeight: 24 },
  modalCloseButton: { backgroundColor: Colors.accent.primary, padding: 16, borderRadius: 12, width: '100%' },
});

export default SkillsLabController;
