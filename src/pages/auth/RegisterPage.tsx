import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/common/Button';

export const RegisterPage: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUpWithEmail, isLoading, error, isConfigured, continueAsGuest } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const ok = await signUpWithEmail(email, password, displayName);
    if (ok) {
      alert('Account registered! You can now access your videos and settings.');
      navigate('/videos');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md bg-surface-card border border-border rounded-3xl p-8 space-y-6 shadow-card-dark">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-surface-secondary border border-border mx-auto flex items-center justify-center text-brand shadow-brand-glow">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Create Account</h2>
          <p className="text-xs text-text-secondary">
            Join Capture Studio to back up and sync your recordings
          </p>
        </div>

        {!isConfigured && (
          <div className="p-4 rounded-2xl bg-surface-secondary border border-border text-xs text-text-secondary space-y-2">
            <div className="flex items-center gap-2 text-brand font-semibold">
              <Sparkles className="w-4 h-4" /> Guest Mode Ready
            </div>
            <p>
              Supabase backend is currently not connected. You can record, edit, and save videos locally without registering.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                continueAsGuest();
                navigate('/');
              }}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name / Studio Nickname"
              className="input-field text-sm"
            />
          </div>

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
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
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
            Create Free Account
          </Button>
        </form>

        <div className="pt-4 border-t border-border text-center space-y-3">
          <p className="text-xs text-text-muted">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-brand hover:underline font-semibold">
              Sign In
            </Link>
          </p>
          <div>
            <Link to="/" className="text-xs text-text-secondary hover:text-white underline">
              Skip and record as Guest
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
