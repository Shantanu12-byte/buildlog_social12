import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Colors, FontSizes, Spacing } from '../constants/theme';

const CATEGORIES = [
  'General', 'Web Dev', 'Android Dev', 'iOS Dev', 'AI & ML', 
  'UI/UX Design', 'Cloud Computing', 'Cybersecurity', 
  'Data Science', 'Blockchain', 'Game Dev'
];

/**
 * CreatePostScreen - A professional, monochrome terminal-style screen for creating posts.
 * Aligns with the Buildlog design system while fulfilling all user requirements.
 */
export default function CreatePostScreen({ navigation }) {
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    // 1. Validation Logic
    if (!content.trim()) {
      Alert.alert('[ SYSTEM_MESSAGE ]', 'INPUT_REQUIRED: CONTENT_FIELD_EMPTY.');
      return;
    }

    setLoading(true);
    try {
      // 2. Auth Logic - Fetch authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) {
        Alert.alert('[ SYSTEM_FAILURE ]', 'AUTH_ERROR: SESSION_NOT_FOUND.');
        return;
      }

      // 3. Database Logic - Insert new post row
      const { error: insertError } = await supabase
        .from('posts')
        .insert([
          { 
            user_id: user.id, 
            content: content.trim(), 
            category: selectedCategory 
          }
        ]);

      if (insertError) throw insertError;

      // 4. Success Navigation
      Alert.alert('Posted successfully!', '', [{
        text: 'OK',
        onPress: () => {
          setContent('');
          if (navigation && navigation.goBack) {
            navigation.goBack();
          }
        }
      }]);

    } catch (error) {
      Alert.alert('[ COMPONENT_ERROR ]', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header - Terminal Navigation Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>{'[ CANCEL ]'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NEW_LOG</Text>
          <TouchableOpacity 
            style={[styles.postButton, !content.trim() && styles.postButtonDisabled]} 
            onPress={handlePost}
            disabled={loading || !content.trim()}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} size="small" />
            ) : (
              <Text style={styles.postButtonText}>POST</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Dynamic Log Entry Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="What are you working on today?..."
            placeholderTextColor="#444"
            multiline
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
            autoFocus
          />
        </View>

        {/* Category Selector Bar */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>SELECT_CATEGORY</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    isActive && styles.activeChip
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.categoryChipText,
                    isActive && styles.activeChipText
                  ]}>
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // True black for retro contrast
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#222',
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  cancelText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#888',
  },
  postButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  postButtonDisabled: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  postButtonText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputContainer: {
    flex: 1,
    padding: 20,
  },
  textInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    color: '#FFFFFF',
    height: '100%',
    lineHeight: 26,
  },
  categorySection: {
    paddingVertical: 20,
    borderTopWidth: 2,
    borderTopColor: '#222',
    backgroundColor: '#0A0A0A',
  },
  sectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 14,
    color: '#888',
    letterSpacing: 1,
  },
  categoryScroll: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#444',
    marginRight: 10,
    backgroundColor: '#000',
  },
  activeChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  categoryChipText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#888',
  },
  activeChipText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
