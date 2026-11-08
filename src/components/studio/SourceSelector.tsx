import React from 'react';
import { Monitor, Camera, Layers, Check } from 'lucide-react';
import { SourceMode } from '@/types';
import { useRecordingStore } from '@/store/useRecordingStore';

export const SourceSelector: React.FC = () => {
  const { config, setSourceMode, status } = useRecordingStore();
  const disabled = status === 'recording' || status === 'preparing';

  const modes: {
    id: SourceMode;
    title: string;
    description: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    {
      id: 'screen',
      title: 'Screen Only',
      description: 'Record full monitor, application window, or browser tab',
      icon: Monitor,
    },
    {
      id: 'screen-camera',
      title: 'Screen + Camera',
      description: 'Picture-in-picture with customizable circular webcam bubble',
      icon: Layers,
      badge: 'Popular',
    },
    {
      id: 'camera',
      title: 'Camera Only',
      description: 'Record pure webcam or mobile camera feed with mic',
      icon: Camera,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-text-primary tracking-wide">
          1. Recording Source
        </label>
        <span className="text-xs text-text-muted">Choose input mode</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {modes.map((mode) => {
          const isSelected = config.sourceMode === mode.id;
          const Icon = mode.icon;

          return (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              onClick={() => setSourceMode(mode.id)}
              className={`relative flex flex-col p-4 rounded-2xl text-left transition-all duration-200 border ${
                isSelected
                  ? 'bg-surface-elevated border-brand shadow-brand-glow text-white'
                  : 'bg-surface-card border-border hover:border-border-bright text-text-secondary hover:text-white'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'}`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    isSelected ? 'bg-brand/20 text-brand' : 'bg-surface-secondary text-text-secondary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {mode.badge && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand/20 text-brand border border-brand/30">
                    {mode.badge}
                  </span>
                )}
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-brand text-surface-bg flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              <h4 className="font-semibold text-sm mb-1 text-white">{mode.title}</h4>
              <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

