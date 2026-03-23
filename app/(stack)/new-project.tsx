import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { githubService, GithubRepo } from '@/services/githubService';
import { LoadingScreen, Button, Input } from '@/components/ui/UI';
import { useUserStore } from '@/store/userStore';
import { detectSkillsFromGitHub } from '@/lib/githubSkillVerifier';

export default function NewProjectScreen() {
  const router = useRouter();
  const { userProfile } = useUserStore();
  
  const [githubUsername, setGithubUsername] = useState('');
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCurrentlySubmitting = React.useRef(false);

  useEffect(() => {
    if (userProfile?.github_url) {
      const parts = userProfile.github_url.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        setGithubUsername(lastPart);
        handleFetchRepos(lastPart);
      }
    }
  }, [userProfile]);

  const handleFetchRepos = async (username: string) => {
    if (!username.trim()) return;
    setIsLoadingRepos(true);
    try {
      const data = await githubService.fetchUserRepos(username.trim());
      setRepos(data);
    } catch (e) {
      Alert.alert('FETCH_ERROR', 'Could not retrieve repositories. Check username and try again.');
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const selectRepo = (repo: GithubRepo) => {
    setSelectedRepo(repo);
    setTitle(repo.name.replace(/[-_]/g, ' ').toUpperCase());
    setDescription(repo.description || '');
    setCaption(`🚀 Just launched a new project from GitHub: ${repo.name.replace(/[-_]/g, ' ')}!`);
    
    // Auto-fill skills from language and topics
    const techStack = new Set<string>();
    if (repo.language) techStack.add(repo.language);
    repo.topics?.forEach(t => techStack.add(t));
    setSkills(Array.from(techStack).join(', '));
  };

  const handleLaunch = async () => {
    if (isCurrentlySubmitting.current) return;
    if (!title.trim() || !description.trim()) {
      Alert.alert('INVALID_INPUT', 'Project Name and Description are mandatory.');
      return;
    }

    if (!userProfile?.id) return;

    setIsSubmitting(true);
    isCurrentlySubmitting.current = true;
    try {
      let githubLanguages = {};
      let autoDetectedSkills: string[] = [];

      // Step 1: Detect skills from GitHub if repo provided
      if (selectedRepo?.html_url) {
        const result = await detectSkillsFromGitHub(selectedRepo.html_url);
        if (!result.error) {
          githubLanguages = result.rawLanguages;
          autoDetectedSkills = result.detectedSkills;
        }
      }

      // Merge manually entered skills with auto-detected ones
      const manuallyEntered = skills.split(',').map(s => s.trim()).filter(s => !!s);
      const FinalSkillsArray = [...new Set([...manuallyEntered, ...autoDetectedSkills])];
      
      const { data: projData, error } = await supabase.from('projects').insert({
        user_id: userProfile.id,
        title: title.trim(),
        description: description.trim(),
        needed_skills: FinalSkillsArray,
        status: 'active',
        github_repo_url: selectedRepo?.html_url || null,
        github_languages: githubLanguages,
      }).select().single();

      if (error) throw error;

      // Also create a post for the feed
      const { error: postError } = await supabase.from('posts').insert({
        author_id: userProfile.id,
        user_id: userProfile.id, 
        username: userProfile.username, // AUTO-FETCHED
        project_id: projData?.id || null, 
        "projectTitle": title.trim(),
        caption: caption.trim() || `🚀 Just launched a new project: ${title.trim()}!`,
        image_url: null, 
      });

      if (postError) throw postError;

      // Recalculate verified skills for the user
      await supabase.rpc('recalculate_verified_skills', { p_user_id: userProfile.id });

      Alert.alert('SYSTEM_ONLINE', 'Project successfully deployed to the grid.');
      router.replace('/(tabs)/profile');
    } catch (e: any) {
      Alert.alert('DEPLOYMENT_FAILED', e.message || 'Fatal error during project launch.');
    } finally {
      setIsSubmitting(false);
      isCurrentlySubmitting.current = false;
    }
  };

  const renderRepoItem = ({ item }: { item: GithubRepo }) => {
    const isSelected = selectedRepo?.id === item.id;
    return (
      <TouchableOpacity 
        style={[s.repoCard, isSelected && s.repoCardSelected]} 
        onPress={() => selectRepo(item)}
      >
        <View style={s.repoHeader}>
          <FontAwesome5 name="github" size={16} color={isSelected ? Colors.cyber.accent : '#888'} />
          <Text style={[s.repoName, isSelected && { color: Colors.cyber.accent }]}>{item.name}</Text>
        </View>
        <Text style={s.repoDesc} numberOfLines={2}>{item.description || 'No description provided.'}</Text>
        <View style={s.repoFooter}>
          <View style={s.repoStat}>
            <Feather name="star" size={12} color="#F1C40F" />
            <Text style={s.repoStatText}>{item.stargazers_count}</Text>
          </View>
          {item.language && (
            <View style={s.langBadge}>
              <View style={[s.langDot, { backgroundColor: Colors.cyber.accent }]} />
              <Text style={s.langText}>{item.language}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>IMPORT_WORK</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* GitHub Fetch Section */}
          <View style={s.fetchSection}>
            <Text style={s.sectionLabel}>GITHUB_IDENTITY</Text>
            <View style={s.searchBar}>
              <TextInput
                style={s.searchInput}
                placeholder="GITHUB_USERNAME"
                placeholderTextColor="#444"
                value={githubUsername}
                onChangeText={setGithubUsername}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={s.fetchBtn} 
                onPress={() => handleFetchRepos(githubUsername)}
                disabled={isLoadingRepos}
              >
                {isLoadingRepos ? (
                  <ActivityIndicator size="small" color={Colors.cyber.accent} />
                ) : (
                  <Feather name="download" size={20} color={Colors.cyber.accent} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Repo List */}
          {repos.length > 0 && (
            <View style={s.repoSection}>
              <Text style={s.sectionLabel}>SELECT_BASE_REPOSITORY</Text>
              <FlatList
                horizontal
                data={repos}
                renderItem={renderRepoItem}
                keyExtractor={item => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.repoList}
              />
            </View>
          )}

          {/* Form Section */}
          <View style={s.formSection}>
            <Text style={s.sectionLabel}>PROJECT_MANIFEST</Text>
            
            <View style={s.formCard}>
              <Input
                label="PROJECT_NAME"
                value={title}
                onChangeText={setTitle}
                placeholder="TERMINAL_X"
                style={s.input}
              />
              
              <Input
                label="SYSTEM_DESCRIPTION"
                value={description}
                onChangeText={setDescription}
                placeholder="Initializing system..."
                multiline
                style={{ ...s.input, height: 100 }}
              />

              <Input
                label="TECH_STACK (COMMA_SEPARATED)"
                value={skills}
                onChangeText={setSkills}
                placeholder="React, Rust, Web3..."
                style={s.input}
              />

              <Input
                label="FEED_CAPTION"
                value={caption}
                onChangeText={setCaption}
                placeholder="Launching into the grid..."
                multiline
                style={{ ...s.input, height: 60 }}
              />

              <Button
                label={isSubmitting ? "UPLOADING_CORE..." : "LAUNCH_PROJECT"}
                onPress={handleLaunch}
                loading={isSubmitting}
                variant="primary"
                style={s.launchBtn}
                textStyle={s.launchBtnText}
              />
            </View>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>// POWERED_BY_GITHUB_API_v3</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cyber.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cyber.border,
  },
  headerTitle: {
    color: Colors.cyber.accent,
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  backBtn: { padding: 4 },
  fetchSection: { padding: Spacing.lg },
  sectionLabel: { 
    color: '#444', 
    fontSize: 10, 
    fontWeight: '800', 
    marginBottom: 10, 
    fontFamily: 'monospace',
    letterSpacing: 1
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: Colors.cyber.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.cyber.border,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#FFF',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  fetchBtn: { padding: 10 },
  repoSection: { marginBottom: 20 },
  repoList: { paddingHorizontal: Spacing.lg, gap: 12 },
  repoCard: {
    width: 220,
    backgroundColor: Colors.cyber.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cyber.border,
    justifyContent: 'space-between',
    height: 140,
  },
  repoCardSelected: {
    borderColor: Colors.cyber.accent,
    backgroundColor: Colors.cyber.dim,
  },
  repoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  repoName: { color: '#FFF', fontWeight: '800', fontSize: 13, fontFamily: 'monospace' },
  repoDesc: { color: '#888', fontSize: 11, lineHeight: 16, marginBottom: 12 },
  repoFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  repoStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  repoStatText: { color: '#666', fontSize: 10, fontWeight: '700' },
  langBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  langDot: { width: 6, height: 6, borderRadius: 3 },
  langText: { color: '#AAA', fontSize: 10, fontWeight: '600' },
  formSection: { padding: Spacing.lg },
  formCard: {
    backgroundColor: Colors.cyber.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cyber.border,
    gap: 16,
  },
  input: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#222',
    color: Colors.cyber.accent,
  },
  launchBtn: {
    backgroundColor: Colors.cyber.accent,
    marginTop: 10,
    height: 56,
    borderRadius: 8,
    borderWidth: 0,
  },
  launchBtnText: {
    color: '#000',
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  footer: { 
    marginVertical: 40, 
    alignItems: 'center', 
    opacity: 0.3 
  },
  footerText: { 
    color: Colors.cyber.accent, 
    fontSize: 8, 
    fontFamily: 'monospace' 
  },
});
