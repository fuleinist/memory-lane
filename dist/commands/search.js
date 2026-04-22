import { Command } from 'commander';
import { searchJournal } from '../lib/journal.js';
export const searchCommand = new Command('search')
    .description('Search the journal for entries matching a query')
    .argument('<query>', 'Search query (case-insensitive)')
    .action(async (query) => {
    const results = searchJournal(query);
    if (results.length === 0) {
        console.log(`No entries found matching: "${query}"`);
        return;
    }
    console.log(`Found ${results.length} matches:\n`);
    for (const result of results) {
        console.log(`[${result.date}:${result.lineNum}] ${result.line}`);
    }
});
//# sourceMappingURL=search.js.map