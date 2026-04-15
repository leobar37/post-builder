/**
 * FFmpeg types and interfaces
 */

export interface VideoInfo {
  duration: number; // in seconds
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  codec: string;
  format: string;
}

export interface ConcatOptions {
  inputs: string[];
  output: string;
  codec?: 'copy' | 'libx264';
  format?: string;
}

export interface ExtractOptions {
  input: string;
  output: string;
  startTime?: number;
  duration?: number;
}

export interface FrameExtractOptions {
  input: string;
  output: string;
  time: number; // timestamp in seconds
  quality?: number; // 1-31, lower is better
}

export interface AudioExtractOptions {
  input: string;
  output: string;
  codec?: 'aac' | 'mp3' | 'copy';
  bitrate?: string;
}

export interface ResizeOptions {
  input: string;
  output: string;
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}
