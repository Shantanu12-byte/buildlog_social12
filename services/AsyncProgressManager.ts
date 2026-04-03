import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export async function manageLanguageProgress(userId: string, topic: string, level: string, percent: number) {
  const key = `progress_${topic}_${level}`;
  
  try {
    // 1. Save standard progress
    const current = await AsyncStorage.getItem(key);
    const existing = current ? parseInt(current, 10) : 0;
    const newPercent = Math.max(existing, percent);
    await AsyncStorage.setItem(key, newPercent.toString());

    // 2. Check for Language Path Completion (Beginner, Pro, Expert all 100%)
    if (newPercent === 100) {
      await checkForBadges(userId, topic);
    }

    return newPercent;
  } catch {
    // Progress save failed silently
  }
}

async function checkForBadges(userId: string, topic: string) {
  const bKey = `progress_${topic}_Beginner`;
  const pKey = `progress_${topic}_Pro`;
  const eKey = `progress_${topic}_Expert`;

  const [b, p, e] = await Promise.all([
    AsyncStorage.getItem(bKey),
    AsyncStorage.getItem(pKey),
    AsyncStorage.getItem(eKey)
  ]);

  // If all levels are mastered
  if (b === '100' && p === '100' && e === '100') {
    const badgeName = `${topic} Master`;
    
    // Save to AsyncStorage locally
    const currentBadgesJson = await AsyncStorage.getItem('user_badges');
    const currentBadges = currentBadgesJson ? JSON.parse(currentBadgesJson) : [];
    
    if (!currentBadges.includes(badgeName)) {
      currentBadges.push(badgeName);
      await AsyncStorage.setItem('user_badges', JSON.stringify(currentBadges));

      // Sync with Supabase (if we have a badges column or metadata)
      const { data: profile } = await supabase.from('profiles').select('skills').eq('id', userId).single();
      const updatedSkills = profile?.skills ? Array.from(new Set([...profile.skills, badgeName])) : [badgeName];
      
      await supabase.from('profiles').update({ skills: updatedSkills }).eq('id', userId);
    }
  }
}
