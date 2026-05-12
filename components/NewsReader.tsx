import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions,
  Platform, TouchableOpacity, Share, PanResponder, Animated, Easing, Image
} from 'react-native';
import NewsCard, { NewsItem, generateNewsImage } from './NewsCard';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

const { height } = Dimensions.get('window');

export default function NewsReader({ 
  items, 
  onClose,
  initialIndex = 0
}: { 
  items: NewsItem[], 
  onClose: () => void, 
  initialIndex?: number
}) {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  // Preload next 3 images aggressively
  useEffect(() => {
    [1, 2, 3].forEach(offset => {
      const next = items[currentIndex + offset];
      if (next) {
        const url = generateNewsImage(next.title, next.tag);
        Image.prefetch(url).catch(() => {});
      }
    });
  }, [currentIndex, items]);

  const animateTransition = (direction: 'up' | 'down') => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: direction === 'up' ? -1 : 1,
        duration: 280,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease)
      }),
    ]).start(() => {
      // Change story
      if (direction === 'up') {
        setCurrentIndex(prev => Math.min(prev + 1, items.length - 1));
      } else {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      }
      
      slideAnim.setValue(direction === 'up' ? 1 : -1);
      
      // Slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }).start(() => {
        // Small delay to prevent double-swipes
        setTimeout(() => {
          isAnimating.current = false;
        }, 100);
      });
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger on vertical swipes that are distinct
        return Math.abs(gestureState.dy) > 30 && Math.abs(gestureState.vy) > 0.2;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -50 && currentIndex < items.length - 1) {
          // Swipe up -> Next
          animateTransition('up');
        } else if (gestureState.dy > 50 && currentIndex > 0) {
          // Swipe down -> Prev
          animateTransition('down');
        }
      }
    })
  ).current;

  const handleShare = async () => {
    const current = items[currentIndex];
    if (!current) return;
    try {
      await Share.share({
        title: current.title,
        url: current.url,
        message: `${current.title}\n\nRead more on CodeNid: ${current.url}`,
      });
    } catch (error) {}
  };

  // Web Scroll Fix
  const handleWheel = (e: any) => {
    if (Platform.OS === 'web') {
      const deltaY = e.deltaY;
      if (deltaY > 50 && currentIndex < items.length - 1) {
        animateTransition('up');
      } else if (deltaY < -50 && currentIndex > 0) {
        animateTransition('down');
      }
    }
  };

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <View 
      style={s.container}
      {...(Platform.OS === 'web' ? { onWheel: handleWheel } as any : {})}
    >
      {/* Header Fixed Top */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.logoMock}>
            <Feather name="code" size={14} color={isDark ? '#000' : '#fff'} />
          </View>
        </View>
        
        <Text style={s.headerTitle}>TRANSMISSIONS</Text>
        
        <View style={s.headerActions}>
          <TouchableOpacity style={s.headerActionBtn} onPress={handleShare}>
            <Feather name="share-2" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.headerActionBtn} onPress={onClose}>
            <Feather name="x" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={s.progressBarBg}>
        <View style={[s.progressBarFill, { width: `${((currentIndex + 1) / items.length) * 100}%` }]} />
      </View>

      {/* Content Area with Animation & Gestures */}
      <Animated.View 
        style={[
          s.content, 
          {
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-height, 0, height]
              })
            }],
            opacity: slideAnim.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [0, 1, 0]
            })
          }
        ]}
        {...panResponder.panHandlers}
      >
        <NewsCard item={currentItem} />
      </Animated.View>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0a0a0a' : '#f0f2f5',
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      width: '100%',
      alignSelf: 'center',
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.border,
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    height: 60,
    backgroundColor: isDark ? '#0a0a0a' : '#f0f2f5',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logoMock: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: theme.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 2,
    textAlign: 'center',
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  headerActions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  headerActionBtn: {
    padding: 6,
  },
  progressBarBg: {
    width: '100%',
    height: 2, 
    backgroundColor: isDark ? '#1a1a1a' : '#e2e8f0',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1a1a1a' : '#e2e8f0',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.purple,
  },
  content: {
    flex: 1,
  },
});
