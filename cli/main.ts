#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create';
import { listCommand } from './commands/list';
import { statusCommand } from './commands/status';
import { renderCommand } from './commands/render';
import { buildCommand } from './commands/build';
import { devCommand } from './commands/dev';

const program = new Command();

program.name('reel').description('CLI for Instagram Reels generation').version('1.0.0');

program
  .command('dev')
  .description('Start development servers (API + Frontend)')
  .option('--api-port <port>', 'Port for API server (default: auto-discover >= 7000)')
  .option('--app-port <port>', 'Port for frontend dev server (default: auto-discover)')
  .action(devCommand);

program
  .command('create')
  .description('Create a new reel from a post')
  .requiredOption('--post-id <id>', 'Post ID to create reel from', parseInt)
  .action(createCommand);

program
  .command('list')
  .description('List all reels')
  .option('--status <status>', 'Filter by status (draft, rendering, completed, failed)')
  .action(listCommand);

program
  .command('status <video-id>')
  .description('Check the status of a reel')
  .action(statusCommand);

program
  .command('render <video-id>')
  .description('Render all scenes of a reel')
  .action(renderCommand);

program
  .command('build <video-id>')
  .description('Build final reel video from rendered scenes')
  .action(buildCommand);

program.parse();
