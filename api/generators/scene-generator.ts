import { readFileSync } from 'fs';
import { join } from 'path';

export interface SceneConfig {
  name: string;
  duration: number;
  elements: {
    layout: string;
    stat?: { value: string; label: string };
    stats?: Array<{ value: string; label: string; icon: string }>;
    features?: Array<{ title: string; description: string }>;
    colors?: { primary: string; background: string };
    animation?: string;
  };
}

export interface Post {
  id: number;
  title: string;
  subtitle: string;
  hook: string;
  slides: Array<{
    layout: string;
    stat?: { value: string; label: string };
    stats?: Array<{ value: string; label: string; icon: string }>;
    features?: Array<{ title: string; description: string }>;
  }>;
}

export class SceneGenerator {
  private postsData: Record<number, Post>;

  constructor() {
    const postsPath = join(process.cwd(), 'src', 'posts-data.ts');
    const postsContent = readFileSync(postsPath, 'utf-8');

    const match = postsContent.match(/const postsData: PostsData = ({[\s\S]*?});/);
    if (match) {
      this.postsData = eval('(' + match[1] + ')');
    } else {
      this.postsData = {};
    }
  }

  async analyzePost(postId: number): Promise<{ post: Post; scenes: SceneConfig[] }> {
    const post = this.postsData[postId];

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    const scenes: SceneConfig[] = [];

    if (post.slides && post.slides.length > 0) {
      for (let i = 0; i < Math.min(post.slides.length, 3); i++) {
        const slide = post.slides[i];
        const scene = this.createSceneFromSlide(slide, i + 1, post);
        scenes.push(scene);
      }
    } else {
      scenes.push({
        name: 'MainContent',
        duration: 5,
        elements: {
          layout: 'center-focus',
          stat: { value: '100%', label: 'Optimized' },
          colors: { primary: '#F57E24', background: '#1a1a2e' },
          animation: 'fadeIn',
        },
      });
    }

    return { post, scenes };
  }

  private createSceneFromSlide(slide: any, sequence: number, post: Post): SceneConfig {
    const name = this.getSceneName(slide.layout, sequence);

    const config: SceneConfig = {
      name,
      duration: this.getDurationForLayout(slide.layout),
      elements: {
        layout: slide.layout,
        colors: { primary: '#F57E24', background: '#1a1a2e' },
        animation: this.getAnimationForSequence(sequence),
      },
    };

    if (slide.stat) {
      config.elements.stat = slide.stat;
    }

    if (slide.stats) {
      config.elements.stats = slide.stats;
    }

    if (slide.features) {
      config.elements.features = slide.features;
    }

    return config;
  }

  private getSceneName(layout: string, sequence: number): string {
    const names: Record<string, string> = {
      'problem-slide': 'ProblemHook',
      'stats-grid': 'StatsBreakdown',
      'solution-slide': 'SolutionReveal',
      'feature-focus': 'FeatureHighlight',
      'center-focus': 'MainStat',
      'numbered-list': 'KeyPoints',
      'two-col-comparison': 'Comparison',
      'error-card': 'ProblemDisplay',
    };

    return names[layout] || `Scene${sequence}`;
  }

  private getDurationForLayout(layout: string): number {
    const durations: Record<string, number> = {
      'problem-slide': 3,
      'stats-grid': 4,
      'solution-slide': 3,
      'feature-focus': 3,
      'center-focus': 2,
      'numbered-list': 4,
      'two-col-comparison': 3,
      'error-card': 2,
    };

    return durations[layout] || 3;
  }

  private getAnimationForSequence(sequence: number): string {
    const animations = ['fadeIn', 'slideUp', 'scaleIn', 'typewriter', 'countUp'];
    return animations[(sequence - 1) % animations.length];
  }

  generateComposition(config: SceneConfig, sequence: number): string {
    const componentName = `Scene${String(sequence).padStart(2, '0')}`;

    switch (config.elements.layout) {
      case 'problem-slide':
        return this.generateProblemSlide(componentName, config);
      case 'stats-grid':
        return this.generateStatsGrid(componentName, config);
      case 'solution-slide':
        return this.generateSolutionSlide(componentName, config);
      default:
        return this.generateDefaultScene(componentName, config);
    }
  }

