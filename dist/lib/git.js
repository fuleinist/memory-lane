import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';
function getGit() {
    return simpleGit(path.parse(process.cwd()).root === process.cwd()
        ? process.cwd()
        : process.cwd());
}
export async function isGitRepo() {
    try {
        const git = getGit();
        return await git.checkIsRepo();
    }
    catch {
        return false;
    }
}
export async function getCommitsSince(date) {
    const git = getGit();
    const log = await git.log({ '--after': date, '--all': undefined });
    return log.all.map(commit => ({
        hash: commit.hash,
        message: commit.message,
        date: commit.date,
        author: commit.author_name
    }));
}
export async function getUncommittedChanges() {
    const git = getGit();
    const status = await git.status();
    const changes = [];
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
export async function getDiffForFiles(files) {
    if (files.length === 0)
        return '';
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
        }
        catch {
            diff += `\n--- ${file} ---\n(binary or unavailable)\n`;
        }
    }
    return diff.trim() || diffSummary;
}
export async function getSessionContext(sinceDate) {
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
export function readLastRunFile(configDir) {
    const lastRunPath = path.join(configDir, '.memorylane', 'last-run');
    if (!fs.existsSync(lastRunPath)) {
        return null;
    }
    return fs.readFileSync(lastRunPath, 'utf-8').trim();
}
export function writeLastRunFile(configDir, date) {
    const dir = path.join(configDir, '.memorylane');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const lastRunPath = path.join(dir, 'last-run');
    fs.writeFileSync(lastRunPath, date, 'utf-8');
}
//# sourceMappingURL=git.js.map