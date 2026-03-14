import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, NeubrutalismShadow } from '@/constants/theme';
import { ProjectCard, Project } from '@/components/ProjectCard';

// Mock user data
const userData = {
  username: 'alexdev',
  bio: 'Building in public 🚀 Full-stack developer passionate about creating impactful projects.',
  stats: {
    projects: 12,
    streaks: 5,
    collabs: 2,
  },
};

// Mock projects data
const mockProjects: Project[] = [
  { id: '1', title: 'Buildlog App', type: 'code', currentDay: 12, totalDays: 30, status: 'active' },
  { id: '2', title: 'UI Design System', type: 'design', currentDay: 30, totalDays: 30, status: 'completed' },
  { id: '3', title: 'Tech Blog', type: 'writing', currentDay: 8, totalDays: 21, status: 'active' },
  { id: '4', title: 'API Backend', type: 'code', currentDay: 15, totalDays: 30, status: 'active' },
  { id: '5', title: 'Portfolio Site', type: 'design', currentDay: 7, totalDays: 14, status: 'completed' },
  { id: '6', title: 'Open Source Lib', type: 'code', currentDay: 5, totalDays: 30, status: 'active' },
  { id: '7', title: 'Newsletter', type: 'writing', currentDay: 4, totalDays: 7, status: 'active' },
  { id: '8', title: 'Mobile Game', type: 'other', currentDay: 20, totalDays: 30, status: 'active' },
];

export default function ProfileScreen() {
  const renderProject = ({ item }: { item: Project }) => (
    <ProjectCard project={item} />
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
      </View>

      {/* Username */}
      <Text style={styles.username}>@{userData.username}</Text>

      {/* Bio */}
      <Text style={styles.bio}>{userData.bio}</Text>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userData.stats.projects}</Text>
          <Text style={styles.statLabel}>Projects</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userData.stats.streaks}</Text>
          <Text style={styles.statLabel}>Streaks</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userData.stats.collabs}</Text>
          <Text style={styles.statLabel}>Collabs</Text>
        </View>
      </View>

      {/* Social Links - wide black blocks with square white text/icons inside */}
      <View style={styles.socialLinks}>
        <Pressable style={styles.socialButton}>
          <FontAwesome name="github" size={24} color="#FFFFFF" />
          <Text style={styles.socialButtonText}>GITHUB</Text>
        </Pressable>
        <Pressable style={styles.socialButton}>
          <FontAwesome name="linkedin" size={24} color="#FFFFFF" />
          <Text style={styles.socialButtonText}>LINKEDIN</Text>
        </Pressable>
      </View>

      {/* Edit Profile Button */}
      <Pressable style={styles.editButton}>
        <Feather name="edit-2" size={16} color={Colors.textPrimary} />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </Pressable>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>MY PROJECTS</Text>
        <Text style={styles.projectCount}>{userData.stats.projects} total</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="folder" size={48} color={Colors.textSecondary} />
      <Text style={styles.emptyText}>NO PROJECTS YET</Text>
      <Text style={styles.emptySubtext}>Start your first project to see it here</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={mockProjects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing['5xl'],
  },
  row: {
    justifyContent: 'space-between',
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.lg,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 0,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#000000',
    ...NeubrutalismShadow,
  },
  avatarText: {
    color: '#000000',
    fontSize: FontSizes['4xl'],
    fontWeight: 'bold',
  },
  username: {
    color: Colors.textPrimary,
    fontSize: FontSizes['2xl'],
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  bio: {
    color: Colors.textSecondary,
    fontSize: FontSizes.base,
    textAlign: 'center',
    paddingHorizontal: Spacing['3xl'],
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 0,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 4,
    borderColor: '#000000',
    ...NeubrutalismShadow,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 2,
    height: 30,
    backgroundColor: '#000000',
  },
  socialLinks: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    width: '100%',
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#000000',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: '#000000',
    ...NeubrutalismShadow,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 0,
    marginBottom: Spacing['2xl'],
    borderWidth: 4,
    borderColor: '#000000',
    ...NeubrutalismShadow,
  },
  editButtonText: {
    color: '#000000',
    fontSize: FontSizes.base,
    fontWeight: 'bold',
    marginLeft: Spacing.sm,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  projectCount: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
  },
  emptyText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    marginTop: Spacing.md,
    textTransform: 'uppercase',
  },
  emptySubtext: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
});
