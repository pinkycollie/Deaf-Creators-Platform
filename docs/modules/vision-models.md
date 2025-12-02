# Video Vision Models

The Video Vision Models module provides AI-powered video analysis, including scene detection, auto-tagging, and ASL gesture recognition.

## Overview

This module handles:
- Video content analysis
- Scene detection and recognition
- Automatic tagging and categorization
- ASL gesture recognition
- Quality control analysis
- Caption generation

## Directory Structure

```
src/
├── vision_models/
│   ├── index.ts              # Main vision service
│   ├── scene-detection.ts    # Scene analysis
│   ├── tagging.ts            # Auto-tagging
│   ├── asl-recognition.ts    # ASL gesture recognition
│   ├── quality-analysis.ts   # Video quality control
│   ├── captioning.ts         # Caption generation
│   └── types.ts              # TypeScript interfaces
│
tests/
├── vision_models/
│   ├── scene-detection.test.ts
│   ├── tagging.test.ts
│   ├── asl-recognition.test.ts
│   └── quality-analysis.test.ts
```

## Core Components

### Scene Detection

Detects scene changes and segments in videos:

```typescript
interface Scene {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  keyframe: string; // URL to keyframe image
  description: string;
  confidence: number;
}

interface SceneDetectionResult {
  videoId: string;
  scenes: Scene[];
  totalScenes: number;
  processingTime: number;
}

class SceneDetector {
  private model: VisionModel;
  
  async detectScenes(videoUrl: string): Promise<SceneDetectionResult> {
    // Extract frames at regular intervals
    const frames = await this.extractFrames(videoUrl, { interval: 0.5 });
    
    // Detect scene boundaries using visual similarity
    const boundaries = await this.findSceneBoundaries(frames);
    
    // Generate descriptions for each scene
    const scenes = await this.describeScenes(frames, boundaries);
    
    return {
      videoId: this.getVideoId(videoUrl),
      scenes,
      totalScenes: scenes.length,
      processingTime: Date.now() - startTime
    };
  }
  
  private async findSceneBoundaries(frames: Frame[]): Promise<number[]> {
    const boundaries: number[] = [0];
    
    for (let i = 1; i < frames.length; i++) {
      const similarity = await this.calculateSimilarity(
        frames[i - 1].embedding,
        frames[i].embedding
      );
      
      if (similarity < 0.7) { // Scene change threshold
        boundaries.push(i);
      }
    }
    
    return boundaries;
  }
}
```

### Auto-Tagging

Automatically generates tags for video content:

```typescript
interface Tag {
  name: string;
  confidence: number;
  category: TagCategory;
}

type TagCategory = 
  | 'content'      // What's in the video
  | 'style'        // Visual style
  | 'emotion'      // Emotional tone
  | 'accessibility'// Accessibility features
  | 'technical';   // Technical attributes

interface TaggingResult {
  videoId: string;
  tags: Tag[];
  suggestedCategories: string[];
}

class AutoTagger {
  private clipModel: CLIPModel;
  private labelModel: ClassificationModel;
  
  async generateTags(videoUrl: string): Promise<TaggingResult> {
    // Extract representative frames
    const frames = await this.extractKeyFrames(videoUrl, 10);
    
    // Generate embeddings
    const embeddings = await this.clipModel.embedImages(frames);
    
    // Match against tag vocabulary
    const contentTags = await this.matchTags(embeddings, 'content');
    const styleTags = await this.matchTags(embeddings, 'style');
    
    // Detect accessibility features
    const accessibilityTags = await this.detectAccessibility(videoUrl);
    
    return {
      videoId: this.getVideoId(videoUrl),
      tags: [...contentTags, ...styleTags, ...accessibilityTags],
      suggestedCategories: this.inferCategories([...contentTags, ...styleTags])
    };
  }
  
  private async detectAccessibility(videoUrl: string): Promise<Tag[]> {
    const tags: Tag[] = [];
    
    // Check for captions
    if (await this.hasCaptions(videoUrl)) {
      tags.push({ name: 'captioned', confidence: 1.0, category: 'accessibility' });
    }
    
    // Check for sign language
    const signLanguage = await this.detectSignLanguage(videoUrl);
    if (signLanguage) {
      tags.push({ name: signLanguage, confidence: 0.9, category: 'accessibility' });
    }
    
    return tags;
  }
}
```

