import React from 'react';
import {
  AbsoluteFill,
  Video,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';

export interface ProblemSolutionProps {
  videoUrl: string;
  topic: string;
  brandColor?: string;
}

export const ProblemSolution: React.FC<ProblemSolutionProps> = ({
  videoUrl,
  topic,
  brandColor = '#F57E24',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Logo animation
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // Outro animation (last 1 second)
  const outroStart = durationInFrames - fps;
  const showOutro = frame >= outroStart;
  const outroOpacity = showOutro ? interpolate(frame, [outroStart, outroStart + 10], [0, 1]) : 0;

  const outroTextY = showOutro ? interpolate(frame, [outroStart, outroStart + 15], [50, 0]) : 50;

  // Get topic text
  const getTopicText = () => {
    switch (topic) {
      case 'excel-management':
        return 'Deja de perder dinero con Excel';
      case 'member-retention':
        return 'Retén a tus socios automáticamente';
      case 'whatsapp-automation':
        return 'Automatiza tu WhatsApp';
      case 'analytics':
        return 'Conoce tus números en tiempo real';
      default:
        return 'Transforma tu gimnasio';
    }
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Main Video from Minimax */}
      <Video
        src={videoUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
        }}
      />

      {/* GymSpace Logo Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity: logoOpacity,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            backgroundColor: brandColor,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path d="M6.5 6.5h11M6.5 17.5h11M6 20v-6.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5V20M6 4v6.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V4" />
          </svg>
        </div>
        <span
          style={{
            color: 'white',
            fontFamily: 'Sora, sans-serif',
            fontSize: 24,
            fontWeight: 700,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          GymSpace
        </span>
      </div>

      {/* Outro Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '35%',
          background: `linear-gradient(to top, ${brandColor}ee, transparent)`,
          opacity: outroOpacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 60,
        }}
      >
        <div
          style={{
            transform: `translateY(${outroTextY}px)`,
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              color: 'white',
              fontFamily: 'Sora, sans-serif',
              fontSize: 42,
              fontWeight: 800,
              margin: 0,
              marginBottom: 16,
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              padding: '0 40px',
            }}
          >
            {getTopicText()}
          </h2>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'white',
              color: brandColor,
              padding: '12px 24px',
              borderRadius: 30,
              fontFamily: 'Manrope, sans-serif',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            <span>Descarga la app</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
