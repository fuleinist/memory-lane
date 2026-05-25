import fs from 'fs';
import { Command } from 'commander';
import { fetchGitHubActivity, formatGitHubActivitySummary } from '../lib/github.js';
import { findConfigDir } from '../lib/config.js';

export const githubCommand = new Command('github')
  .description('Fetch recent GitHub activity for a repository and include in journal')
  .argument('<owner/repo>', 'GitHub repository in owner/repo format')
  .option('--token <token>', 'GitHub API token (or set GITHUB_TOKEN env var)')
  .option('--no-journal', 'Show output without appending to journal')
  .option('--json', 'Output activity as JSON for scripting')
  .action(async (repoSpec: string, opts: { token?: string; noJournal?: boolean; json?: boolean }) => {
    // Parse owner/repo
    const parts = repoSpec.split('/');
    if (parts.length !== 2) {
      console.error('Error: Repository must be in owner/repo format (e.g. anthropics/claude-code)');
      process.exit(1);
    }
    const [owner, repo] = parts;

    // Get token from flag or env
    const token = opts.token || process.env.GITHUB_TOKEN;

    const config = {
      owner,
      repo,
      token,
      apiUrl: 'https://api.github.com',
    };

    console.log(`Fetching GitHub activity for ${owner}/${repo}...`);

    let activities;
    try {
      activities = await fetchGitHubActivity(config);
    } catch (err) {
      console.error('Error fetching GitHub activity:', (err as Error).message);
      process.exit(1);
    }

    if (activities.length === 0) {
      console.log('No GitHub activity found.');
      return;
    }

    if (opts.json) {
      console.log(JSON.stringify({ owner, repo, activities }, null, 2));
      return;
    }

    // Print summary
    const summary = formatGitHubActivitySummary(activities);
    console.log(`\n${summary}\n`);

    const recent = activities.slice(0, 10);
    for (const a of recent) {
      const date = a.date.split('T')[0];
      console.log(`  [${date}] ${a.type}: ${a.title}`);
      console.log(`    ${a.url}`);
    }

    // If --no-journal, skip appending
    if (opts.noJournal) {
      return;
    }

    const configDir = findConfigDir();
    if (!configDir) {
      console.log('\nNote: No .memorylanerc found. Run `memory-lane init` first to enable journal integration.');
      return;
    }

    const { loadConfig } = await import('../lib/config.js');
    const journalConfig = loadConfig(configDir);
    const today = new Date().toISOString().split('T')[0];
    const journalPath = `${configDir}/${journalConfig.journalDir}/${today}.md`;

    const entryLines = [
      '',
      `## GitHub Activity: ${owner}/${repo}`,
      '',
      summary,
      '',
    ];

    for (const a of recent) {
      const date = a.date.split('T')[0];
      entryLines.push(`- ${a.type}: [${a.title}](${a.url}) (${date})`);
    }

    entryLines.push('');

    fs.appendFileSync(journalPath, entryLines.join('\n'), 'utf-8');
    console.log(`\nAppended GitHub activity to ${journalPath}`);
  });
