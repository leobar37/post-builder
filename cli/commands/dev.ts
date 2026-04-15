#!/usr/bin/env node

import { Command } from 'commander';
import { spawn } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import { findAvailablePort } from '../utils/port-finder.js';

const START_PORT = 7000;

interface DevOptions {
  apiPort?: string;
  appPort?: string;
}

export async function devCommand(options: DevOptions): Promise<void> {
  console.log(chalk.bold.blue('\n🔍 Discovering available ports...'));
  console.log(chalk.gray(`  Start port: ${START_PORT}\n`));

  // Discover available ports starting from 7000
  const spinner = ora('Finding available ports...').start();
  
  let apiPort: number;
  let appPort: number;

  if (options.apiPort) {
    apiPort = parseInt(options.apiPort, 10);
    spinner.stop();
    console.log(chalk.gray(`  Using specified API port: ${apiPort}`));
  } else {
    apiPort = await findAvailablePort(START_PORT);
  }

  if (options.appPort) {
    appPort = parseInt(options.appPort, 10);
    spinner.stop();
    console.log(chalk.gray(`  Using specified App port: ${appPort}`));
  } else {
    // Find next available port after API port
    appPort = await findAvailablePort(apiPort + 1);
  }

  spinner.succeed(chalk.green(`Ports discovered: API=${apiPort}, App=${appPort}`));

  console.log(chalk.bold.blue('\n🚀 Starting GymSpace Post Builder Dev Server\n'));

  // Set environment variables for the API
  const apiEnv = {
    ...process.env,
    PORT: String(apiPort),
  };

  // Start API server with tsx watch
  const apiSpinner = ora('Starting API server...').start();
  const apiProcess = spawn('tsx', ['watch', 'api/index.ts'], {
    stdio: 'pipe',
    env: apiEnv,
  });

  let apiStarted = false;

  apiProcess.stdout?.on('data', (data: Buffer) => {
    const output = data.toString();
    if (!apiStarted && (output.includes('running') || output.includes('🚀'))) {
      apiStarted = true;
      apiSpinner.succeed(chalk.green(`API server running at http://localhost:${apiPort}`));
    }
    // Filter out health check logs
    if (!output.includes('/health')) {
      console.log(chalk.gray(`[API] ${output.trim()}`));
    }
  });

  apiProcess.stderr?.on('data', (data: Buffer) => {
    console.error(chalk.red(`[API Error] ${data.toString().trim()}`));
  });

  apiProcess.on('error', (error) => {
    apiSpinner.fail(chalk.red(`Failed to start API: ${error.message}`));
    process.exit(1);
  });

  // Wait a moment for API to start, then start Vite
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Start Vite dev server
  const appSpinner = ora('Starting Vite dev server...').start();
  
  const appEnv = {
    ...process.env,
    APP_PORT: String(appPort),
    API_PORT: String(apiPort),
    VITE_API_URL: `http://localhost:${apiPort}`,
  };
  
  const appProcess = spawn('vite', ['--host'], {
    stdio: 'pipe',
    env: appEnv,
  });

  let appStarted = false;

  appProcess.stdout?.on('data', (data: Buffer) => {
    const output = data.toString();
    if (!appStarted && (output.includes('ready') || output.includes('Local:'))) {
      appStarted = true;
      appSpinner.succeed(chalk.green(`App running at http://localhost:${appPort}`));
      
      console.log(chalk.bold.green('\n✅ Dev servers are ready!\n'));
      console.log(chalk.cyan('📍 API:    ') + chalk.underline(`http://localhost:${apiPort}`));
      console.log(chalk.cyan('📍 App:    ') + chalk.underline(`http://localhost:${appPort}`));
      console.log(chalk.cyan('📍 Health: ') + chalk.underline(`http://localhost:${apiPort}/health\n`));
    }
    // Only show relevant Vite output
    if (output.includes('error') || output.includes('Error')) {
      console.log(chalk.yellow(`[App] ${output.trim()}`));
    }
  });

  appProcess.stderr?.on('data', (data: Buffer) => {
    const output = data.toString();
    // Vite sometimes outputs to stderr for info messages
    if (output.includes('error') || output.includes('Error')) {
      console.error(chalk.red(`[App Error] ${output.trim()}`));
    }
  });

  appProcess.on('error', (error) => {
    appSpinner.fail(chalk.red(`Failed to start App: ${error.message}`));
    apiProcess.kill();
    process.exit(1);
  });

  // Handle graceful shutdown
  const shutdown = (signal: string) => {
    console.log(chalk.yellow(`\n\n${signal} received. Shutting down...`));
    apiProcess.kill('SIGTERM');
    appProcess.kill('SIGTERM');
    
    // Force exit after 3 seconds
    setTimeout(() => {
      apiProcess.kill('SIGKILL');
      appProcess.kill('SIGKILL');
      process.exit(0);
    }, 3000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Keep the process running
  await new Promise(() => {});
}
