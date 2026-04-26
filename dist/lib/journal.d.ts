import type { JournalEntry, SearchOptions } from '../types.js';
export interface WeekSummaryEntry {
    date: string;
    summary: string;
}
export interface WeekSummaryResult {
    weekStart: string;
    weekEnd: string;
    summary: string;
    entries: WeekSummaryEntry[];
}
export interface MonthSummaryEntry {
    date: string;
    summary: string;
}
export interface MonthSummaryResult {
    month: string;
    summary: string;
    entries: MonthSummaryEntry[];
}
export declare function getJournalPath(date: string): string;
export declare function journalExists(date: string): boolean;
export declare function appendEntry(entry: JournalEntry): void;
export declare function searchJournal(query: string, options?: SearchOptions): Array<{
    date: string;
    line: string;
    lineNum: number;
}>;
export declare function initJournalDir(dir: string, journalDir: string): void;
export declare function getWeekEntries(weekStart: string, weekEnd: string): WeekSummaryEntry[];
export declare function writeWeekSummary(result: WeekSummaryResult): void;
export declare function getMonthEntries(year: number, month: number): MonthSummaryEntry[];
export declare function writeMonthSummary(result: MonthSummaryResult): void;
//# sourceMappingURL=journal.d.ts.map