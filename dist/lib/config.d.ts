import type { Config } from '../types.js';
export declare function findConfigDir(from?: string): string | null;
export declare function loadConfig(dir?: string): Config;
export declare function getDefaultConfig(): Config;
export declare function saveConfig(config: Config, dir: string): void;
//# sourceMappingURL=config.d.ts.map