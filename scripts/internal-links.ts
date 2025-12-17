import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RULES_PATH = path.join(__dirname, '../rules/internal-links.yaml');
const CONTENT_DIR = path.join(__dirname, '../src/content/insights');
const BASE_URL = 'https://incierge.jp';

interface Rule {
    target_hub_slug: string;
    trigger_keywords: string[];
    insertion_strategy: 'append_after_paragraph' | 'inline_keyword';
    anchor_text: string;
    link_path: string;
}

const args = process.argv.slice(2);
const mode = args[0] || 'dry-run'; // dry-run, apply, verify

async function loadRules(): Promise<Rule[]> {
    if (!fs.existsSync(RULES_PATH)) {
        console.error(`Rules file not found at ${RULES_PATH}`);
        process.exit(1);
    }
    const fileContents = fs.readFileSync(RULES_PATH, 'utf8');
    return yaml.load(fileContents) as Rule[];
}

function getMdxFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getMdxFiles(filePath));
        } else {
            if (file.endsWith('.mdx')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

async function verifyLinks() {
    console.log('Verifying links...');
    // Simple check: do the target paths defined in rules exist as files?
    // Ideally we would check HTTP 200 against localhost or prod.
    // Here we check against file system existence for "link_path".

    const rules = await loadRules();
    let errors = 0;

    for (const rule of rules) {
        // Convert /insights/slug/ to src/content/insights/slug.mdx ??
        // Actually the prompt asks to check existing hub pages.
        // Assuming file path logic: /insights/slug/ -> slug.mdx
        const slug = rule.link_path.replace('/insights/', '').replace(/\/$/, '');
        const expectedFile = path.join(CONTENT_DIR, `${slug}.mdx`);

        if (!fs.existsSync(expectedFile)) {
            console.error(`[FAIL] Target for ${rule.link_path} not found at ${expectedFile}`);
            errors++;
        } else {
            console.log(`[OK] ${rule.link_path} resolves to ${expectedFile}`);
        }
    }

    if (errors === 0) {
        console.log('All rule targets verify (local file check).');
    } else {
        process.exit(1);
    }
}

async function processFiles() {
    const rules = await loadRules();
    const files = getMdxFiles(CONTENT_DIR);

    console.log(`Mode: ${mode}`);
    console.log(`Found ${files.length} MDX files.`);

    for (const file of files) {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;
        let originalContent = content;

        // Skip if file is the target hub itself (prevent self-linking)
        const filename = path.basename(file, '.mdx');

        for (const rule of rules) {
            if (rule.link_path.includes(filename)) continue; // Self-link check
            if (content.includes(rule.link_path)) continue; // Idempotency: Link already exists

            // Keywords check
            const keyword = rule.trigger_keywords.find(k => content.includes(k));
            if (!keyword) continue;

            if (rule.insertion_strategy === 'inline_keyword') {
                // Strategy: Replace first occurrence of keyword with [keyword](link)
                // Check if keyword is already inside a link
                const regex = new RegExp(`(?<!\\[)${keyword}(?!\\])`, 'i'); // Simple check
                if (regex.test(content)) {
                    // Check if we are inside a tag or link (very basic check)
                    // For strict robustness, we might want to avoid breaking existing markdown links.
                    // Here we just replace the first safe occurrence.
                    const replacement = `[${keyword}](${rule.link_path})`;
                    content = content.replace(keyword, replacement);
                    console.log(`[${path.basename(file)}] Planning to replace "${keyword}" with link.`);
                    modified = true;
                }
            } else if (rule.insertion_strategy === 'append_after_paragraph') {
                // Strategy: Find paragraph containing keyword, append context link
                const lines = content.split('\n');
                let lineIdx = -1;

                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes(keyword) && !lines[i].startsWith('#') && !lines[i].startsWith('import')) {
                        // Ensure line doesn't already have the link
                        if (!lines[i].includes(rule.link_path)) {
                            lineIdx = i;
                            break;
                        }
                    }
                }

                if (lineIdx !== -1) {
                    // Append to the end of the paragraph (detected by empty line after, or just append to line)
                    // We'll append a new sentence.
                    const injection = ` (参考: [${rule.anchor_text}](${rule.link_path}))`;
                    lines[lineIdx] = lines[lineIdx] + injection;
                    content = lines.join('\n');
                    console.log(`[${path.basename(file)}] Planning to append link after keyword "${keyword}".`);
                    modified = true;
                }
            }
        }

        if (modified) {
            if (mode === 'apply') {
                fs.writeFileSync(file, content, 'utf8');
                console.log(`[APPLY] Wrote changes to ${file}`);
            } else {
                console.log(`[DRY-RUN] Would modify ${file}`);
            }
        }
    }
}

if (mode === 'verify') {
    verifyLinks();
} else {
    processFiles();
}
