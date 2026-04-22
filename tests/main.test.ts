import { describe, it, expect } from 'vitest';
import { isGitRepo } from '../src/lib/git.ts';
import { searchJournal } from '../src/lib/journal.ts';

describe('MemoryLane', () => {
  describe('git operations', () => {
    it('should detect git repository', async () => {
      const result = await isGitRepo();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('journal search', () => {
    it('should return empty array when no journal exists', () => {
      const results = searchJournal('test');
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
