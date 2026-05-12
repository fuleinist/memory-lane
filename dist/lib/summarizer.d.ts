import type { SessionContext } from '../types.js';
import type { WeekSummaryEntry } from './journal.js';
export declare function summarizeWeek(entries: WeekSummaryEntry[]): Promise<string>;
export interface GitSummaryOptions {
    includeCommits?: boolean;
    includeChanges?: boolean;
    includeDiff?: boolean;
}
export declare function generateGitSummary(context: SessionContext, opts?: GitSummaryOptions): string;
export declare function summarizeSession(context: SessionContext): Promise<string>;
//# sourceMappingURL=summarizer.d.ts.map