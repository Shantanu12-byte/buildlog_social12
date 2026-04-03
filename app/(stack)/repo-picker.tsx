import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Spacing } from '@/constants/theme';
import { githubService, GithubRepo } from '@/services/githubService';
import { useUserStore } from '@/store/userStore';
import { Search, GitBranch, Star, Code2, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

export default function RepoPickerScreen() {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { userId } = useUserStore();

  useEffect(() => {
    loadRepos();
  }, []);

  const loadRepos = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await githubService.fetchUserReposFromBackend(userId);
      setRepos(data);
      setFilteredRepos(data);
    } catch (error) { } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = repos.filter(repo => 
      repo.name.toLowerCase().includes(text.toLowerCase()) || 
      (repo.description && repo.description.toLowerCase().includes(text.toLowerCase()))
    );
    setFilteredRepos(filtered);
  };

  const handleSelectRepo = (repo: GithubRepo) => { Alert.alert('Success', `Linked ${repo.name} to your log entry!`);
    router.back();
  };

  const renderItem = ({ item }: { item: GithubRepo }) => (
    <TouchableOpacity style={s.repoItem} onPress={() => handleSelectRepo(item)} activeOpacity={0.7}>
      <View style={s.repoInfo}>
        <View style={s.repoHeader}>
          <GitBranch size={16} color={theme.purple} />
          <Text style={s.repoName}>{item.name}</Text>
        </View>
        {item.description && (
          <Text style={s.repoDesc} numberOfLines={1}>{item.description}</Text>
        )}
        <View style={s.repoMeta}>
          {item.language && (
            <View style={s.metaItem}>
              <Code2 size={12} color={theme.textMuted} />
              <Text style={s.metaText}>{item.language}</Text>
            </View>
          )}
          <View style={s.metaItem}>
            <Star size={12} color={theme.textMuted} />
            <Text style={s.metaText}>{item.stargazers_count}</Text>
          </View>
        </View>
      </View>
      <ChevronRight size={20} color={theme.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      <View style={s.headSection}>
        <Text style={s.title}>Select Repository</Text>
        <Text style={s.subtitle}>Link a repo as proof of work</Text>
      </View>

      <View style={s.searchContainer}>
        <Search size={20} color={theme.textMuted} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Search repositories..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={s.loaderContainer}>
          <ActivityIndicator size="large" color={theme.purple} />
          <Text style={s.loadText}>Fetching repositories...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRepos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <Text style={s.emptyText}>{search ? 'No repositories found matching your search.' : 'No public repositories found.'}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  headSection: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgInput,
    margin: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: theme.textPrimary,
    fontSize: 16,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  repoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  repoInfo: {
    flex: 1,
  },
  repoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  repoName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginLeft: 8,
  },
  repoDesc: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  repoMeta: {
    flexDirection: 'row',
    gap: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: theme.textMuted,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadText: {
    color: theme.textSecondary,
    marginTop: 15,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: theme.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
