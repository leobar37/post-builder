import chalk from 'chalk';
import ora from 'ora';
import { ApiClient } from '../client';

export async function renderCommand(videoId: string) {
  console.log(chalk.blue(`Starting render for video ${videoId}...`));

  const client = new ApiClient();
  const spinner = ora('Initializing render...').start();

  try {
    await client.startRender(videoId);

    let completed = false;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes with 5s intervals

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const status = await client.getVideoStatus(videoId);

      spinner.text = `Rendering... ${status.progress}% (${status.completedScenes}/${status.totalScenes} scenes)`;

      if (status.status === 'completed') {
        completed = true;
        spinner.succeed(chalk.green('Render completed!'));
      } else if (status.status === 'failed') {
        spinner.fail(chalk.red('Render failed'));
        process.exit(1);
      }

      attempts++;
    }

    if (!completed) {
      spinner.warn(chalk.yellow('Render timeout - check status later'));
    }
  } catch (error) {
    spinner.fail(chalk.red('Render error'));
    console.error(error);
    process.exit(1);
  }
}
