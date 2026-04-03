import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { FontSizes, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Feather } from '@expo/vector-icons';

export default function AddLogScreen() {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();
  const { projectId, repoName, repoUrl } = useLocalSearchParams<{ 
    projectId: string;
    repoName?: string;
    repoUrl?: string; 
  }>();
  
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCurrentlySubmitting = React.useRef(false);
  const [user, setUser] = useState<any>(null);
  const [linkedRepo, setLinkedRepo] = useState<{ name: string, url: string } | null>(
    repoName ? { name: repoName, url: repoUrl || '' } : null
  );

  React.useEffect(() => {
    const getInitialUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUser(session.user);
    };
    getInitialUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setUser(session.user);
      else setUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are required to share progress.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) { Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (isCurrentlySubmitting.current) return;
    if (!caption.trim()) {
      Alert.alert('Quest Incomplete', 'Please describe what you built today!');
      return;
    }

    if (!imageUri) {
      Alert.alert('Missing Proof', 'Please attach a screenshot of your progress!');
      return;
    }

    setIsSubmitting(true);
    isCurrentlySubmitting.current = true;

    try {
      let finalUserId = user?.id;

      if (!finalUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        finalUserId = session?.user?.id;
      }

      if (!finalUserId) {
        throw new Error('You must be logged in to post. Please try re-logging.');
      }

      let publicImageUrl = '';

      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const filePath = `${finalUserId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(filePath);
        
        publicImageUrl = publicUrl;
      }

      const { error: insertError } = await supabase
        .from('quest_logs')
        .insert({
          user_id: finalUserId,
          quest_id: projectId,
          content: caption.trim(),
          image_url: publicImageUrl,
          github_repo_name: linkedRepo?.name,
          github_repo_url: linkedRepo?.url,
        });

      if (insertError) throw insertError;

      Alert.alert('Quest Updated!', 'Your progress has been logged to the world.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) { Alert.alert('Post Failed', error.message || 'An error occurred while saving your log.');
    } finally {
      setIsSubmitting(false);
      isCurrentlySubmitting.current = false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.textPrimary} />
            <Text style={styles.backText}>BACK</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LOG_PROGRESS</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>WHAT_DID_YOU_BUILD_TODAY?</Text>
          <TextInput
            style={styles.multilineInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="Documenting my journey..."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={6}
          />
          
          {linkedRepo && (
            <View style={styles.linkedRepoChip}>
              <Feather name="git-branch" size={14} color={theme.purple} />
              <Text style={styles.linkedRepoText} numberOfLines={1}>{linkedRepo.name}</Text>
              <TouchableOpacity onPress={() => setLinkedRepo(null)}>
                <Feather name="x" size={14} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.imageSection}>
            <Text style={styles.label}>VISUAL_PROOF (SCREENSHOT)</Text>
            {imageUri && (
              <View style={styles.imageFrame}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              </View>
            )}
            <TouchableOpacity style={styles.pixelButtonGray} onPress={handlePickImage} disabled={isSubmitting}>
              <Text style={styles.pixelButtonText}>
                {imageUri ? 'CHANGE_IMAGE' : 'ATTACH_SCREENSHOT'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, isSubmitting && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.textPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>SAVE_LOG</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scrollContent: {
    paddingBottom: Spacing['5xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontFamily: 'monospace',
    color: theme.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: theme.textPrimary,
    letterSpacing: 2,
  },
  form: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.xl,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: theme.textSecondary,
    marginBottom: Spacing.xs,
    letterSpacing: 1,
  },
  multilineInput: {
    borderWidth: 4,
    borderRadius: 0,
    borderTopColor: isDark ? '#333333' : theme.border,
    borderLeftColor: isDark ? '#333333' : theme.border,
    borderBottomColor: theme.textPrimary,
    borderRightColor: theme.textPrimary,
    backgroundColor: theme.bgInput,
    color: theme.textPrimary,
    fontFamily: 'monospace',
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imageSection: {
    gap: Spacing.md,
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: theme.bgCard,
    borderWidth: 4,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  pixelButtonGray: {
    backgroundColor: theme.bgCard,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 4,
    borderTopColor: isDark ? '#333333' : theme.border,
    borderLeftColor: isDark ? '#333333' : theme.border,
    borderBottomColor: theme.bg,
    borderRightColor: theme.bg,
  },
  pixelButtonText: {
    fontFamily: 'monospace',
    color: theme.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: theme.green,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 4,
    borderTopColor: theme.textPrimary,
    borderLeftColor: theme.textPrimary,
    borderBottomColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)',
    borderRightColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)',
    marginTop: Spacing.md,
  },
  saveButtonText: {
    fontFamily: 'monospace',
    color: isDark ? '#000' : '#FFF',
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  linkedRepoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgInput,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 8,
    alignSelf: 'flex-start',
  },
  linkedRepoText: {
    fontFamily: 'monospace',
    color: theme.textPrimary,
    fontSize: 12,
    maxWidth: 200,
  },
  });
}
