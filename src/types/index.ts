export type SourceMode = 'screen' | 'screen-camera' | 'camera';

export type ResolutionPreset = '480p' | '720p' | '1080p' | '1440p' | '4k';

export type FrameRate = 24 | 30 | 60;

export type VideoFormat = 'webm' | 'mp4';

export type CameraPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export type CameraSize = 'sm' | 'md' | 'lg';

export type CameraShape = 'circle' | 'square' | 'rounded';

export type RecordingStatus = 'idle' | 'preparing' | 'recording' | 'paused' | 'stopped';

export interface ResolutionConfig {
  width: number;
  height: number;
  label: string;
}

export const RESOLUTION_MAP: Record<ResolutionPreset, ResolutionConfig> = {
  '480p': { width: 854, height: 480, label: '480p SD' },
  '720p': { width: 1280, height: 720, label: '720p HD' },
  '1080p': { width: 1920, height: 1080, label: '1080p Full HD' },
  '1440p': { width: 2560, height: 1440, label: '1440p 2K QHD' },
  '4k': { width: 3840, height: 2160, label: '4K Ultra HD' },
};

export interface AudioSettings {
  micEnabled: boolean;
  micDeviceId: string;
  micVolume: number; // 0.0 to 1.0
  systemAudioEnabled: boolean;
  systemAudioAvailable: boolean;
}

export interface CameraSettings {
  enabled: boolean;
  deviceId: string;
  mirror: boolean;
  resolution: ResolutionPreset;
  position: CameraPosition;
  size: CameraSize;
  shape: CameraShape;
}

export interface RecordingConfig {
  sourceMode: SourceMode;
  resolution: ResolutionPreset;
  frameRate: FrameRate;
  format: VideoFormat;
  audio: AudioSettings;
  camera: CameraSettings;
  floatingControllerEnabled: boolean;
}

export interface VideoRecord {
  id: string;
  title: string;
  blob?: Blob;
  blobUrl?: string;
  storagePath?: string; // If synced to Supabase storage
  duration: number; // In seconds
  fileSize: number; // In bytes
  resolution: string; // e.g. "1920x1080"
  frameRate: number;
  format: VideoFormat;
  sourceType: SourceMode;
  thumbnailUrl: string;
  createdAt: string; // ISO date string
  updatedAt: string;
  isCloudSynced?: boolean;
  userId?: string;
}

export interface TextOverlay {
  id: string;
  text: string;
  startTime: number; // seconds
  endTime: number; // seconds
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number; // pixels
  color: string;
  backgroundColor?: string;
}

export interface EditorSettings {
  trimStart: number;
  trimEnd: number;
  aspectRatio: 'original' | '16:9' | '9:16' | '1:1' | '4:3';
  rotation: 0 | 90 | 180 | 270;
  volume: number; // 0 to 2
  isMuted: boolean;
  playbackSpeed: number; // 0.25 to 2.0
  textOverlays: TextOverlay[];
  exportResolution: ResolutionPreset;
  exportFormat: VideoFormat;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface UserSettings {
  defaultResolution: ResolutionPreset;
  defaultFps: FrameRate;
  defaultFormat: VideoFormat;
  defaultMicEnabled: boolean;
  defaultSystemAudioEnabled: boolean;
  defaultCameraEnabled: boolean;
  floatingControlsDefault: boolean;
  theme: 'dark';
}
