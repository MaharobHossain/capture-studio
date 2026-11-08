import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { TermsPage } from '@/pages/TermsPage';

describe('UI Navigation & Pages', () => {
  it('renders Navbar with Capture Studio brand and guest badge', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText(/CAPTURE/i)).toBeInTheDocument();
    expect(screen.getByText('STUDIO')).toBeInTheDocument();
    expect(screen.getByText(/Guest Mode/i)).toBeInTheDocument();
    const studioLinks = screen.getAllByRole('link', { name: /studio/i });
    expect(studioLinks.length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /saved videos/i })).toBeInTheDocument();
  });

  it('renders How It Works guide page with steps', () => {
    render(
      <BrowserRouter>
        <HowItWorksPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/How Capture Studio Works/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Recording Source/i)).toBeInTheDocument();
    expect(screen.getByText(/Save Offline in IndexedDB/i)).toBeInTheDocument();
  });

  it('renders Privacy Policy page', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy-First & Local Storage By Default/i)).toBeInTheDocument();
  });

  it('renders Terms of Service page', () => {
    render(<TermsPage />);
    expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
    expect(screen.getByText(/Acceptance of Terms/i)).toBeInTheDocument();
  });
});
