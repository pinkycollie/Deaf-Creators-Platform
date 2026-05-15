/**
 * Request API Module
 * 
 * Handles video search requests and filtering.
 */

import type { MatchRequest, MatchResult, MatchFilters } from '../matching_engine';

export interface SearchResponse {
  results: MatchResult[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface VideoRequest {
  id: string;
  userId: string;
  query: string;
  filters: MatchFilters;
  status: RequestStatus;
  matchedContentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type RequestStatus = 'pending' | 'processing' | 'matched' | 'fulfilled' | 'cancelled';

/**
 * Validate search request parameters
 */
export function validateSearchRequest(request: MatchRequest): ValidationResult {
  const errors: string[] = [];

  if (!request.query || request.query.trim().length === 0) {
    errors.push('Query is required');
  }

  if (request.query && request.query.length > 500) {
    errors.push('Query must be 500 characters or less');
  }

  if (request.limit && (request.limit < 1 || request.limit > 100)) {
    errors.push('Limit must be between 1 and 100');
  }

  if (request.filters?.duration) {
    const { min, max } = request.filters.duration;
    if (min !== undefined && max !== undefined && min > max) {
      errors.push('Duration min must be less than max');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Elasticsearch query structure */
export interface ElasticsearchQuery {
  query: {
    bool: {
      must: object[];
      filter: object[];
    };
  };
  size: number;
}

/**
 * Build Elasticsearch query from filters
 */
export function buildSearchQuery(request: MatchRequest): ElasticsearchQuery {
  const must: object[] = [];
  const filter: object[] = [];

  // Full-text search on query
  if (request.query) {
    must.push({
      multi_match: {
        query: request.query,
        fields: ['title^2', 'description', 'tags'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    });
  }

  // Apply filters
  if (request.filters) {
    const { tags, categories, duration, quality, hasCaptions, signLanguage } = request.filters;

    if (tags && tags.length > 0) {
      filter.push({ terms: { tags: tags } });
    }

    if (categories && categories.length > 0) {
      filter.push({ terms: { categories: categories } });
    }

    if (duration) {
      const range: { gte?: number; lte?: number } = {};
      if (duration.min !== undefined) range.gte = duration.min;
      if (duration.max !== undefined) range.lte = duration.max;
      filter.push({ range: { duration: range } });
    }

    if (quality) {
      filter.push({ term: { quality: quality } });
    }

    if (hasCaptions !== undefined) {
      filter.push({ term: { has_captions: hasCaptions } });
    }

    if (signLanguage) {
      filter.push({ term: { sign_language: signLanguage } });
    }
  }

  return {
    query: {
      bool: {
        must,
        filter,
      },
    },
    size: request.limit || 20,
  };
}
