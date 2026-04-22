import type { JournalEntry } from '../types.js';
export declare function getJournalPath(date: string): string;
export declare function journalExists(date: string): boolean;
export declare function appendEntry(entry: JournalEntry): void;
export declare function searchJournal(query: string): Array<{
    date: string;
    line: string;
    lineNum: number;
}>;
export declare function initJournalDir(dir: string, journalDir: string): void;
//# sourceMappingURL=journal.d.ts.map