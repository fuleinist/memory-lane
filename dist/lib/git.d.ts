import type { GitChange, CommitInfo, SessionContext } from '../types.js';
export declare function isGitRepo(): Promise<boolean>;
export declare function getCommitsSince(date: string): Promise<CommitInfo[]>;
export declare function getUncommittedChanges(): Promise<GitChange[]>;
export declare function getDiffForFiles(files: string[]): Promise<string>;
export declare function getSessionContext(sinceDate: string): Promise<SessionContext>;
export declare function readLastRunFile(configDir: string): string | null;
export declare function writeLastRunFile(configDir: string, date: string): void;
//# sourceMappingURL=git.d.ts.map