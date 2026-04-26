import { Command } from 'commander';
import { loadConfig, findConfigDir } from '../lib/config.js';
import { getSessionContext, readLastRunFile, writeLastRunFile, isGitRepo } from '../lib/git.js';
import { appendEntry, getWeekEntries, writeWeekSummary } from '../lib/journal.js';
import { summarizeSession, summarizeWeek } from '../lib/summarizer.js';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export const runCommand = new Command('run')
  .description('Run the MemoryLane journaling loop')
  .option('--week', 'Generate a weekly summary instead of a daily entry')
  .action(async (opts: { week?: boolean }) => {
    if (opts.week) {
      return runWeeklySummary();
    }
    return runDaily();
  });

async function runWeeklySummary() {
  console.log('MemoryLane — Generating weekly summary...\n');

  const configDir = findConfigDir();
  if (!configDir) {
    console.error('Error: No .memorylanerc found. Run `memory-lane init` first.');
    process.exit(1);
  }

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });   // Sunday

  const startStr = format(weekStart, 'yyyy-MM-dd');
  const endStr = format(weekEnd, 'yyyy-MM-dd');

  console.log(`Scanning journal entries from ${startStr} to ${endStr}...`);

  let entries;
  try {
    entries = getWeekEntries(startStr, endStr);
  } catch (err) {
    console.error('Error reading journal entries:', (err as Error).message);
    process.exit(1);
  }

  if (entries.length === 0) {
    console.log('No journal entries found for this week. Run `memory-lane run` first.');
    process.exit(1);
  }

  console.log(`Found ${entries.length} journal ${entries.length === 1 ? 'entry' : 'entries'} for this week.`);

  // Build per-day count map
  const dayCount: Record<string, number> = {};
  for (const e of entries) {
    dayCount[e.date] = (dayCount[e.date] || 0) + 1;
  }

  console.log(`\nPer-day entry count:`);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let current = weekStart;
  for (let i = 0; i < 7; i++) {
    const dayStr = format(current, 'yyyy-MM-dd');
    const label = days[i];
    const count = dayCount[dayStr] || 0;
    console.log(`  ${label} (${dayStr}): ${count} ${count === 1 ? 'entry' : 'entries'}`);
    current = new Date(current);
    current.setDate(current.getDate() + 1);
  }

  let summary: string;
  try {
    summary = await summarizeWeek(entries);
  } catch (err) {
    console.error('Error calling LLM:', (err as Error).message);
    process.exit(1);
  }

  console.log(`\nWeekly AI Summary: ${summary}`);

  try {
    writeWeekSummary({
      weekStart: startStr,
      weekEnd: endStr,
      summary,
      entries,
    });
  } catch (err) {
    console.error('Error writing weekly summary:', (err as Error).message);
    process.exit(1);
  }

  console.log('\nDone!');
}

async function runDaily() {
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
}
