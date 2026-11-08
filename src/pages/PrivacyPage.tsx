import React from 'react';
import { Shield, Lock, EyeOff, HardDrive, CheckCircle2 } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-fade-in">
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-brand" />
          <span className="text-xs font-semibold text-brand tracking-wider uppercase font-mono">
            Security & Trust
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
        <p className="text-xs text-text-muted mt-1">Last updated: November 2026</p>
      </div>

      <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
        <div className="p-5 rounded-2xl bg-surface-card border border-border space-y-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <Lock className="w-5 h-5 text-brand" />
            1. Privacy-First & Local Storage By Default
          </div>
          <p>
            Capture Studio operates with a strict privacy-first model. In Guest Mode, all screen captures, camera feeds, and microphone audio are processed 100% locally on your device within your browser using the MediaStreams and Web Audio APIs. Recorded video blobs are written directly into your local browser IndexedDB storage and never transmitted to our servers without your explicit action.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border space-y-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <EyeOff className="w-5 h-5 text-brand" />
            2. Clear User Consent & No Secret Recording
          </div>
          <p>
            Screen, camera, and microphone permissions are requested explicitly via standard browser security dialogs. You are in complete control of what window, tab, or screen is captured. A persistent recording banner and floating indicator ensure you are always aware when a recording is actively taking place.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border space-y-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <HardDrive className="w-5 h-5 text-brand" />
            3. Optional Cloud Storage & Account Synchronization
          </div>
          <p>
            If you choose to create an account through Supabase, we store your profile metadata and authenticate you securely. Videos are only uploaded to cloud storage when you explicitly click &ldquo;Upload to Cloud&rdquo;. You retain 100% ownership of your media, and you can delete cloud or local recordings at any time.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border space-y-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <CheckCircle2 className="w-5 h-5 text-brand" />
            4. Local Data Erasure
          </div>
          <p>
            You can clear all locally stored recordings, thumbnails, and cache at any time from the Settings page with a single click.
          </p>
        </div>
      </div>
    </div>
  );
};

