import chalk from 'chalk';
import { ApiClient } from '../client';

export async function statusCommand(videoId: string) {
  const client = new ApiClient();

  try {
    const status = await client.getVideoStatus(videoId);

    console.log(chalk.bold('Video Status'));
    console.log('Video ID:', chalk.cyan(status.videoId));
    console.log('Status:', chalk.yellow(status.status));
    console.log('Progress:', chalk.white(`${status.progress}%`));
    console.log(`Scenes: ${status.completedScenes}/${status.totalScenes}`);
    console.log('');

    if (status.scenes.length > 0) {
      console.log(chalk.bold('Scenes:'));
      status.scenes.forEach((scene) => {
        const statusIcon =
          {
            pending: '⏳',
            rendering: '🎬',
            completed: '✓',
            failed: '✗',
          }[scene.status] || '?';

        console.log(`  ${statusIcon} Scene ${scene.sequence}: ${scene.name} (${scene.status})`);
      });
    }
  } catch (error) {
    console.error(chalk.red('Error checking status:'), error);
    process.exit(1);
  }
}
