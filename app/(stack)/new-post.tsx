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
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Card, SectionHeader, Avatar, Input } from '@/components/ui/UI';

export default function NewPostScreen() {
  const router = useRouter();
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
        // Default to null (Generic Log) to satisfy the "post without project" requirement
        setSelectedProjectId(null);
      }
    } catch (e) {
      console.error('Init error:', e);
    } finally {
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
    } catch (error) {
      console.error('Picker error:', error);
    }
  };

  const handlePost = async () => {
    if (isCurrentlyUploading.current) return;
    if (!imageUri || !caption.trim()) {
      Alert.alert('Incomplete Log', 'Please add proof (image) and write a summary.');
      return;
    }

    setIsUploading(true);
    isCurrentlyUploading.current = true;

    // 1. Zero-Cost Profanity Filter Bridge (Local Node Backend)
    let processedCaption = caption.trim();
    let wasFiltered = false;

    try {
      const filterResponse = await fetch('http://localhost:5000/api/chat/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: caption.trim() })
      });
      const filterData = await filterResponse.json();
      if (filterData.wasFiltered) {
        processedCaption = filterData.cleaned;
        wasFiltered = true;
      }
    } catch (e) {
      console.warn('Content filter service unavailable, using raw caption.');
    }

    try {
      if (!user) throw new Error('Auth session lost. Please login again.');

      // 2. Process and Upload Image
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

      // 3. Insert Post
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          author_id: user.id,
          username: user.user_metadata?.username || 'builder',
          project_id: selectedProjectId,
          projectTitle: selectedProject?.title || '', // Match camelCase schema
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
    } catch (error: any) {
      console.error('Post failed:', error);
      Alert.alert('Post Failed', error.message || 'An error occurred during verification.');
    } finally {
      setIsUploading(false);
      isCurrentlyUploading.current = false;
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="x" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>LOG_ENTRY</Text>
        <TouchableOpacity 
          onPress={handlePost} 
          disabled={isUploading || !caption.trim() || !imageUri}
          style={[s.postBtn, (isUploading || !caption.trim() || !imageUri) && s.postBtnDisabled]}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#000" />
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
              <ActivityIndicator color={Colors.accent.primary} />
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
                  <Text style={[s.projectTitle, selectedProjectId === null && { color: '#000' }]}>
                    GENERIC_LOG
                  </Text>
                </TouchableOpacity>
                {projects.map(p => (
                  <TouchableOpacity 
                    key={p.id}
                    onPress={() => setSelectedProjectId(p.id)}
                    style={[s.projectCard, selectedProjectId === p.id && s.projectCardActive]}
                  >
                    <Text style={[s.projectTitle, selectedProjectId === p.id && { color: '#000' }]}>
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
                  <Text style={[s.projectTitle, selectedProjectId === null && { color: '#000' }]}>
                    GENERIC_LOG (SELECTED)
                  </Text>
                </TouchableOpacity>
                <Text style={s.noneText}>NO_ACTIVE_PROJECTS_FOUND</Text>
                <TouchableOpacity 
                  style={s.createProjectBtn}
                  onPress={() => router.push('/(stack)/create-project')}
                >
                  <Feather name="plus" size={14} color={Colors.accent.glow} />
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
              placeholderTextColor="#555"
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
                  <Feather name="camera" size={32} color="#333" />
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0B' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1.5, fontFamily: Platform.OS === 'ios' ? 'Inter' : 'monospace' },
  backBtn: { padding: 4 },
  postBtn: { backgroundColor: Colors.accent.glow, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  postBtnDisabled: { backgroundColor: '#333', opacity: 0.5 },
  postBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  scroll: { padding: Spacing.lg },
  section: { marginBottom: 24 },
  projectList: { flexDirection: 'row', paddingHorizontal: 4, gap: 12 },
  projectCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
  },
  projectCardActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.glow,
  },
  projectTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'monospace',
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
    borderColor: 'rgba(168, 85, 247, 0.4)',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  createProjectBtnText: {
    color: Colors.accent.glow,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  noneText: { color: '#444', fontSize: 11, fontFamily: 'monospace', textAlign: 'center' },
  entryCard: { padding: 20, marginBottom: 24 },
  inputHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  inputMeta: { flex: 1 },
  username: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  timestamp: { color: '#555', fontSize: 10, fontWeight: '600' },
  textInput: { color: '#EEE', fontSize: 16, minHeight: 100, textAlignVertical: 'top', marginBottom: 20 },
  mediaBox: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#111', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  placeholderTxt: { color: '#444', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  imageWrap: { flex: 1 },
  preview: { width: '100%', height: '100%' },
  changeBadge: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  githubInput: { marginBottom: 8 },
  hint: { color: '#444', fontSize: 10, fontStyle: 'italic' },
});
