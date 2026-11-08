import { create } from 'zustand';
import { UserSettings, ResolutionPreset, FrameRate, VideoFormat } from '@/types';
import { getStorageEstimate, clearAllRecordingsFromDB } from '@/services/storage/db';

interface SettingsStoreState {
  settings: UserSettings;
  storageUsage: {
    usedBytes: number;
    quotaBytes: number;
    recordingsCount: number;
    percentage: number;
  };
  isLoadingStorage: boolean;

  // Actions
  updateSettings: (partial: Partial<UserSettings>) => void;
  refreshStorageUsage: () => Promise<void>;
  clearLocalData: () => Promise<void>;
}

const STORAGE_KEY = 'capture_studio_user_settings';

const DEFAULT_SETTINGS: UserSettings = {
  defaultResolution: '1080p',
  defaultFps: 30,
  defaultFormat: 'webm',
  defaultMicEnabled: true,
  defaultSystemAudioEnabled: true,
  defaultCameraEnabled: false,
  floatingControlsDefault: true,
  theme: 'dark',
};

function loadStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  settings: loadStoredSettings(),
  storageUsage: {
    usedBytes: 0,
    quotaBytes: 1024 * 1024 * 1024 * 5,
    recordingsCount: 0,
    percentage: 0,
  },
  isLoadingStorage: false,

  updateSettings: (partial) => {
    const updated = { ...get().settings, ...partial };
    set({ settings: updated });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },

  refreshStorageUsage: async () => {
    set({ isLoadingStorage: true });
    try {
      const estimate = await getStorageEstimate();
      set({ storageUsage: estimate, isLoadingStorage: false });
    } catch (e) {
      console.warn('Storage calculation failed:', e);
      set({ isLoadingStorage: false });
    }
  },

  clearLocalData: async () => {
    await clearAllRecordingsFromDB();
    await get().refreshStorageUsage();
  },
}));

