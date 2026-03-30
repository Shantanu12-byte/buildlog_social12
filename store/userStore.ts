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
  learning_focus?: string | null;
  skill_level?: string | null;
  campus_id?: string | null;
  campus_name?: string | null;
  is_joined_to_campus?: boolean;
  verified_skills?: Record<string, any>;
  is_public?: boolean;
}

interface UserState {
  userProfile: UserProfile | null;
  userId: string | null;
  isLoading: boolean;
  profileFetched: boolean; // Flag to prevent infinite fetch loops
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
  profileFetched: false,
  isEnderMode: false,

  fetchUserProfile: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ userProfile: null, userId: null, isLoading: false, profileFetched: true });
        return;
      }
      
      const userId = session.user.id;
      set({ userId });

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      set({ userProfile: data || null, profileFetched: true });
    } catch (error) {
      console.error("fetchUserProfile Error:", error);
      set({ profileFetched: true });
    } finally {
      set({ isLoading: false });
    }
  },

  updateUserProfile: async (newData) => {
    const currentProfile = get().userProfile;
    if (!currentProfile) return;

    const updatedProfile = { ...currentProfile, ...newData };
    set({ userProfile: updatedProfile });

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(updatedProfile);

      if (error) throw error;
      
      await supabase.auth.updateUser({
        data: { 
          username: updatedProfile.username,
          avatar_url: updatedProfile.avatar_url 
        }
      });

      // Cache Invalidation (Non-blocking)
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const usernames = [updatedProfile.username];
      if (currentProfile.username && currentProfile.username !== updatedProfile.username) {
        usernames.push(currentProfile.username);
      }

      fetch(`${backendUrl}/api/user/profile/invalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames }),
      }).catch(() => {});
      
    } catch (error) {
      console.error("updateUserProfile Error:", error);
      throw error;
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
      // 1. Load Ender Mode
      const val = await AsyncStorage.getItem('isEnderMode');
      if (val !== null) set({ isEnderMode: JSON.parse(val) });

      // 2. Initial Session Check
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({ userId: session.user.id });
        await get().fetchUserProfile();
      } else {
        set({ profileFetched: true });
      }

      // 3. Listen for Auth Changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          if (!get().userId) {
            set({ userId: session.user.id });
            await get().fetchUserProfile();
          }
        } else if (event === 'SIGNED_OUT') {
          get().clearUser();
        }
      });
    } catch (e) {
      console.error("Store Initialization Error:", e);
      set({ profileFetched: true });
    }
  },

  clearUser: () => set({ userProfile: null, userId: null, profileFetched: true, isLoading: false }),
}));
