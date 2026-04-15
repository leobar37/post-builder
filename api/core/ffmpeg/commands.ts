import { spawn } from 'child_process';
import { readFile, writeFile, unlink } from 'fs/promises';
import ffmpegStatic from 'ffmpeg-static';
import { getLogger } from '../logger.js';
import { FFmpegError } from '../errors.js';
import type { VideoInfo, ConcatOptions, ExtractOptions, FrameExtractOptions, AudioExtractOptions } from './types.js';

/**
 * Build FFmpeg command arguments
 */
export function buildConcatCommand(options: ConcatOptions): string[] {
  const { inputs, output, codec = 'copy' } = options;
  
  // Create concat demuxer input
  const args = ['-f', 'concat', '-safe', '0', '-i', 'pipe:0'];
  
  if (codec !== 'copy') {
    args.push('-c:v', codec);
  } else {
    args.push('-c', 'copy');
  }
  
  args.push('-y', output);
  
  return args;
}

/**
 * Build FFmpeg info command
 */
export function buildInfoCommand(input: string): string[] {
  return [
    '-i', input,
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,r_frame_rate,bit_rate,codec_name',
    '-show_entries', 'format=duration,format_name',
    '-of', 'json',
    '-',
  ];
}

/**
 * Build frame extract command
 */
export function buildFrameExtractCommand(options: FrameExtractOptions): string[] {
  const { input, output, time, quality = 2 } = options;
  
  return [
    '-ss', String(time),
    '-i', input,
    '-vframes', '1',
    '-q:v', String(quality),
    '-y',
    output,
  ];
}

/**
 * Build audio extract command
 */
export function buildAudioExtractCommand(options: AudioExtractOptions): string[] {
  const { input, output, codec = 'aac', bitrate } = options;
  
  const args = ['-i', input, '-vn'];
  
  if (codec === 'copy') {
    args.push('-c:a', 'copy');
  } else {
    args.push('-c:a', codec);
    if (bitrate) {
      args.push('-b:a', bitrate);
    }
  }
  
  args.push('-y', output);
  
  return args;
}
