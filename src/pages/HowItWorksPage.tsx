import React from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Monitor,
  Mic,
  Camera,
  Film,
  HardDrive,
  Download,
  Share2,
  Sparkles,
  Layers,
  Smartphone,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/common/Button';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Select Recording Source',
      description:
        'Choose whether to record Screen Only, Screen + Camera (picture-in-picture with custom bubble position, size, and shape), or Camera Only.',
      icon: Monitor,
    },
    {
      step: '02',
      title: 'Configure Audio & Camera',
      description:
        'Enable microphone narration with real-time volume testing and include system/tab audio where supported. Live preview your camera overlay with mirroring options.',
      icon: Mic,
    },
    {
      step: '03',
      title: 'Capture With Floating Controls',
      description:
        'Hit Start Recording! An always-accessible floating pill lets you pause, resume, view elapsed time, and finish recording smoothly without switching windows.',
      icon: Video,
    },
    {
      step: '04',
      title: 'Save Offline in IndexedDB',
      description:
        'Recordings are instantly saved locally to your device browser IndexedDB without requiring any login or sending private data to external servers.',
      icon: HardDrive,
    },
    {
      step: '05',
      title: 'Trim, Crop & Enhance in Editor',
      description:
        'Open the built-in Studio Video Editor to trim start/end points, change aspect ratios (16:9, 9:16 vertical reels, 1:1), rotate, add custom text overlays, and adjust volume.',
      icon: Film,
    },
    {
      step: '06',
      title: 'Export & Share Anywhere',
      description:
        'Render your final video with real-time progress, download standard MP4 or WebM files, or sync to optional cloud storage when you log in.',
      icon: Download,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12 animate-fade-in">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Studio Guide & Walkthrough
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          How Capture Studio Works
        </h1>
        <p className="text-base text-text-secondary leading-relaxed">
          Record, edit, and create high quality videos directly in your browser or Android native app without mandatory sign-ins or watermarks.
        </p>
      </div>

      {/* Step Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="bg-surface-card border border-border hover:border-brand/40 rounded-2xl p-6 transition-all duration-200 shadow-card-dark flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-secondary border border-border group-hover:border-brand/40 flex items-center justify-center text-brand shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-2xl font-black text-border-bright group-hover:text-brand transition-colors">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-bold text-base text-white mb-2">{s.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  {s.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Platform Architecture & Native Features */}
      <div className="bg-surface-secondary border border-border rounded-3xl p-8 space-y-6">
        <div className="max-w-2xl">
          <h3 className="text-xl font-bold text-white mb-2">
            Desktop Web & Native Android Architecture
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Capture Studio is architected with a unified platform adapter. On Desktop browsers, it leverages WebRTC DisplayMedia, Canvas Compositing, and the Web Audio API. On Android, it runs high performance native MediaProjection, CameraX, and Foreground Services.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-surface-card border border-border space-y-2">
            <CheckCircle className="w-5 h-5 text-brand" />
            <h4 className="font-semibold text-sm text-white">Guest Mode First</h4>
            <p className="text-xs text-text-muted">
              Zero login requirement. Local storage works immediately out of the box in your browser.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-border space-y-2">
            <CheckCircle className="w-5 h-5 text-brand" />
            <h4 className="font-semibold text-sm text-white">Full Compositing</h4>
            <p className="text-xs text-text-muted">
              Simultaneous screen + webcam recording with customizable circular or rounded bubbles.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-border space-y-2">
            <CheckCircle className="w-5 h-5 text-brand" />
            <h4 className="font-semibold text-sm text-white">Client-side Editor</h4>
            <p className="text-xs text-text-muted">
              Trimming, cropping for TikTok/Reels, rotations, speed control and text titles without server rendering.
            </p>
          </div>
        </div>

        <div className="pt-4 text-center">
          <Link to="/">
            <Button variant="primary" size="lg" icon={<Video className="w-5 h-5 fill-surface-bg" />}>
              Open Studio Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

