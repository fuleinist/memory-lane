import { describe, it, expect } from 'vitest';
import { formatGitHubActivitySummary } from '../src/lib/github.js';

describe('GitHub module', () => {
  describe('formatGitHubActivitySummary', () => {
    it('returns "no activity" for empty array', () => {
      const result = formatGitHubActivitySummary([]);
      expect(result).toBe('No GitHub activity found.');
    });

    it('formats single commit', () => {
      const result = formatGitHubActivitySummary([{
        type: 'commit' as const,
        title: 'feat: add login',
        url: 'https://github.com/test/test/commit/abc123',
        date: '2026-05-28T10:00:00Z',
        author: 'dev',
      }]);
      expect(result).toBe('GitHub activity: 1 commits.');
    });

    it('formats multiple commits', () => {
      const result = formatGitHubActivitySummary([
        { type: 'commit' as const, title: 'fix: a', url: 'x', date: '2026-05-28T10:00:00Z', author: 'dev' },
        { type: 'commit' as const, title: 'fix: b', url: 'y', date: '2026-05-27T10:00:00Z', author: 'dev' },
      ]);
      expect(result).toBe('GitHub activity: 2 commits.');
    });

    it('formats mixed types', () => {
      const result = formatGitHubActivitySummary([
        { type: 'commit' as const, title: 'init', url: 'x', date: '2026-05-28T10:00:00Z', author: 'dev' },
        { type: 'issue' as const, title: '#1 bug', url: 'y', date: '2026-05-27T10:00:00Z', author: 'user' },
        { type: 'issue' as const, title: '#2 feat', url: 'z', date: '2026-05-26T10:00:00Z', author: 'user' },
      ]);
      expect(result).toBe('GitHub activity: 1 commits, 2 issues.');
    });

    it('handles only issues', () => {
      const result = formatGitHubActivitySummary([
        { type: 'issue' as const, title: '#1', url: 'u', date: '2026-05-28T10:00:00Z', author: 'a' },
        { type: 'issue' as const, title: '#2', url: 'u', date: '2026-05-27T10:00:00Z', author: 'a' },
        { type: 'issue' as const, title: '#3', url: 'u', date: '2026-05-26T10:00:00Z', author: 'a' },
      ]);
      expect(result).toBe('GitHub activity: 3 issues.');
    });

    it('handles only PRs', () => {
      const result = formatGitHubActivitySummary([
        { type: 'pr' as const, title: 'PR 1', url: 'u', date: '2026-05-28T10:00:00Z', author: 'a' },
        { type: 'pr' as const, title: 'PR 2', url: 'u', date: '2026-05-27T10:00:00Z', author: 'a' },
      ]);
      expect(result).toBe('GitHub activity: 2 prs.');
    });

    it('handles only releases', () => {
      const result = formatGitHubActivitySummary([
        { type: 'release' as const, title: 'v1.0', url: 'u', date: '2026-05-28T10:00:00Z', author: 'a' },
      ]);
      expect(result).toBe('GitHub activity: 1 releases.');
    });

    it('handles all four types together', () => {
      const result = formatGitHubActivitySummary([
        { type: 'commit' as const, title: 'c1', url: 'u1', date: '2026-05-28T10:00:00Z', author: 'd' },
        { type: 'issue' as const, title: 'i1', url: 'u2', date: '2026-05-27T10:00:00Z', author: 'd' },
        { type: 'pr' as const, title: 'PR 1', url: 'u3', date: '2026-05-26T10:00:00Z', author: 'd' },
        { type: 'release' as const, title: 'v1.0', url: 'u4', date: '2026-05-25T10:00:00Z', author: 'd' },
      ]);
      // 1 commit, 1 issue, 1 PR, 1 release
      expect(result).toBe('GitHub activity: 1 commits, 1 issues, 1 prs, 1 releases.');
    });
  });
});
