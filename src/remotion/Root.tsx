import React from 'react';
import { Composition } from 'remotion';
import { ProblemSolution } from './compositions/ProblemSolution.js';

const ProblemSolutionComposition: React.FC<Record<string, unknown>> = (props) => {
  const videoUrl = typeof props.videoUrl === 'string' ? props.videoUrl : '';
  const topic = typeof props.topic === 'string' ? props.topic : 'excel-management';
  const brandColor = typeof props.brandColor === 'string' ? props.brandColor : '#F57E24';

  return <ProblemSolution videoUrl={videoUrl} topic={topic} brandColor={brandColor} />;
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ProblemSolution"
        component={ProblemSolutionComposition}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          videoUrl: '',
          topic: 'excel-management',
          brandColor: '#F57E24',
        }}
      />
    </>
  );
};
