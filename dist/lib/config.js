import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
const CONFIG_FILE = '.memorylanerc';
export function findConfigDir(from = process.cwd()) {
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
export function loadConfig(dir) {
    const configDir = dir ?? findConfigDir();
    if (!configDir) {
        return getDefaultConfig();
    }
    const configPath = path.join(configDir, CONFIG_FILE);
    if (!fs.existsSync(configPath)) {
        return getDefaultConfig();
    }
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = yaml.load(raw);
    return { ...getDefaultConfig(), ...parsed };
}
export function getDefaultConfig() {
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
export function saveConfig(config, dir) {
    const configPath = path.join(dir, CONFIG_FILE);
    fs.writeFileSync(configPath, yaml.dump(config), 'utf-8');
}
//# sourceMappingURL=config.js.map