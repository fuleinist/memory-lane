import fs from 'fs';
import path from 'path';
import { simpleGit } from 'simple-git';

export interface GitHubConfig {
  owner: string;
  repo: string;
  token?: string;
  apiUrl?: string;
}

export interface GitHubActivity {
  type: 'issue' | 'pr' | 'commit' | 'release';
  title: string;
  url: string;
  date: string;
  author: string;
  body?: string;
}

export function loadGitHubConfig(configDir: string): GitHubConfig | null {
  const rcPath = path.join(configDir, '.memorylanerc');
  if (!fs.existsSync(rcPath)) return null;

  try {
    const content = fs.readFileSync(rcPath, 'utf-8');
    const parsed = JSON.parse(content);
    if (parsed.github && parsed.github.owner && parsed.github.repo) {
      return {
        owner: parsed.github.owner,
        repo: parsed.github.repo,
        token: parsed.github.token,
        apiUrl: parsed.github.apiUrl,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

export async function fetchGitHubActivity(config: GitHubConfig): Promise<GitHubActivity[]> {
  const baseUrl = config.apiUrl || 'https://api.github.com';
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'memory-lane',
  };
  if (config.token) {
    headers['Authorization'] = `Bearer ${config.token}`;
  }

  const results: GitHubActivity[] = [];

  // Fetch recent commits
  try {
    const commitsRes = await fetch(
      `${baseUrl}/repos/${config.owner}/${config.repo}/commits?per_page=20`,
      { headers }
    );
    if (commitsRes.ok) {
      const commits = await commitsRes.json() as Array<{ sha: string; commit: { message: string; author: { date: string; name: string } }; html_url: string }>;
      for (const c of commits) {
        results.push({
          type: 'commit',
          title: c.commit.message.split('\n')[0],
          url: c.html_url,
          date: c.commit.author.date,
          author: c.commit.author.name,
        });
      }
    }
  } catch {
    // ignore fetch errors
  }

  // Fetch recent issues
  try {
    const issuesRes = await fetch(
      `${baseUrl}/repos/${config.owner}/${config.repo}/issues?per_page=20&state=all&sort=updated`,
      { headers }
    );
    if (issuesRes.ok) {
      const issues = await issuesRes.json() as Array<{ number: number; title: string; html_url: string; created_at: string; user: { login: string }; body: string | null; pull_request?: unknown }>;
      for (const issue of issues) {
        if (issue.pull_request) continue; // skip PRs
        results.push({
          type: 'issue',
          title: `#${issue.number}: ${issue.title}`,
          url: issue.html_url,
          date: issue.created_at,
          author: issue.user.login,
          body: issue.body || undefined,
        });
      }
    }
  } catch {
    // ignore
  }

  // Sort by date descending
  results.sort((a, b) => b.date.localeCompare(a.date));
  return results;
}

export function formatGitHubActivitySummary(activities: GitHubActivity[]): string {
  if (activities.length === 0) return 'No GitHub activity found.';

  const byType: Record<string, GitHubActivity[]> = {};
  for (const a of activities) {
    if (!byType[a.type]) byType[a.type] = [];
    byType[a.type].push(a);
  }

  const parts: string[] = [];
  for (const [type, items] of Object.entries(byType)) {
    const label = type === 'commit' ? 'commits' : type === 'issue' ? 'issues' : type === 'pr' ? 'prs' : type === 'release' ? 'releases' : type;
    parts.push(`${items.length} ${label}`);
  }

  return `GitHub activity: ${parts.join(', ')}.`;
}
