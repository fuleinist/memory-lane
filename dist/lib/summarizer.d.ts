import type { SessionContext } from '../types.js';
import type { WeekSummaryEntry, MonthSummaryEntry } from './journal.js';
export declare function summarizeWeek(entries: WeekSummaryEntry[]): Promise<string>;
export declare function summarizeMonth(entries: MonthSummaryEntry[]): Promise<string>;
export declare function summarizeSession(context: SessionContext): Promise<string>;
//# sourceMappingURL=summarizer.d.ts.map