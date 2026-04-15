import { spawn } from 'child_process';
import { readFile, writeFile, unlink } from 'fs/promises';
import ffmpegStatic from 'ffmpeg-static';
import { getLogger } from '../logger.js';
import { FFmpegError } from '../errors.js';
import { ensureDir } from '../utils/files.js';
import type { 
  VideoInfo, 
  ConcatOptions, 
  FrameExtractOptions, 
  AudioExtractOptions 
} from './types.js';
import { 
  buildConcatCommand, 
  buildFrameExtractCommand, 
  buildAudioExtractCommand 
} from './commands.js';

/**
 * FFmpeg wrapper for common video operations
 */
export class FFmpegWrapper {
  private logger = getLogger().child('FFmpeg');
  private ffmpegPath: string;

  constructor() {
    this.ffmpegPath = ffmpegStatic || 'ffmpeg';
    this.logger.debug(`Using FFmpeg: ${this.ffmpegPath}`);
  }

  /**
   * Execute FFmpeg command and return stdout
   */
  private async execute(args: string[], input?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.logger.debug(`Executing: ffmpeg ${args.join(' ')}`);
      
      const proc = spawn(this.ffmpegPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      if (input && proc.stdin) {
        proc.stdin.write(input);
        proc.stdin.end();
      }

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new FFmpegError(`FFmpeg exited with code ${code}: ${stderr}`, {
            command: `ffmpeg ${args.join(' ')}`,
          }));
        }
      });

      proc.on('error', (error) => {
        reject(new FFmpegError(`Failed to spawn FFmpeg: ${error.message}`, {
          command: `ffmpeg ${args.join(' ')}`,
          cause: error,
        }));
      });
    });
  }

  /**
   * Concatenate multiple video files
   */
  async concat(options: ConcatOptions): Promise<string> {
    const { inputs, output } = options;
    
    await ensureDir(output.substring(0, output.lastIndexOf('/')));
    
    // Create concat list file
    const listContent = inputs.map(f => `file '${f}'`).join('\n');
    const listFile = `${output}.concatlist.txt`;
    
    try {
      await writeFile(listFile, listContent);
      
      const args = [
        '-f', 'concat',
        '-safe', '0',
        '-i', listFile,
        '-c', 'copy',
        '-y',
        output,
      ];
      
      await this.execute(args);
      this.logger.info(`Concatenated ${inputs.length} videos to ${output}`);
      
      return output;
    } finally {
      // Cleanup list file
      try {
        await unlink(listFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Get video metadata
   */
  async getInfo(input: string): Promise<VideoInfo> {
    const ffprobePath = this.ffmpegPath.replace('ffmpeg', 'ffprobe');
    
    const args = [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,r_frame_rate,bit_rate,codec_name',
      '-show_entries', 'format=duration,format_name',
      '-of', 'json',
      input,
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn(ffprobePath, args);
      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new FFmpegError(`ffprobe failed: ${stderr}`));
          return;
        }

        try {
          const data = JSON.parse(stdout);
          const stream = data.streams?.[0];
          const format = data.format;

          if (!stream || !format) {
            reject(new FFmpegError('Invalid ffprobe output'));
            return;
          }

          // Parse frame rate fraction (e.g., "30/1" -> 30)
          const fpsMatch = stream.r_frame_rate?.match(/(\d+)\/(\d+)/);
          const fps = fpsMatch ? parseInt(fpsMatch[1]) / parseInt(fpsMatch[2]) : 0;

          resolve({
            duration: parseFloat(format.duration) || 0,
            width: stream.width || 0,
            height: stream.height || 0,
            fps,
            bitrate: parseInt(stream.bit_rate) || 0,
            codec: stream.codec_name || 'unknown',
            format: format.format_name || 'unknown',
          });
        } catch (error) {
          reject(new FFmpegError(`Failed to parse ffprobe output: ${error}`));
        }
      });
    });
  }

  /**
   * Extract a frame at specific time
   */
  async extractFrame(options: FrameExtractOptions): Promise<string> {
    const { output } = options;
    await ensureDir(output.substring(0, output.lastIndexOf('/')));
    
    const args = buildFrameExtractCommand(options);
    await this.execute(args);
    
    this.logger.info(`Extracted frame at ${options.time}s to ${output}`);
    return output;
  }

  /**
   * Extract audio from video
   */
  async extractAudio(options: AudioExtractOptions): Promise<string> {
    const { output } = options;
    await ensureDir(output.substring(0, output.lastIndexOf('/')));
    
    const args = buildAudioExtractCommand(options);
    await this.execute(args);
    
    this.logger.info(`Extracted audio to ${output}`);
    return output;
  }
}

// Singleton instance
let ffmpegWrapper: FFmpegWrapper | null = null;

/**
 * Get FFmpeg wrapper instance
 */
export function getFFmpeg(): FFmpegWrapper {
  if (!ffmpegWrapper) {
    ffmpegWrapper = new FFmpegWrapper();
  }
  return ffmpegWrapper;
}
