import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ArrowLeft, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/common/Button';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInWithEmail, isLoading, error, isConfigured, continueAsGuest } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const ok = await signInWithEmail(email, password);
    if (ok) {
      navigate('/videos');
    }
  };

  const handleGuestContinue = () => {
    continueAsGuest();
    navigate('/');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md bg-surface-card border border-border rounded-3xl p-8 space-y-6 shadow-card-dark">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-surface-secondary border border-border mx-auto flex items-center justify-center text-brand shadow-brand-glow">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Sign In</h2>
          <p className="text-xs text-text-secondary">
            Sync your recordings and settings across devices
          </p>
        </div>

        {/* Not Configured Notice */}
        {!isConfigured && (
          <div className="p-4 rounded-2xl bg-surface-secondary border border-border text-xs text-text-secondary space-y-2">
            <div className="flex items-center gap-2 text-brand font-semibold">
              <Sparkles className="w-4 h-4" /> Guest Mode is 100% Operational
            </div>
            <p>
              Supabase backend is currently not connected. You can record, edit, and save videos locally right now!
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGuestContinue}
              className="w-full mt-1"
            >
              Continue as Guest
            </Button>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-status-error/10 border border-status-error/30 text-xs text-status-error flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-text-secondary">Password</label>
              <Link
                to="/auth/forgot-password"
                className="text-xs text-brand hover:underline font-medium"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field text-sm"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full text-sm py-2.5"
          >
            Sign In to Capture Studio
          </Button>
        </form>

        {/* Footers */}
        <div className="pt-4 border-t border-border text-center space-y-3">
          <p className="text-xs text-text-muted">
            Don&rsquo;t have an account?{' '}
            <Link to="/auth/register" className="text-brand hover:underline font-semibold">
              Create Account
            </Link>
          </p>

          <div>
            <button
              onClick={handleGuestContinue}
              className="text-xs text-text-secondary hover:text-white underline"
            >
              Skip and record as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

