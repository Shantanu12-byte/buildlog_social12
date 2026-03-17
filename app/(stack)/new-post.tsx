import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { processImage } from '@/lib/imageProcessor';
import { Colors, FontSizes, Spacing } from '@/constants/theme';

export default function NewPostScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Fetch projects for selection
  React.useEffect(() => {
    const fetchUserProjects = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('projects')
            .select('id, title')
            .eq('user_id', user.id);
          
          if (!error && data) {
            setProjects(data);
            if (data.length > 0) setSelectedProjectId(data[0].id);
          }
        }
      } catch (e) {
        console.error('Error fetching user projects:', e);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchUserProjects();
  }, []);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Newer API format
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setImageUri(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handlePost = async () => {
    if (!imageUri || !caption.trim() || !selectedProjectId) {
      Alert.alert('Incomplete Post', 'Please select an image, write a caption, and choose a project.');
      return;
    }

    setIsUploading(true);

    try {
      console.log('🎁 SHARE_WORLD: Starting post process...');
      
      // 1. Get current user - with a small delay for session hydration
      let userId = '';
      let retries = 0;
      
      while (retries < 2) {
        console.log(`🔍 AUTH CHECK (Attempt ${retries + 1}): Attempting getUser()...`);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (user) {
          userId = user.id;
          console.log('✅ getUser success:', userId);
          break;
        }

        console.log('⚠️ getUser fail. Checking getSession()...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          userId = session.user.id;
          console.log('✅ getSession success:', userId);
          break;
        }

        // Wait 300ms before retry
        await new Promise(resolve => setTimeout(resolve, 300));
        retries++;
      }

      if (!userId) {
        console.error('❌ AUTH CHECK FAILED: Final attempt failed.');
        throw new Error('You must be logged in to post. Please sign in again.');
      }

      // 2. Process and Upload Image
      console.log('📸 IMAGE_UPLOAD: Compressing image...');
      const processedImage = await processImage(imageUri);
      
      const response = await fetch(processedImage.uri);
      const blob = await response.blob();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `${userId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      // 4. Insert Post into Database - aligning with author_id and project_id
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          author_id: userId,
          project_id: selectedProjectId,
          image_url: publicUrl,
          caption: caption.trim(),
          github_url: githubUrl.trim() || null,
        });

      if (insertError) throw insertError;

      Alert.alert('Success!', 'Your buildlog has been shared.');
      
      // Reset state
      setImageUri(null);
      setCaption('');
      setGithubUrl('');
      
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Error sharing post:', error);
      Alert.alert('Post Failed', error.message || 'An error occurred during submission.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>NEW_POST</Text>
          <Text style={styles.subtitle}>SHARE_YOUR_PROGRESS</Text>
        </View>

        {/* Project Selector */}
        <View style={styles.projectSelector}>
          <Text style={styles.label}>SELECT_QUEST (PROJECT)</Text>
          {isLoadingProjects ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : projects.length > 0 ? (
            <View style={styles.projectList}>
              {projects.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.projectItem,
                    selectedProjectId === p.id && styles.projectItemSelected
                  ]}
                  onPress={() => setSelectedProjectId(p.id)}
                >
                  <Text style={[
                    styles.projectItemText,
                    selectedProjectId === p.id && styles.projectItemTextSelected
                  ]}>
                    {p.title.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noProjectsText}>NO_ACTIVE_QUESTS. CREATE_ONE_FIRST!</Text>
          )}
        </View>

        {/* Image Picker Area */}
        <TouchableOpacity 
          style={styles.imagePicker} 
          onPress={pickImage}
          activeOpacity={0.8}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholderBox}>
              <Feather name="plus-square" size={48} color="#666666" />
              <Text style={styles.placeholderText}>TAP_TO_SELECT_IMAGE</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Inputs */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CAPTION</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="What are you building?..."
                placeholderTextColor="#666666"
                multiline
                value={caption}
                onChangeText={setCaption}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GITHUB_REPO_URL</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="https://github.com/..."
                placeholderTextColor="#666666"
                value={githubUrl}
                onChangeText={setGithubUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isUploading && styles.disabledButton]} 
            onPress={handlePost}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>SHARE_WORLD</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: Spacing['2xl'],
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: FontSizes['3xl'],
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#888888',
    textTransform: 'uppercase',
  },
  projectSelector: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  projectList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  projectItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#333333',
  },
  projectItemSelected: {
    backgroundColor: '#8B8B8B',
    borderColor: '#FFFFFF',
  },
  projectItemText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#888888',
  },
  projectItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  noProjectsText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#FF5555',
    marginTop: Spacing.sm,
  },
  imagePicker: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#111111',
    borderWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#222222',
    borderRightColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderBox: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  placeholderText: {
    fontFamily: 'monospace',
    color: '#666666',
    fontSize: 12,
  },
  form: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#888888',
    letterSpacing: 1.5,
  },
  inputWrap: {
    backgroundColor: '#222222',
    borderWidth: 2,
    borderTopColor: '#000000',
    borderLeftColor: '#000000',
    borderBottomColor: '#444444',
    borderRightColor: '#444444',
  },
  input: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: FontSizes.base,
    padding: Spacing.md,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: Spacing.md,
    backgroundColor: '#8B8B8B',
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#333333',
    borderRightColor: '#333333',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
});