  private generateProblemSlide(name: string, config: SceneConfig): string {
    const stat = config.elements.stat;

    return `import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const ${name}: React.FC = () => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const scale = interpolate(frame, [0, 20], [0.8, 1], { extrapolateRight: 'clamp' });
  
  return (
    <AbsoluteFill 
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          opacity,
          transform: \`scale(\${scale})\`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 160,
            fontWeight: 800,
            color: '#F57E24',
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          ${stat?.value || '60%'}
        </div>
        <div
          style={{
            fontSize: 36,
            color: 'white',
            fontWeight: 600,
            maxWidth: 600,
          }}
        >
          ${stat?.label || 'usan Excel y pierden dinero'}
        </div>
      </div>
    </AbsoluteFill>
  );
};
`;
  }

  private generateStatsGrid(name: string, config: SceneConfig): string {
    const stats = config.elements.stats || [];

    return `import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const ${name}: React.FC = () => {
  const frame = useCurrentFrame();
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(${Math.min(stats.length, 3)}, 1fr)',
          gap: 30,
          width: '100%',
          maxWidth: 900,
        }}
      >
        ${stats
          .map(
            (stat, i) => `
        <div
          key={${i}}
          style={{
            background: 'rgba(245, 126, 36, 0.1)',
            border: '2px solid #F57E24',
            borderRadius: 16,
            padding: 30,
            textAlign: 'center',
            opacity: interpolate(frame, [${i * 5}, ${i * 5 + 10}], [0, 1]),
            transform: \`translateY(\${interpolate(frame, [${i * 5}, ${i * 5 + 15}], [50, 0])}px)\`,
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 800, color: '#F57E24', marginBottom: 10 }}>
            ${stat.value}
          </div>
          <div style={{ fontSize: 20, color: 'white', fontWeight: 500 }}>
            ${stat.label}
          </div>
        </div>`,
          )
          .join('')}
      </div>
    </AbsoluteFill>
  );
};
`;
  }

  private generateSolutionSlide(name: string, config: SceneConfig): string {
    const features = config.elements.features || [];

    return `import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const ${name}: React.FC = () => {
  const frame = useCurrentFrame();
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #16213e 0%, #0f3460 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: 'white',
          marginBottom: 40,
          opacity: interpolate(frame, [0, 15], [0, 1]),
        }}
      >
        La Solución
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 800 }}>
        ${features
          .slice(0, 3)
          .map(
            (feature, i) => `
        <div
          key={${i}}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            padding: 24,
            opacity: interpolate(frame, [${10 + i * 8}, ${18 + i * 8}], [0, 1]),
            transform: \`translateX(\${interpolate(frame, [${10 + i * 8}, ${18 + i * 8}], [-50, 0])}px)\`,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: '#F57E24', marginBottom: 8 }}>
            ${feature.title}
          </div>
          <div style={{ fontSize: 18, color: 'rgba(255, 255, 255, 0.8)' }}>
            ${feature.description}
          </div>
        </div>`,
          )
          .join('')}
      </div>
    </AbsoluteFill>
  );
};
`;
  }

  private generateDefaultScene(name: string, config: SceneConfig): string {
    return `import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const ${name}: React.FC = () => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [0, 15], [0, 1]);
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          opacity,
          fontSize: 72,
          fontWeight: 800,
          color: '#F57E24',
          textAlign: 'center',
        }}
      >
        ${config.name}
      </div>
    </AbsoluteFill>
  );
};
`;
  }

  generateIndex(sceneCount: number): string {
    const imports = Array.from({ length: sceneCount }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return `import { Scene${num} } from './Scene${num}';`;
    }).join('\n');

    const exports = Array.from({ length: sceneCount }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return `  Scene${num},`;
    }).join('\n');

    return `${imports}

export const compositions = {
${exports}
};

export {
${exports}
};
`;
  }
}
