#!/usr/bin/env node
import { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const program = new Command();
const BONFIRE_DIR = '.bonfire';
const CHECKPOINTS_DIR = 'checkpoints';
const INSTRUCTIONS_FILE = 'agent-instructions.md';

function getGitUser(): string {
  try {
    return execSync('git config user.name', { encoding: 'utf8' }).trim();
  } catch {
    return 'Unknown';
  }
}

const AI_INSTRUCTIONS = `# Bonfire AI Instructions
This project uses Bonfire to track AI session context.
At the end of your session, or when you reach a major milestone, please:
1. Summarize your progress, current state, and next steps.
2. Run \`bonfire create "<your summary>"\` to save this context.
   - You can specify an author with \`--author "Name"\`.
   - By default, it uses your git user name.
3. This helps maintain continuity across sessions and between developers.
`;

program
  .name('bonfire')
  .description('A tool to save and recall AI coding session context.')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize the .bonfire folder and setup agent instructions.')
  .action(async () => {
    const rootDir = process.cwd();
    const bonfirePath = path.join(rootDir, BONFIRE_DIR);
    const checkpointsPath = path.join(bonfirePath, CHECKPOINTS_DIR);

    if (!fs.existsSync(bonfirePath)) {
      fs.mkdirSync(bonfirePath);
      console.log(`Created ${BONFIRE_DIR} directory.`);
    } else {
      console.log(`${BONFIRE_DIR} directory already exists.`);
    }

    if (!fs.existsSync(checkpointsPath)) {
      fs.mkdirSync(checkpointsPath);
      console.log(`Created ${path.join(BONFIRE_DIR, CHECKPOINTS_DIR)} directory.`);
    }

    // Migrate existing checkpoints if any
    const existingFiles = fs.readdirSync(bonfirePath)
      .filter(f => f.endsWith('.md') && f !== INSTRUCTIONS_FILE);
    
    if (existingFiles.length > 0) {
      console.log(`Migrating ${existingFiles.length} existing checkpoints to ${CHECKPOINTS_DIR}/...`);
      for (const file of existingFiles) {
        fs.renameSync(path.join(bonfirePath, file), path.join(checkpointsPath, file));
      }
    }

    const instructionsPath = path.join(bonfirePath, INSTRUCTIONS_FILE);
    fs.writeFileSync(instructionsPath, AI_INSTRUCTIONS);
    console.log(`Created ${path.join(BONFIRE_DIR, INSTRUCTIONS_FILE)}.`);

    // Interactive injection
    const configs = [
      { name: '.cursorrules', path: path.join(rootDir, '.cursorrules') },
      { name: '.gemini/system.md', path: path.join(rootDir, '.gemini', 'system.md') },
      { name: '.agents.md', path: path.join(rootDir, '.agents.md') },
      { name: 'AGENTS.md', path: path.join(rootDir, 'AGENTS.md') }
    ];

    for (const config of configs) {
      if (fs.existsSync(config.path)) {
        const shouldAppend = await confirm({
          message: `Found ${config.name}. Would you like to append bonfire instructions to it?`,
          default: false
        });

        if (shouldAppend) {
          const content = fs.readFileSync(config.path, 'utf-8');
          if (!content.includes('bonfire create')) {
            fs.appendFileSync(config.path, `\n\n${AI_INSTRUCTIONS}`);
            console.log(`Appended instructions to ${config.name}.`);
          } else {
            console.log(`Instructions already present in ${config.name}.`);
          }
        }
      }
    }
    
    console.log('Bonfire initialized successfully! 🔥');
  });

program
  .command('create')
  .description('Create a new bonfire checkpoint.')
  .argument('<message>', 'The context message to save.')
  .option('-a, --author <name>', 'The author of the checkpoint.')
  .action((message, options) => {
    const rootDir = process.cwd();
    const checkpointsPath = path.join(rootDir, BONFIRE_DIR, CHECKPOINTS_DIR);

    if (!fs.existsSync(checkpointsPath)) {
      console.error(`Error: ${path.join(BONFIRE_DIR, CHECKPOINTS_DIR)} directory not found. Run "bonfire init" first.`);
      process.exit(1);
    }

    const author = options.author || process.env.BONFIRE_AUTHOR || getGitUser();
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `${timestamp}.md`;
    const filePath = path.join(checkpointsPath, fileName);

    const content = `Author: ${author}\nDate: ${now.toLocaleString()}\n---\n${message}`;

    fs.writeFileSync(filePath, content);
    console.log(`Bonfire created: ${path.join(CHECKPOINTS_DIR, fileName)} 🔥`);
  });

program
  .command('list')
  .description('List all existing bonfires.')
  .action(() => {
    const rootDir = process.cwd();
    const checkpointsPath = path.join(rootDir, BONFIRE_DIR, CHECKPOINTS_DIR);

    if (!fs.existsSync(checkpointsPath)) {
      console.error(`Error: ${path.join(BONFIRE_DIR, CHECKPOINTS_DIR)} directory not found.`);
      process.exit(1);
    }

    const files = fs.readdirSync(checkpointsPath)
      .filter((f: string) => f.endsWith('.md'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log('No bonfires found.');
      return;
    }

    console.log('Existing Bonfires:');
    files.forEach((file: string) => console.log(`- ${file}`));
  });

program
  .command('read')
  .description('Read the contents of a specific bonfire.')
  .argument('<id>', 'The ID (filename) of the bonfire to read.')
  .action((id) => {
    const rootDir = process.cwd();
    const checkpointsPath = path.join(rootDir, BONFIRE_DIR, CHECKPOINTS_DIR);
    
    // Support reading by full name or just the timestamp part
    const fileName = id.endsWith('.md') ? id : `${id}.md`;
    const filePath = path.join(checkpointsPath, fileName);

    if (!fs.existsSync(filePath)) {
      console.error(`Error: Bonfire "${id}" not found in ${CHECKPOINTS_DIR}/.`);
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(content);
  });

program
  .command('prune')
  .description('Remove old bonfires, keeping only the most recent ones.')
  .option('-k, --keep <number>', 'Number of most recent bonfires to keep.', '5')
  .option('-a, --all', 'Remove all bonfires.', false)
  .action((options) => {
    const rootDir = process.cwd();
    const checkpointsPath = path.join(rootDir, BONFIRE_DIR, CHECKPOINTS_DIR);

    if (!fs.existsSync(checkpointsPath)) {
      console.error(`Error: ${path.join(BONFIRE_DIR, CHECKPOINTS_DIR)} directory not found.`);
      process.exit(1);
    }

    const files = fs.readdirSync(checkpointsPath)
      .filter((f: string) => f.endsWith('.md'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log('No bonfires to prune.');
      return;
    }

    if (options.all) {
      files.forEach((file: string) => {
        fs.unlinkSync(path.join(checkpointsPath, file));
      });
      console.log(`Pruned all ${files.length} bonfires. 🔥💨`);
      return;
    }

    const keepCount = parseInt(options.keep, 10);
    const toPrune = files.slice(keepCount);

    if (toPrune.length === 0) {
      console.log(`Nothing to prune. Keeping the last ${files.length} bonfires.`);
      return;
    }

    toPrune.forEach((file: string) => {
      fs.unlinkSync(path.join(checkpointsPath, file));
    });

    console.log(`Pruned ${toPrune.length} old bonfires from ${CHECKPOINTS_DIR}/. Kept the most recent ${keepCount}. 🔥💨`);
  });

program.parse();
