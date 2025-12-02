/**
 * Video Input Processor
 * 
 * Handles video ingestion, validation, and preparation for processing.
 * 
 * Features:
 * - Video upload handling
 * - Format validation
 * - Metadata extraction
 * - Chunking for large files
 */

export interface VideoInput {
  file: File | string;
  metadata: InputMetadata;
  options: ProcessingOptions;
}

export interface InputMetadata {
  title: string;
  description?: string;
  tags?: string[];
  accessibility?: AccessibilityOptions;
}

export interface AccessibilityOptions {
  generateCaptions: boolean;
  detectSignLanguage: boolean;
  audioDescription?: boolean;
}

export interface ProcessingOptions {
  priority: 'low' | 'normal' | 'high';
  outputs: OutputFormat[];
  enableAnalysis: boolean;
  generateThumbnails: boolean;
  thumbnailCount?: number;
}

export interface OutputFormat {
  resolution: '480p' | '720p' | '1080p' | '4k';
  codec: 'h264' | 'h265' | 'vp9' | 'av1';
  bitrate?: number;
  format: 'mp4' | 'webm' | 'hls';
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  frameRate: number;
  codec: string;
  bitrate: number;
  hasAudio: boolean;
  fileSize: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata?: VideoMetadata;
}

export interface ValidationError {
  code: string;
  message: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
}

// Configuration constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const MAX_DURATION = 3600; // 1 hour in seconds
const SUPPORTED_CODECS = ['h264', 'h265', 'vp8', 'vp9', 'av1'];
const SUPPORTED_FORMATS = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

/**
 * Validate video input against platform requirements
 */
export function validateVideoInput(metadata: VideoMetadata): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check file size
  if (metadata.fileSize > MAX_FILE_SIZE) {
    errors.push({
      code: 'FILE_TOO_LARGE',
      message: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024 / 1024}GB`,
    });
  }

  // Check duration
  if (metadata.duration > MAX_DURATION) {
    errors.push({
      code: 'DURATION_TOO_LONG',
      message: `Video exceeds maximum duration of ${MAX_DURATION / 60} minutes`,
    });
  }

  // Check codec
  if (!SUPPORTED_CODECS.includes(metadata.codec.toLowerCase())) {
    errors.push({
      code: 'UNSUPPORTED_CODEC',
      message: `Codec ${metadata.codec} is not supported`,
    });
  }

  // Check for audio (warning for accessibility)
  if (!metadata.hasAudio && metadata.duration > 10) {
    warnings.push({
      code: 'NO_AUDIO',
      message: 'Video has no audio track - consider adding captions for accessibility',
    });
  }

  // Check resolution
  if (metadata.height < 480) {
    warnings.push({
      code: 'LOW_RESOLUTION',
      message: 'Video resolution is below 480p - may not display well on larger screens',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata,
  };
}

/**
 * Calculate optimal output formats based on input
 */
export function calculateOutputFormats(metadata: VideoMetadata): OutputFormat[] {
  const outputs: OutputFormat[] = [];

  // Always include MP4 for compatibility
  if (metadata.height >= 480) {
    outputs.push({ resolution: '480p', codec: 'h264', format: 'mp4' });
  }

  if (metadata.height >= 720) {
    outputs.push({ resolution: '720p', codec: 'h264', format: 'mp4' });
    outputs.push({ resolution: '720p', codec: 'h264', format: 'hls' });
  }

  if (metadata.height >= 1080) {
    outputs.push({ resolution: '1080p', codec: 'h264', format: 'mp4' });
    outputs.push({ resolution: '1080p', codec: 'h264', format: 'hls' });
  }

  if (metadata.height >= 2160) {
    outputs.push({ resolution: '4k', codec: 'h265', format: 'mp4' });
    outputs.push({ resolution: '4k', codec: 'h265', format: 'hls' });
  }

  return outputs;
}
