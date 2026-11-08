import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, Smartphone, Laptop } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-surface-secondary/50 py-8 px-4 text-xs text-text-muted mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand" />
          <span className="font-semibold text-text-secondary">Capture Studio</span>
          <span>— Record. Edit. Create.</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/how-it-works" className="hover:text-text-primary transition-colors">
            How It Works
          </Link>
          <Link to="/privacy" className="hover:text-text-primary transition-colors flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-text-primary transition-colors flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Terms of Service
          </Link>
        </div>

        <div className="flex items-center gap-3 text-text-muted">
          <span className="flex items-center gap-1">
            <Laptop className="w-3.5 h-3.5" /> Web
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5" /> Android Native
          </span>
        </div>
      </div>
    </footer>
  );
};

