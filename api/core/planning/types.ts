/**
 * Hierarchical context types for scene planning
 * 
 * Context hierarchy: Project → Video → Scene
 */

// ============================================================================
// Project Context (Level 1)
// ============================================================================

export interface ProjectContext {
  /** Project name/title */
  name: string;
  
  /** Context ID for filesystem path */
  contextId: string;
  
  /** Brand guidelines reference */
  brand?: {
    colors?: string[];
    logo?: string;
    voice?: string;
  };
  
  /** Target audience */
  audience?: {
    ageRange?: string;
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
    interests?: string[];
    painPoints?: string[];
  };
  
  /** Content guidelines */
  guidelines?: {
    tone?: string;
    style?: string;
    dos?: string[];
    donts?: string[];
  };
}

// ============================================================================
// Video Context (Level 2)
// ============================================================================

export interface VideoContext {
  /** Video theme/topic */
  theme?: string;
  
  /** Communication objective */
  objective?: 'awareness' | 'conversion' | 'engagement';
  
  /** Visual style preferences */
  visualStyle?: {
    mood?: 'energetic' | 'calm' | 'professional' | 'fun';
    colorPalette?: string[];
    typography?: 'modern' | 'classic' | 'bold';
    pacing?: 'fast' | 'moderate' | 'slow';
  };
  
  /** Target audience for this specific video */
  targetAudience?: {
    ageRange?: string;
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
    interests?: string[];
  };
  
  /** Video settings */
  settings?: {
    duration?: number;
    aspectRatio?: '16:9' | '9:16';
    musicStyle?: string;
  };
}

// ============================================================================
// Scene Context (Level 3)
// ============================================================================

export interface SceneContext {
  /** Action happening in the scene */
  action?: string;
  
  /** Visual elements present */
  visualElements?: {
    people?: number;
    location?: string;
    props?: string[];
    lighting?: 'natural' | 'studio' | 'dramatic';
    camera?: 'static' | 'pan' | 'zoom' | 'tracking';
  };
  
  /** Text overlays */
  textOverlay?: {
    headline?: string;
    subheadline?: string;
    cta?: string;
    position?: 'top' | 'center' | 'bottom';
  };
  
  /** Emotional tone */
  emotion?: 'excitement' | 'motivation' | 'relaxation' | 'urgency' | 'confidence';
  
  /** Scene-specific settings */
  settings?: {
    duration?: number;
    transition?: 'cut' | 'fade' | 'slide';
    useTestimonial?: string;
  };
}

// ============================================================================
// Scene Plan
// ============================================================================

export interface ScenePlan {
  /** Scene sequence number */
  sequence: number;
  
  /** Scene description */
  description: string;
  
  /** Duration in seconds */
  duration: number;
  
  /** Prompt for video generation */
  prompt: string;
  
  /** Scene context */
  context: SceneContext;
}

// ============================================================================
// Planning Result
// ============================================================================

export interface PlanningResult {
  /** Video title */
  title: string;
  
  /** Video description */
  description: string;
  
  /** Total duration */
  totalDuration: number;
  
  /** Planned scenes */
  scenes: ScenePlan[];
}
