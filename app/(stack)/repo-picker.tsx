import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors, Shadows } from '@/constants/theme';
import { githubService, GithubRepo } from '@/services/githubService';
import { useUserStore } from '@/store/userStore';
import { Search, GitBranch, Star, Code2, ChevronRight } from 'lucide-react-native';

export default function RepoPickerScreen() {
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
    } catch (error) {
      console.error('Failed to load repos:', error);
    } finally {
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

  const handleSelectRepo = (repo: GithubRepo) => {
    // In a real flow, you'd pass this back to the "Add Log" screen
    // For now we'll log it and navigate back
    console.log('Selected Repo:', repo.full_name);
    Alert.alert('Success', `Linked ${repo.name} to your log entry!`);
    router.back();
  };

  const renderItem = ({ item }: { item: GithubRepo }) => (
    <TouchableOpacity style={styles.repoItem} onPress={() => handleSelectRepo(item)}>
      <View style={styles.repoInfo}>
        <View style={styles.repoHeader}>
          <GitBranch size={16} color={Colors.accent.primary} />
          <Text style={styles.repoName}>{item.name}</Text>
        </View>
        {item.description && (
          <Text style={styles.repoDesc} numberOfLines={1}>{item.description}</Text>
        )}
        <View style={styles.repoMeta}>
          {item.language && (
            <View style={styles.metaItem}>
              <Code2 size={12} color={Colors.text.tertiary} />
              <Text style={styles.metaText}>{item.language}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Star size={12} color={Colors.text.tertiary} />
            <Text style={styles.metaText}>{item.stargazers_count}</Text>
          </View>
        </View>
      </View>
      <ChevronRight size={20} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Repository</Text>
        <Text style={styles.subtitle}>Link a repo as proof of work</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search repositories..."
          placeholderTextColor={Colors.text.tertiary}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
          <Text style={styles.loadText}>Fetching repositories...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRepos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{search ? 'No repositories found matching your search.' : 'No public repositories found.'}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    margin: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#FFF',
    fontSize: 16,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  repoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
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
    color: '#FFF',
    marginLeft: 8,
  },
  repoDesc: {
    fontSize: 13,
    color: Colors.text.secondary,
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
    color: Colors.text.tertiary,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadText: {
    color: Colors.text.secondary,
    marginTop: 15,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: Colors.text.tertiary,
    fontSize: 14,
    textAlign: 'center',
  },
});
