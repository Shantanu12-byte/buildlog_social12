import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
  'Web Dev', 'Android Dev', 'iOS Dev', 'AI & ML', 'UI/UX Design', 
  'Cloud Computing', 'Cybersecurity', 'Data Science', 'Blockchain', 'Game Dev'
];

export default function InterestsScreen({ navigation }) {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSave = async (interestsToSave) => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          interests: interestsToSave,
          onboarding_complete: true,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Note: If you are using Expo Router instead of React Navigation, 
      // you might want to use useRouter().replace('/(tabs)/main') instead.
      navigation.replace('MainFeed');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onContinue = () => handleSave(selectedInterests);
  const onSkip = () => handleSave([]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>What are you building?</Text>
        <Text style={styles.subtitle}>Select your interests to customize your feed.</Text>
      </View>

      <View style={styles.gridContainer}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedInterests.includes(cat);
          return (
            <TouchableOpacity 
              key={cat} 
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggleInterest(cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={onContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueText}>Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.skipButton}
          onPress={onSkip}
          disabled={loading}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Clean off-white background
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  headerContainer: {
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    flex: 1,
  },
  chip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chipSelected: {
    backgroundColor: '#007AFF', // Modern iOS Blue
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 15,
    color: '#4a4a4a',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
  footer: {
    marginBottom: 40,
    alignItems: 'center',
    gap: 16,
  },
  continueButton: {
    backgroundColor: '#1a1a1a',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    minHeight: 56, // Fixed height to prevent jumping when ActivityIndicator shows
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
});
