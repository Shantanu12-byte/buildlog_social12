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
      } else {
        set({ userProfile: null });
      }
      set({ profileFetched: true });
    } catch (error) {
      console.error("fetchUserProfile Error:", error);
      set({ profileFetched: true }); // Even on error, we mark as fetched to stop loop
    } finally {
      set({ isLoading: false });
    }
  },

  updateUserProfile: async (newData) => {
    const currentProfile = get().userProfile;
    if (!currentProfile) return;

    // Redundant cache-busting removed (handled in Avatar component)
    let finalData = { ...newData };

    // Optimistic Update
    const updatedProfile = { ...currentProfile, ...finalData };
    set({ userProfile: updatedProfile });

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          ...updatedProfile,
        });

      if (error) throw error;
      
      // Sync Auth Metadata
      await supabase.auth.updateUser({
        data: { 
          username: updatedProfile.username,
          avatar_url: updatedProfile.avatar_url 
        }
      });

      // Invalidate Backend Cache (Both old and new if renamed)
      try {
        const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const usernamesToInvalidate = [updatedProfile.username];
        if (currentProfile.username && currentProfile.username !== updatedProfile.username) {
          usernamesToInvalidate.push(currentProfile.username);
        }

        await Promise.all(usernamesToInvalidate.map(name => 
          fetch(`${backendUrl}/api/user/profile/invalidate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: name }),
          })
        ));
        console.log(`🚀 AUTH_SYNC_COMPLETE & CACHE_CLEARED: ${usernamesToInvalidate.join(', ')}`);
      } catch (cacheErr) {
        console.warn("Backend cache invalidation failed (non-critical):", cacheErr);
      }
    } catch (error) {
      console.error("updateUserProfile Error:", error);
      throw error; // Re-throw for UI error handling
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

  clearUser: () => set({ userProfile: null, userId: null, profileFetched: false }),
}));
