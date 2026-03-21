const GITHUB_API_URL = 'https://api.github.com';
const BACKEND_URL = 'http://localhost:5000'; // Update this for production

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  language: string;
  html_url: string;
  topics: string[];
}

export const githubService = {
  /**
   * Exchanges GitHub Auth Code for a token via our backend.
   */
  exchangeGithubCode: async (code: string, userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/github/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, userId }),
      });

      if (!response.ok) {
        throw new Error('FAILED_TO_EXCHANGE_TOKEN');
      }

      return true;
    } catch (error) {
      console.error('githubService.exchangeGithubCode error:', error);
      throw error;
    }
  },

  /**
   * Fetches repos using our backend (which uses the stored access token).
   */
  fetchUserReposFromBackend: async (userId: string): Promise<GithubRepo[]> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/user/github/repos?userId=${userId}`);

      if (!response.ok) {
        throw new Error('FAILED_TO_FETCH_REPOS');
      }

      const data = await response.json();
      return data as GithubRepo[];
    } catch (error) {
      console.error('githubService.fetchUserReposFromBackend error:', error);
      throw error;
    }
  },

  /**
   * Fetches public repositories for a given GitHub username (Fallback).
   */
  fetchUserRepos: async (username: string): Promise<GithubRepo[]> => {
    try {
      const response = await fetch(
        `${GITHUB_API_URL}/users/${username}/repos?sort=updated&per_page=30`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('GITHUB_USER_NOT_FOUND');
        }
        throw new Error('GITHUB_API_ERROR');
      }

      const data = await response.json();
      return data as GithubRepo[];
    } catch (error) {
      console.error('githubService.fetchUserRepos error:', error);
      throw error;
    }
  },
};
