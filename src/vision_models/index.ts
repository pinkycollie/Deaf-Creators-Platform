/**
 * Video Vision Models Module
 * 
 * AI-powered video analysis including scene detection, auto-tagging, and ASL recognition.
 * 
 * Features:
 * - Scene detection and recognition
 * - Automatic tagging and categorization
 * - ASL gesture recognition
 * - Quality control analysis
 */

export interface Scene {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  keyframeUrl: string;
  description: string;
  confidence: number;
}

export interface SceneDetectionResult {
  videoId: string;
  scenes: Scene[];
  totalScenes: number;
  processingTimeMs: number;
}

export interface Tag {
  name: string;
  confidence: number;
  category: TagCategory;
}

export type TagCategory =
  | 'content'
  | 'style'
  | 'emotion'
  | 'accessibility'
  | 'technical';

export interface TaggingResult {
  videoId: string;
  tags: Tag[];
  suggestedCategories: string[];
}

export interface ASLGesture {
  gesture: string;
  startTime: number;
  endTime: number;
  confidence: number;
  handedness: 'left' | 'right' | 'both';
}

export interface ASLRecognitionResult {
  videoId: string;
  gestures: ASLGesture[];
  transcript: string;
  language: 'asl' | 'bsl' | 'other';
}

export interface QualityMetrics {
  resolution: { width: number; height: number };
  frameRate: number;
  bitrate: number;
  lightingScore: number;
  stabilityScore: number;
  focusScore: number;
  overallQuality: 'low' | 'medium' | 'high' | 'professional';
}

export interface QualityIssue {
  type: string;
  severity: 'warning' | 'error';
  timestamp?: number;
  description: string;
  suggestion: string;
}

export interface QualityAnalysisResult {
  videoId: string;
  metrics: QualityMetrics;
  issues: QualityIssue[];
  passed: boolean;
}

/**
 * Calculate overall quality score from individual metrics
 */
export function calculateOverallQuality(metrics: QualityMetrics): QualityMetrics['overallQuality'] {
  const avgScore = (metrics.lightingScore + metrics.stabilityScore + metrics.focusScore) / 3;

  if (avgScore >= 0.9 && metrics.resolution.height >= 1080) return 'professional';
  if (avgScore >= 0.7 && metrics.resolution.height >= 720) return 'high';
  if (avgScore >= 0.5) return 'medium';
  return 'low';
}

/**
 * Check if video meets minimum quality standards for ASL content
 */
export function meetsASLQualityStandards(metrics: QualityMetrics): boolean {
  // ASL videos need good lighting and stability for clear signing
  return (
    metrics.lightingScore >= 0.7 &&
    metrics.stabilityScore >= 0.8 &&
    metrics.resolution.height >= 720 &&
    metrics.frameRate >= 24
  );
}

/**
 * Filter tags by minimum confidence threshold
 */
export function filterTagsByConfidence(tags: Tag[], minConfidence: number = 0.7): Tag[] {
  return tags.filter(tag => tag.confidence >= minConfidence);
}

/**
 * Group tags by category
 */
export function groupTagsByCategory(tags: Tag[]): Record<TagCategory, Tag[]> {
  const grouped: Record<TagCategory, Tag[]> = {
    content: [],
    style: [],
    emotion: [],
    accessibility: [],
    technical: [],
  };

  for (const tag of tags) {
    grouped[tag.category].push(tag);
  }

  return grouped;
}
