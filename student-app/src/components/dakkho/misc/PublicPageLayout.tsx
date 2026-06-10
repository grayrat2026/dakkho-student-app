'use client';

import React, { type ReactNode } from 'react';
import { useNavigationStore, useAuthStore } from '@/lib/store';
import { ArrowLeft, LogIn, ArrowRight } from 'lucide-react';

interface PublicPageLayoutProps {
  children: ReactNode;
}

export default function PublicPageLayout({ children }: PublicPageLayoutProps) {
  const navigate = useNavigationStore((s) => s.navigate);
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: back + brand */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (user) {
                  navigate('home');
                } else if (typeof window !== 'undefined' && window.history.length > 1) {
                  window.history.back();
                } else {
                  navigate('support-wizard');
                }
              }}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => (user ? navigate('home') : navigate('support-wizard'))}
              className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
              aria-label="DAKKHO home"
            >
              Dakkho
            </button>
          </div>

          {/* Right: auth-aware CTA */}
          {user ? (
            <button
              onClick={() => navigate('home')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              Back to App
            </button>
          ) : (
            <button
              onClick={() => navigate('login')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 active:bg-sky-700 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      {/* ─── Footer (sticky to bottom) ─── */}
      <footer className="border-t border-border py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate('terms-public')}
              className="hover:text-foreground transition-colors"
            >
              Terms
            </button>
            <span className="text-border" aria-hidden="true">·</span>
            <button
              onClick={() => navigate('privacy-public')}
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </button>
            <span className="text-border" aria-hidden="true">·</span>
            <button
              onClick={() => navigate('rules-public')}
              className="hover:text-foreground transition-colors"
            >
              Rules
            </button>
            <span className="text-border" aria-hidden="true">·</span>
            <button
              onClick={() => navigate('refund-public')}
              className="hover:text-foreground transition-colors"
            >
              Refund
            </button>
            <span className="text-border" aria-hidden="true">·</span>
            <button
              onClick={() => navigate('support-public')}
              className="hover:text-foreground transition-colors"
            >
              Support
            </button>
          </div>
          <p className="mt-3">
            &copy; {new Date().getFullYear()} DAKKHO. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
