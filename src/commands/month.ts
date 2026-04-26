import { Command } from 'commander';
import { loadConfig, findConfigDir } from '../lib/config.js';
import { getMonthEntries, writeMonthSummary } from '../lib/journal.js';
import { summarizeMonth } from '../lib/summarizer.js';
import { format } from 'date-fns';

export const monthCommand = new Command('month')
  .description('Generate a monthly summary from journal entries')
  .option('--YYYY-MM <month>', 'Month to summarize (YYYY-MM format, defaults to current month)')
  .action(async (opts: { YYYYMM?: string }) => {
    const configDir = findConfigDir();
    if (!configDir) {
      console.error('Error: No .memorylanerc found. Run `memory-lane init` first.');
      process.exit(1);
    }

    let year: number;
    let month: number;

    if (opts.YYYYMM) {
      const parts = opts.YYYYMM.split('-');
      if (parts.length !== 2) {
        console.error('Error: --month must be in YYYY-MM format.');
        process.exit(1);
      }
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        console.error('Error: Invalid year or month.');
        process.exit(1);
      }
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1; // getMonth is 0-indexed
    }

    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    console.log(`MemoryLane — Generating monthly summary for ${monthStr}...\n`);
    console.log('Scanning journal entries...');

    let entries;
    try {
      entries = getMonthEntries(year, month);
    } catch (err) {
      console.error('Error reading journal entries:', (err as Error).message);
      process.exit(1);
    }

    if (entries.length === 0) {
      console.log('No journal entries found for this month. Run `memory-lane run` first.');
      process.exit(1);
    }

    console.log(`Found ${entries.length} journal ${entries.length === 1 ? 'entry' : 'entries'} for ${monthStr}.`);

    let summary: string;
    try {
      summary = await summarizeMonth(entries);
    } catch (err) {
      console.error('Error calling LLM:', (err as Error).message);
      process.exit(1);
    }

    console.log(`\nMonthly AI Summary: ${summary}`);

    try {
      writeMonthSummary({
        month: monthStr,
        summary,
        entries,
      });
    } catch (err) {
      console.error('Error writing monthly summary:', (err as Error).message);
      process.exit(1);
    }

    console.log('\nDone!');
  });
