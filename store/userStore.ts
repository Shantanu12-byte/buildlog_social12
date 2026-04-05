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
  public_key?: string | null;
  expo_push_token: string | null;
  onboarding_complete: boolean;
  learning_focus?: string | null;
  skill_level?: string | null;
  campus_id?: string | null;
  campus_name?: string | null;
  college?: string | null;
  is_joined_to_campus?: boolean;
  verified_skills?: Record<string, any>;
  is_public?: boolean;
  xp?: number;
  problems_solved?: number;
  easy_solved?: number;
  medium_solved?: number;
  hard_solved?: number;
}

interface UserState {
  userProfile: UserProfile | null;
  userId: string | null;
  isLoading: boolean;
  profileFetched: boolean; // Flag to prevent infinite fetch loops
  isEnderMode: boolean;
  lastFetched: number;
  fetchUserProfile: (force?: boolean) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  toggleEnderMode: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  userProfile: null,
  userId: null,
  isLoading: false,
  profileFetched: false,
  isEnderMode: false,

  lastFetched: 0,

  fetchUserProfile: async (force = false) => {
    if (get().isLoading) return;
    
    // 5-minute TTL cache, but bypass if force is true
    const isFresh = Date.now() - get().lastFetched < 5 * 60000;
    if (isFresh && get().userProfile && !force) {
      set({ profileFetched: true });
      return;
    }

    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ userProfile: null, userId: null, isLoading: false, profileFetched: true, lastFetched: 0 });
        return;
      }
      
      const userId = session.user.id;
      set({ userId });

      // 1. ATOMIC UPSERT-ON-FETCH: Ensure profile record always exists
      // This solves the 'username not loading' bug by guaranteeing a row.
      const initialProfile = {
        id: userId,
        username: session.user.user_metadata?.user_name || `builder_${userId.slice(0, 5)}`,
        onboarding_complete: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(initialProfile, { onConflict: 'id', ignoreDuplicates: true }) // Only insert if missing
        .select('*')
        .single();

      if (error) {
        console.error('[userStore] Fetch/Upsert profile error:', error);
        throw error;
      }

      // 2. Fetch optional metadata (badges, keys)
      let extraData: Record<string, any> = {};
      if (data) {
        const { data: extra } = await supabase
          .from('profiles')
          .select('verified_skills, public_key')
          .eq('id', userId)
          .maybeSingle();
        if (extra) extraData = extra;
      }

      set({ 
        userProfile: data ? { ...data, ...extraData } : null, 
        profileFetched: true,
        lastFetched: Date.now()
      });
    } catch (error) {
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

    // 1. Safe Update: Only send valid DB columns to Supabase
    // This prevents errors if the local object has extra properties (e.g. verified_skills, UI state)
    const VALID_PROFILES_COLUMNS = [
      'id', 'username', 'bio', 'avatar_url', 'skills', 'languages', 
      'streak_count', 'level', 'github_url', 'linkedin_url', 'public_key',
      'expo_push_token', 'onboarding_complete', 'campus_id', 'campus_name', 
      'college', 'is_joined_to_campus', 'is_public', 'learning_focus', 'skill_level',
      'xp', 'problems_solved', 'easy_solved', 'medium_solved', 'hard_solved'
    ];

    const dbPayload = Object.keys(updatedProfile)
      .filter(key => VALID_PROFILES_COLUMNS.includes(key))
      .reduce((obj, key) => {
        obj[key] = (updatedProfile as any)[key];
        return obj;
      }, {} as Record<string, any>);

    try {
      // 1. Update the 'profiles' table using the cleaned payload
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert(dbPayload);

      if (dbError) {
        console.warn('[userStore] DB Update Error:', dbError);
        throw new Error(dbError.message);
      }
      
      // 2. Update Auth metadata (for display names in common areas)
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          username: updatedProfile.username,
          avatar_url: updatedProfile.avatar_url 
        }
      });

      if (authError) {
        console.warn('[userStore] Auth Update Error:', authError);
        // We don't throw here as the main profile table is updated
      }

      // 3. Cache Invalidation (Non-blocking)
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const usernames = [updatedProfile.username];
      if (currentProfile.username && currentProfile.username !== updatedProfile.username) {
        usernames.push(currentProfile.username);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      fetch(`${backendUrl}/api/user/profile/invalidate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ usernames }),
      }).catch(() => {});
      
    } catch (error: any) {
      console.error('[userStore] updateUserProfile failed:', error);
      // Revert local state on failure
      set({ userProfile: currentProfile });
      throw error;
    }
  },

  toggleEnderMode: async () => {
    const newMode = !get().isEnderMode;
    set({ isEnderMode: newMode });
    try {
      await AsyncStorage.setItem('isEnderMode', JSON.stringify(newMode));
    } catch (e) {
      // Error handled silently
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
      // Error handled silently
      set({ profileFetched: true });
    }
  },

  refreshProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    console.log('[userStore] Manual Profile Refresh Triggered...');
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (profile) {
      console.log('[userStore] Fresh DB data received:', profile.campus_id, profile.is_joined_to_campus);
      set({ userProfile: profile, lastFetched: Date.now() });
    }
  },

  clearUser: () => set({ userProfile: null, userId: null, profileFetched: true, isLoading: false }),
}));
