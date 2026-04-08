import chalk from 'chalk';
import { ApiClient } from '../client';

export async function createCommand(options: { postId: number }) {
  console.log(chalk.blue(`Creating reel from post ${options.postId}...`));

  const client = new ApiClient();

  try {
    const video = await client.createVideo(options.postId);

    console.log(chalk.green('✓ Reel created successfully!'));
    console.log('');
    console.log('Video ID:', chalk.cyan(video.id));
    console.log('Title:', chalk.white(video.title));
    console.log('Scenes:', chalk.white(video.total_scenes));
    console.log('Status:', chalk.yellow(video.status));
    console.log('');
    console.log(chalk.gray('Next steps:'));
    console.log(chalk.gray(`  reel render ${video.id}`));
  } catch (error) {
    console.error(chalk.red('Error creating reel:'), error);
    process.exit(1);
  }
}
