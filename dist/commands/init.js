import { Command } from 'commander';
import { getDefaultConfig, saveConfig } from '../lib/config.js';
import { initJournalDir } from '../lib/journal.js';
export const initCommand = new Command('init')
    .description('Initialize MemoryLane journal in the current directory')
    .action(async () => {
    const configDir = process.cwd();
    const config = getDefaultConfig();
    // Create .memorylane directory
    const memorylaneDir = `${configDir}/.memorylane`;
    const { mkdirSync, existsSync } = await import('fs');
    if (!existsSync(memorylaneDir)) {
        mkdirSync(memorylaneDir, { recursive: true });
    }
    // Initialize journal directory
    initJournalDir(configDir, 'journal');
    // Save default config
    saveConfig(config, configDir);
    console.log('MemoryLane initialized!');
    console.log('Created:');
    console.log('  - .memorylane/ directory');
    console.log('  - journal/ directory');
    console.log('  - .memorylanerc (configuration)');
    console.log('\nEdit .memorylanerc to configure your LLM provider.');
    console.log('Then run: memory-lane run');
});
//# sourceMappingURL=init.js.map