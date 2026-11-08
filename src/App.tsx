import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { FloatingRecorder } from '@/components/studio/FloatingRecorder';
import { StudioPage } from '@/pages/StudioPage';
import { VideosPage } from '@/pages/VideosPage';
import { EditorPage } from '@/pages/EditorPage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { TermsPage } from '@/pages/TermsPage';
import { useAuthStore } from '@/store/useAuthStore';

export const App: React.FC = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-surface-bg text-text-primary selection:bg-brand selection:text-surface-bg">
        {/* Top Navbar */}
        <Navbar />

        {/* Floating Global Recorder Pill */}
        <FloatingRecorder />

        {/* Page Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<StudioPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/editor/:videoId" element={<EditorPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />

        {/* Mobile Navigation Bar */}
        <BottomNav />
      </div>
    </Router>
  );
};

export default App;

