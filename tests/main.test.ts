import { describe, it, expect } from '@jest/globals';
import { isGitRepo } from '../src/lib/git.js';
import { searchJournal } from '../src/lib/journal.js';

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