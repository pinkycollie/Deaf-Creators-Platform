# Multi-Channel Video Processing

The Multi-Channel Video Processing module handles large-scale video ingestion, processing, and delivery across multiple pipelines.

## Overview

This module handles:
- Video ingestion and validation
- Multi-format transcoding
- Parallel GPU processing
- Batch processing with queues
- CDN-optimized delivery

## Directory Structure

```
src/
├── input_processor/
│   ├── index.ts              # Main ingestion service
│   ├── validator.ts          # Video validation
│   ├── extractor.ts          # Metadata extraction
│   ├── chunker.ts            # Video chunking
│   └── types.ts              # TypeScript interfaces
│
├── output_delivery/
│   ├── index.ts              # Delivery service
│   ├── transcoder.ts         # Video transcoding
│   ├── optimizer.ts          # Delivery optimization
│   ├── cdn.ts                # CDN integration
│   └── types.ts              # TypeScript interfaces
```

## Core Components

### Input Processor

Handles video ingestion and preparation:

```typescript
interface VideoInput {
  file: File | string; // File object or URL
  metadata: InputMetadata;
  options: ProcessingOptions;
}

interface InputMetadata {
  title: string;
  description?: string;
  tags?: string[];
  accessibility?: AccessibilityOptions;
}

interface ProcessingOptions {
  priority: 'low' | 'normal' | 'high';
  outputs: OutputFormat[];
  enableAnalysis: boolean;
  generateThumbnails: boolean;
  extractCaptions: boolean;
}

interface OutputFormat {
  resolution: '480p' | '720p' | '1080p' | '4k';
  codec: 'h264' | 'h265' | 'vp9' | 'av1';
  bitrate?: number;
  format: 'mp4' | 'webm' | 'hls';
}

class InputProcessor {
  private validator: VideoValidator;
  private extractor: MetadataExtractor;
  private queue: ProcessingQueue;
  
  async processUpload(input: VideoInput): Promise<ProcessingJob> {
    // Validate input
    const validation = await this.validator.validate(input.file);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }
    
    // Extract technical metadata
    const techMetadata = await this.extractor.extract(input.file);
    
    // Upload to temporary storage
    const tempUrl = await this.uploadToTemp(input.file);
    
    // Create processing job
    const job = await this.queue.enqueue({
      inputUrl: tempUrl,
      metadata: { ...input.metadata, ...techMetadata },
      options: input.options,
      status: 'queued'
    });
    
    return job;
  }
}
```

### Video Validator

Validates incoming videos:

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: VideoMetadata;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  frameRate: number;
  codec: string;
  bitrate: number;
  hasAudio: boolean;
  fileSize: number;
}

class VideoValidator {
  private maxFileSize = 5 * 1024 * 1024 * 1024; // 5GB
  private maxDuration = 3600; // 1 hour
  private supportedCodecs = ['h264', 'h265', 'vp8', 'vp9', 'av1'];
  
  async validate(file: File | string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Extract metadata using FFprobe
    const metadata = await this.extractMetadata(file);
    
    // Check file size
    if (metadata.fileSize > this.maxFileSize) {
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `File exceeds maximum size of ${this.maxFileSize / 1024 / 1024 / 1024}GB`
      });
    }
    
    // Check duration
    if (metadata.duration > this.maxDuration) {
      errors.push({
        code: 'DURATION_TOO_LONG',
        message: `Video exceeds maximum duration of ${this.maxDuration / 60} minutes`
      });
    }
    
    // Check codec
    if (!this.supportedCodecs.includes(metadata.codec)) {
      errors.push({
        code: 'UNSUPPORTED_CODEC',
        message: `Codec ${metadata.codec} is not supported`
      });
    }
    
    // Check for accessibility
    if (!metadata.hasAudio && metadata.duration > 10) {
      warnings.push({
        code: 'NO_AUDIO',
        message: 'Video has no audio track - consider adding captions'
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata
    };
  }
}
```

### Transcoder

Handles video encoding using FFMPEG:

```typescript
interface TranscodeJob {
  inputUrl: string;
  outputs: TranscodeOutput[];
  priority: number;
  callbacks: TranscodeCallbacks;
}

