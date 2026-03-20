/**
 * lib/githubSkillVerifier.ts
 * Fetches language breakdown from a public GitHub repo
 * and maps programming languages to skill names.
 * Uses GitHub public API — completely free, no token needed.
 */

// Maps GitHub language names → buildlog skill names
const LANGUAGE_TO_SKILL: Record<string, string[]> = {
  'JavaScript': ['JavaScript', 'React', 'Node.js', 'Vue', 'Express'],
  'TypeScript': ['TypeScript', 'React', 'Angular', 'Node.js'],
  'Python': ['Python', 'Django', 'FastAPI', 'Flask', 'Machine Learning'],
  'Dart': ['Flutter', 'Dart'],
  'Swift': ['Swift', 'iOS'],
  'Kotlin': ['Kotlin', 'Android'],
  'Java': ['Java', 'Spring', 'Android'],
  'Go': ['Go', 'Golang'],
  'Rust': ['Rust'],
  'PHP': ['PHP', 'Laravel'],
  'Ruby': ['Ruby', 'Rails'],
  'C++': ['C++'],
  'C#': ['C#', '.NET'],
  'CSS': ['CSS', 'TailwindCSS'],
  'HTML': ['HTML'],
};

export interface GitHubLanguageResult {
  detectedSkills: string[];     // Skills buildlog can verify
  rawLanguages: Record<string, number>; // Raw from GitHub API
  error?: string;
}

/**
 * Parses a GitHub URL and returns owner/repo
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const clean = url.replace(/\.git$/, '').replace(/\/$/, '');
    const match = clean.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  } catch {
    return null;
  }
}

/**
 * Main function — fetch languages from GitHub and map to buildlog skills
 */
export async function detectSkillsFromGitHub(
  githubUrl: string
): Promise<GitHubLanguageResult> {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) {
    return { detectedSkills: [], rawLanguages: {}, error: 'Invalid GitHub URL' };
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/languages`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'buildlog-app',
        },
      }
    );

    if (response.status === 404) {
      return { detectedSkills: [], rawLanguages: {}, error: 'Repository not found or is private' };
    }
    if (response.status === 403) {
      return { detectedSkills: [], rawLanguages: {}, error: 'GitHub API rate limit reached' };
    }
    if (!response.ok) {
      return { detectedSkills: [], rawLanguages: {}, error: 'GitHub API error' };
    }

    const languages: Record<string, number> = await response.json();
    const total = Object.values(languages).reduce((a, b) => a + b, 0);

    // Only count languages that are at least 10% of the repo
    const detectedSkills: string[] = [];
    for (const [lang, bytes] of Object.entries(languages)) {
      const percentage = (bytes / total) * 100;
      if (percentage >= 10 && LANGUAGE_TO_SKILL[lang]) {
        detectedSkills.push(...LANGUAGE_TO_SKILL[lang]);
      }
    }

    return {
      detectedSkills: [...new Set(detectedSkills)], // remove duplicates
      rawLanguages: languages,
    };
  } catch (err) {
    return { detectedSkills: [], rawLanguages: {}, error: 'Network error' };
  }
}
