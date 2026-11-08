import { create } from 'zustand';
import {
  RecordingConfig,
  RecordingStatus,
  SourceMode,
  ResolutionPreset,
  FrameRate,
  VideoFormat,
  CameraPosition,
  CameraSize,
  CameraShape,
} from '@/types';

interface RecordingStoreState {
  config: RecordingConfig;
  status: RecordingStatus;
  duration: number; // in seconds
  volume: number; // 0-100%
  availableMics: MediaDeviceInfo[];
  availableCameras: MediaDeviceInfo[];
  isMicTesting: boolean;
  errorMessage: string | null;

  // Actions
  setSourceMode: (mode: SourceMode) => void;
  setResolution: (resolution: ResolutionPreset) => void;
  setFrameRate: (fps: FrameRate) => void;
  setFormat: (format: VideoFormat) => void;
  setMicEnabled: (enabled: boolean) => void;
  setMicDeviceId: (deviceId: string) => void;
  setSystemAudioEnabled: (enabled: boolean) => void;
  setCameraEnabled: (enabled: boolean) => void;
  setCameraDeviceId: (deviceId: string) => void;
  setCameraPosition: (pos: CameraPosition) => void;
  setCameraSize: (size: CameraSize) => void;
  setCameraShape: (shape: CameraShape) => void;
  setCameraMirror: (mirror: boolean) => void;
  setFloatingControllerEnabled: (enabled: boolean) => void;

  setStatus: (status: RecordingStatus) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setAvailableMics: (mics: MediaDeviceInfo[]) => void;
  setAvailableCameras: (cameras: MediaDeviceInfo[]) => void;
  setIsMicTesting: (testing: boolean) => void;
  setErrorMessage: (msg: string | null) => void;
}

const DEFAULT_CONFIG: RecordingConfig = {
  sourceMode: 'screen',
  resolution: '1080p',
  frameRate: 30,
  format: 'webm',
  audio: {
    micEnabled: true,
    micDeviceId: '',
    micVolume: 1.0,
    systemAudioEnabled: true,
    systemAudioAvailable: true,
  },
  camera: {
    enabled: false,
    deviceId: '',
    mirror: true,
    resolution: '720p',
    position: 'bottom-right',
    size: 'md',
    shape: 'circle',
  },
  floatingControllerEnabled: true,
};

export const useRecordingStore = create<RecordingStoreState>((set) => ({
  config: DEFAULT_CONFIG,
  status: 'idle',
  duration: 0,
  volume: 0,
  availableMics: [],
  availableCameras: [],
  isMicTesting: false,
  errorMessage: null,

  setSourceMode: (sourceMode) =>
    set((state) => ({
      config: {
        ...state.config,
        sourceMode,
        camera: {
          ...state.config.camera,
          enabled: sourceMode === 'screen-camera' || sourceMode === 'camera',
        },
      },
    })),

  setResolution: (resolution) =>
    set((state) => ({ config: { ...state.config, resolution } })),

  setFrameRate: (frameRate) =>
    set((state) => ({ config: { ...state.config, frameRate } })),

  setFormat: (format) =>
    set((state) => ({ config: { ...state.config, format } })),

  setMicEnabled: (micEnabled) =>
    set((state) => ({
      config: {
        ...state.config,
        audio: { ...state.config.audio, micEnabled },
      },
    })),

  setMicDeviceId: (micDeviceId) =>
    set((state) => ({
      config: {
        ...state.config,
        audio: { ...state.config.audio, micDeviceId },
      },
    })),

  setSystemAudioEnabled: (systemAudioEnabled) =>
    set((state) => ({
      config: {
        ...state.config,
        audio: { ...state.config.audio, systemAudioEnabled },
      },
    })),

  setCameraEnabled: (enabled) =>
    set((state) => ({
      config: {
        ...state.config,
        camera: { ...state.config.camera, enabled },
      },
    })),

  setCameraDeviceId: (deviceId) =>
    set((state) => ({
      config: {
        ...state.config,
        camera: { ...state.config.camera, deviceId },
      },
    })),

  setCameraPosition: (position) =>
    set((state) => ({
      config: {
        ...state.config,
        camera: { ...state.config.camera, position },
      },
    })),

  setCameraSize: (size) =>
    set((state) => ({
      config: {
        ...state.config,
        camera: { ...state.config.camera, size },
      },
    })),

  setCameraShape: (shape) =>
    set((state) => ({
      config: {
        ...state.config,
        camera: { ...state.config.camera, shape },
      },
    })),

  setCameraMirror: (mirror) =>
    set((state) => ({
      config: {
        ...state.config,
        camera: { ...state.config.camera, mirror },
      },
    })),

  setFloatingControllerEnabled: (floatingControllerEnabled) =>
    set((state) => ({ config: { ...state.config, floatingControllerEnabled } })),

  setStatus: (status) => set({ status }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setAvailableMics: (availableMics) => set({ availableMics }),
  setAvailableCameras: (availableCameras) => set({ availableCameras }),
  setIsMicTesting: (isMicTesting) => set({ isMicTesting }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
}));

