import { Command } from 'commander';
import { searchJournal } from '../lib/journal.js';
export const searchCommand = new Command('search')
    .description('Search the journal for entries matching a query')
    .argument('<query>', 'Search query (case-insensitive)')
    .option('--from <date>', 'Filter entries from this date (YYYY-MM-DD)')
    .option('--to <date>', 'Filter entries up to this date (YYYY-MM-DD)')
    .option('--stats', 'Show search statistics before results')
    .action(async (query, opts) => {
    if (opts.stats) {
        printSearchStats(query, opts);
    }
    const results = searchJournal(query, opts);
    if (results.length === 0) {
        console.log(`No entries found matching: "${query}"`);
        return;
    }
    console.log(`Found ${results.length} matches:\n`);
    for (const result of results) {
        console.log(`[${result.date}:${result.lineNum}] ${result.line}`);
    }
});
function printSearchStats(query, opts) {
    const { from, to } = opts;
    const allResults = searchJournal(query, { from, to });
    if (allResults.length === 0) {
        console.log('Search Statistics: no matches found.\n');
        return;
    }
    const dates = [...new Set(allResults.map(r => r.date))].sort();
    const entriesPerDay = dates.map(d => ({
        date: d,
        count: allResults.filter(r => r.date === d).length
    }));
    const totalWords = allResults.reduce((acc, r) => acc + r.line.split(/\s+/).length, 0);
    const rangeStart = dates[0];
    const rangeEnd = dates[dates.length - 1];
    console.log('Search Statistics:');
    console.log(`  Total matches: ${allResults.length}`);
    console.log(`  Entries searched: ${dates.length}`);
    console.log(`  Date range: ${rangeStart} → ${rangeEnd}`);
    console.log(`  Words matched: ${totalWords}`);
    console.log('  Entries per day:');
    for (const e of entriesPerDay) {
        console.log(`    ${e.date}: ${e.count} match${e.count !== 1 ? 'es' : ''}`);
    }
    console.log();
}
//# sourceMappingURL=search.js.map