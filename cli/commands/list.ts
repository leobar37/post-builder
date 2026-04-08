import chalk from 'chalk';
import Table from 'cli-table3';
import { ApiClient } from '../client';

export async function listCommand(options: { status?: string }) {
  const client = new ApiClient();

  try {
    const videos = await client.getVideos(options.status);

    if (videos.length === 0) {
      console.log(chalk.yellow('No reels found'));
      return;
    }

    const table = new Table({
      head: ['Video ID', 'Title', 'Scenes', 'Status', 'Created'],
      colWidths: [14, 30, 8, 12, 20],
    });

    videos.forEach((video) => {
      const statusColor =
        {
          draft: chalk.gray,
          rendering: chalk.yellow,
          completed: chalk.green,
          failed: chalk.red,
        }[video.status] || chalk.white;

      table.push([
        video.id,
        video.title.substring(0, 28),
        video.total_scenes,
        statusColor(video.status),
        new Date(video.created_at).toLocaleDateString(),
      ]);
    });

    console.log(table.toString());
  } catch (error) {
    console.error(chalk.red('Error listing reels:'), error);
    process.exit(1);
  }
}
