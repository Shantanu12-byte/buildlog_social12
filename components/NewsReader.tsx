import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions,
  Platform, TouchableOpacity, Share, FlatList
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
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Spacing } from '@/constants/theme';

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
  const [showSwipeHint, setShowSwipeHint] = useState(currentIndex === 0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (showSwipeHint) {
      const timer = setTimeout(() => setShowSwipeHint(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showSwipeHint]);

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
      // Share error handled silently
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

  const onScrollIndexChanged = useCallback((e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / height);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  }, [currentIndex]);

  if (items.length === 0) return null;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>TRANSMISSIONS</Text>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.headerActionBtn} onPress={handleShare}>
            <Feather name="share-2" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.headerActionBtn} onPress={onClose}>
            <Feather name="x" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={s.progressBarBg}>
        <Animated.View 
          style={[
            s.progressBarFill, 
            progressStyle
          ]} 
        />
      </View>

      {/* Vertical Feed */}
      <FlatList
        data={items}
        keyExtractor={(item: NewsItem) => item.id.toString()}
        renderItem={({ item }: { item: NewsItem }) => (
          <View style={{ height: height }}>
            <NewsCard item={item} />
          </View>
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={onScrollIndexChanged}
        initialScrollIndex={initialIndex}
        getItemLayout={(_: any, index: number) => ({
          length: height,
          offset: height * index,
          index,
        })}
        // Optimizations
        removeClippedSubviews={Platform.OS !== 'ios'}
        initialNumToRender={1}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
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
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
    height: 3,
    backgroundColor: theme.bgInput,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.purple,
  },
  content: {
    flex: 1,
  },
});
