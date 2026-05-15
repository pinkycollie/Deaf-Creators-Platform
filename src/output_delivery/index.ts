/**
 * Output Delivery Module
 * 
 * Handles video transcoding, optimization, and CDN delivery.
 * 
 * Features:
 * - Multi-format transcoding
 * - Thumbnail generation
 * - CDN-optimized delivery
 * - Caption integration
 */

export interface DeliveryOptions {
  cdn: 'cloudflare' | 'aws' | 'fastly';
  adaptiveStreaming: boolean;
  thumbnails: ThumbnailOptions;
  captions: CaptionOptions;
}

export interface ThumbnailOptions {
  count: number;
  width: number;
  height: number;
  format: 'jpg' | 'webp';
}

export interface CaptionOptions {
  languages: string[];
  format: 'vtt' | 'srt';
  autoGenerate: boolean;
}

export interface DeliveryResult {
  videoId: string;
  urls: VideoUrls;
  thumbnails: string[];
  captions?: CaptionTrack[];
  metadata: DeliveryMetadata;
}

export interface VideoUrls {
  hls?: string;
  dash?: string;
  mp4: Record<string, string>;
}

export interface CaptionTrack {
  language: string;
  label: string;
  url: string;
  isDefault: boolean;
}

export interface DeliveryMetadata {
  deliveredAt: Date;
  cdn: string;
  totalSize: number;
  processingTimeMs: number;
}

export interface TranscodeJob {
  id: string;
  inputUrl: string;
  outputs: TranscodeOutput[];
  priority: number;
  status: JobStatus;
  progress: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface TranscodeOutput {
  resolution: string;
  codec: string;
  bitrate: number;
  format: string;
  outputPath: string;
}

export type JobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

// FFMPEG encoding profiles
export const ENCODING_PROFILES: Record<string, EncodingProfile> = {
  '480p': { width: 854, height: 480, bitrate: 1000, audioBitrate: 96 },
  '720p': { width: 1280, height: 720, bitrate: 2500, audioBitrate: 128 },
  '1080p': { width: 1920, height: 1080, bitrate: 5000, audioBitrate: 192 },
  '4k': { width: 3840, height: 2160, bitrate: 15000, audioBitrate: 256 },
};

interface EncodingProfile {
  width: number;
  height: number;
  bitrate: number;
  audioBitrate: number;
}

/**
 * Build FFMPEG command arguments for transcoding
 */
export function buildFFmpegArgs(
  input: string,
  output: TranscodeOutput,
  profile: EncodingProfile
): string[] {
  const args = [
    '-i', input,
    '-c:v', getVideoCodec(output.codec),
    '-b:v', `${output.bitrate || profile.bitrate}k`,
    '-vf', `scale=${profile.width}:${profile.height}`,
    '-c:a', 'aac',
    '-b:a', `${profile.audioBitrate}k`,
    '-movflags', '+faststart', // Enable streaming before full download
  ];

  if (output.format === 'hls') {
    // Extract base path by removing .m3u8 extension (case-insensitive)
    const basePath = output.outputPath.replace(/\.m3u8$/i, '');
    const segmentFilename = basePath !== output.outputPath 
      ? `${basePath}_%03d.ts`
      : `${output.outputPath}_%03d.ts`;
    
    args.push(
      '-f', 'hls',
      '-hls_time', '6',
      '-hls_playlist_type', 'vod',
      '-hls_segment_filename', segmentFilename
    );
  }

  args.push(output.outputPath);
  return args;
}

function getVideoCodec(codec: string): string {
  switch (codec) {
    case 'h264': return 'libx264';
    case 'h265': return 'libx265';
    case 'vp9': return 'libvpx-vp9';
    case 'av1': return 'libaom-av1';
    default: return 'libx264';
  }
}

/**
 * Calculate estimated transcoding time
 */
export function estimateTranscodeTime(
  durationSeconds: number,
  outputCount: number,
  hasGpu: boolean
): number {
  // Base estimate: 1 second of video = 0.5 seconds of processing (with GPU)
  // or 2 seconds without GPU
  const baseMultiplier = hasGpu ? 0.5 : 2;
  const timePerOutput = durationSeconds * baseMultiplier;
  return timePerOutput * outputCount;
}

/**
 * Generate CDN-optimized URL with cache headers
 */
export function generateCdnUrl(
  baseUrl: string,
  path: string,
  options: { immutable?: boolean; maxAge?: number } = {}
): string {
  const { immutable = true, maxAge = 31536000 } = options;

  // Add cache control parameters
  const params = new URLSearchParams();
  if (immutable) params.set('immutable', '1');
  params.set('max-age', maxAge.toString());

  return `${baseUrl}/${path}?${params.toString()}`;
}
