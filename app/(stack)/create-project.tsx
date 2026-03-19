import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { supabase, getValidSession } from '@/lib/supabase';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function CreateProjectScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [isChallenge, setIsChallenge] = useState(false);
  const [duration, setDuration] = useState('30');
  const [lookingForCollabs, setLookingForCollabs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  React.useEffect(() => {
    const getInitialUser = async () => {
      const session = await getValidSession();
      if (session) {
        setUser(session.user);
      } else {
        router.replace('/(auth)/login');
      }
    };
    getInitialUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setUser(session.user);
      else {
        setUser(null);
        router.replace('/(auth)/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('PERMISSION_DENIED', 'Media library access is required for quest capture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Capture error:', e);
      Alert.alert('ERROR', 'FAILED_TO_CAPTURE_DATA');
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Incomplete Quest', 'Please enter a title and description for your project.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Silent Auth Check
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        session = refreshed.session;
      }

      if (!session) {
        router.replace('/(auth)/login');
        return;
      }

      const finalUserId = session.user.id;
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s !== '');

      let publicUrl = null;

      // 2. Handle Image Upload
      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const fileName = `preview-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const filePath = `${finalUserId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-previews')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('project-previews')
          .getPublicUrl(filePath);
        
        publicUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('projects').insert({
        user_id: finalUserId,
        title: title.trim(),
        description: description.trim(),
        image_url: publicUrl,
        needed_skills: skillsArray,
        is_challenge: isChallenge,
        challenge_duration: isChallenge ? parseInt(duration) : null,
        looking_for_collabs: lookingForCollabs,
        status: 'active',
      });

      if (error) throw error;

      Alert.alert('Quest Accepted!', 'Your new project has been created.');
      router.replace('/(tabs)/profile');
    } catch (error: any) {
      console.error('Error creating project:', error);
      Alert.alert('Quest Failed', error.message || 'An error occurred during creation.');
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
          </TouchableOpacity>
          <Text style={styles.title}>NEW_QUEST</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>TITLE</Text>
            <TextInput
              style={styles.pixelInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Project Name..."
              placeholderTextColor="#555555"
            />
          </View>

          {/* Quest Capture Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>QUEST_CAPTURE (16:9_PREVIEW)</Text>
            <TouchableOpacity 
              style={styles.captureFrame} 
              onPress={handlePickImage}
              activeOpacity={0.9}
            >
              {imageUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  {/* CRT Scanline Overlay */}
                  <View style={styles.crtOverlay}>
                    {Array.from({ length: 40 }).map((_, i) => (
                      <View key={i} style={styles.scanline} />
                    ))}
                  </View>
                  <View style={styles.dataLabel}>
                    <Text style={styles.dataLabelText}>[ DATA_CAPTURED ]</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.placeholderBox}>
                  <Feather name="camera" size={32} color="#444" />
                  <Text style={styles.placeholderText}>TAP_TO_CAPTURE_PREVIEW</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput
              style={[styles.pixelInput, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="What are you building?..."
              placeholderTextColor="#555555"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>SKILLS (COMMA_SEPARATED)</Text>
            <TextInput
              style={styles.pixelInput}
              value={skills}
              onChangeText={setSkills}
              placeholder="React, TypeScript, Node..."
              placeholderTextColor="#555555"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>COLLABORATORS_WANTED?</Text>
            <TouchableOpacity
              style={[
                styles.pixelToggle,
                lookingForCollabs ? styles.toggleOn : styles.toggleOff
              ]}
              onPress={() => setLookingForCollabs(!lookingForCollabs)}
            >
              <Text style={styles.toggleText}>{lookingForCollabs ? 'YES' : 'NO'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>ENABLE_CHALLENGE_MODE?</Text>
            <TouchableOpacity
              style={[
                styles.pixelToggle,
                isChallenge ? styles.toggleOn : styles.toggleOff
              ]}
              onPress={() => setIsChallenge(!isChallenge)}
            >
              <Text style={styles.toggleText}>{isChallenge ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          </View>

          {isChallenge && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DURATION (DAYS)</Text>
              <TextInput
                style={styles.pixelInput}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor="#555555"
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleCreate}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>START_PROJECT</Text>
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
    paddingBottom: Spacing['5xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: FontSizes['3xl'],
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  form: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#888888',
    letterSpacing: 1,
  },
  pixelInput: {
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
    marginBottom: 20,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  toggleLabel: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  pixelToggle: {
    width: 80,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#555555',
    borderRightColor: '#555555',
  },
  toggleOn: {
    backgroundColor: '#4CAF50',
  },
  toggleOff: {
    backgroundColor: '#F44336',
  },
  toggleText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  submitButton: {
    marginTop: Spacing.xl,
    backgroundColor: '#2F81F7', // Blue for "POST" (START_PROJECT)
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#1A4D94',
    borderRightColor: '#1A4D94',
    borderRadius: 0,
  },
  submitButtonText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  captureFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0A0A0A',
    borderWidth: 4,
    borderTopColor: '#555555',
    borderLeftColor: '#555555',
    borderBottomColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
    marginBottom: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    width: '100%',
    height: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  crtOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  scanline: {
    height: 1,
    width: '100%',
    backgroundColor: '#000',
    opacity: 0.1,
    marginBottom: 2,
  },
  dataLabel: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#00FFFF',
  },
  dataLabelText: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#00FFFF',
    fontWeight: 'bold',
  },
  placeholderBox: {
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#444',
  },
});
