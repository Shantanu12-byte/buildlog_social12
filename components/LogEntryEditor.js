import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

/**
 * LogEntryEditor.js
 * Component for creating new log entries with GitHub repository proof-of-work.
 */

const mockRepoData = {
  id: '123',
  name: 'BuildLog_MVP',
  owner: 'founder_username',
  primaryLanguage: 'React Native',
  url: 'https://github.com/founder_username/BuildLog_MVP',
};

const LogEntryEditor = ({ onPost }) => {
  const [postText, setPostText] = useState('');
  const [attachedRepo, setAttachedRepo] = useState(null);
  const [showError, setShowError] = useState(false);

  const isPostEnabled = postText.trim().length > 0 && attachedRepo !== null;

  const handleAttachRepo = () => {
    // Simulate successful GitHub selection
    setAttachedRepo(mockRepoData);
    setShowError(false);
  };

  const handleRemoveRepo = () => {
    setAttachedRepo(null);
  };

  const handlePost = () => {
    if (!isPostEnabled) {
      setShowError(true);
      return;
    }
    if (onPost) {
      onPost({ text: postText, repo: attachedRepo });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>New Log Entry</Text>
            <Text style={styles.subtitle}>Document your progress and attach proof-of-work.</Text>
          </View>

          {/* Main Content Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="What did you build today? (e.g., 'Implemented Java backend routes')"
              placeholderTextColor={Colors.text.tertiary}
              multiline
              textAlignVertical="top"
              value={postText}
              onChangeText={(t) => {
                setPostText(t);
                if (t.trim()) setShowError(false);
              }}
            />
          </View>

          {/* Proof of Work Section */}
          <View style={styles.powSection}>
            <View style={styles.powHeader}>
              <Feather name="shield" size={16} color={Colors.accent.primary} />
              <Text style={styles.powLabel}>Proof of Work</Text>
            </View>

            {!attachedRepo ? (
              <TouchableOpacity 
                style={styles.attachBtn} 
                onPress={handleAttachRepo}
                activeOpacity={0.7}
              >
                <View style={styles.githubIconContainer}>
                  <Feather name="github" size={24} color={Colors.text.primary} />
                </View>
                <Text style={styles.attachBtnText}>Attach GitHub Repo</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.repoCard}>
                <View style={styles.repoInfo}>
                  <View style={styles.langIconContainer}>
                    <Feather name="code" size={18} color={Colors.accent.primary} />
                  </View>
                  <View style={styles.repoMeta}>
                    <Text style={styles.repoName}>{attachedRepo.name}</Text>
                    <Text style={styles.repoLang}>{attachedRepo.primaryLanguage}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.removeBtn} 
                  onPress={handleRemoveRepo}
                >
                  <Feather name="x" size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {showError && !isPostEnabled && (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={14} color={Colors.danger} />
              <Text style={styles.errorText}>
                {!postText.trim() ? 'Please enter some text.' : 'Please attach a repository card.'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer with Post Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.postBtn, 
              !isPostEnabled && styles.postBtnDisabled
            ]}
            onPress={handlePost}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.postBtnText,
              !isPostEnabled && styles.postBtnTextDisabled
            ]}>
              Post Entry
            </Text>
            <Feather 
              name="send" 
              size={18} 
              color={isPostEnabled ? '#FFF' : Colors.text.tertiary} 
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  title: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
  inputContainer: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    minHeight: 180,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  textInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
    lineHeight: 22,
  },
  powSection: {
    gap: Spacing.md,
  },
  powHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  powLabel: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.github.bg,
    borderWidth: 1,
    borderColor: Colors.github.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  githubIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.strong,
  },
  attachBtnText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  },
  repoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(47, 129, 247, 0.05)',
    borderWidth: 1,
    borderColor: Colors.accent.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  repoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  langIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(47, 129, 247, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repoMeta: {
    gap: 2,
  },
  repoName: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
    fontWeight: '700',
  },
  repoLang: {
    color: Colors.accent.primary,
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
  },
  removeBtn: {
    padding: Spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    backgroundColor: 'rgba(218, 54, 51, 0.1)',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
    backgroundColor: Colors.bg.primary,
  },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent.primary,
    borderRadius: Radius.md,
    height: 54,
  },
  postBtnDisabled: {
    backgroundColor: Colors.bg.tertiary,
    opacity: 0.8,
  },
  postBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  postBtnTextDisabled: {
    color: Colors.text.tertiary,
  },
});

export default LogEntryEditor;