### ASL Recognition

Recognizes American Sign Language gestures:

```typescript
interface ASLGesture {
  gesture: string;      // The recognized sign
  startTime: number;    // Start timestamp
  endTime: number;      // End timestamp
  confidence: number;   // Recognition confidence
  handedness: 'left' | 'right' | 'both';
}

interface ASLRecognitionResult {
  videoId: string;
  gestures: ASLGesture[];
  transcript: string;   // Text representation
  language: 'asl' | 'bsl' | 'other';
}

class ASLRecognizer {
  private poseModel: PoseEstimationModel;
  private gestureModel: GestureClassificationModel;
  
  async recognizeGestures(videoUrl: string): Promise<ASLRecognitionResult> {
    // Extract video frames
    const frames = await this.extractFrames(videoUrl, { fps: 30 });
    
    // Detect hand poses
    const poses = await Promise.all(
      frames.map(frame => this.poseModel.detectHands(frame))
    );
    
    // Classify gestures from pose sequences
    const gestureSequences = this.segmentGestures(poses);
    const gestures = await Promise.all(
      gestureSequences.map(seq => this.classifyGesture(seq))
    );
    
    // Generate transcript
    const transcript = gestures
      .filter(g => g.confidence > 0.8)
      .map(g => g.gesture)
      .join(' ');
    
    return {
      videoId: this.getVideoId(videoUrl),
      gestures,
      transcript,
      language: 'asl'
    };
  }
  
  private segmentGestures(poses: HandPose[][]): HandPose[][] {
    // Segment continuous pose sequence into individual gestures
    const segments: HandPose[][] = [];
    let currentSegment: HandPose[] = [];
    
    for (const pose of poses) {
      if (this.isTransition(pose)) {
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
          currentSegment = [];
        }
      } else {
        currentSegment.push(...pose);
      }
    }
    
    return segments;
  }
}
```

### Quality Analysis

Analyzes video quality for conformance:

```typescript
interface QualityMetrics {
  resolution: { width: number; height: number };
  frameRate: number;
  bitrate: number;
  audioQuality?: AudioQuality;
  lightingScore: number;      // 0-1
  stabilityScore: number;     // 0-1
  focusScore: number;         // 0-1
  overallQuality: 'low' | 'medium' | 'high' | 'professional';
}

interface QualityIssue {
  type: string;
  severity: 'warning' | 'error';
  timestamp?: number;
  description: string;
  suggestion: string;
}

interface QualityAnalysisResult {
  videoId: string;
  metrics: QualityMetrics;
  issues: QualityIssue[];
  passed: boolean;
}

class QualityAnalyzer {
  async analyzeQuality(videoUrl: string): Promise<QualityAnalysisResult> {
    const metrics = await this.extractMetrics(videoUrl);
    const issues = await this.detectIssues(videoUrl, metrics);
    
    return {
      videoId: this.getVideoId(videoUrl),
      metrics,
      issues,
      passed: issues.filter(i => i.severity === 'error').length === 0
    };
  }
  
  private async detectIssues(
    videoUrl: string,
    metrics: QualityMetrics
  ): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    
    // Check resolution
    if (metrics.resolution.height < 720) {
      issues.push({
        type: 'low_resolution',
        severity: 'warning',
        description: 'Video resolution is below 720p',
        suggestion: 'Consider re-recording at higher resolution'
      });
    }
    
    // Check lighting
    if (metrics.lightingScore < 0.5) {
      issues.push({
        type: 'poor_lighting',
        severity: 'warning',
        description: 'Lighting conditions are suboptimal',
        suggestion: 'Improve lighting for better visibility, especially for sign language'
      });
    }
    
    // Check stability (important for ASL videos)
    if (metrics.stabilityScore < 0.7) {
      issues.push({
        type: 'unstable_video',
        severity: 'error',
        description: 'Video is too shaky',
        suggestion: 'Use a tripod or stabilizer for clearer signing visibility'
      });
    }
    
    return issues;
  }
}
```

