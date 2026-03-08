'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          router.push('/dashboard');
        }
      } catch {
        // User not authenticated
      }
    };

    checkAuth();
  }, [router]);

  const handleLogin = async () => {
    window.location.href = '/api/auth/login';
  };

  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Social Media Manager
          </h1>
          <p className="text-xl text-slate-300 mb-2">
            AI-assisted post generation and publishing workflows
          </p>
          <p className="text-slate-400">
            Powered by Groq, RSS feeds, and X API v2
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 shadow-2xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Features
          </h2>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start">
              <span className="text-blue-400 mr-3">✓</span>
              <span>Manual post generation with AI context expansion</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-3">✓</span>
              <span>Autonomous news agent powered by RSS feeds</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-3">✓</span>
              <span>Scheduled cron jobs for consistent content</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-3">✓</span>
              <span>OAuth 2.0 PKCE for secure X integration</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-3">✓</span>
              <span>Zero-cost infrastructure on free tiers</span>
            </li>
          </ul>
        </div>

        <div className="text-center">
          <button
            onClick={handleLogin}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-colors shadow-lg"
          >
            Sign in with X
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-900 border border-red-700 rounded-lg text-red-100">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
            <h3 className="text-lg font-bold text-white mb-2">
              Manual Mode
            </h3>
            <p className="text-slate-300">
              Provide context and generate professional post options on demand.
            </p>
          </div>
          <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
            <h3 className="text-lg font-bold text-white mb-2">
              Autonomous Mode
            </h3>
            <p className="text-slate-300">
              Enable scheduled automation to discover, synthesize, and publish relevant AI news.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <HomeContent />
    </Suspense>
  );
}
