import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView as RN_SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase, getValidSession } from '@/lib/supabase';
import { processImage } from '@/lib/imageProcessor';
import { useUserStore } from '@/store/userStore';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Input, Button, Avatar } from '@/components/ui/UI';

export default function EditProfileScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [skills, setSkills] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const { updateUserProfile } = useUserStore();

  const PREDEFINED_LANGUAGES = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 
    'Go', 'Rust', 'Ruby', 'Swift', 'PHP', 'HTML', 'CSS'
  ];

  // Robust session tracking
  useEffect(() => {
    const getInitialUser = async () => {
      try {
        const session = await getValidSession();
        
        if (!session) {
          router.replace('/(auth)/login');
          return;
        }

        const user = session.user;
        setUserId(user.id);
        
        // Now proceed with the profile fetch
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profile) {
          setUsername(profile.username || '');
          setBio(profile.bio || '');
          setGithubUrl(profile.github_url || '');
          setLinkedinUrl(profile.linkedin_url || '');
          setAvatarUrl(profile.avatar_url || null);
          if (profile.skills && Array.isArray(profile.skills)) {
            setSkills(profile.skills.join(', '));
          }
          if (profile.languages && Array.isArray(profile.languages)) {
            setSelectedLanguages(profile.languages);
          }
        }
      } catch (e) {
        console.error('Fetch error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUserId(session.user.id);
      } else if (_event === 'SIGNED_OUT') {
        setUserId(null);
        router.replace('/(auth)/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUrl(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Image picker error:', e);
    }
  };

  const handleSave = async () => {
    console.log('🔘 BUTTON_CLICKED: SAVE_PROFILE pressed');
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    console.log('💾 PROFILE_SAVE_START: Initiating characterize update...');
    setIsSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;

      // 1. Handle Avatar Upload if it's a new local image
      const isNewLocalImage = avatarUrl && (avatarUrl.startsWith('file://') || avatarUrl.startsWith('blob:') || avatarUrl.startsWith('data:'));
      if (isNewLocalImage) {
        console.log('📸 AVATAR_UPLOAD: Compressing and processing image...');
        const processedImage = await processImage(avatarUrl);
        const response = await fetch(processedImage.uri);
        const blob = await response.blob();
        const fileName = `avatar-${userId}-${Date.now()}.jpg`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        finalAvatarUrl = urlData.publicUrl;
      }

      console.log('📸 AVATAR_COMPLETE: Final URL:', finalAvatarUrl);

      const skillsArray = skills.split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      // 2. Update Global State (Store handles DB sync internally)
      console.log('🔄 SYNC_START: Updating character data in global store...');
      await updateUserProfile({
        username: username.trim(),
        bio: bio.trim(),
        github_url: githubUrl.trim(),
        linkedin_url: linkedinUrl.trim(),
        avatar_url: finalAvatarUrl,
        skills: skillsArray,
        languages: selectedLanguages,
      });
      
      console.log('✨ SYNC_COMPLETE: Profile logic finished.');

      Alert.alert('QUEST_UPDATED', 'CHARACTER_DATA_SYNCED', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>EDIT_PROFILE</Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
            <View style={styles.avatarWrapper}>
              <Avatar 
                username={username || 'builder'} 
                uri={avatarUrl} 
                size={120} 
              />
              <View style={styles.editIconBadge}>
                <Feather name="camera" size={16} color="#FFF" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>TAP_TO_CHANGE_IDENTITY_VISUAL</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <Input
            label="USERNAME"
            value={username}
            onChangeText={setUsername}
            placeholder="OPERATOR_TAG"
          />

          <Input
            label="BIO"
            value={bio}
            onChangeText={setBio}
            placeholder="ENCRYPTED_STATUS_MESSAGE"
            multiline
          />

          <Input
            label="GITHUB_URL"
            value={githubUrl}
            onChangeText={setGithubUrl}
            placeholder="https://github.com/..."
            autoCapitalize="none"
          />

          <Input
            label="LINKEDIN_URL"
            value={linkedinUrl}
            onChangeText={setLinkedinUrl}
            placeholder="https://linkedin.com/in/..."
            autoCapitalize="none"
          />

          <Input
            label="SKILLS (COMMA SEPARATED)"
            value={skills}
            onChangeText={setSkills}
            placeholder="REACT, NODE, DESIGN"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>LANGUAGE_STACK (SELECT_YOUR_POWER)</Text>
            <View style={styles.languagesGrid}>
              {PREDEFINED_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.languageOption,
                      isSelected && styles.languageOptionSelected
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedLanguages(prev => prev.filter(l => l !== lang));
                      } else {
                        setSelectedLanguages(prev => [...prev, lang]);
                      }
                    }}
                  >
                    <Text style={[
                      styles.languageOptionText,
                      isSelected && styles.languageOptionTextSelected
                    ]}>
                      {lang.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            label="SYNC_PROFILE_DATA"
            onPress={handleSave}
            loading={isSaving}
            variant="primary"
          />

          <Button
            label="ABORT_CHANGES"
            onPress={() => router.back()}
            variant="ghost"
            style={{ marginTop: 8 }}
          />
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
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: '900',
    color: Colors.accent.glow,
    letterSpacing: 3,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    position: 'relative',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.accent.primary,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000',
  },
  avatarHint: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#444',
    marginTop: 12,
    letterSpacing: 1,
  },
  form: {
    paddingHorizontal: 24,
    gap: 8,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#888888',
    letterSpacing: 1,
    marginBottom: 8,
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  languageOption: {
    backgroundColor: '#090909',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#222',
  },
  languageOptionSelected: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: Colors.accent.primary,
  },
  languageOptionText: {
    fontFamily: 'monospace',
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
  },
  languageOptionTextSelected: {
    color: Colors.accent.glow,
  },
  actions: {
    padding: 24,
    marginTop: 12,
  },
});