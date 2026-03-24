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
    
    if (score === total && total > 0) {
      newTrophy = {
        id: trophyKey,
        topic: topic,
        tier: level,
        name: `${topic} ${level} Master 🏆`,
        awardedAt: new Date().toISOString(),
        description: `Achieved a perfect score in the BuildLog ${topic} ${level} Skills Lab!`
      };
      
      const currentTrophiesJson = await AsyncStorage.getItem('user_trophies');
      const currentTrophies = currentTrophiesJson ? JSON.parse(currentTrophiesJson) : [];
      
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

/**
 * Fetches localized repository cards for a user.
 * Includes campus selection requirement for 'Campus communities' lock.
 * @param {string} userId 
 */
export async function fetchUserProjects(userId) {
  try {
    const cachedRepos = await AsyncStorage.getItem(`repos_${userId}`);
    let repos = cachedRepos ? JSON.parse(cachedRepos) : [];
    
    // Mocking campus lock logic
    const userCampus = await AsyncStorage.getItem('user_selected_campus');
    
    if (!userCampus) {
      return { 
        error: 'CAMPUS_LOCK', 
        message: 'Please select your campus community to unlock regional projects.' 
      };
    }

    // Filter or tag repos based on campus
    return repos.map(repo => ({
      ...repo,
      campusBadge: userCampus,
      isPrivate: false
    }));
  } catch (error) {
    console.error('fetchUserProjects Error:', error);
    return [];
  }
}
