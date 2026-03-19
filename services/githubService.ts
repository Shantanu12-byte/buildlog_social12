const GITHUB_API_URL = 'https://api.github.com';

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
   * Fetches public repositories for a given GitHub username.
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
