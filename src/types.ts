export interface OllamaConfig {
  url: string;
  model: string;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
}

export interface Config {
  provider: 'ollama' | 'openai' | 'anthropic';
  ollama?: OllamaConfig;
  openai?: OpenAIConfig;
  anthropic?: { apiKey: string; model: string };
  journalDir: string;
  excludePatterns: string[];
}

export interface GitChange {
  file: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions?: number;
  deletions?: number;
}

export interface CommitInfo {
  hash: string;
  message: string;
  date: string;
  author: string;
}

export interface SessionContext {
  date: string;
  commits: CommitInfo[];
  changes: GitChange[];
  uncommittedDiff: string;
}

export interface SearchOptions {
  from?: string;
  to?: string;
}

export interface JournalEntry {
  date: string;
  summary: string;
  changes: GitChange[];
  generatedAt: string;
}