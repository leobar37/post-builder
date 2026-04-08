import chalk from 'chalk';
import ora from 'ora';
import { ApiClient } from '../client';

export async function buildCommand(videoId: string) {
  console.log(chalk.blue(`Building final reel for ${videoId}...`));

  const client = new ApiClient();
  const spinner = ora('Concatenating scenes with FFmpeg...').start();

  try {
    const result = await client.buildVideo(videoId);

    spinner.succeed(chalk.green('Build completed!'));
    console.log('');
    console.log('Output:', chalk.cyan(result.outputPath));
    console.log('Duration:', chalk.white(`${result.duration}s`));
    console.log('');
    console.log(chalk.gray('To download:'));
    console.log(chalk.gray(`  reel download ${videoId}`));
  } catch (error) {
    spinner.fail(chalk.red('Build failed'));
    console.error(error);
    process.exit(1);
  }
}