### Caption Generation

Generates captions using speech-to-text and ASL recognition:

```typescript
interface Caption {
  text: string;
  startTime: number;
  endTime: number;
  speaker?: string;
  source: 'speech' | 'asl' | 'manual';
}

interface CaptionResult {
  videoId: string;
  captions: Caption[];
  language: string;
  format: 'srt' | 'vtt';
}

class CaptionGenerator {
  private speechModel: SpeechToTextModel;
  private aslRecognizer: ASLRecognizer;
  
  async generateCaptions(videoUrl: string): Promise<CaptionResult> {
    const captions: Caption[] = [];
    
    // Try speech-to-text first
    const speechCaptions = await this.generateFromSpeech(videoUrl);
    captions.push(...speechCaptions);
    
    // Add ASL recognition results
    const aslResult = await this.aslRecognizer.recognizeGestures(videoUrl);
    const aslCaptions = this.convertASLToCaptions(aslResult);
    captions.push(...aslCaptions);
    
    // Merge and deduplicate
    const mergedCaptions = this.mergeCaptions(captions);
    
    return {
      videoId: this.getVideoId(videoUrl),
      captions: mergedCaptions,
      language: 'en',
      format: 'vtt'
    };
  }
  
  exportToVTT(result: CaptionResult): string {
    let vtt = 'WEBVTT\n\n';
    
    result.captions.forEach((caption, index) => {
      vtt += `${index + 1}\n`;
      vtt += `${this.formatTime(caption.startTime)} --> ${this.formatTime(caption.endTime)}\n`;
      vtt += `${caption.text}\n\n`;
    });
    
    return vtt;
  }
}
```

## API Endpoints

### Analyze Video

```http
POST /api/video/analyze
```

Request:
```json
{
  "videoId": "video-uuid",
  "analyses": ["scenes", "tags", "quality", "asl", "captions"]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "jobId": "analysis-job-uuid",
    "status": "processing",
    "estimatedTime": 120
  }
}
```

### Get Analysis Results

```http
GET /api/video/analyze/:jobId
```

### Recognize ASL

```http
POST /api/video/gestures/recognize
```

## Model Configuration

### Supported Models

| Analysis Type | Model | Performance |
|---------------|-------|-------------|
| Scene Detection | PySceneDetect | Fast |
| Tagging | CLIP ViT-B/32 | Accurate |
| ASL Recognition | Custom CNN+LSTM | Specialized |
| Quality Analysis | FFprobe + Custom | Fast |
| Speech-to-Text | Whisper | Accurate |

### Hardware Requirements

- **GPU**: NVIDIA with 8GB+ VRAM for real-time processing
- **CPU**: Fallback mode available (slower)
- **Memory**: 16GB+ RAM recommended

## Testing

```bash
# Run vision model tests
pnpm test src/vision_models

# Run specific test
pnpm test src/vision_models/asl-recognition.test.ts
```

### Test Data

Test videos are stored in `tests/fixtures/videos/`:
- `test-asl-greeting.mp4` - ASL greeting signs
- `test-scene-changes.mp4` - Multiple scene transitions
- `test-low-quality.mp4` - Quality issue detection

## Integration

The Vision Models integrate with:
- **Video Matching**: Provide embeddings for similarity search
- **Creator Dispatch**: Quality check completed videos
- **Multi-channel Processing**: Analyze during processing pipeline
