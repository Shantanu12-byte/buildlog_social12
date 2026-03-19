import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView as RN_SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase, getValidSession } from '@/lib/supabase';
import { processImage } from '@/lib/imageProcessor';
import { useUserStore } from '@/store/userStore';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

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
          <View style={styles.avatarFrame}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={40} color="#666666" />
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.changePhotoButton} onPress={handlePickImage}>
            <Text style={styles.changePhotoText}>CHANGE_PHOTO</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>USERNAME</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor="#555"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>BIO</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#555"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GITHUB_URL</Text>
            <TextInput
              style={styles.input}
              value={githubUrl}
              onChangeText={setGithubUrl}
              placeholder="https://github.com/..."
              placeholderTextColor="#555"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>LINKEDIN_URL</Text>
            <TextInput
              style={styles.input}
              value={linkedinUrl}
              onChangeText={setLinkedinUrl}
              placeholder="https://linkedin.com/in/..."
              placeholderTextColor="#555"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>SKILLS (COMMA SEPARATED)</Text>
            <TextInput
              style={styles.input}
              value={skills}
              onChangeText={setSkills}
              placeholder="e.g. Java, React Native, UI Design"
              placeholderTextColor="#555"
            />
          </View>

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
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.disabledButton]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>SAVE_PROFILE</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={isSaving}>
            <Text style={styles.cancelButtonText}>CANCEL</Text>
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
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  header: {
    padding: 24,
    paddingTop: 48,
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarFrame: {
    width: 104,
    height: 104,
    backgroundColor: '#111111',
    borderWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#555555',
    borderRightColor: '#555555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    marginTop: 16,
    backgroundColor: '#8B8B8B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 3,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#555555',
    borderRightColor: '#555555',
  },
  changePhotoText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  form: {
    paddingHorizontal: 24,
    gap: 16,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#888888',
    letterSpacing: 1,
  },
  input: {
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
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    padding: 24,
    gap: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#2E7D32',
    borderRightColor: '#2E7D32',
    borderRadius: 0,
  },
  saveButtonText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'monospace',
    color: '#888888',
    fontSize: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  languageOption: {
    backgroundColor: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#333333',
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
  },
  languageOptionSelected: {
    backgroundColor: '#333333',
    borderColor: '#FFFFFF',
    borderBottomColor: '#888888',
    transform: [{ translateY: 2 }],
  },
  languageOptionText: {
    fontFamily: 'monospace',
    color: '#888888',
    fontSize: 10,
    fontWeight: 'bold',
  },
  languageOptionTextSelected: {
    color: '#FFFFFF',
  },
});