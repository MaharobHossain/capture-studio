import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-fade-in">
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-brand" />
          <span className="text-xs font-semibold text-brand tracking-wider uppercase font-mono">
            Legal
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Terms of Service</h1>
        <p className="text-xs text-text-muted mt-1">Last updated: November 2026</p>
      </div>

      <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
        <div className="p-5 rounded-2xl bg-surface-card border border-border space-y-3">
          <h3 className="text-white font-bold text-base">1. Acceptance of Terms</h3>
          <p>
            By accessing or using Capture Studio, you agree to comply with these terms. Capture Studio provides software tools for recording, editing, and exporting video and audio content.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border space-y-3">
          <h3 className="text-white font-bold text-base">2. Acceptable Use</h3>
          <p>
            You agree not to use Capture Studio to record copyrighted, sensitive, confidential, or private material without lawful authorization or consent from the affected parties. You are solely responsible for the content you create, edit, or distribute.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border space-y-3">
          <h3 className="text-white font-bold text-base">3. Disclaimer of Warranties</h3>
          <p>
            Capture Studio is provided &ldquo;as is&rdquo; without warranties of any kind. Device hardware performance, operating system permissions, browser codec support, and hardware acceleration capabilities may vary depending on your computer, browser, or Android device.
          </p>
        </div>
      </div>
    </div>
  );
};
