// ProfilePersistenceManager.js - Manages Skills Lab achievements
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Updates smooth progress bars on the profile and awards trophies.
 * @param {Object} profile - The current user profile object.
 * @param {Object} newSkillData - { topic: 'HTML', level: 'Beginner', score: 5, total: 5 }
 */
export async function updateProfileWithSkillsData(profile, newSkillData) {
  const { topic, level, score, total } = newSkillData;
  const progressPercent = (score / total) * 100;
  
  const progressKey = `skill_prog_${topic}_${level}`;
  
  try {
    // 1. Update Progress in AsyncStorage
    const existingProg = await AsyncStorage.getItem(progressKey);
    const maxProg = Math.max(existingProg ? parseInt(existingProg) : 0, progressPercent);
    await AsyncStorage.setItem(progressKey, maxProg.toString());

    // 2. Award medallic trophy if mastery (perfect score) is achieved
    const trophyKey = `trophy_${topic}_${level}`;
    let newTrophy = null;
    
    if (score === total) {
      newTrophy = {
        id: trophyKey,
        name: `${topic} ${level} Master`,
        icon: "🏆",
        awardedAt: new Date().toISOString(),
        description: `Achieved a perfect score in the BuildLog ${topic} ${level} Skills Lab!`
      };
      
      const currentTrophiesJson = await AsyncStorage.getItem('user_trophies');
      const currentTrophies = currentTrophiesJson ? JSON.parse(currentTrophiesJson) : [];
      
      // Prevent duplicate trophies
      if (!currentTrophies.some(t => t.id === trophyKey)) {
        currentTrophies.push(newTrophy);
        await AsyncStorage.setItem('user_trophies', JSON.stringify(currentTrophies));
      }
    }

    return {
      newProgress: maxProg,
      awardedTrophy: newTrophy,
      nextStep: score === total ? `Proceed to ${topic} NEXT TIER` : "Review your misconceptions and try again for a perfect score!"
    };
  } catch (error) {
    console.error('ProfilePersistenceManager Error:', error);
    return null;
  }
}
