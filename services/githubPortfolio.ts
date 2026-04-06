/**
 * githubPortfolio.ts
 * Frontend service for fetching automated GitHub project data.
 */

import { supabase } from '@/lib/supabase';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000'; // Fallback for development

export interface GitHubProject {
  id: number;
  name: string;
  description: string;
  language: string;
  url: string;
  stars: number;
  updated_at: string;
  topics: string[];
}

export interface GitHubPortfolioResponse {
  username: string;
  projects: GitHubProject[];
  total_count: number;
}

/**
 * Fetches the user's automated project portfolio from the backend.
 * This endpoint processes and filters GitHub repositories for high-quality display.
 * 
 * @param userId - The Supabase user ID
 * @returns A promise resolving to the GitHubPortfolioResponse
 */
export async function fetchUserProjects(userId: string): Promise<GitHubPortfolioResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${BACKEND_URL}/api/user/projects?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('GITHUB_NOT_LINKED');
      }
      throw new Error('FAILED_TO_FETCH_PORTFOLIO');
    }

    const data = await response.json();
    return data as GitHubPortfolioResponse;
  } catch (error) {
    throw error;
  }
}
