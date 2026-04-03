import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { supabase, getValidSession } from '@/lib/supabase';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Input, Button } from '@/components/ui/UI';

export default function CreateProjectScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [isChallenge, setIsChallenge] = useState(false);
  const [duration, setDuration] = useState('30');
  const [lookingForCollabs, setLookingForCollabs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCurrentlySubmitting = React.useRef(false);
  const [user, setUser] = useState<any>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [feedCaption, setFeedCaption] = useState('');

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
    } catch (e) { Alert.alert('ERROR', 'FAILED_TO_CAPTURE_DATA');
    }
  };

  const handleCreate = async () => {
    if (isCurrentlySubmitting.current) return;
    if (!title.trim() || !description.trim()) {
      Alert.alert('Incomplete Project', 'Please enter a title and description for your project.');
      return;
    }

    setIsSubmitting(true);
    isCurrentlySubmitting.current = true;
    try {
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

      const { error: postError } = await supabase.from('posts').insert({
        user_id: finalUserId,
        author_id: finalUserId,
        username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Builder',
        "projectTitle": title.trim(),
        caption: feedCaption.trim() || description.trim(),
        image_url: publicUrl,
        likes_count: 0,
        comments: 0
      });

      if (postError) throw postError;

      Alert.alert('Success', 'Your new project has been created.');
      router.replace('/(tabs)/profile');
    } catch (error: any) { Alert.alert('Error', error.message || 'An error occurred during creation.');
    } finally {
      setIsSubmitting(false);
      isCurrentlySubmitting.current = false;
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton} activeOpacity={0.75}>
          <Feather name="chevron-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>New Project</Text>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.form}>
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Project Name..."
          />

          {/* Project Preview Image */}
          <View style={s.inputGroup}>
            <Text style={s.label}>PREVIEW IMAGE (16:9)</Text>
            <TouchableOpacity 
              style={s.captureFrame} 
              onPress={handlePickImage}
              activeOpacity={0.8}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={s.previewImage} contentFit="cover" />
              ) : (
                <View style={s.placeholderBox}>
                  <Feather name="image" size={32} color={theme.textMuted} />
                  <Text style={s.placeholderText}>Tap to upload preview</Text>
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

          <Input
            label="Feed Caption"
            value={feedCaption}
            onChangeText={setFeedCaption}
            placeholder="What should the feed say?..."
            multiline
          />

          {/* Toggles */}
          <View style={s.togglesSection}>
            <View style={s.toggleRow}>
              <Text style={s.toggleLabel}>Open for Collaborators?</Text>
              <TouchableOpacity
                style={[s.toggleBtn, lookingForCollabs ? s.toggleOn : s.toggleOff]}
                onPress={() => setLookingForCollabs(!lookingForCollabs)}
                activeOpacity={0.8}
              >
                <Text style={[s.toggleText, lookingForCollabs && s.toggleTextActive]}>
                  {lookingForCollabs ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={s.toggleRow}>
              <Text style={s.toggleLabel}>Enable Challenge Mode?</Text>
              <TouchableOpacity
                style={[s.toggleBtn, isChallenge ? s.toggleOn : s.toggleOff]}
                onPress={() => setIsChallenge(!isChallenge)}
                activeOpacity={0.8}
              >
                <Text style={[s.toggleText, isChallenge && s.toggleTextActive]}>
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

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  backButton: {
    marginRight: Spacing.sm,
    padding: 4,
  },
  title: {
    color: theme.textPrimary,
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
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  captureFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: theme.bgInput,
    borderWidth: 0.5,
    borderColor: theme.border,
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
    color: theme.textMuted,
  },
  togglesSection: {
    backgroundColor: theme.bgInput,
    borderWidth: 0.5,
    borderColor: theme.border,
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
    color: theme.textSecondary,
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
    backgroundColor: theme.bgInput,
    borderColor: theme.border,
  },
  toggleOn: {
    backgroundColor: isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(74, 222, 128, 0.05)',
    borderColor: theme.green,
  },
  toggleText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: theme.textMuted,
  },
  toggleTextActive: {
    color: theme.green,
  },
});
