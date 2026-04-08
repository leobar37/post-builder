// GymSpace Instagram Post Builder - TypeScript Types

export interface Stat {
  value: string;
  label: string;
  icon?: string;
}

export interface Feature {
  icon: string;
  title: string;
  desc: string;
}

export interface FloatingBadge {
  icon: string;
  text: string;
}

export interface SlideStat {
  value: string;
  label: string;
  icon?: string;
}

export interface SlideFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface SlideItem {
  number: string;
  icon?: string;
  title: string;
  desc: string;
}

export interface ComparisonSection {
  title: string;
  items: string[];
}

export interface SlideTestimonial {
  quote: string;
  author: string;
}

export interface SlideGrowthStat {
  from: string;
  to: string;
  period: string;
  growth: string;
}

export type SlideLayout =
  | 'cover'
  | 'problem-slide'
  | 'stats-grid'
  | 'solution-slide'
  | 'metric-detail'
  | 'final-cta'
  | 'error-detail'
  | 'error-card'
  | 'growth-journey'
  | 'numbered-list'
  | 'two-col-comparison'
  | 'center-focus'
  | 'feature-focus'
  | 'two-col'
  | 'app-list'
  | 'cost-breakdown'
  | 'solution-showcase'
  | 'comparison-insight'
  | 'benefits'
  | 'process-breakdown'
  | 'mobile-onboarding-flow'
  | 'conversion-cta'
  | 'hook-cards'
  | 'default';

export type PilarColor = 'prob' | 'edu' | 'soc' | 'promo' | 'social' | 'brand';
export type PostType =
  | 'Carousel'
  | 'Single'
  | 'Reel + Carousel'
  | 'Infografía'
  | 'Meme'
  | 'FAQ'
  | 'CTA Fuerte'
  | 'Single Image';

export interface Slide {
  title: string;
  subtitle?: string;
  layout: SlideLayout;
  content?: string;
  // Problem slide
  warning?: string;
  stat?: SlideStat | SlideGrowthStat | string;
  message?: string;
  // Stats grid
  stats?: SlideStat[];
  // Solution slide
  features?: SlideFeature[];
  // Numbered list
  items?: SlideItem[];
  steps?: Array<{ label: string; time?: string; icon?: string; note?: string }>;
  // Comparison
  before?: ComparisonSection;
  after?: ComparisonSection;
  manualTotal?: string;
  digitalTotal?: string;
  proofPoints?: string[];
  mockupStages?: Array<{ title: string; subtitle: string; icon: string }>;
  // Center focus
  // Feature focus
  // Cover
  statLabel?: string;
  // Error detail
  subtitle_detail?: string;
  icon?: string;
  error?: string;
  description?: string;
  solution?: string;
  // Metric detail
  metricName?: string;
  metricValue?: string;
  whyItMatters?: string;
  // App list
  apps?: Array<{ name: string; cost?: string; desc?: string; icon: string; problem?: string }>;
  totalCost?: string;
  // Cost breakdown
  costs?: Array<{
    item?: string;
    cost?: string;
    icon?: string;
    label?: string;
    value?: string;
    desc?: string;
  }>;
  gymsUsingExcel?: string;
  // Solution showcase
  solutionTitle?: string;
  solutionSubtitle?: string;
  // Comparison insight
  leftStat?: { value: string; label: string };
  rightStat?: { value: string; label: string };
  comparisons?: Array<{ metric: string; insight: string }>;
  // Benefits
  benefitItems?: Array<{ icon: string; title: string; desc: string }>;
  benefits?: Array<{ icon: string; title: string; desc: string }>;
  // Final CTA
  resultStat?: { value: string; label: string };
  // Growth journey
  badge?: string;
  location?: string;
  testimonial?: SlideTestimonial;
  // Hook cards
  [key: string]: unknown;
}

export interface Post {
  id: number;
  title: string;
  day: string;
  type: PostType;
  pilar: string;
  pilarColor: PilarColor;
  hook: string;
  subtitle: string;
  totalSlides?: number;
  slides?: Slide[];
  stats: Stat[];
  features: Feature[];
  cta: string;
  ctaNote: string;
  hasFloatingBadge?: boolean;
  floatingBadge?: FloatingBadge;
  /** Descripción/caption para Instagram (max 2200 caracteres) */
  description?: string;
  /** Hashtags sin el símbolo # (max 30 hashtags) */
  hashtags?: string[];
}

export type PostsData = Record<number, Post>;

// Export types
export type ExportFormat = 'png' | 'pdf';

export interface ExportConfig {
  width: number;
  height: number;
  format: ExportFormat;
  scale: number;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  blob?: Blob;
  error?: string;
}

export interface ExportProgress {
  current: number;
  total: number;
  postId?: number;
}

// App State
export interface AppState {
  currentPostId: number;
  currentSlide: number;
  zoomLevel: number;
  isGalleryView: boolean;
  isExporting: boolean;
  exportProgress?: ExportProgress;
}

// API Types
export interface ExportPostRequest {
  postId: number;
  html: string;
  format: ExportFormat;
  width?: number;
  height?: number;
}

export interface ExportPostResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
}

// Publish types
export interface PublishResult {
  success: boolean;
  postUrl?: string;
  error?: string;
}
