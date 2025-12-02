/**
 * Video Matching Engine
 * 
 * AI-powered matching between user requests and existing video content.
 * 
 * Features:
 * - Metadata-based video matching
 * - AI-powered content similarity analysis
 * - Real-time search capabilities
 */

export interface MatchRequest {
  query: string;
  filters: MatchFilters;
  preferences: MatchPreferences;
  limit: number;
}

export interface MatchFilters {
  tags?: string[];
  categories?: string[];
  duration?: { min?: number; max?: number };
  quality?: 'sd' | 'hd' | '4k';
  language?: string;
  signLanguage?: string;
  hasCaptions?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface MatchPreferences {
  prioritizeAccessibility?: boolean;
  preferVerifiedCreators?: boolean;
  styleMatch?: 'exact' | 'similar' | 'any';
}

export interface MatchResult {
  contentId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  score: number;
  matchReasons: string[];
}

export interface ScoringWeights {
  textMatch: number;
  visualSimilarity: number;
  accessibility: number;
  popularity: number;
  recency: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  textMatch: 0.30,
  visualSimilarity: 0.25,
  accessibility: 0.20,
  popularity: 0.15,
  recency: 0.10,
};

/**
 * Calculate text match score using simple term frequency
 */
export function calculateTextMatchScore(
  query: string,
  title: string,
  description: string,
  tags: string[]
): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const contentText = `${title} ${description} ${tags.join(' ')}`.toLowerCase();

  let matchCount = 0;
  for (const term of queryTerms) {
    if (contentText.includes(term)) {
      matchCount++;
    }
  }

  return matchCount / queryTerms.length;
}

/**
 * Calculate accessibility score
 */
export function calculateAccessibilityScore(
  hasCaptions: boolean,
  hasSignLanguage: boolean,
  hasAudioDescription: boolean
): number {
  let score = 0;
  if (hasCaptions) score += 0.4;
  if (hasSignLanguage) score += 0.4;
  if (hasAudioDescription) score += 0.2;
  return score;
}

// Recency scoring constants
const RECENCY_FULL_SCORE_DAYS = 7; // Content less than this many days gets full score
const RECENCY_DECAY_COEFFICIENT = 0.3; // Controls how quickly recency score decays

/**
 * Calculate recency score (newer content scores higher)
 */
export function calculateRecencyScore(createdAt: Date): number {
  const now = new Date();
  const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

  // Content less than RECENCY_FULL_SCORE_DAYS old gets full score
  // Score decreases logarithmically
  if (ageInDays <= RECENCY_FULL_SCORE_DAYS) return 1;
  return Math.max(0, 1 - Math.log10(ageInDays / RECENCY_FULL_SCORE_DAYS) * RECENCY_DECAY_COEFFICIENT);
}
