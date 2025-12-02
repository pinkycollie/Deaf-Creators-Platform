# Video Request Matching

The Video Request Matching module provides AI-powered matching between user requests and existing video content.

## Overview

This module handles:
- Metadata-based video matching
- AI-powered content similarity analysis
- Real-time search capabilities
- Request-to-content matching

## Directory Structure

```
src/
├── matching_engine/
│   ├── index.ts              # Main matching service
│   ├── metadata-matcher.ts   # Metadata-based matching
│   ├── ai-matcher.ts         # AI-powered similarity
│   ├── scoring.ts            # Match scoring algorithm
│   └── types.ts              # TypeScript interfaces
│
├── request_api/
│   ├── index.ts              # API handlers
│   ├── search.ts             # Search functionality
│   ├── filters.ts            # Filter processing
│   └── validation.ts         # Request validation
```

## Core Components

### Matching Engine

The matching engine combines multiple strategies to find the best content matches.

```typescript
interface MatchRequest {
  query: string;
  filters: MatchFilters;
  preferences: MatchPreferences;
  limit: number;
}

interface MatchFilters {
  tags?: string[];
  categories?: string[];
  duration?: { min?: number; max?: number };
  quality?: 'sd' | 'hd' | '4k';
  language?: string;
  signLanguage?: string;
  hasCaption?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

interface MatchPreferences {
  prioritizeAccessibility?: boolean;
  preferVerifiedCreators?: boolean;
  styleMatch?: 'exact' | 'similar' | 'any';
}

interface MatchResult {
  content: Content;
  score: number;
  matchReasons: string[];
}
```

### Metadata Matcher

Performs fast matching based on video metadata:

```typescript
class MetadataMatcher {
  async match(request: MatchRequest): Promise<MatchResult[]> {
    const query = this.buildElasticQuery(request);
    
    const results = await elasticsearch.search({
      index: 'video_content',
      body: query
    });
    
    return results.hits.hits.map(hit => ({
      content: hit._source,
      score: hit._score,
      matchReasons: this.extractMatchReasons(hit)
    }));
  }
  
  private buildElasticQuery(request: MatchRequest) {
    return {
      query: {
        bool: {
          must: [
            { multi_match: { query: request.query, fields: ['title', 'description', 'tags'] } }
          ],
          filter: this.buildFilters(request.filters)
        }
      }
    };
  }
}
```

### AI Matcher

Uses machine learning models for semantic matching:

```typescript
class AIMatcher {
  private model: EmbeddingModel;
  
  async match(request: MatchRequest): Promise<MatchResult[]> {
    // Generate embedding for the query
    const queryEmbedding = await this.model.embed(request.query);
    
    // Find similar content using vector similarity
    const results = await this.vectorSearch(queryEmbedding, {
      limit: request.limit,
      filters: request.filters
    });
    
    return results;
  }
  
  async vectorSearch(embedding: number[], options: SearchOptions) {
    // Use CLIP or similar model for visual similarity
    const results = await supabase.rpc('match_videos', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: options.limit
    });
    
    return results;
  }
}
```

### Scoring Algorithm

Combines multiple signals for final ranking:

```typescript
interface ScoringWeights {
  textMatch: number;      // 30%
  visualSimilarity: number; // 25%
  accessibility: number;  // 20%
  popularity: number;     // 15%
  recency: number;        // 10%
}

function calculateFinalScore(
  content: Content,
  request: MatchRequest,
  weights: ScoringWeights
): number {
  let score = 0;
  
  // Text relevance
  score += textMatchScore(content, request.query) * weights.textMatch;
  
  // Visual similarity (if AI matching enabled)
  score += visualScore(content, request) * weights.visualSimilarity;
  
  // Accessibility features
  if (request.preferences.prioritizeAccessibility) {
    score += accessibilityScore(content) * weights.accessibility;
  }
  
  // Popularity metrics
  score += popularityScore(content) * weights.popularity;
  
  // Recency
  score += recencyScore(content) * weights.recency;
  
  return score;
}
```

## API Endpoints

### Search Videos

```http
POST /api/matching/search
```

Request:
```json
{
  "query": "ASL tutorial greeting",
  "filters": {
    "tags": ["asl", "tutorial"],
    "duration": { "max": 300 },
    "hasCaption": true
  },
  "preferences": {
    "prioritizeAccessibility": true
  },
  "limit": 20
}
```

Response:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "content": {
          "id": "video-uuid",
          "title": "ASL Greetings Tutorial",
          "thumbnailUrl": "https://...",
          "duration": 180
        },
        "score": 0.95,
        "matchReasons": ["Tag match: asl", "High accessibility score"]
      }
    ],
    "total": 45,
    "page": 1
  }
}
```

### Get Recommendations

```http
GET /api/matching/recommendations
```

Query parameters:
- `contentId`: Base content for recommendations
- `limit`: Number of recommendations

### Match Request to Content

```http
POST /api/matching/match-request
```

Request:
```json
{
  "requestId": "request-uuid",
  "maxResults": 10
}
```

## Elasticsearch Configuration

```yaml
# Index mapping for video content
mappings:
  properties:
    title:
      type: text
      analyzer: english
    description:
      type: text
      analyzer: english
    tags:
      type: keyword
    categories:
      type: keyword
    duration:
      type: integer
    quality:
      type: keyword
    has_captions:
      type: boolean
    sign_language:
      type: keyword
    embedding:
      type: dense_vector
      dims: 512
    created_at:
      type: date
```

## AI Models

### Text Embeddings

Used for semantic search:
- Model: OpenAI `text-embedding-ada-002` or Hugging Face alternatives
- Dimension: 1536 (OpenAI) or 384-768 (Hugging Face)

### Visual Embeddings

Used for visual similarity:
- Model: CLIP (Contrastive Language-Image Pre-training)
- Dimension: 512

### Integration

```typescript
// Generate embeddings on video upload
async function processNewVideo(video: Video) {
  // Extract frames for visual embedding
  const frames = await extractKeyFrames(video.url);
  const visualEmbedding = await clipModel.embed(frames);
  
  // Generate text embedding from metadata
  const textEmbedding = await textModel.embed(
    `${video.title} ${video.description} ${video.tags.join(' ')}`
  );
  
  // Store embeddings
  await supabase.from('video_embeddings').insert({
    video_id: video.id,
    visual_embedding: visualEmbedding,
    text_embedding: textEmbedding
  });
}
```

## Performance Optimization

### Caching

```typescript
// Cache frequent searches
const searchCache = new Redis({
  url: process.env.REDIS_URL
});

async function cachedSearch(request: MatchRequest) {
  const cacheKey = `search:${hash(request)}`;
  
  const cached = await searchCache.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const results = await performSearch(request);
  await searchCache.set(cacheKey, JSON.stringify(results), 'EX', 300);
  
  return results;
}
```

### Batch Processing

Process embedding generation in batches for efficiency:

```typescript
// Process videos in batches
const BATCH_SIZE = 10;

async function processVideoBatch(videos: Video[]) {
  const batches = chunk(videos, BATCH_SIZE);
  
  for (const batch of batches) {
    await Promise.all(batch.map(processNewVideo));
  }
}
```

## Integration Points

- **Creator Dispatch**: Check for existing content before new assignments
- **Vision Models**: Use analyzed content for better matching
- **Multi-channel Processing**: Index processed videos for search
