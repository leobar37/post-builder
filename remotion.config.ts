import { Config } from 'remotion';

export const config: Config = {
  // Vertical video format (9:16) for Instagram Reels
  defaultProps: {
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: 180, // 6 seconds at 30fps
  },
};
