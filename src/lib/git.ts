import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs';
import type { GitChange, CommitInfo, SessionContext } from '../types.js';

function getGit(): SimpleGit {
  return simpleGit(path.parse(process.cwd()).root === process.cwd() 
    ? process.cwd() 
    : process.cwd());
}

export async function isGitRepo(): Promise<boolean> {
  try {
    const git = getGit();
    return await git.checkIsRepo();
  } catch {
    return false;
  }
}

export async function getCommitsSince(date: string): Promise<CommitInfo[]> {
  const git = getGit();
  const log = await git.log({ '--after': date, '--all': undefined } as any);
  
  return log.all.map(commit => ({
    hash: commit.hash,
    message: commit.message,
    date: commit.date,
    author: commit.author_name
  }));
}

export async function getUncommittedChanges(): Promise<GitChange[]> {
  const git = getGit();
  const status = await git.status();
  const changes: GitChange[] = [];

  for (const file of status.modified) {
    changes.push({ file, status: 'modified' });
  }
  for (const file of status.created) {
    changes.push({ file, status: 'added' });
  }
  for (const file of status.deleted) {
    changes.push({ file, status: 'deleted' });
  }
  for (const file of status.renamed) {
    changes.push({ file: file.to, status: 'renamed' });
  }

  return changes;
}

export async function getDiffForFiles(files: string[]): Promise<string> {
  if (files.length === 0) return '';
  const git = getGit();
  // Get diff stats
  const diffSummary = await git.diff(['--stat', ...files]);
  // Get actual diff (first 50 lines per file to keep it manageable)
  let diff = '';
  for (const file of files) {
    try {
      const fileDiff = await git.diff([file]);
      const lines = fileDiff.split('\n').slice(0, 50).join('\n');
      diff += `\n--- ${file} ---\n${lines}\n`;
    } catch {
      diff += `\n--- ${file} ---\n(binary or unavailable)\n`;
    }
  }
  return diff.trim() || diffSummary;
}

export async function getSessionContext(sinceDate: string): Promise<SessionContext> {
  const commits = await getCommitsSince(sinceDate);
  const changes = await getUncommittedChanges();
  const fileList = changes.map(c => c.file);
  const diff = await getDiffForFiles(fileList);

  const today = new Date().toISOString().split('T')[0];

  return {
    date: today,
    commits,
    changes,
    uncommittedDiff: diff
  };
}

export function readLastRunFile(configDir: string): string | null {
  const lastRunPath = path.join(configDir, '.memorylane', 'last-run');
  if (!fs.existsSync(lastRunPath)) {
    return null;
  }
  return fs.readFileSync(lastRunPath, 'utf-8').trim();
}

export function writeLastRunFile(configDir: string, date: string): void {
  const dir = path.join(configDir, '.memorylane');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const lastRunPath = path.join(dir, 'last-run');
  fs.writeFileSync(lastRunPath, date, 'utf-8');
}