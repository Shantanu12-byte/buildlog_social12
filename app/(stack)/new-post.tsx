import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView,
  Platform, SafeAreaView, StatusBar
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { processImage } from '@/lib/imageProcessor';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { Card, SectionHeader, Avatar, Input } from '@/components/ui/UI';
import { useTheme } from '@/context/ThemeContext';

export default function NewPostScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const isCurrentlyUploading = useRef(false);
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.replace('/(auth)/login');
        return;
      }
      setUser(authUser);

      // Fetch user projects
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setProjects(data);
        setSelectedProjectId(null);
      }
    } catch (e) { } finally {
      setIsLoadingProjects(false);
    }
  }

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library access is required to share progress.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) { }
  };

  const handlePost = async () => {
    if (isCurrentlyUploading.current) return;
    if (!imageUri || !caption.trim()) {
      Alert.alert('Incomplete Log', 'Please add proof (image) and write a summary.');
      return;
    }

    setIsUploading(true);
    isCurrentlyUploading.current = true;

    let processedCaption = caption.trim();
    let wasFiltered = false;

    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://buildlog-social12.onrender.com';
      const filterResponse = await fetch(`${backendUrl}/api/chat/clean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: caption.trim() })
      });
      const filterData = await filterResponse.json();
      if (filterData.wasFiltered) {
        processedCaption = filterData.cleaned;
        wasFiltered = true;
      }
    } catch (e) { }

    try {
      if (!user) throw new Error('Auth session lost. Please login again.');

      const processedImage = await processImage(imageUri);
      const response = await fetch(processedImage.uri);
      const blob = await response.blob();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, blob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      const selectedProject = projects.find(p => p.id === selectedProjectId);
      
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          author_id: user.id,
          username: user.user_metadata?.username || 'builder',
          project_id: selectedProjectId,
          projectTitle: selectedProject?.title || '',
          image_url: publicUrl,
          caption: githubUrl.trim() ? `${processedCaption}\n\n🔗 ${githubUrl.trim()}` : processedCaption,
        });

      if (insertError) throw insertError;

      if (wasFiltered) {
        Alert.alert(
          'Community Guidelines',
          'Keep it professional, Builder! Your caption was filtered to follow community guidelines.',
          [{ text: 'Got it', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        Alert.alert('Post Success', 'Your log entry has been broadcasted.');
        router.replace('/(tabs)');
      }
    } catch (error: any) { Alert.alert('Post Failed', error.message || 'An error occurred during verification.');
    } finally {
      setIsUploading(false);
      isCurrentlyUploading.current = false;
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="x" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>LOG_ENTRY</Text>
        <TouchableOpacity 
          onPress={handlePost} 
          disabled={isUploading || !caption.trim() || !imageUri}
          style={[s.postBtn, (isUploading || !caption.trim() || !imageUri) && s.postBtnDisabled]}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={isDark ? "#000" : "#FFF"} />
          ) : (
            <Text style={s.postBtnText}>POST</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          
          {/* Project Selection */}
          <View style={s.section}>
            <SectionHeader title="Select Project" />
            {isLoadingProjects ? (
              <ActivityIndicator color={theme.purple} />
            ) : projects.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.projectList}
              >
                <TouchableOpacity 
                  onPress={() => setSelectedProjectId(null)}
                  style={[s.projectCard, selectedProjectId === null && s.projectCardActive]}
                >
                  <Text style={[s.projectTitle, selectedProjectId === null && s.projectTitleActive]}>
                    GENERIC_LOG
                  </Text>
                </TouchableOpacity>
                {projects.map(p => (
                  <TouchableOpacity 
                    key={p.id}
                    onPress={() => setSelectedProjectId(p.id)}
                    style={[s.projectCard, selectedProjectId === p.id && s.projectCardActive]}
                  >
                    <Text style={[s.projectTitle, selectedProjectId === p.id && s.projectTitleActive]}>
                      {p.title.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={s.noProjectsContainer}>
                <TouchableOpacity 
                  onPress={() => setSelectedProjectId(null)}
                  style={[s.projectCard, selectedProjectId === null && s.projectCardActive, { marginBottom: 12 }]}
                >
                  <Text style={[s.projectTitle, selectedProjectId === null && s.projectTitleActive]}>
                    GENERIC_LOG (SELECTED)
                  </Text>
                </TouchableOpacity>
                <Text style={s.noneText}>NO_ACTIVE_PROJECTS_FOUND</Text>
                <TouchableOpacity 
                  style={s.createProjectBtn}
                  onPress={() => router.push('/(stack)/create-project')}
                >
                  <Feather name="plus" size={14} color={theme.purple} />
                  <Text style={s.createProjectBtnText}>START_NEW_PROJECT</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Main Input Area */}
          <Card style={s.entryCard}>
            <View style={s.inputHeader}>
              <Avatar username={user?.user_metadata?.username || 'B'} size={32} />
              <View style={s.inputMeta}>
                <Text style={s.username}>{user?.user_metadata?.username || 'builder'}</Text>
                <Text style={s.timestamp}>PRODUCING_LOG</Text>
              </View>
            </View>
            
            <TextInput
              style={s.textInput}
              placeholder="What did you build today?"
              placeholderTextColor={theme.textMuted}
              multiline
              value={caption}
              onChangeText={setCaption}
              maxLength={1000}
            />

            {/* Image Preview / Picker */}
            <TouchableOpacity style={s.mediaBox} onPress={pickImage} activeOpacity={0.9}>
              {imageUri ? (
                <View style={s.imageWrap}>
                  <Image source={{ uri: imageUri }} style={s.preview} />
                  <View style={s.changeBadge}>
                    <Feather name="edit-2" size={12} color="#FFF" />
                  </View>
                </View>
              ) : (
                <View style={s.placeholder}>
                  <Feather name="camera" size={32} color={theme.textMuted} />
                  <Text style={s.placeholderTxt}>ATTACH_VISUAL_PROOF</Text>
                </View>
              )}
            </TouchableOpacity>
          </Card>

          {/* Proof of Work Section */}
          <View style={s.section}>
            <SectionHeader title="Proof of Work" />
            <Input
              placeholder="GitHub Repo URL (Optional)"
              value={githubUrl}
              onChangeText={setGithubUrl}
              autoCapitalize="none"
              style={s.githubInput}
            />
            <Text style={s.hint}>Validating repository links ensures high-fidelity build logs.</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: '800', letterSpacing: 1.5, fontFamily: Platform.OS === 'ios' ? 'Inter' : 'monospace' },
  backBtn: { padding: 4 },
  postBtn: { backgroundColor: theme.purple, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  postBtnDisabled: { backgroundColor: theme.bgInput, opacity: 0.5 },
  postBtnText: { color: isDark ? '#000' : '#FFF', fontWeight: '800', fontSize: 14 },
  scroll: { padding: Spacing.lg },
  section: { marginBottom: 24 },
  projectList: { flexDirection: 'row', paddingHorizontal: 4, gap: 12 },
  projectCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: theme.bgInput,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
  },
  projectCardActive: {
    backgroundColor: theme.purple,
    borderColor: theme.purple,
  },
  projectTitle: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'monospace',
  },
  projectTitleActive: {
    color: isDark ? '#000' : '#FFF',
  },
  noProjectsContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  createProjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: theme.purpleGlow,
    backgroundColor: isDark ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.05)',
  },
  createProjectBtnText: {
    color: theme.purple,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  noneText: { color: theme.textMuted, fontSize: 11, fontFamily: 'monospace', textAlign: 'center' },
  entryCard: { padding: 20, marginBottom: 24 },
  inputHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  inputMeta: { flex: 1 },
  username: { color: theme.textPrimary, fontSize: 14, fontWeight: '800' },
  timestamp: { color: theme.textMuted, fontSize: 10, fontWeight: '600' },
  textInput: { color: theme.textPrimary, fontSize: 16, minHeight: 100, textAlignVertical: 'top', marginBottom: 20 },
  mediaBox: { width: '100%', aspectRatio: 16 / 9, backgroundColor: theme.bgInput, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.border },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  placeholderTxt: { color: theme.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  imageWrap: { flex: 1 },
  preview: { width: '100%', height: '100%' },
  changeBadge: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  githubInput: { marginBottom: 8 },
  hint: { color: theme.textMuted, fontSize: 10, fontStyle: 'italic' },
});
