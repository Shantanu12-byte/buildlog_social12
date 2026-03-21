import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface QuizOptionProps {
  opt: string;
  idx: number;
  isSelected: boolean;
  isAnswered: boolean;
  isCorrect: boolean | null;
  correctIdx: number;
  onPress: () => void;
}

const QuizOption = forwardRef((props: QuizOptionProps, ref) => {
  const { opt, idx, isSelected, isAnswered, isCorrect, correctIdx, onPress } = props;
  const scale = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const colorIndex = useRef(new Animated.Value(0)).current; // 0=default, 1=green, 2=red

  // Expose playCorrectAnimation and playIncorrectAnimation to parent
  useImperativeHandle(ref, () => ({
    playCorrectAnimation: () => {
      // Instantly switch to flash state
      Animated.timing(colorIndex, { toValue: 1, duration: 0, useNativeDriver: false }).start();
      
      // Scale pulse
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.1, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true })
      ]).start();
      
      // Optionally reset color later if needed, but since it's answered, we can leave it
    },
    playIncorrectAnimation: () => {
      // Instantly switch to red flash state
      Animated.timing(colorIndex, { toValue: 2, duration: 0, useNativeDriver: false }).start();
      
      // Shake sequence (Left to right 3 times)
      Animated.sequence([
        Animated.timing(shake, { toValue: -15, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 15, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -15, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 15, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -15, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 15, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }));

  // Map state to the user's Mimo Cyber-Noir styling
  let baseBorderColor = '#333';
  let staticBackgroundColor = '#1A1A1A';
  let baseTextColor = '#AAA';

  if (isAnswered) {
    if (idx === correctIdx) {
      baseBorderColor = '#1D9E75';
      staticBackgroundColor = 'rgba(29,158,117,0.1)';
      baseTextColor = '#FFF';
    } else if (isSelected && !isCorrect) {
      baseBorderColor = '#FF4444';
      staticBackgroundColor = 'rgba(255,68,68,0.1)';
      baseTextColor = '#FFF';
    }
  } else if (isSelected) {
    baseBorderColor = Colors.accent.primary;
    staticBackgroundColor = 'rgba(57,255,20,0.05)';
    baseTextColor = '#FFF';
  }

  // Flash color interpolation (to show the instant flash on top of standard styles)
  const animatedBackgroundColor = colorIndex.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [staticBackgroundColor, 'rgba(29, 158, 117, 0.8)', 'rgba(255, 68, 68, 0.8)']
  });

  return (
    <Animated.View style={[
      styles.animatedWrapper,
      {
        borderColor: baseBorderColor,
        backgroundColor: animatedBackgroundColor,
        transform: [{ scale }, { translateX: shake }]
      }
    ]}>
      <TouchableOpacity 
        style={styles.mcqBtn}
        onPress={onPress}
        disabled={isAnswered}
        activeOpacity={0.7}
      >
        <Text style={[styles.mcqBtnText, { color: baseTextColor }]}>{opt}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default QuizOption;

const styles = StyleSheet.create({
  animatedWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mcqBtn: { 
    padding: 18, 
    width: '100%',
  },
  mcqBtnText: { 
    fontSize: 16, 
    fontWeight: '600' 
  }
});
