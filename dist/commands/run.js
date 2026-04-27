import { Command } from 'commander';
import { loadConfig, findConfigDir } from '../lib/config.js';
import { getSessionContext, readLastRunFile, writeLastRunFile, isGitRepo } from '../lib/git.js';
import { appendEntry, getWeekEntries, writeWeekSummary } from '../lib/journal.js';
import { summarizeSession, summarizeWeek } from '../lib/summarizer.js';
import { format, startOfWeek, endOfWeek } from 'date-fns';
export const runCommand = new Command('run')
    .description('Run the MemoryLane journaling loop')
    .option('--week', 'Generate a weekly summary instead of a daily entry')
    .option('--date <date>', 'Journal date in YYYY-MM-DD format (default: today). Use to backfill past days.')
    .option('--dry-run', 'Preview the journal entry without saving it')
    .action(async (opts) => {
    if (opts.week) {
        return runWeeklySummary();
    }
    return runDaily(opts.date, opts.dryRun);
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
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
    const startStr = format(weekStart, 'yyyy-MM-dd');
    const endStr = format(weekEnd, 'yyyy-MM-dd');
    console.log(`Scanning journal entries from ${startStr} to ${endStr}...`);
    let entries;
    try {
        entries = getWeekEntries(startStr, endStr);
    }
    catch (err) {
        console.error('Error reading journal entries:', err.message);
        process.exit(1);
    }
    if (entries.length === 0) {
        console.log('No journal entries found for this week. Run `memory-lane run` first.');
        process.exit(1);
    }
    console.log(`Found ${entries.length} journal ${entries.length === 1 ? 'entry' : 'entries'} for this week.`);
    let summary;
    try {
        summary = await summarizeWeek(entries);
    }
    catch (err) {
        console.error('Error calling LLM:', err.message);
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
    }
    catch (err) {
        console.error('Error writing weekly summary:', err.message);
        process.exit(1);
    }
    console.log('\nDone!');
}
async function runDaily(dateOverride, dryRun) {
    console.log('MemoryLane running...\n\n');
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
    const today = dateOverride || format(new Date(), 'yyyy-MM-dd');
    // Validate date format if provided
    if (dateOverride && !/^\d{4}-\d{2}-\d{2}$/.test(dateOverride)) {
        console.error('Error: --date must be in YYYY-MM-DD format.');
        process.exit(1);
    }
    // Determine start date (last run or midnight of target date)
    const lastRun = readLastRunFile(configDir);
    const sinceDate = lastRun || `${today}T00:00:00`;
    console.log(`Scanning git activity since: ${sinceDate}`);
    // Get session context
    let context;
    try {
        context = await getSessionContext(sinceDate);
    }
    catch (err) {
        console.error('Error reading git context:', err.message);
        process.exit(1);
    }
    // Check if there's anything to journal
    const hasCommits = context.commits.length > 0;
    const hasChanges = context.changes.length > 0;
    if (!hasCommits && !hasChanges) {
        console.log('No activity detected since last run. Nothing to journal.');
        if (!dryRun)
            writeLastRunFile(configDir, new Date().toISOString());
        return;
    }
    console.log(`Found ${context.commits.length} commits and ${context.changes.length} uncommitted changes.`);
    // Summarize with LLM
    let summary;
    try {
        summary = await summarizeSession(context);
    }
    catch (err) {
        console.error('Error calling LLM:', err.message);
        process.exit(1);
    }
    console.log(`\nAI Summary: ${summary}`);
    if (dryRun) {
        console.log('\n[Dry run] Journal entry NOT saved.');
        console.log(`\nWould write to journal/${today}.md:`);
        const changeList = context.changes.length > 0
            ? context.changes.map(c => `  - \`${c.file}\` — ${c.status}`).join('\n')
            : '  (no file changes detected)';
        console.log(`\n## ${today}\n\n**Summary:** ${summary}\n\n**Changes:**\n${changeList}\n`);
        return;
    }
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
//# sourceMappingURL=run.js.map