import { View, Text, FlatList, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { FeedPostCard, FeedPost } from '@/components/FeedPostCard';
import { ChallengeCard, Challenge } from '@/components/ChallengeCard';

// Mock data for Active Challenges
const MOCK_CHALLENGES: Challenge[] = [
  { id: '1', username: 'Alex', projectName: 'E-commerce App', currentDay: 12, totalDays: 15 },
  { id: '2', username: 'Sarah', projectName: 'AI Chatbot', currentDay: 8, totalDays: 30 },
  { id: '3', username: 'Mike', projectName: 'Portfolio Site', currentDay: 5, totalDays: 15 },
  { id: '4', username: 'Emma', projectName: 'Game Dev', currentDay: 22, totalDays: 30 },
  { id: '5', username: 'John', projectName: 'Mobile App', currentDay: 3, totalDays: 15 },
];

// Mock data for Feed Posts
const MOCK_POSTS: FeedPost[] = [
  {
    id: '1',
    username: 'alex_dev',
    timestamp: '2h ago',
    projectTitle: 'Building an API',
    caption: 'Finally got the authentication system working! 🎉 Next up: implementing rate limiting and caching.',
    hasGithubLink: true,
    cheers: 24,
    comments: 5,
  },
  {
    id: '2',
    username: 'sarah_codes',
    timestamp: '4h ago',
    projectTitle: 'AI Chatbot',
    caption: 'Day 8 of my 30-day sprint. The NLP model is starting to understand context better. Still a long way to go!',
    cheers: 42,
    comments: 12,
  },
  {
    id: '3',
    username: 'mike_builds',
    timestamp: '6h ago',
    projectTitle: 'Portfolio Site',
    caption: 'Added dark mode toggle and smooth animations. Really happy with how the hero section turned out!',
    hasGithubLink: true,
    cheers: 18,
    comments: 3,
  },
  {
    id: '4',
    username: 'emma_ships',
    timestamp: '1d ago',
    projectTitle: 'Game Dev',
    caption: 'Character movement and collision detection done! Now working on the enemy AI. Game development is harder than I thought but so rewarding.',
    cheers: 67,
    comments: 15,
  },
  {
    id: '5',
    username: 'john_codes',
    timestamp: '1d ago',
    projectTitle: 'Mobile App',
    caption: 'Just started my 15-day sprint! Setting up the project structure and navigation today. Let\'s go! 🚀',
    cheers: 31,
    comments: 8,
  },
];

export default function FeedScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>(MOCK_POSTS);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleCheerPress = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, cheers: post.cheers + 1 }
          : post
      )
    );
  };

  const handleCommentPress = (postId: string) => {
    // Navigate to comments screen (to be implemented)
    console.log('Navigate to comments for post:', postId);
  };

  const renderPost = ({ item }: { item: FeedPost }) => (
    <FeedPostCard
      post={item}
      onCheerPress={handleCheerPress}
      onCommentPress={handleCommentPress}
    />
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Active Challenges Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>ACTIVE CHALLENGES</Text>
        <Text style={styles.seeAllText}>See all</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.challengesScroll}
        contentContainerStyle={styles.challengesContent}
      >
        {MOCK_CHALLENGES.map(challenge => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </ScrollView>

      {/* Feed Header */}
      <View style={styles.feedHeader}>
        <Text style={styles.sectionTitle}>LATEST UPDATES</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>NO POSTS YET</Text>
      <Text style={styles.emptyStateSubtext}>
        Start following other builders to see their updates here!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Screen Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.screenTitle}>BUILDLOG</Text>
      </View>

      {/* Main Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  titleContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  screenTitle: {
    fontSize: FontSizes['3xl'],
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
  },
  headerSection: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
  },
  seeAllText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
  challengesScroll: {
    marginBottom: Spacing.lg,
  },
  challengesContent: {
    paddingHorizontal: Spacing.lg,
  },
  feedHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  feedContent: {
    paddingBottom: Spacing['5xl'],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['5xl'],
  },
  emptyStateText: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  emptyStateSubtext: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
