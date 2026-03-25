import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions,
  Platform, TouchableOpacity, Share
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  FadeInDown,
} from 'react-native-reanimated';
import NewsCard, { NewsItem } from './NewsCard';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function NewsReader({ 
  items, 
  onClose,
  initialIndex = 0
}: { 
  items: NewsItem[], 
  onClose: () => void,
  initialIndex?: number
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(currentIndex === 0);

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (showSwipeHint) {
      const timer = setTimeout(() => setShowSwipeHint(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showSwipeHint]);

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      translateY.value = withTiming(-height, { duration: 300 }, () => {
        runOnJS(setCurrentIndex)(currentIndex + 1);
        translateY.value = height;
        translateY.value = withTiming(0, { duration: 300 });
      });
    }
  }, [currentIndex, items.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      translateY.value = withTiming(height, { duration: 300 }, () => {
        runOnJS(setCurrentIndex)(currentIndex - 1);
        translateY.value = -height;
        translateY.value = withTiming(0, { duration: 300 });
      });
    }
  }, [currentIndex]);

  // Web Gestures
  const handleWheel = (e: any) => {
    if (Platform.OS === 'web') {
      if (e.deltaY > 0) handleNext();
      else if (e.deltaY < 0) handlePrev();
    }
  };

  const onTouchStart = (e: any) => {
    setTouchStart(e.nativeEvent.pageY || e.nativeEvent.touches[0].pageY);
  };

  const onTouchEnd = (e: any) => {
    const endY = e.nativeEvent.pageY || e.nativeEvent.changedTouches[0].pageY;
    const diff = touchStart - endY;
    if (diff > 50) handleNext();
    else if (diff < -50) handlePrev();
  };

  const handleShare = async () => {
    const current = items[currentIndex];
    if (!current) return;
    try {
      await Share.share({
        title: current.title,
        url: current.url,
        message: `${current.title}\n\nRead more on Buildlog: ${current.url}`,
      });
    } catch (error) {
      console.error('SHARE_ERROR:', error);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(
      Math.abs(translateY.value),
      [0, height],
      [1, 0.5]
    ),
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: withSpring(`${((currentIndex + 1) / items.length) * 100}%`, { damping: 20 }),
  }));

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <View 
      style={s.container}
      // @ts-ignore - web only
      onWheel={handleWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>NEWS</Text>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.headerActionBtn}>
            <Feather name="bell" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={s.headerActionBtn} onPress={handleShare}>
            <Feather name="share-2" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar (Full Width, Flush) */}
      <View style={s.progressBarBg}>
        <Animated.View 
          style={[
            s.progressBarFill, 
            progressStyle
          ]} 
        />
      </View>

      {/* Content */}
      <Animated.View 
        key={currentIndex} 
        entering={FadeInDown.duration(400).delay(currentIndex === 0 ? 100 : 0)} 
        style={[s.content, animatedStyle]}
      >
        <NewsCard 
          item={currentItem} 
          isFirst={currentIndex === 0}
          showSwipeHint={showSwipeHint}
        />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      width: '100%',
      alignSelf: 'center',
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: '#1a1a1a',
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerActionBtn: {
    padding: 6,
  },
  progressBarBg: {
    width: '100%',
    height: 2,
    backgroundColor: 'transparent',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
  },
  content: {
    flex: 1,
  },
});
