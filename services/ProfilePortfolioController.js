/**
 * ProfilePortfolioController.js
 * Client-side logic for managing GitHub project visibility and status.
 */

import { supabase } from '../lib/supabase';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export const ProfilePortfolioController = {
  /**
   * Checks the backend for GitHub connection status and scope validity.
   * @param {string} userId - The Supabase user ID
   * @returns {Promise<{ isConnected: boolean, hasSufficientScopes: boolean, message?: string }>}
   */
  async checkGitHubStatus(userId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${BACKEND_URL}/api/user/github/status?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        if (response.status === 404) return { isConnected: false, hasSufficientScopes: false };
        throw new Error('STATUS_CHECK_FAILED');
      }
      return await response.json();
    } catch (error) {
      return { isConnected: false, hasSufficientScopes: false, error: error.message };
    }
  },

  /**
   * Logic for the 'Projects' tab for user 'shantanu'.
   * In a real app, this would fetch the user's specific project data.
   */
  async loadUserProjects(userId) {
    // This uses the existing githubPortfolio service logic but abstracted here
    // as requested by the user for the controller-based architecture.
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${BACKEND_URL}/api/user/projects?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('FAILED_TO_LOAD_PROJECTS');
      return await response.json();
    } catch (error) {
      return { projects: [], total_count: 0 };
    }
  },

  /**
   * Disconnects GitHub by clearing the access token in the backend.
   * @param {string} userId 
   */
  async disconnectGitHub(userId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${BACKEND_URL}/api/user/github/disconnect`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId }),
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
};
