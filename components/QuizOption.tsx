import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

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
  const { theme, isDark } = useTheme();
  
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

  // Map state to dynamic theme styling
  let baseBorderColor = theme.border;
  let staticBackgroundColor = theme.bgInput;
  let baseTextColor = theme.textSecondary;

  if (isAnswered) {
    if (idx === correctIdx) {
      baseBorderColor = theme.green;
      staticBackgroundColor = isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(22, 163, 74, 0.1)';
      baseTextColor = theme.textPrimary;
    } else if (isSelected && !isCorrect) {
      baseBorderColor = theme.red;
      staticBackgroundColor = isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.1)';
      baseTextColor = theme.textPrimary;
    }
  } else if (isSelected) {
    baseBorderColor = theme.purple;
    staticBackgroundColor = isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.05)';
    baseTextColor = theme.textPrimary;
  }

  // Flash color interpolation (to show the instant flash on top of standard styles)
  const animatedBackgroundColor = colorIndex.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      staticBackgroundColor, 
      theme.green + 'CC', // With some alpha
      theme.red + 'CC'   // With some alpha
    ]
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

QuizOption.displayName = 'QuizOption';

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
