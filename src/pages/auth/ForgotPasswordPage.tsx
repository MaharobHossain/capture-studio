import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/common/Button';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const ok = await resetPassword(email);
    if (ok) {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md bg-surface-card border border-border rounded-3xl p-8 space-y-6 shadow-card-dark">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-surface-secondary border border-border mx-auto flex items-center justify-center text-brand shadow-brand-glow">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Reset Password</h2>
          <p className="text-xs text-text-secondary">
            Enter your email to receive a password reset link
          </p>
        </div>

        {success ? (
          <div className="p-4 rounded-2xl bg-brand/10 border border-brand/30 text-xs text-brand space-y-2 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-brand" />
            <p className="font-semibold">Reset Email Sent</p>
            <p className="text-text-secondary">
              If an account exists for {email}, a password reset link has been dispatched.
            </p>
            <Link to="/auth/login" className="inline-block pt-2">
              <Button variant="primary" size="sm">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-status-error/10 border border-status-error/30 text-xs text-status-error flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

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

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full text-sm py-2.5"
            >
              Send Reset Link
            </Button>
          </form>
        )}

        <div className="pt-4 border-t border-border text-center">
          <Link
            to="/auth/login"
            className="text-xs text-text-secondary hover:text-white inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
