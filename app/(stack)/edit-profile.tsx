import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView as RN_SafeAreaView, ScrollView, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase, getValidSession } from '@/lib/supabase';
import { processImage } from '@/lib/imageProcessor';
import { useUserStore } from '@/store/userStore';
import { Spacing, Radius, Typography } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { Input, Button, Avatar } from '@/components/ui/UI';
import { useTheme } from '@/context/ThemeContext';

export default function EditProfileScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [originalUsername, setOriginalUsername] = useState('');
  const [skills, setSkills] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const { updateUserProfile } = useUserStore();

  const PREDEFINED_LANGUAGES = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 
    'Go', 'Rust', 'Ruby', 'Swift', 'PHP', 'HTML', 'CSS'
  ];

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
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) { } else if (profile) {
          setUsername(profile.username || '');
          setOriginalUsername(profile.username || '');
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
      } catch (e) { } finally {
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
    } catch (e) { }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;

      const isNewLocalImage = avatarUrl && (avatarUrl.startsWith('file://') || avatarUrl.startsWith('blob:') || avatarUrl.startsWith('data:'));
      if (isNewLocalImage) {
        const processedImage = await processImage(avatarUrl!);
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


      const skillsArray = skills.split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      await updateUserProfile({
        username: username.trim(),
        bio: bio.trim(),
        github_url: githubUrl.trim(),
        linkedin_url: linkedinUrl.trim(),
        avatar_url: finalAvatarUrl,
        skills: skillsArray,
        languages: selectedLanguages,
      });
      

      Alert.alert('QUEST_UPDATED', 'CHARACTER_DATA_SYNCED', [{ 
        text: 'OK', 
        onPress: () => {
          if (username.trim() !== originalUsername && originalUsername !== '') {
            router.replace({ pathname: '/profile/[username]', params: { username: username.trim() } } as any);
          } else {
            router.back();
          }
        } 
      }]);
    } catch (error: any) { Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={theme.purple} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>EDIT_PROFILE</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar Section */}
        <View style={s.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
            <View style={s.avatarWrapper}>
              <Avatar 
                username={username || 'builder'} 
                uri={avatarUrl} 
                size={120} 
              />
              <View style={s.editIconBadge}>
                <Feather name="camera" size={16} color="#FFF" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={s.avatarHint}>TAP_TO_CHANGE_IDENTITY_VISUAL</Text>
        </View>

        {/* Form Fields */}
        <View style={s.form}>
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

          <View style={s.inputGroup}>
            <Text style={s.label}>LANGUAGE_STACK (SELECT_YOUR_POWER)</Text>
            <View style={s.languagesGrid}>
              {PREDEFINED_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      s.languageOption,
                      isSelected && s.languageOptionSelected
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
                      s.languageOptionText,
                      isSelected && s.languageOptionTextSelected
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
        <View style={s.actions}>
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

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    marginBottom: 24,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: '900',
    color: theme.purple,
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
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
    backgroundColor: theme.purple,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.bg,
  },
  avatarHint: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 12,
    letterSpacing: 1,
  },
  form: {
    paddingHorizontal: 24,
    gap: 8,
  },
  inputGroup: {
    gap: 4,
    marginTop: 12,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: theme.textSecondary,
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
    backgroundColor: theme.bgInput,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: theme.border,
  },
  languageOptionSelected: {
    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.05)',
    borderColor: theme.purple,
  },
  languageOptionText: {
    fontFamily: 'monospace',
    color: theme.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  languageOptionTextSelected: {
    color: theme.purple,
  },
  actions: {
    padding: 24,
    marginTop: 12,
  },
});