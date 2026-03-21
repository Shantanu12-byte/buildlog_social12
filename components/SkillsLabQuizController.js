// SkillsLabQuizController.js - Controls logic for BuildLog Skills Lab (Zero-Cost Tutor)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LESSON_DATA } from '../constants/LESSON_DATA'; 
import { updateProfileWithSkillsData } from '../services/ProfilePersistenceManager';
import { Colors, Spacing, Radius } from '../constants/theme';

const SkillsLabQuizController = ({ language = "HTML", initialLevel = "Beginner" }) => {
  const [level, setLevel] = useState(initialLevel);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [tutorFeedback, setTutorFeedback] = useState("");
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [roundCompleted, setRoundCompleted] = useState(false);

  const currentQuestions = LESSON_DATA[language]?.[level] || [];
  const currentQuestion = currentQuestions[questionIndex];

  const handleOptionSelect = (index) => {
    if (selectedOption !== null || roundCompleted || !currentQuestion) return;
    
    setSelectedOption(index);
    
    if (index === currentQuestion.correctAnswerIndex) {
      setScore(prevScore => prevScore + 1);
      Alert.alert("Correct!", "Well done!");
      setTimeout(goToNextQuestion, 800);
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
    const results = await updateProfileWithSkillsData({}, {
      topic: language,
      level: level,
      score: score,
      total: currentQuestions.length
    });

    if (results?.awardedTrophy) {
      Alert.alert("🏆 MASTERED!", `You earned the ${results.awardedTrophy.name} trophy!`);
    } else {
      Alert.alert("Round Finished", `Score: ${score}/${currentQuestions.length}. ${results?.nextStep}`);
    }
  };

  if (!currentQuestion && !roundCompleted) {
    return <View style={s.container}><Text style={s.header}>Syncing Lab...</Text></View>;
  }

  if (roundCompleted) {
    return (
      <View style={s.container}>
        <Feather name="zap" size={64} color={Colors.accent.primary} style={{ alignSelf: 'center', marginBottom: 20 }} />
        <Text style={s.header}>Skills Lab Complete!</Text>
        <Text style={s.scoreText}>{score} / {currentQuestions.length}</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => console.log('Exit')}>
          <Text style={s.btnText}>Back to Path</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.header}>{language} {level}</Text>
      <View style={s.progressRow}>
         <Text style={s.pText}>Question {questionIndex + 1}/{currentQuestions.length}</Text>
      </View>
      
      <ScrollView style={s.qContainer} showsVerticalScrollIndicator={false}>
        <Text style={s.qText}>{currentQuestion.question}</Text>
        
        {currentQuestion.codeSnippet && (
          <View style={s.codeBox}>
            <Text style={s.codeText}>{currentQuestion.codeSnippet}</Text>
          </View>
        )}
        
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCorrect = index === currentQuestion.correctAnswerIndex;
          
          return (
            <TouchableOpacity
              key={index}
              style={[s.optBtn, isSelected && (isCorrect ? s.correct : s.wrong)]}
              onPress={() => handleOptionSelect(index)}
              disabled={selectedOption !== null}
            >
              <Text style={[s.optText, isSelected && { color: '#000' }]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal transparent visible={showTutorModal} animationType="fade">
        <View style={s.mOverlay}>
          <View style={s.mContent}>
            <View style={s.avatar}><Text style={{ fontSize: 32 }}>🤖</Text></View>
            <Text style={s.mHeader}>Supportive Tip!</Text>
            <Text style={s.mFeedback}>{tutorFeedback}</Text>
            <TouchableOpacity style={s.mBtn} onPress={() => { setShowTutorModal(false); goToNextQuestion(); }}>
              <Text style={s.btnText}>I understand, next!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, padding: 25, backgroundColor: '#000', justifyContent: 'center' },
  header: { fontSize: 28, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 5, fontFamily: 'monospace' },
  progressRow: { marginBottom: 30, alignItems: 'center' },
  pText: { color: Colors.accent.glow, fontSize: 13, fontFamily: 'monospace', opacity: 0.8 },
  qContainer: { flex: 1 },
  qText: { fontSize: 20, color: '#EEE', marginBottom: 25, fontWeight: '700', lineHeight: 28 },
  codeBox: { backgroundColor: '#111', padding: 15, borderRadius: 10, marginBottom: 25, borderLeftWidth: 4, borderLeftColor: Colors.accent.primary },
  codeText: { fontFamily: 'monospace', color: Colors.accent.glow, fontSize: 14 },
  optBtn: { backgroundColor: '#121212', padding: 20, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  optText: { fontSize: 17, color: '#FFF', fontWeight: 'bold', textAlign: 'center' },
  correct: { backgroundColor: Colors.accent.primary, borderColor: Colors.accent.primary },
  wrong: { backgroundColor: '#FF3B30', borderColor: '#FF3B30' },
  scoreText: { fontSize: 48, fontWeight: '900', color: Colors.accent.primary, textAlign: 'center', marginVertical: 30 },
  primaryBtn: { backgroundColor: Colors.accent.primary, padding: 20, borderRadius: 15 },
  btnText: { color: '#000', textAlign: 'center', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  mOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  mContent: { width: '85%', backgroundColor: '#111', borderRadius: Radius.lg, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: Colors.accent.primary },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(57,255,20,0.1)', marginBottom: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.accent.primary },
  mHeader: { fontSize: 22, fontWeight: '900', color: Colors.accent.primary, marginBottom: 15, textAlign: 'center' },
  mFeedback: { fontSize: 16, color: '#CCC', textAlign: 'center', marginBottom: 30, lineHeight: 24 },
  mBtn: { backgroundColor: Colors.accent.primary, padding: 18, borderRadius: 15, width: '100%' }
});

export default SkillsLabQuizController;
