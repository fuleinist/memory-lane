import { Command } from 'commander';
import { loadConfig, findConfigDir } from '../lib/config.js';
import { getSessionContext, readLastRunFile, writeLastRunFile, isGitRepo } from '../lib/git.js';
import { appendEntry, journalExists } from '../lib/journal.js';
import { summarizeSession } from '../lib/summarizer.js';
import { format } from 'date-fns';

export const runCommand = new Command('run')
  .description('Run the MemoryLane journaling loop')
  .action(async () => {
    console.log('MemoryLane running...\n');

    // Check we're in a git repo
    const isGit = await isGitRepo();
    if (!isGit) {
      console.error('Error: Not in a git repository. MemoryLane requires git.');
      process.exit(1);
    }

    // Find config
    const configDir = findConfigDir();
    if (!configDir) {
      console.error('Error: No .memorylanerc found. Run `memory-lane init` first.');
      process.exit(1);
    }

    const config = loadConfig(configDir);
    const today = format(new Date(), 'yyyy-MM-dd');

    // Determine start date (last run or midnight today)
    const lastRun = readLastRunFile(configDir);
    const sinceDate = lastRun || `${today}T00:00:00`;

    console.log(`Scanning git activity since: ${sinceDate}`);

    // Get session context
    let context;
    try {
      context = await getSessionContext(sinceDate);
    } catch (err) {
      console.error('Error reading git context:', (err as Error).message);
      process.exit(1);
    }

    // Check if there's anything to journal
    const hasCommits = context.commits.length > 0;
    const hasChanges = context.changes.length > 0;

    if (!hasCommits && !hasChanges) {
      console.log('No activity detected since last run. Nothing to journal.');
      writeLastRunFile(configDir, new Date().toISOString());
      return;
    }

    console.log(`Found ${context.commits.length} commits and ${context.changes.length} uncommitted changes.`);

    // Summarize with LLM
    let summary: string;
    try {
      summary = await summarizeSession(context);
    } catch (err) {
      console.error('Error calling LLM:', (err as Error).message);
      process.exit(1);
    }

    console.log(`\nAI Summary: ${summary}`);

    // Append to journal
    const entry = {
      date: today,
      summary,
      changes: context.changes,
      generatedAt: format(new Date(), 'HH:mm')
    };

    appendEntry(entry);

    // Update last run
    writeLastRunFile(configDir, new Date().toISOString());
    console.log('\nDone!');
  });