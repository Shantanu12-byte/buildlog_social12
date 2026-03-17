import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

export default function AddLogScreen() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

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
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!caption.trim()) {
      Alert.alert('Quest Incomplete', 'Please describe what you built today!');
      return;
    }

    if (!imageUri) {
      Alert.alert('Missing Proof', 'Please attach a screenshot of your progress!');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalUserId = user?.id;

      // Final attempt if user state is missing
      if (!finalUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        finalUserId = session?.user?.id;
      }

      if (!finalUserId) {
        throw new Error('You must be logged in to post. Please try re-logging.');
      }

      let publicImageUrl = '';

      // Image Upload
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

      // Database Insert - Matching Schema
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          author_id: finalUserId,
          project_id: projectId,
          caption: caption.trim(),
          image_url: publicImageUrl,
        });

      if (insertError) throw insertError;

      Alert.alert('Quest Updated!', 'Your progress has been logged to the world.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error adding log:', error);
      Alert.alert('Post Failed', error.message || 'An error occurred while saving your log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
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
            placeholderTextColor="#555555"
            multiline
            numberOfLines={6}
          />

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
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>SAVE_LOG</Text>
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
    backgroundColor: '#0A0A0A',
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
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    color: '#888888',
    marginBottom: Spacing.xs,
    letterSpacing: 1,
  },
  multilineInput: {
    borderWidth: 4,
    borderRadius: 0,
    borderTopColor: '#555555',
    borderLeftColor: '#555555',
    borderBottomColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
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
    backgroundColor: '#111111',
    borderWidth: 4,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  pixelButtonGray: {
    backgroundColor: '#333333',
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 4,
    borderTopColor: '#555555',
    borderLeftColor: '#555555',
    borderBottomColor: '#111111',
    borderRightColor: '#111111',
  },
  pixelButtonText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#2E7D32',
    borderRightColor: '#2E7D32',
    marginTop: Spacing.md,
  },
  saveButtonText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
