import { loadConfig } from './config.js';
export async function summarizeWeek(entries) {
    const config = loadConfig();
    const prompt = buildWeekPrompt(entries);
    if (config.provider === 'ollama') {
        return await callOllama(prompt, config);
    }
    else if (config.provider === 'openai') {
        return await callOpenAI(prompt, config);
    }
    else if (config.provider === 'anthropic') {
        return await callAnthropic(prompt, config);
    }
    throw new Error(`Unknown provider: ${config.provider}`);
}
function buildWeekPrompt(entries) {
    const dayList = entries
        .map(e => `  - [${e.date}] ${e.summary}`)
        .join('\n');
    return `You are a developer journaling assistant. Generate a concise weekly summary (3-4 sentences) that captures the overall themes and highlights of the week's coding work. Group related activities together and identify the main focus areas. Be specific — avoid generic phrases like "worked on various tasks."

## Daily Entries:
${dayList}

Write a focused weekly summary that a developer would want to review for a weekly standup or code review meeting.`;
}
function buildMonthPrompt(entries) {
    const dayList = entries
        .map(e => `  - [${e.date}] ${e.summary}`)
        .join('\n');
    return `You are a developer journaling assistant. Generate a concise monthly summary (4-5 sentences) that captures the overall themes, major accomplishments, and focus areas of the month. Group related activities together and highlight the most significant work. Be specific — avoid generic phrases like "worked on various tasks."

## Daily Entries:
${dayList}

Write a focused monthly summary suitable for a monthly report or portfolio review.`;
}
export async function summarizeMonth(entries) {
    const config = loadConfig();
    const prompt = buildMonthPrompt(entries);
    if (config.provider === 'ollama') {
        return await callOllama(prompt, config);
    }
    else if (config.provider === 'openai') {
        return await callOpenAI(prompt, config);
    }
    else if (config.provider === 'anthropic') {
        return await callAnthropic(prompt, config);
    }
    throw new Error(`Unknown provider: ${config.provider}`);
}
export async function summarizeSession(context) {
    const config = loadConfig();
    const prompt = buildPrompt(context);
    if (config.provider === 'ollama') {
        return await callOllama(prompt, config);
    }
    else if (config.provider === 'openai') {
        return await callOpenAI(prompt, config);
    }
    else if (config.provider === 'anthropic') {
        return await callAnthropic(prompt, config);
    }
    throw new Error(`Unknown provider: ${config.provider}`);
}
function buildPrompt(context) {
    const commitList = context.commits.length > 0
        ? context.commits.map(c => `  - [${c.hash.slice(0, 7)}] ${c.message}`).join('\n')
        : '  (no commits since last run)';
    const changeList = context.changes.length > 0
        ? context.changes.map(c => `  - \`${c.file}\` (${c.status})`).join('\n')
        : '  (no uncommitted changes)';
    return `You are a developer journaling assistant. Summarize the following coding session in 2-3 sentences as a work log. Focus on what was accomplished, not just listing changes. Be specific about the work done.

## Session Date: ${context.date}

## Commits since last run:
${commitList}

## Uncommitted changes:
${changeList}

## Diff summary:
${context.uncommittedDiff || '(no diff available)'}

Write a concise summary that captures what the developer actually worked on today.`;
}
async function callOllama(prompt, config) {
    const { url, model } = config.ollama;
    try {
        const response = await fetch(`${url}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt, stream: false })
        });
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }
        const data = await response.json();
        return data.response?.trim() ?? 'Summary unavailable';
    }
    catch (err) {
        const error = err;
        throw new Error(`Failed to connect to Ollama at ${url}: ${error.message}. Is Ollama running?`);
    }
}
async function callOpenAI(prompt, config) {
    const { apiKey, model } = config.openai;
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 200
            })
        });
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() ?? 'Summary unavailable';
    }
    catch (err) {
        const error = err;
        throw new Error(`OpenAI API error: ${error.message}`);
    }
}
async function callAnthropic(prompt, config) {
    const { apiKey, model } = config.anthropic;
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model || 'claude-3-5-sonnet-20241014',
                max_tokens: 200,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status}`);
        }
        const data = await response.json();
        return data.content?.[0]?.text?.trim() ?? 'Summary unavailable';
    }
    catch (err) {
        const error = err;
        throw new Error(`Anthropic API error: ${error.message}`);
    }
}
//# sourceMappingURL=summarizer.js.map