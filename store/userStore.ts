import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  id: string;
  username: string;
  bio: string;
  avatar_url: string | null;
  skills: string[];
  languages: string[];
  streak_count: number;
  level: string;
  github_url: string;
  linkedin_url: string;
  public_key: string | null;
  expo_push_token: string | null;
  onboarding_complete: boolean;
}

interface UserState {
  userProfile: UserProfile | null;
  userId: string | null;
  isLoading: boolean;
  isEnderMode: boolean;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  toggleEnderMode: () => Promise<void>;
  initialize: () => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  userProfile: null,
  userId: null,
  isLoading: false,
  isEnderMode: false,

  fetchUserProfile: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ userProfile: null, userId: null, isLoading: false });
        return;
      }
      set({ userId: session.user.id });

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        set({ userProfile: data });
      }
    } catch (error) {
      console.error("fetchUserProfile Error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateUserProfile: async (newData) => {
    const currentProfile = get().userProfile;
    if (!currentProfile) return;

    // Optimistic Update
    const updatedProfile = { ...currentProfile, ...newData };
    set({ userProfile: updatedProfile });

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          ...updatedProfile,
        });

      if (error) throw error;
    } catch (error) {
      console.error("updateUserProfile Error:", error);
    }
  },

  toggleEnderMode: async () => {
    const newMode = !get().isEnderMode;
    set({ isEnderMode: newMode });
    try {
      await AsyncStorage.setItem('isEnderMode', JSON.stringify(newMode));
    } catch (e) {
      console.error("Error saving Ender Mode:", e);
    }
  },

  initialize: async () => {
    try {
      const val = await AsyncStorage.getItem('isEnderMode');
      if (val !== null) {
        set({ isEnderMode: JSON.parse(val) });
      }
    } catch (e) {
      console.error("Store Initialization Error:", e);
    }
  },

  clearUser: () => set({ userProfile: null, userId: null }),
}));
