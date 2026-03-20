import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { supabase, getValidSession } from '@/lib/supabase';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Input, Button } from '@/components/ui/UI';

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
  }, [router]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('PERMISSION_DENIED', 'Media library access is required for project capture.');
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
      Alert.alert('Incomplete Project', 'Please enter a title and description for your project.');
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

      // Announce on Feed
      await supabase.from('posts').insert({
        user_id: finalUserId,
        author_id: finalUserId,
        username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Builder',
        projectTitle: title.trim(),
        caption: description.trim(),
        imageUrl: publicUrl,
        cheers: 0,
        comments: 0
      });

      Alert.alert('Success', 'Your new project has been created.');
      router.replace('/(tabs)/profile');
    } catch (error: any) {
      console.error('Error creating project:', error);
      Alert.alert('Error', error.message || 'An error occurred during creation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.75}>
          <Feather name="chevron-left" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Project</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Project Name..."
          />

          {/* Project Preview Image */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PREVIEW IMAGE (16:9)</Text>
            <TouchableOpacity 
              style={styles.captureFrame} 
              onPress={handlePickImage}
              activeOpacity={0.8}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
              ) : (
                <View style={styles.placeholderBox}>
                  <Feather name="image" size={32} color={Colors.text.tertiary} />
                  <Text style={styles.placeholderText}>Tap to upload preview</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What are you building?..."
            multiline
          />

          <Input
            label="Skills (Comma_Separated)"
            value={skills}
            onChangeText={setSkills}
            placeholder="React, TypeScript, Node..."
          />

          {/* Toggles */}
          <View style={styles.togglesSection}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Open for Collaborators?</Text>
              <TouchableOpacity
                style={[styles.toggleBtn, lookingForCollabs ? styles.toggleOn : styles.toggleOff]}
                onPress={() => setLookingForCollabs(!lookingForCollabs)}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, lookingForCollabs && styles.toggleTextActive]}>
                  {lookingForCollabs ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Enable Challenge Mode?</Text>
              <TouchableOpacity
                style={[styles.toggleBtn, isChallenge ? styles.toggleOn : styles.toggleOff]}
                onPress={() => setIsChallenge(!isChallenge)}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, isChallenge && styles.toggleTextActive]}>
                  {isChallenge ? 'On' : 'Off'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {isChallenge && (
            <Input
              label="Duration (Days)"
              value={duration}
              onChangeText={setDuration}
              placeholder="30"
            />
          )}

          <Button
            label="Start Project"
            onPress={handleCreate}
            loading={isSubmitting}
            style={{ marginTop: Spacing.xl }}
            variant="primary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border.subtle,
  },
  backButton: {
    marginRight: Spacing.sm,
    padding: 4,
  },
  title: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingBottom: Spacing['4xl'],
  },
  form: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    letterSpacing: 0.5,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  captureFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.bg.secondary,
    borderWidth: 0.5,
    borderColor: Colors.border.default,
    borderRadius: Radius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },
  togglesSection: {
    backgroundColor: Colors.bg.secondary,
    borderWidth: 0.5,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    minWidth: 80,
    alignItems: 'center',
  },
  toggleOff: {
    backgroundColor: Colors.bg.tertiary,
    borderColor: Colors.border.default,
  },
  toggleOn: {
    backgroundColor: 'rgba(46,160,67,0.15)',
    borderColor: 'rgba(46,160,67,0.3)',
  },
  toggleText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: Colors.text.tertiary,
  },
  toggleTextActive: {
    color: '#2EA043', // Colors.success
  },
});
