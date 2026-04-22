import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { Config } from '../types.js';

const CONFIG_FILE = '.memorylanerc';

export function findConfigDir(from = process.cwd()): string | null {
  let dir = from;
  while (dir !== path.parse(dir).root) {
    const configPath = path.join(dir, CONFIG_FILE);
    if (fs.existsSync(configPath)) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

export function loadConfig(dir?: string): Config {
  const configDir = dir ?? findConfigDir();
  if (!configDir) {
    return getDefaultConfig();
  }

  const configPath = path.join(configDir, CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    return getDefaultConfig();
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  const parsed = yaml.load(raw) as Partial<Config>;
  return { ...getDefaultConfig(), ...parsed };
}

export function getDefaultConfig(): Config {
  return {
    provider: 'ollama',
    ollama: {
      url: 'http://localhost:11434',
      model: 'llama3'
    },
    journalDir: 'journal',
    excludePatterns: ['**/node_modules/**', '**/.git/**']
  };
}

export function saveConfig(config: Config, dir: string): void {
  const configPath = path.join(dir, CONFIG_FILE);
  fs.writeFileSync(configPath, yaml.dump(config), 'utf-8');
}