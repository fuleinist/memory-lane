#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { runCommand } from './commands/run.js';
import { searchCommand } from './commands/search.js';

const program = new Command();

program
  .name('memory-lane')
  .description('AI-powered CLI tool that automatically maintains a markdown journal of your coding work')
  .version('0.1.0')
  .addCommand(initCommand)
  .addCommand(runCommand)
  .addCommand(searchCommand);

program.parse();