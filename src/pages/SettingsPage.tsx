import React, { useEffect, useState } from 'react';
import {
  Settings,
  HardDrive,
  Trash2,
  Cloud,
  Shield,
  Sliders,
  CheckCircle,
  AlertCircle,
  Database,
  Sparkles,
} from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ResolutionPreset, FrameRate, VideoFormat } from '@/types';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, storageUsage, refreshStorageUsage, clearLocalData } =
    useSettingsStore();
  const { user, isGuest, isConfigured } = useAuthStore();
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  useEffect(() => {
    refreshStorageUsage();
  }, [refreshStorageUsage]);

  const handleClear = async () => {
    await clearLocalData();
    setIsClearing(false);
    setClearSuccess(true);
    setTimeout(() => setClearSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-brand" />
          <span className="text-xs font-semibold text-brand tracking-wider uppercase font-mono">
            Configuration
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Configure recording defaults, local offline storage, and cloud synchronization.
        </p>
      </div>

      {/* Storage Information Card */}
      <div className="bg-surface-card border border-border rounded-2xl p-6 space-y-4 shadow-card-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-surface-secondary text-brand">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Local Offline Storage</h3>
              <p className="text-xs text-text-muted">IndexedDB video storage on your device</p>
            </div>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsClearing(true)}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Clear Local Data
          </Button>
        </div>

        {/* Storage Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-text-secondary font-mono">
            <span>
              {formatBytes(storageUsage.usedBytes)} used ({storageUsage.recordingsCount} recordings)
            </span>
            <span>{formatBytes(storageUsage.quotaBytes)} available</span>
          </div>

          <div className="h-2.5 rounded-full bg-surface-secondary overflow-hidden border border-border">
            <div
              className="h-full bg-brand rounded-full transition-all duration-300"
              style={{ width: `${Math.max(2, storageUsage.percentage)}%` }}
            />
          </div>
        </div>

        {clearSuccess && (
          <div className="p-3 rounded-xl bg-brand/10 border border-brand/30 text-xs text-brand flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> All local recordings cleared successfully.
          </div>
        )}
      </div>

      {/* Default Recording Preferences */}
      <div className="bg-surface-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-surface-secondary text-brand">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Default Recording Preferences</h3>
            <p className="text-xs text-text-muted">Default settings applied when opening Studio</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Resolution */}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">
              Default Resolution
            </label>
            <select
              value={settings.defaultResolution}
              onChange={(e) =>
                updateSettings({ defaultResolution: e.target.value as ResolutionPreset })
              }
              className="input-field text-sm"
            >
              <option value="720p">720p HD</option>
              <option value="1080p">1080p Full HD</option>
              <option value="1440p">1440p 2K QHD</option>
              <option value="4k">4K Ultra HD</option>
            </select>
          </div>

          {/* Frame Rate */}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">
              Default Frame Rate
            </label>
            <select
              value={settings.defaultFps}
              onChange={(e) =>
                updateSettings({ defaultFps: parseInt(e.target.value, 10) as FrameRate })
              }
              className="input-field text-sm"
            >
              <option value={24}>24 FPS (Cinematic)</option>
              <option value={30}>30 FPS (Standard)</option>
              <option value={60}>60 FPS (Ultra Smooth)</option>
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">
              Default Format
            </label>
            <select
              value={settings.defaultFormat}
              onChange={(e) =>
                updateSettings({ defaultFormat: e.target.value as VideoFormat })
              }
              className="input-field text-sm"
            >
              <option value="webm">WebM (Universal Browser Support)</option>
              <option value="mp4">MP4 (Hardware H.264)</option>
            </select>
          </div>

          {/* Floating Controls Default */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border border-border">
            <div>
              <span className="text-xs font-semibold text-white block">Floating Controls</span>
              <span className="text-[11px] text-text-muted">Always show floating recording pill</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.floatingControlsDefault}
                onChange={(e) => updateSettings({ floatingControlsDefault: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Cloud & Supabase Account Information */}
      <div className="bg-surface-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-surface-secondary text-brand">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Cloud Account & Sync</h3>
            <p className="text-xs text-text-muted">Optional Supabase authentication & cross-device backup</p>
          </div>
        </div>

        {user ? (
          <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Signed in as:</span>
              <span className="text-xs font-bold text-brand">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Account ID:</span>
              <span className="text-xs font-mono text-text-secondary truncate max-w-[200px]">
                {user.id}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-surface-secondary border border-border text-xs text-text-secondary space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <span className="w-2 h-2 rounded-full bg-brand" />
              Guest Mode Active
            </div>
            <p>
              Login is 100% optional. All features, recording, local video storage, and editing work without an account.
            </p>
            {isConfigured ? (
              <p className="text-brand">
                Supabase backend is configured and ready for user accounts!
              </p>
            ) : (
              <p className="text-text-muted">
                To connect Supabase for cloud sync, specify <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your environment file.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Clearing Data */}
      <Modal
        isOpen={isClearing}
        onClose={() => setIsClearing(false)}
        title="Clear All Local Recordings?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            This will permanently remove all video recordings stored in your browser IndexedDB.
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsClearing(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleClear}>
              Clear Everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