interface TranscodeOutput {
  resolution: Resolution;
  codec: string;
  bitrate: number;
  outputPath: string;
}

interface TranscodeProgress {
  jobId: string;
  progress: number; // 0-100
  currentOutput: string;
  eta: number; // seconds
}

class Transcoder {
  private ffmpeg: FFmpegWrapper;
  
  async transcode(job: TranscodeJob): Promise<TranscodeResult> {
    const results: TranscodeResult[] = [];
    
    for (const output of job.outputs) {
      const command = this.buildFFmpegCommand(job.inputUrl, output);
      
      const result = await this.ffmpeg.run(command, {
        onProgress: (progress) => {
          job.callbacks.onProgress?.({
            jobId: job.id,
            progress: progress.percent,
            currentOutput: output.outputPath,
            eta: progress.eta
          });
        }
      });
      
      results.push(result);
    }
    
    return {
      jobId: job.id,
      outputs: results,
      status: 'completed'
    };
  }
  
  private buildFFmpegCommand(input: string, output: TranscodeOutput): string[] {
    const args = [
      '-i', input,
      '-c:v', this.getVideoCodec(output.codec),
      '-b:v', `${output.bitrate}k`,
      '-vf', `scale=${output.resolution.width}:${output.resolution.height}`,
      '-c:a', 'aac',
      '-b:a', '128k'
    ];
    
    // Add HLS-specific options
    if (output.format === 'hls') {
      args.push(
        '-f', 'hls',
        '-hls_time', '6',
        '-hls_playlist_type', 'vod',
        '-hls_segment_filename', `${output.outputPath}_%03d.ts`
      );
    }
    
    args.push(output.outputPath);
    return args;
  }
}
```

### Processing Queue

Manages batch processing with Apache Kafka or Redis:

```typescript
interface ProcessingQueue {
  enqueue(job: ProcessingJob): Promise<string>;
  dequeue(): Promise<ProcessingJob | null>;
  getStatus(jobId: string): Promise<JobStatus>;
  cancel(jobId: string): Promise<void>;
}

class KafkaProcessingQueue implements ProcessingQueue {
  private producer: KafkaProducer;
  private consumer: KafkaConsumer;
  
  async enqueue(job: ProcessingJob): Promise<string> {
    const jobId = generateJobId();
    
    await this.producer.send({
      topic: 'video-processing',
      messages: [{
        key: jobId,
        value: JSON.stringify({
          ...job,
          id: jobId,
          createdAt: new Date().toISOString()
        })
      }]
    });
    
    return jobId;
  }
  
  async processJobs() {
    await this.consumer.subscribe({ topic: 'video-processing' });
    
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const job = JSON.parse(message.value.toString());
        await this.processJob(job);
      }
    });
  }
}
```

### Output Delivery

Handles optimized video delivery:

```typescript
interface DeliveryOptions {
  cdn: 'cloudflare' | 'aws' | 'fastly';
  adaptiveStreaming: boolean;
  thumbnails: ThumbnailOptions;
  captions: CaptionOptions;
}

interface DeliveryResult {
  videoId: string;
  urls: {
    hls?: string;
    dash?: string;
    mp4: Record<string, string>; // resolution -> url
  };
  thumbnails: string[];
  captions?: CaptionTrack[];
}

class OutputDelivery {
  private cdn: CDNClient;
  private storage: StorageClient;
  
