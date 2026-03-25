import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isOnboardingFinished: boolean;
  updateOnboardingStatus: (status: boolean) => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  isOnboardingFinished: false,
  updateOnboardingStatus: () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnboardingFinished, setIsOnboardingFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('onboarding_complete');
        if (value === 'true') {
          setIsOnboardingFinished(true);
        }
      } catch (error) {
        console.error('Error reading onboarding status from AsyncStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const updateOnboardingStatus = (status: boolean) => {
    setIsOnboardingFinished(status);
    AsyncStorage.setItem('onboarding_complete', status ? 'true' : 'false').catch(e => 
      console.error('Error saving onboarding status:', e)
    );
  };

  return (
    <AuthContext.Provider value={{ isOnboardingFinished, updateOnboardingStatus, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