  async deliver(
    videoId: string,
    processedFiles: ProcessedFile[],
    options: DeliveryOptions
  ): Promise<DeliveryResult> {
    const urls: DeliveryResult['urls'] = { mp4: {} };
    
    // Upload files to CDN
    for (const file of processedFiles) {
      const cdnUrl = await this.cdn.upload(file.path, {
        cacheControl: 'public, max-age=31536000',
        contentType: this.getContentType(file)
      });
      
      if (file.format === 'hls') {
        urls.hls = cdnUrl;
      } else if (file.format === 'mp4') {
        urls.mp4[file.resolution] = cdnUrl;
      }
    }
    
    // Generate and upload thumbnails
    const thumbnails = await this.generateThumbnails(videoId, options.thumbnails);
    
    // Process captions
    const captions = await this.processCaptions(videoId, options.captions);
    
    return {
      videoId,
      urls,
      thumbnails,
      captions
    };
  }
  
  private async generateThumbnails(
    videoId: string,
    options: ThumbnailOptions
  ): Promise<string[]> {
    const frames = await this.extractFrames(videoId, options.count);
    
    const urls = await Promise.all(
      frames.map(frame => this.cdn.upload(frame, {
        cacheControl: 'public, max-age=31536000',
        contentType: 'image/jpeg'
      }))
    );
    
    return urls;
  }
}
```

## API Endpoints

### Upload Video

```http
POST /api/upload
Content-Type: multipart/form-data

file: <video_file>
title: "My Video"
outputs: ["720p", "1080p"]
```

### Get Processing Status

```http
GET /api/processing/:jobId
```

Response:
```json
{
  "success": true,
  "data": {
    "jobId": "job-uuid",
    "status": "processing",
    "progress": 45,
    "currentStep": "transcoding_1080p",
    "eta": 120
  }
}
```

### Get Video URLs

```http
GET /api/video/:videoId/urls
```

Response:
```json
{
  "success": true,
  "data": {
    "hls": "https://cdn.example.com/videos/uuid/master.m3u8",
    "mp4": {
      "720p": "https://cdn.example.com/videos/uuid/720p.mp4",
      "1080p": "https://cdn.example.com/videos/uuid/1080p.mp4"
    },
    "thumbnails": [
      "https://cdn.example.com/videos/uuid/thumb_001.jpg"
    ]
  }
}
```

## Processing Pipeline

```
┌─────────────┐
│   Upload    │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  Validate   │────▶│   Reject    │ (if invalid)
└──────┬──────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│   Queue     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│              Processing Workers          │
├─────────────┬─────────────┬─────────────┤
│  Transcode  │  Analyze    │  Caption    │
│  (FFMPEG)   │  (Vision)   │  (ASL/STT)  │
└──────┬──────┴──────┬──────┴──────┬──────┘
       │             │             │
       └─────────────┼─────────────┘
                     │
                     ▼
              ┌─────────────┐
              │   Deliver   │
              │    (CDN)    │
              └─────────────┘
```

## Configuration

### FFMPEG Profiles

```typescript
const encodingProfiles = {
  '480p': { width: 854, height: 480, bitrate: 1000 },
  '720p': { width: 1280, height: 720, bitrate: 2500 },
  '1080p': { width: 1920, height: 1080, bitrate: 5000 },
  '4k': { width: 3840, height: 2160, bitrate: 15000 }
};
```

### Worker Configuration

```yaml
# config/workers.yml
workers:
  transcode:
    count: 4
    gpu: true
    memory: 8GB
  analyze:
    count: 2
    gpu: true
    memory: 16GB
  caption:
    count: 2
    gpu: false
    memory: 4GB
```

## Monitoring

### Metrics

- Processing queue depth
- Average processing time
- Transcoding success rate
- CDN cache hit ratio
- Error rates by type

### Alerts

- Queue depth > 1000 jobs
- Processing time > 10 minutes
- Error rate > 5%
- Storage usage > 80%

## Integration

The Multi-Channel Processing integrates with:
- **Vision Models**: Analyze videos during processing
- **Video Matching**: Index processed videos for search
- **Creator Dispatch**: Notify on completion
